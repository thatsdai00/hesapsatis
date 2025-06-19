import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPasswordResetToken } from '@/lib/auth-utils';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get('token');
  
  // Add CORS headers to the response
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (!token) {
    return NextResponse.json(
      { valid: false, message: 'Token is required' },
      { status: 400, headers }
    );
  }

  try {
    const { valid } = await verifyPasswordResetToken(token);
    
    return NextResponse.json(
      { valid, message: valid ? 'Token is valid' : 'Token is invalid or expired' },
      { status: 200, headers }
    );
  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json(
      { valid: false, message: 'An error occurred while verifying the token' },
      { status: 500, headers }
    );
  }
} 