'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaTimes } from 'react-icons/fa';
import { MdCategory } from 'react-icons/md';
import { IoGameControllerOutline } from 'react-icons/io5';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc-client';
import { formatPrice } from '@/lib/utils';
import { useDebounce } from '@/lib/hooks';
import { createPortal } from 'react-dom';
import ModalOverlay from './ModalOverlay';

interface SearchPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchPopup({ isOpen, onClose }: SearchPopupProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 300);
  const inputRef = useRef<HTMLInputElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [imageLoadingStates, setImageLoadingStates] = useState<Record<string, boolean>>({});

  // Search query using tRPC
  const { data, isLoading, error } = trpc.public.searchAll.useQuery(
    { query: debouncedQuery },
    { enabled: debouncedQuery.length > 0 }
  );

  // Handle image load state
  const handleImageLoad = (id: string) => {
    setImageLoadingStates(prev => ({ ...prev, [id]: true }));
  };

  // Handle mounting for portal
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Reset image loading states when search query changes
  useEffect(() => {
    setImageLoadingStates({});
  }, [debouncedQuery]);

  // Focus input when popup opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handle keyboard events (Esc to close, arrow keys to navigate)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Add body class to prevent scrolling when popup is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isOpen]);

  // Handle form submission
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    // Don't navigate to search page, just ensure the query is set for the popup search
    if (searchQuery.trim()) {
      // Focus back on the input after form submission
      inputRef.current?.focus();
    }
  }, [searchQuery]);

  // Clear search input
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    inputRef.current?.focus();
  }, []);

  if (!mounted) return null;

  const searchPopupContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4 sm:pt-32">
          {/* Use the common ModalOverlay component */}
          <ModalOverlay onClick={onClose} />
          
          <motion.div
            ref={popupRef}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative z-[101] w-full max-w-2xl max-h-[70vh] overflow-hidden rounded-2xl"
          >
            {/* Glassmorphic container with neon border effect */}
            <div className="relative rounded-2xl overflow-hidden">
              {/* Neon border effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 animate-pulse" />
              
              {/* Glassmorphic background */}
              <div className="relative m-[2px] rounded-2xl bg-[#0f0f1a]/80 backdrop-blur-lg p-4 shadow-lg overflow-hidden">
                {/* Search form */}
                <form onSubmit={handleSubmit} className="relative mb-4">
                  <div className="relative flex items-center">
                    <FaSearch className="absolute left-4 text-purple-400" size={18} />
                    <input
                      ref={inputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Ürün veya kategori ara..."
                      className="w-full bg-[#1a1a2e]/50 border-2 border-[#2c1a47] text-white pl-12 pr-12 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7e22ce]/50 focus:border-[#7e22ce] transition-all text-lg"
                      aria-label="Ürün veya kategori ara"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={clearSearch}
                        className="absolute right-4 text-gray-400 hover:text-white transition-colors"
                        aria-label="Aramayı temizle"
                      >
                        <FaTimes size={18} />
                      </button>
                    )}
                  </div>
                </form>

                {/* Search results */}
                <div className="max-h-[calc(70vh-100px)] overflow-y-auto custom-scrollbar">
                  {isLoading && (
                    <div className="flex flex-col items-center justify-center py-8">
                      <div className="w-12 h-12 rounded-full border-4 border-t-purple-500 border-r-purple-500 border-b-transparent border-l-transparent animate-spin" />
                      <p className="mt-4 text-white text-opacity-70">Aranıyor...</p>
                    </div>
                  )}

                  {error && (
                    <div className="text-center py-8">
                      <p className="text-red-400">Arama sırasında bir hata oluştu. Lütfen tekrar deneyin.</p>
                    </div>
                  )}

                  {!isLoading && !error && debouncedQuery.length > 0 && (
                    <>
                      {/* Categories section */}
                      {data?.categories && data.categories.length > 0 && (
                        <div className="mb-6">
                          <h3 className="text-white text-lg font-bold mb-3 flex items-center">
                            <MdCategory className="mr-2 text-purple-400" size={20} />
                            Kategoriler
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {data.categories.map((category) => (
                              <Link
                                key={category.id}
                                href={`/kategori/${category.slug}`}
                                onClick={onClose}
                                className="flex items-center p-3 rounded-lg bg-[#1a1a2e]/50 hover:bg-[#2c1a47]/70 border border-[#2c1a47] hover:border-purple-500/50 transition-all group"
                              >
                                <div className="flex-shrink-0 w-12 h-12 bg-[#2c1a47] rounded-lg flex items-center justify-center overflow-hidden relative">
                                  {category.image ? (
                                    <>
                                      {!imageLoadingStates[`category-${category.id}`] && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-[#2c1a47]">
                                          <div className="w-6 h-6 border-2 border-t-purple-500 border-r-purple-500 border-b-transparent border-l-transparent rounded-full animate-spin" />
                                        </div>
                                      )}
                                      <Image
                                        src={category.image}
                                        alt={category.name}
                                        fill
                                        sizes="48px"
                                        className="object-cover"
                                        style={{ objectPosition: 'center' }}
                                        onLoad={() => handleImageLoad(`category-${category.id}`)}
                                      />
                                    </>
                                  ) : (
                                    <MdCategory className="text-purple-400" size={24} />
                                  )}
                                </div>
                                <div className="ml-3">
                                  <h4 className="text-white font-medium group-hover:text-purple-400 transition-colors">{category.name}</h4>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Products section */}
                      {data?.products && data.products.length > 0 && (
                        <div>
                          <h3 className="text-white text-lg font-bold mb-3 flex items-center">
                            <IoGameControllerOutline className="mr-2 text-purple-400" size={20} />
                            Ürünler
                          </h3>
                          <div className="grid grid-cols-1 gap-3">
                            {data.products.map((product) => (
                              <Link
                                key={product.id}
                                href={`/urun/${product.slug}`}
                                onClick={onClose}
                                className="flex items-center p-3 rounded-lg bg-[#1a1a2e]/50 hover:bg-[#2c1a47]/70 border border-[#2c1a47] hover:border-purple-500/50 transition-all group"
                              >
                                <div className="flex-shrink-0 w-16 h-16 bg-[#2c1a47] rounded-lg flex items-center justify-center overflow-hidden relative">
                                  {product.image ? (
                                    <>
                                      {!imageLoadingStates[`product-${product.id}`] && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-[#2c1a47]">
                                          <div className="w-6 h-6 border-2 border-t-purple-500 border-r-purple-500 border-b-transparent border-l-transparent rounded-full animate-spin" />
                                        </div>
                                      )}
                                      <Image
                                        src={product.image}
                                        alt={product.name}
                                        fill
                                        sizes="64px"
                                        className="object-cover"
                                        style={{ objectPosition: 'center' }}
                                        onLoad={() => handleImageLoad(`product-${product.id}`)}
                                      />
                                    </>
                                  ) : (
                                    <IoGameControllerOutline className="text-purple-400" size={30} />
                                  )}
                                </div>
                                <div className="ml-3 flex-grow">
                                  <h4 className="text-white font-medium group-hover:text-purple-400 transition-colors">{product.name}</h4>
                                  <p className="text-sm text-gray-400">{product.category.name}</p>
                                </div>
                                <div className="flex-shrink-0">
                                  <span className="text-white font-bold">{formatPrice(product.price.toString())}</span>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* No results */}
                      {(!data?.categories || data.categories.length === 0) && 
                       (!data?.products || data.products.length === 0) && (
                        <div className="text-center py-8">
                          <p className="text-white text-opacity-70">Sonuç bulunamadı.</p>
                        </div>
                      )}

                      {/* Show "View More" only if we have a lot of results */}
                      {((data?.categories && data.categories.length > 0) || 
                        (data?.products && data.products.length > 0)) && (
                        <div className="text-center mt-6">
                          <p className="text-sm text-gray-400">
                            Arama sonuçları burada gösterilmektedir.
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  {!isLoading && !error && debouncedQuery.length === 0 && (
                    <div className="text-center py-8">
                      <FaSearch className="mx-auto text-purple-400/30" size={40} />
                      <p className="mt-4 text-white text-opacity-50">Aramak istediğiniz ürün veya kategoriyi yazın.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(searchPopupContent, document.body);
} 