'use client';

import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { FaShoppingCart, FaTrash, FaTimes } from 'react-icons/fa';
import { formatPrice } from '@/lib/utils';
import { useCart } from '@/components/providers/cart-provider';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { createPortal } from 'react-dom';
import ModalOverlay from '@/components/ui/ModalOverlay';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartModal({ isOpen, onClose }: CartModalProps) {
  const { cartItems, removeFromCart, updateQuantity, cartTotal } = useCart();
  const [mounted, setMounted] = useState(false);
  const [renderModal, setRenderModal] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle initial mounting
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Control modal rendering with a slight delay to ensure proper animation
  useEffect(() => {
    if (isOpen) {
      setRenderModal(true);
    } else {
      // Keep the modal in DOM during exit animation
      const timer = setTimeout(() => {
        setRenderModal(false);
      }, 300); // Slightly longer than exit animation
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle escape key press to close modal
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
      // Prevent scrolling when modal is open
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [isOpen, onClose]);

  // Handle clicking outside to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  const handleRemoveItem = (id: string) => {
    removeFromCart(id);
  };

  const handleUpdateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    updateQuantity(id, newQuantity);
  };

  // Don't render on server or if not mounted
  if (!mounted) return null;

  // Use portal for better rendering
  const modalContent = (
    <AnimatePresence mode="wait">
      {(isOpen || renderModal) && (
        <div 
          className="fixed inset-0 z-[100] flex justify-end" 
          onClick={handleBackdropClick}
          aria-modal="true"
          role="dialog"
          aria-label="Sepet Modalı"
        >
          {/* Use the common ModalOverlay component */}
          <ModalOverlay onClick={onClose} />

          {/* Modal - slides in from right */}
          <motion.div
            ref={modalRef}
            className={cn(
              "fixed z-[101] h-full overflow-y-auto bg-gray-900/90 backdrop-blur-sm shadow-2xl border-l border-purple-800/30",
              "w-full sm:w-[450px] md:w-[500px] lg:w-[550px]",
              "text-white"
            )}
            initial={{ 
              x: '100%',
              opacity: 0.5,
            }}
            animate={{ 
              x: 0,
              opacity: 1,
              transition: { 
                type: "spring", 
                damping: 30, 
                stiffness: 300,
                delay: 0.05
              }
            }}
            exit={{ 
              x: '100%',
              opacity: 0.5,
              transition: { 
                duration: 0.25,
                ease: "easeInOut" 
              } 
            }}
            onClick={(e) => e.stopPropagation()} // Prevent clicks from closing modal
          >
            {/* Header */}
            <div className="sticky top-0 z-20 flex items-center justify-between p-5 border-b border-purple-800/30 bg-gray-900/90 backdrop-blur-md">
              <h2 className="text-xl font-bold flex items-center text-white">
                <FaShoppingCart className="mr-3 text-primary" />
                <span>Sepetim</span>
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-purple-900/50 transition-colors text-white"
                aria-label="Kapat"
              >
                <FaTimes size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-5">
              {cartItems.length === 0 ? (
                <div className="py-16 text-center">
                  <FaShoppingCart className="text-gray-400 text-6xl mx-auto mb-6" />
                  <h3 className="text-2xl font-semibold mb-3 text-white">Sepetiniz boş</h3>
                  <p className="text-gray-300 mb-8 text-lg">Henüz sepetinize ürün eklemediniz.</p>
                  <Button 
                    variant="primary" 
                    onClick={onClose}
                    className="mx-auto text-lg px-6 py-2.5"
                  >
                    Alışverişe Devam Et
                  </Button>
                </div>
              ) : (
                <>
                  {/* Cart Items */}
                  <ul className="divide-y divide-purple-800/30">
                    {cartItems.map((item) => (
                      <motion.li 
                        key={item.id}
                        layout="position"
                        layoutId={`cart-item-${item.id}`}
                        className="py-5 flex flex-wrap sm:flex-nowrap items-center gap-4"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0, marginBottom: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        {/* Product Image */}
                        <div className="h-20 w-20 flex-shrink-0 bg-gradient-to-br from-primary/30 to-secondary/30 rounded-md mr-4 flex items-center justify-center overflow-hidden shadow-md">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                          ) : (
                            <FaShoppingCart className="text-primary/70 text-2xl" />
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0 sm:min-w-[150px]">
                          <h4 className="font-medium text-white text-lg whitespace-normal break-words">{item.name}</h4>
                          <div className="text-sm text-gray-300">
                            Birim Fiyat: {formatPrice(item.price, { currency: 'TRY' })}
                          </div>
                        </div>

                        {/* Quantity, Price, and Remove Controls Wrapper */}
                        <div className="w-full sm:w-auto flex items-center justify-between">
                          {/* Quantity Controls */}
                          <div className="flex items-center">
                            <button 
                              onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                              className="w-8 h-8 rounded-l bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors text-white"
                            >
                              -
                            </button>
                            <div className="w-10 h-8 bg-gray-900 flex items-center justify-center text-white border-x border-gray-700">
                              {item.quantity}
                            </div>
                            <button 
                              onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                              className="w-8 h-8 rounded-r bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors text-white"
                            >
                              +
                            </button>
                          </div>

                          {/* Price */}
                          <div className="w-24 text-right font-medium text-white">
                            {formatPrice(item.price * item.quantity, { currency: 'TRY' })}
                          </div>

                          {/* Remove Button */}
                          <button 
                            onClick={() => handleRemoveItem(item.id)}
                            className="ml-2 p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-full transition-colors"
                            aria-label="Ürünü Kaldır"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </motion.li>
                    ))}
                  </ul>

                  {/* Summary */}
                  <div className="mt-8 pt-5 border-t border-purple-800/30">
                    <div className="flex justify-between items-center mb-6">
                      <span className="font-semibold text-gray-200 text-lg">Toplam</span>
                      <span className="font-bold text-2xl text-white">
                        {formatPrice(cartTotal, { currency: 'TRY' })}
                      </span>
                    </div>

                    <div className="flex flex-col gap-3">
                      <Button
                        variant="outline"
                        className="w-full py-3 text-white border-purple-700 hover:bg-purple-900/30"
                        onClick={onClose}
                      >
                        Alışverişe Devam Et
                      </Button>
                      <Link 
                        href="/checkout" 
                        className="w-full"
                        onClick={onClose}
                      >
                        <Button
                          variant="primary"
                          className="w-full py-3 text-lg"
                        >
                          Ödemeye Geç
                        </Button>
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  // Use createPortal to render the modal at the document body level
  return mounted ? createPortal(modalContent, document.body) : null;
} 