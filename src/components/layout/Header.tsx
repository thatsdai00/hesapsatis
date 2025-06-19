'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaSearch, FaUser, FaWallet } from 'react-icons/fa';
import { RiAdminLine } from 'react-icons/ri';
import { MdDashboard, MdShoppingBag, MdLogout, MdHome, MdInfo, MdMenu } from 'react-icons/md';
import { IoLogoGameControllerB } from 'react-icons/io';
import { SiPubg } from 'react-icons/si';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { trpc } from '@/lib/trpc-client';
import { formatPrice } from '@/lib/utils';
import CartButtonNav from './CartButtonNav';
import SearchPopup from '../ui/SearchPopup';

type HeaderProps = {
  logo: React.ReactNode;
};

// Memoized animation variants to prevent recreation on each render
const navItemVariants = {
  hidden: { opacity: 0, y: -5 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 }
  },
  hover: { 
    scale: 1.05,
    transition: { type: 'spring', stiffness: 400, damping: 10 }
  }
};

const mobileMenuVariants = {
  hidden: { opacity: 0, height: 0, transformOrigin: 'top' },
  visible: { 
    opacity: 1, 
    height: 'auto',
    transition: { duration: 0.2, ease: [0.04, 0.62, 0.23, 0.98] }
  },
  exit: {
    opacity: 0,
    height: 0,
    transition: { duration: 0.15, ease: [0.04, 0.62, 0.23, 0.98] }
  }
};

const dropdownVariants = {
  hidden: { opacity: 0, y: -10, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: 'spring', stiffness: 400, damping: 25 }
  },
  exit: { 
    opacity: 0, 
    y: -10, 
    scale: 0.95,
    transition: { duration: 0.15 }
  }
};

// Define types for header links
type HeaderLink = {
  id: string;
  text: string;
  url: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

// Define types for navigation items
type NavItem = {
  path: string;
  label: string;
  icon?: React.ReactNode;
};

export default function Header({ logo }: HeaderProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Fetch user balance if logged in
  const { data: userBalance } = trpc.public.getUserBalance.useQuery(undefined, {
    enabled: status === 'authenticated',
  });

  const isActive = useCallback((path: string) => {
    return pathname === path;
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = useCallback(async () => {
    await signOut({ callbackUrl: '/' });
  }, []);

  const toggleMenu = useCallback(() => {
    setIsMenuOpen(prev => !prev);
  }, []);

  const toggleSearch = useCallback(() => {
    setIsSearchOpen(prev => !prev);
  }, []);

  const toggleUserMenu = useCallback(() => {
    setIsUserMenuOpen(prev => !prev);
  }, []);

  const closeUserMenu = useCallback(() => {
    setIsUserMenuOpen(false);
  }, []);

  const closeSearchPopup = useCallback(() => {
    setIsSearchOpen(false);
  }, []);

  const isLoading = status === "loading";

  // Memoize navigation items to prevent recreation on re-renders
  const navItems = useMemo(() => [
    { path: '/', icon: <MdHome size={16} />, label: 'Anasayfa' },
    { path: '/about', icon: <MdInfo size={16} />, label: 'Hakkımızda' },
    { path: '/valorant', icon: <IoLogoGameControllerB size={16} />, label: 'Valorant' },
    { path: '/pubg-mobile', icon: <SiPubg size={16} />, label: 'PUBG Mobile' },
  ], []);

  // Memoize mobile navigation items with larger icons
  const mobileNavItems = useMemo(() => [
    { path: '/', icon: <MdHome size={20} />, label: 'Anasayfa' },
    { path: '/about', icon: <MdInfo size={20} />, label: 'Hakkımızda' },
    { path: '/valorant', icon: <IoLogoGameControllerB size={20} />, label: 'Valorant' },
    { path: '/pubg-mobile', icon: <SiPubg size={20} />, label: 'PUBG Mobile' },
  ], []);

  // Fetch header links
  const { data: headerLinks } = trpc.public.getHeaderLinks.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  // Use dynamic links if available, otherwise use static defaults
  const dynamicNavItems = useMemo(() => {
    if (headerLinks && headerLinks.length > 0) {
      return headerLinks.map((link: HeaderLink) => ({
        path: link.url,
        label: link.text
      }));
    }
    return navItems;
  }, [headerLinks, navItems]);

  // Use dynamic links for mobile if available, otherwise use static defaults
  const dynamicMobileNavItems = useMemo(() => {
    if (headerLinks && headerLinks.length > 0) {
      return headerLinks.map((link: HeaderLink) => ({
        path: link.url,
        label: link.text,
        icon: <MdHome size={20} /> // Default icon for all dynamic links
      }));
    }
    return mobileNavItems;
  }, [headerLinks, mobileNavItems]);

  // Memoize header classes based on scroll state
  const headerClasses = useMemo(() => 
    `sticky top-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-[#0f0f1a]/70 backdrop-blur-lg shadow-lg shadow-[#7e22ce]/10' 
        : 'bg-[#0f0f1a]/90 backdrop-blur-md'
    }`,
    [isScrolled]
  );

  return (
    <header className={headerClasses}>
      <div className="container mx-auto px-2 sm:px-4 flex justify-between items-center h-16 md:h-20 relative">
        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center z-10">
          <motion.button 
            className="relative flex items-center justify-center w-10 h-10 text-white rounded-full hover:bg-[#2c1a47]/50 transition-colors"
            onClick={toggleMenu}
            whileTap={{ scale: 0.9 }}
            aria-expanded={isMenuOpen}
            aria-label="Gezinme menüsünü aç/kapa"
          >
            <MdMenu size={24} />
          </motion.button>
        </div>

        {/* Logo - Centered on mobile */}
        <div className="absolute left-1/2 transform -translate-x-1/2 md:static md:left-auto md:transform-none">
          {logo}
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-6 ml-10">
          {dynamicNavItems.map((item: NavItem) => (
            <motion.div
              key={item.path}
              variants={navItemVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
            >
              <Link 
                href={item.path}
                className={`text-white hover:text-[#7e22ce] transition-colors flex items-center ${
                  isActive(item.path) ? 'text-[#7e22ce]' : ''
                }`}
                aria-current={isActive(item.path) ? 'page' : undefined}
              >
                {item.icon && <span className="mr-1" aria-hidden="true">{item.icon}</span>}
                {item.label}
              </Link>
            </motion.div>
          ))}
        </nav>

        {/* Search Box */}
        <div className="hidden md:flex items-center relative flex-1 max-w-md mx-6">
          <div className="w-full">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={toggleSearch}
                placeholder="Ürün Ara..."
                className="w-full bg-[#1a1a2e]/50 border border-[#2c1a47] text-white px-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-[#7e22ce]/50 transition-all"
                aria-label="Ürünleri ara"
              />
              <motion.button 
                type="button" 
                onClick={toggleSearch}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Aramayı aç"
              >
                <FaSearch />
              </motion.button>
            </div>
          </div>
        </div>

        {/* User Actions */}
        <div className="flex items-center space-x-4 md:space-x-4 ml-auto md:ml-0 z-10 header-actions">
          {/* Mobile Search Icon */}
          <motion.button
            className="md:hidden flex items-center justify-center w-10 h-10 text-white rounded-full hover:bg-[#2c1a47]/50 transition-colors header-action-button"
            onClick={toggleSearch}
            whileTap={{ scale: 0.9 }}
            aria-expanded={isSearchOpen}
            aria-label="Aramayı aç/kapa"
          >
            <FaSearch size={18} />
          </motion.button>

          {/* Cart Button */}
          <motion.div 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }}
            className="flex items-center justify-center header-action-button"
          >
            <CartButtonNav />
          </motion.div>

          {/* User Menu - Dynamic based on auth state */}
          {isLoading ? (
            <div className="h-10 w-10 bg-[#2c1a47]/50 rounded-full animate-pulse header-action-button" aria-label="Kullanıcı verileri yükleniyor"></div>
          ) : session ? (
            <div className="relative z-20">
              <motion.button 
                onClick={toggleUserMenu}
                className="flex items-center space-x-1 bg-[#7e22ce] hover:bg-[#9333ea] text-white px-3 py-2 sm:px-4 sm:py-2 rounded-full transition-colors header-action-button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                aria-expanded={isUserMenuOpen}
                aria-label="Kullanıcı menüsü"
              >
                <span className="hidden sm:block max-w-24 truncate">
                  {session.user?.name || session.user?.email?.split('@')[0] || 'Kullanıcı'}
                </span>
                <FaUser className="sm:hidden" size={16} aria-hidden="true" />
              </motion.button>
              
              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div 
                    className="absolute right-0 mt-2 w-48 bg-[#1a1a2e]/90 backdrop-blur-lg rounded-lg shadow-lg z-50 py-1 border border-[#2c1a47]"
                    variants={dropdownVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    role="menu"
                  >
                    {/* Show balance */}
                    <div className="px-4 py-2 border-b border-[#2c1a47]">
                      <div className="flex items-center text-sm text-gray-300">
                        <FaWallet className="mr-2 text-green-500" aria-hidden="true" />
                        <span>Bakiye:</span>
                        <span className="ml-auto font-semibold text-white">
                          {userBalance ? formatPrice(userBalance) : '...'}
                        </span>
                      </div>
                    </div>
                    
                    <Link 
                      href="/dashboard" 
                      className="block px-4 py-2 text-sm text-white hover:bg-[#2c1a47]/70 transition flex items-center"
                      onClick={closeUserMenu}
                      role="menuitem"
                    >
                      <MdDashboard className="mr-2 text-blue-400" aria-hidden="true" />
                      Hesabım
                    </Link>
                    <Link 
                      href="/dashboard/orders" 
                      className="block px-4 py-2 text-sm text-white hover:bg-[#2c1a47]/70 transition flex items-center"
                      onClick={closeUserMenu}
                      role="menuitem"
                    >
                      <MdShoppingBag className="mr-2 text-green-400" aria-hidden="true" />
                      Siparişlerim
                    </Link>
                    {/* Admin button - only visible for users with ADMIN role */}
                    {['ADMIN', 'MANAGER', 'SUPPORTER'].includes(session?.user?.role) && (
                      <Link 
                        href="/admin" 
                        className="block px-4 py-2 text-sm text-white hover:bg-[#2c1a47]/70 transition flex items-center"
                        onClick={closeUserMenu}
                        role="menuitem"
                      >
                        <RiAdminLine className="mr-2 text-purple-400" aria-hidden="true" />
                        Admin Paneli
                      </Link>
                    )}
                    <button 
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-white hover:bg-[#2c1a47]/70 transition flex items-center"
                      role="menuitem"
                    >
                      <MdLogout className="mr-2 text-red-400" aria-hidden="true" />
                      Çıkış Yap
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link 
                href="/auth/login" 
                className="flex items-center bg-[#7e22ce] hover:bg-[#9333ea] text-white px-3 py-2 sm:px-4 sm:py-2 rounded-full transition-colors header-action-button"
                aria-label="Giriş yap"
              >
                <FaUser size={16} className="sm:mr-2" aria-hidden="true" />
                <span className="hidden sm:inline">Kullanıcı</span>
              </Link>
            </motion.div>
          )}
        </div>
      </div>

      {/* Mobile Menu - Animated slide down */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            variants={mobileMenuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute top-16 left-0 right-0 bg-[#0f0f1a]/95 backdrop-blur-md border-b border-[#2c1a47]/30 z-50"
          >
            <div className="container mx-auto px-4 py-4">
              <nav className="flex flex-col space-y-3">
                {dynamicMobileNavItems.map((item: NavItem) => (
                  <Link 
                    key={item.path}
                    href={item.path}
                    className={`text-white hover:text-[#7e22ce] transition-colors flex items-center py-2 px-3 rounded-md ${
                      isActive(item.path) ? 'bg-[#1a1a2e] text-[#7e22ce]' : ''
                    }`}
                    onClick={toggleMenu}
                  >
                    {item.icon && <span className="mr-2" aria-hidden="true">{item.icon}</span>}
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Popup */}
      <SearchPopup isOpen={isSearchOpen} onClose={closeSearchPopup} />
    </header>
  );
} 