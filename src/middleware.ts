import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';

// Paths that require authentication
const authRoutes = [
  '/dashboard',
  '/profile',
  '/orders',
  '/tickets',
  '/add-funds',
];

// Paths that should redirect to dashboard if already authenticated
const guestRoutes = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
];

// Public routes that are always accessible (even for banned users)
const publicRoutes = [
  '/auth/logout',
  '/auth/error',
  '/_next',
  '/favicon.ico',
  '/api/auth',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get the user's token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  
  // Check if the user is banned
  if (token?.role === "BANNED") {
    // Allow access only to logout and error pages
    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
    
    if (!isPublicRoute) {
      return NextResponse.redirect(new URL('/auth/error?error=AccountBanned', request.url));
    }
  }
  
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
  const isGuestRoute = guestRoutes.some(route => pathname.startsWith(route));
  
  // If the user is on an auth route but not authenticated, redirect to login
  if (isAuthRoute && !token) {
    const url = new URL('/auth/login', request.url);
    url.searchParams.set('callbackUrl', encodeURI(request.url));
    return NextResponse.redirect(url);
  }
  
  // If the user is authenticated and trying to access a guest route, redirect to dashboard
  if (isGuestRoute && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  return NextResponse.next();
}

// Match only specific paths in the middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}; 