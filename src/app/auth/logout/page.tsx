'use client';

import { useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { FaSignOutAlt } from 'react-icons/fa';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const handleSignOut = async () => {
      try {
        await signOut({ redirect: false });
        toast.success('You have been logged out successfully');
        router.push('/');
      } catch (error) {
        console.error('Error signing out:', error);
        toast.error('An error occurred while signing out');
      }
    };

    // Add a small delay to show the page before redirecting
    const timer = setTimeout(() => {
      handleSignOut();
    }, 1000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-6">
        <FaSignOutAlt className="text-primary text-4xl" />
      </div>
      <h2 className="text-3xl font-bold neon-text mb-2">Signing Out</h2>
      <p className="text-gray-400 mb-8">Please wait while we log you out...</p>
      <div className="loading-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  );
} 