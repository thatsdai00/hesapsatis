import { NextResponse } from 'next/server';
import prisma from '@/lib/db-client';
import { hashPassword } from '@/lib/server-utils';
import { z } from 'zod';
import { logActivity } from '@/lib/activity-logger';
import { sendWelcomeEmail } from '@/lib/email';

// Validate the registration input
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
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
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: validation.error.errors[0].message },
        { status: 400, headers }
      );
    }
    
    const { name, email, password } = validation.data;
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'User with this email already exists' },
        { status: 409, headers }
      );
    }
    
    // Hash the password
    let hashedPassword;
    try {
      hashedPassword = await hashPassword(password);
    } catch (hashError) {
      return NextResponse.json(
        { success: false, message: 'Error processing your password' },
        { status: 500, headers }
      );
    }
    
    // Create the user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'USER',
      },
    });
    
    // Log the activity
    await logActivity({
      type: 'USER_REGISTRATION',
      message: `New user registered: ${name} (${email})`,
      userId: user.id,
    });
    
    // Send welcome email
    await sendWelcomeEmail(email, name);
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    return NextResponse.json(
      { 
        success: true, 
        message: 'User registered successfully', 
        user: userWithoutPassword 
      },
      { status: 201, headers }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred during registration' },
      { status: 500, headers }
    );
  }
} 