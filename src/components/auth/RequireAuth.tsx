'use client';

import * as React from 'react';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'react-toastify';

interface RequireAuthProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function RequireAuth({ 
  children, 
  allowedRoles = ['USER', 'ADMIN'] 
}: RequireAuthProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check if user is authenticated
    if (status === 'unauthenticated') {
      toast.error('You must be logged in to access this page');
      router.push(`/auth/login?callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }

    // Check if user has required role
    if (status === 'authenticated' && 
        session?.user?.role && 
        allowedRoles.length > 0 && 
        !allowedRoles.includes(session.user.role)) {
      toast.error('You do not have permission to access this page');
      router.push('/');
      return;
    }
  }, [status, session, router, pathname, allowedRoles]);

  // Show loading state while checking auth
  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full bg-primary"></div>
          </div>
          <p className="mt-4 text-gray-400">Authenticating...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
} 