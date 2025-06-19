'use server';

import { redirect } from 'next/navigation';
import { getAuthSession } from './auth';
import { db } from './db';
import crypto from 'crypto';
import { hashPassword } from './server-utils';

// Role type
type Role = 'USER' | 'ADMIN' | 'MANAGER' | 'SUPPORTER' | 'BANNED';

// Redirect authenticated users away from auth pages
export async function redirectIfAuthenticated(redirectTo: string = '/dashboard') {
  const session = await getAuthSession();

  if (session?.user) {
    redirect(redirectTo);
  }
}

// Check if the user is authenticated and has the required role
export async function checkAuth(
  redirectTo: string = '/auth/login',
  requiredRoles: Role[] = ['USER', 'ADMIN', 'MANAGER', 'SUPPORTER']
) {
  const session = await getAuthSession();

  if (!session?.user) {
    redirect(`${redirectTo}?callbackUrl=${encodeURIComponent(redirectTo)}`);
  }

  // Check if user is banned
  if (session.user.role === 'BANNED') {
    redirect('/auth/error?error=AccountBanned');
  }

  // Check if user has the required role
  if (
    requiredRoles.length > 0 &&
    session.user.role &&
    !requiredRoles.includes(session.user.role as Role)
  ) {
    redirect('/auth/error?error=AccessDenied');
  }

  return session.user;
}

// Check if the user is an admin
export async function checkAdmin(redirectTo: string = '/') {
  return checkAuth(redirectTo, ['ADMIN', 'MANAGER']);
}

// Check if the user is a supporter (can access support tickets)
export async function checkSupporter(redirectTo: string = '/') {
  return checkAuth(redirectTo, ['ADMIN', 'MANAGER', 'SUPPORTER']);
}

// Function to create a new password reset token
export async function createPasswordResetToken(email: string): Promise<string | null> {
  try {
    // Find user by email
    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, role: true }
    });

    console.log(`Password reset requested for email: ${email}`);
    console.log(`User found: ${!!user}, Role: ${user?.role || 'N/A'}, Role type: ${user ? typeof user.role : 'N/A'}`);
    
    // Don't reveal whether the user exists or not
    // But only create token for USER role (case-insensitive check)
    if (!user || (user.role.toUpperCase() !== 'USER')) {
      console.log(`Password reset rejected - User exists: ${!!user}, Role: ${user?.role || 'N/A'}, Role uppercase: ${user?.role?.toUpperCase() || 'N/A'}`);
      return null;
    }

    // Delete any existing tokens for this user
    await db.passwordResetToken.deleteMany({
      where: { email }
    });

    // Create a secure token - using both crypto.randomBytes and crypto.randomUUID
    // for added security
    const randomBytes = crypto.randomBytes(32).toString('hex');
    const uuid = crypto.randomUUID();
    const token = `${randomBytes}${uuid}`;

    // Create a hash of the token for storage
    const tokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Set expiration to 30 minutes from now
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 30);

    // Store the token in the database
    await db.passwordResetToken.create({
      data: {
        email,
        token: tokenHash,
        expires
      }
    });

    return token;
  } catch (error) {
    console.error('Error creating password reset token:', error);
    return null;
  }
}

// Function to verify a password reset token
export async function verifyPasswordResetToken(token: string): Promise<{ valid: boolean; email?: string }> {
  try {
    // Hash the token for verification
    const tokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Look up the token in the database
    const resetToken = await db.passwordResetToken.findUnique({
      where: { token: tokenHash }
    });

    // Check if token exists and is not expired
    if (!resetToken || resetToken.expires < new Date()) {
      // Delete expired token if found
      if (resetToken) {
        await db.passwordResetToken.delete({
          where: { id: resetToken.id }
        });
      }
      return { valid: false };
    }

    return { valid: true, email: resetToken.email };
  } catch (error) {
    console.error('Error verifying password reset token:', error);
    return { valid: false };
  }
}

// Function to reset a user's password
export async function resetPassword(token: string, newPassword: string): Promise<boolean> {
  try {
    // Verify the token
    const { valid, email } = await verifyPasswordResetToken(token);

    if (!valid || !email) {
      return false;
    }

    // Hash the new password
    const hashedPassword = await hashPassword(newPassword);

    // Update the user's password
    await db.user.update({
      where: { email },
      data: { password: hashedPassword }
    });

    // Delete the used token
    const tokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    await db.passwordResetToken.delete({
      where: { token: tokenHash }
    });

    // Log this action
    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, name: true }
    });

    if (user) {
      await db.activityLog.create({
        data: {
          type: 'PASSWORD_RESET',
          message: `Password reset successfully for user: ${user.name || email}`,
          userId: user.id
        }
      });
    }

    return true;
  } catch (error) {
    console.error('Error resetting password:', error);
    return false;
  }
} 