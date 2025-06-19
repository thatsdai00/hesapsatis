import * as React from 'react';
import '../admin.css';
import { getAuthSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {FaImages, FaList, FaBoxOpen, FaSearch, FaSignOutAlt, FaUsers, FaShoppingCart, FaTruck, FaArrowRight, FaTicketAlt, FaFileAlt, FaChartBar} from 'react-icons/fa';
import { MdAdminPanelSettings } from 'react-icons/md';
import { FaHome, FaCog } from 'react-icons/fa';


interface AdminLayoutProps {
  children: React.ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const session = await getAuthSession();
  
  // Check if user is authenticated
  if (!session || !session.user) {
    console.log('Admin layout: No session found, redirecting to login');
    redirect('/auth/login?callbackUrl=/admin&reason=unauthenticated');
  }
  
  // Check if user has admin role
  const allowedRoles = ['ADMIN', 'MANAGER', 'SUPPORTER'];
  if (!allowedRoles.includes(session.user.role)) {
    console.log(`Admin layout: User ${session.user.id} has role ${session.user.role}, not allowed`);
    redirect('/auth/login?callbackUrl=/admin&reason=unauthorized');
  }
  
  // Check if user is a supporter
  const isSupporter = session.user.role === 'SUPPORTER';
  
  
  // Log successful authentication for debugging
  console.log(`Admin layout: User ${session.user.id} authenticated as ${session.user.role}`);
  
  return (
    <div className="flex h-screen bg-gray-900 text-gray-100">
      {/* Sidebar */}
      <aside className="w-64 admin-sidebar hidden md:flex flex-col">
        <div className="p-6 admin-sidebar-header">
          <div className="flex items-center gap-2">
            <MdAdminPanelSettings className="text-primary text-2xl" />
            <h1 className="text-xl font-bold">Admin Panel</h1>
          </div>
          <div className="mt-2 text-sm text-gray-400">
            {session.user.email}
          </div>
          <div className="mt-1 text-xs">
            <span className={`admin-badge ${
              session.user.role === 'ADMIN' ? 'admin-badge-info' : 
              session.user.role === 'MANAGER' ? 'admin-badge-success' : 
              'admin-badge-warning'
            }`}>
              {session.user.role}
            </span>
          </div>
        </div>
        
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            <li>
              <Link 
                href="/admin" 
                className="admin-nav-item"
              >
                <FaHome className="admin-nav-icon" />
                <span>Dashboard</span>
              </Link>
            </li>
            <li>
              <Link
                href="/admin/tickets"
                className="admin-nav-item"
              >
                <FaTicketAlt className="admin-nav-icon" />
                <span>Tickets</span>
              </Link>
            </li>
            {/* Only show these links for ADMIN and MANAGER */}
            {!isSupporter && (
              <>
                <li>
                  <Link 
                    href="/admin/users" 
                    className="admin-nav-item"
                  >
                    <FaUsers className="admin-nav-icon" />
                    <span>Users</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/admin/orders" 
                    className="admin-nav-item"
                  >
                    <FaShoppingCart className="admin-nav-icon" />
                    <span>Orders</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/activity"
                    className="admin-nav-item"
                  >
                    <FaChartBar className="admin-nav-icon" />
                    <span>Activity Logs</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/admin/sliders" 
                    className="admin-nav-item"
                  >
                    <FaImages className="admin-nav-icon" />
                    <span>Sliders</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/admin/quick-access" 
                    className="admin-nav-item"
                  >
                    <FaArrowRight className="admin-nav-icon" />
                    <span>Quick Access</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/admin/categories" 
                    className="admin-nav-item"
                  >
                    <FaList className="admin-nav-icon" />
                    <span>Categories</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/admin/products" 
                    className="admin-nav-item"
                  >
                    <FaBoxOpen className="admin-nav-icon" />
                    <span>Products</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/admin/custom-pages" 
                    className="admin-nav-item"
                  >
                    <FaFileAlt className="admin-nav-icon" />
                    <span>Custom Pages</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/deliveries"
                    className="admin-nav-item"
                  >
                    <FaTruck className="admin-nav-icon" />
                    <span>Auto Delivery</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/admin/seo" 
                    className="admin-nav-item"
                  >
                    <FaSearch className="admin-nav-icon" />
                    <span>SEO Management</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/admin/settings" 
                    className="admin-nav-item"
                  >
                    <FaCog className="admin-nav-icon" />
                    <span>Settings</span>
                  </Link>
                </li>
              </>
            )}
            
            {/* Show tickets for all admin roles */}

          </ul>
        </nav>
        
        <div className="p-4 border-t border-gray-700">
          <Link 
            href="/auth/logout" 
            className="admin-nav-item text-red-400 hover:text-red-300"
          >
            <FaSignOutAlt className="admin-nav-icon" />
            <span>Logout</span>
          </Link>
        </div>
      </aside>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 sm:px-6 md:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
} 