'use client';

import * as React from 'react';

import { useState, useRef, useEffect } from 'react';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaUser, FaSignOutAlt, FaCog, FaTicketAlt, FaShoppingBag, FaUserShield } from 'react-icons/fa';

export default function UserMenu() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  
  // Debug log for session data
  useEffect(() => {
    if (session?.user) {
      console.log('UserMenu - User Session:', {
        id: session.user.id,
        role: session.user.role,
        hasAdminAccess: ['ADMIN', 'MANAGER', 'SUPPORTER'].includes(String(session.user.role))
      });
    }
  }, [session]);
  
  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/');
    router.refresh();
  };

  if (status === 'loading') {
    return (
      <button className="relative flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:text-white">
        <div className="h-5 w-5 rounded-full bg-gray-700 animate-pulse"></div>
        <span>Loading...</span>
      </button>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex items-center gap-2">
        <Link 
          href="/auth/login"
          className="px-4 py-2 text-sm text-gray-300 hover:text-white"
        >
          Login
        </Link>
        <Link 
          href="/auth/register" 
          className="px-4 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary-hover transition-colors"
        >
          Register
        </Link>
      </div>
    );
  }
  
  // Force string comparison for role check to avoid any type issues
  const userRole = String(session?.user?.role || '');
  const showAdminPanel = ['ADMIN', 'MANAGER', 'SUPPORTER'].includes(userRole);
  
  console.log('UserMenu - Rendering with:', {
    userRole,
    showAdminPanel
  });

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors focus:outline-none"
      >
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
          <FaUser />
        </div>
        <span>{session?.user?.name || 'User'}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-background-alt z-10 ring-1 ring-black ring-opacity-5 divide-y divide-gray-700">
          <div className="px-4 py-3">
            <p className="text-sm text-gray-300">Signed in as</p>
            <p className="text-sm font-medium text-white truncate">{session?.user?.email}</p>
            {session?.user?.role && (
              <p className="text-xs mt-1">
                <span className={`inline-block px-2 py-1 rounded ${
                  userRole === 'ADMIN' ? 'bg-blue-900/50 text-blue-300' :
                  userRole === 'MANAGER' ? 'bg-green-900/50 text-green-300' :
                  userRole === 'SUPPORTER' ? 'bg-yellow-900/50 text-yellow-300' :
                  userRole === 'BANNED' ? 'bg-red-900/50 text-red-300' :
                  'bg-gray-800 text-gray-300'
                }`}>
                  {userRole}
                </span>
              </p>
            )}
          </div>
          <div className="py-1">
            <Link 
              href="/dashboard" 
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white"
              onClick={() => setIsOpen(false)}
            >
              <FaCog className="text-gray-500" />
              Dashboard
            </Link>
            <Link 
              href="/dashboard/orders" 
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white"
              onClick={() => setIsOpen(false)}
            >
              <FaShoppingBag className="text-gray-500" />
              My Orders
            </Link>
            <Link 
              href="/dashboard/tickets" 
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white"
              onClick={() => setIsOpen(false)}
            >
              <FaTicketAlt className="text-gray-500" />
              Support Tickets
            </Link>
            
            {/* Admin Panel link - only show for admin, manager, supporter */}
            {showAdminPanel && (
              <Link 
                href="/admin" 
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white"
                onClick={() => setIsOpen(false)}
              >
                <FaUserShield className="text-gray-500" />
                Admin Panel
              </Link>
            )}
          </div>
          <div className="py-1">
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              <FaSignOutAlt className="text-gray-500" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 