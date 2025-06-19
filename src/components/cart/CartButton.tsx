'use client';

import * as React from 'react';

import { useState, useCallback } from 'react';
import { FaShoppingCart } from 'react-icons/fa';
import { useCart } from '@/components/providers/cart-provider';
import CartModal from './CartModal';
import { motion, AnimatePresence } from 'framer-motion';

interface CartButtonProps {
  className?: string;
}

export default function CartButton({ className }: CartButtonProps) {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { cartCount } = useCart();
  
  const toggleCart = useCallback(() => {
    setIsCartOpen(prev => !prev);
  }, []);
  
  const closeCart = useCallback(() => {
    setIsCartOpen(false);
  }, []);
  
  return (
    <>
      <button 
        onClick={toggleCart}
        className={`relative p-2 rounded-full hover:bg-gray-700/50 transition-colors w-10 h-10 flex items-center justify-center ${className || ''}`}
        aria-label="Sepeti Aç"
        aria-expanded={isCartOpen}
        aria-controls="cart-modal"
      >
        <FaShoppingCart className="text-xl" />
        
        {/* Cart Badge */}
        <AnimatePresence>
          {cartCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
              className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
            >
              {cartCount > 99 ? '99+' : cartCount}
            </motion.div>
          )}
        </AnimatePresence>
      </button>
      
      <CartModal isOpen={isCartOpen} onClose={closeCart} />
    </>
  );
} 