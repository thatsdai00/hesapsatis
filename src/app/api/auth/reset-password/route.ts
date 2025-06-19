import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { resetPassword } from '@/lib/auth-utils';

// Validate the reset password input
const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
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
    const validation = resetPasswordSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: validation.error.errors[0].message },
        { status: 400, headers }
      );
    }
    
    const { token, password } = validation.data;
    
    // Reset the password
    const success = await resetPassword(token, password);
    
    if (success) {
      return NextResponse.json(
        { success: true, message: 'Password has been reset successfully' },
        { status: 200, headers }
      );
    } else {
      return NextResponse.json(
        { success: false, message: 'Failed to reset password. The token might be invalid or expired.' },
        { status: 400, headers }
      );
    }
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred. Please try again later.' },
      { status: 500, headers }
    );
  }
} 