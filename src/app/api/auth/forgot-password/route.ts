import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { createPasswordResetToken } from '@/lib/auth-utils';
import { sendPasswordResetEmail } from '@/lib/email';
import { logActivity } from '@/lib/activity-logger';

// Validate the forgot password input
const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function POST(req: Request) {
  // Add CORS headers to the response
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    // Parse the request body
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      return NextResponse.json(
        { success: false, message: 'Invalid request body' },
        { status: 400, headers }
      );
    }
    
    // Validate the request body
    const validation = forgotPasswordSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: validation.error.errors[0].message },
        { status: 400, headers }
      );
    }
    
    const { email } = validation.data;
    
    // Check if user exists but don't leak this information in the response
    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, name: true, role: true }
    });
    
    // If the user has role ADMIN, SUPPORTER, MANAGER, or BANNED, we don't send an email
    // but still return success to avoid leaking information
    if (user && user.role.toUpperCase() !== 'USER') {
      // Log this attempt but don't send email
      await logActivity({
        type: 'PASSWORD_RESET_REQUEST',
        message: `Password reset requested for non-customer user: ${user.name || email} (${user.role})`,
        userId: user.id
      });
      
      // Return a generic success message
      return NextResponse.json(
        { success: true, message: 'If your email exists in our system, you will receive a password reset link shortly' },
        { status: 200, headers }
      );
    }
    
    // Create a password reset token
    const resetToken = await createPasswordResetToken(email);
    
    // If a token was created, send the email
    if (resetToken && user) {
      console.log(`Sending password reset email to: ${email} (${user.role})`);
      const emailResult = await sendPasswordResetEmail(email, user.name || '', resetToken);
      
      if (emailResult) {
        console.log(`Password reset email sent successfully to: ${email}`);
      } else {
        console.error(`Failed to send password reset email to: ${email}`);
      }
      
      // Log this action
      await logActivity({
        type: 'PASSWORD_RESET_REQUEST',
        message: `Password reset requested for user: ${user.name || email}`,
        userId: user.id
      });
    } else {
      console.log(`No password reset email sent for: ${email} (token created: ${!!resetToken}, user exists: ${!!user})`);
    }
    
    // Always return a generic success message to avoid leaking information
    return NextResponse.json(
      { success: true, message: 'If your email exists in our system, you will receive a password reset link shortly' },
      { status: 200, headers }
    );
  } catch (error) {
    console.error('Password reset request error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred. Please try again later.' },
      { status: 500, headers }
    );
  }
} 