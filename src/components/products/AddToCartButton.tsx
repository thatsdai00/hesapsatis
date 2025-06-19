'use client';

import { useState, useEffect } from 'react';
import { FaCartPlus, FaCheck } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useCart } from '@/components/providers/cart-provider';
import { motion } from 'framer-motion';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  [key: string]: any;
}

interface AddToCartButtonProps {
  product: Product;
  quantity?: number;
}

export default function AddToCartButton({ product, quantity = 1 }: AddToCartButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const { addToCart, isInCart } = useCart();

  // Reset justAdded state after 1.5 seconds
  useEffect(() => {
    if (justAdded) {
      const timer = setTimeout(() => {
        setJustAdded(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [justAdded]);

  const handleAddToCart = async () => {
    if (product.stock <= 0) {
      toast.error('Bu ürün stokta yok');
      return;
    }

    setIsLoading(true);

    try {
      // Add the product to the cart using our cart context
      addToCart(product, quantity);
      setJustAdded(true);
      toast.success(`${product.name} sepete eklendi!`);
    } catch (error) {
      toast.error('Ürün sepete eklenemedi');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.button
      onClick={handleAddToCart}
      disabled={isLoading || product.stock <= 0}
      className={`
        w-full flex items-center justify-center px-6 py-4 rounded-xl
        font-medium text-lg transition-all duration-300
        ${product.stock <= 0 
          ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
          : justAdded 
            ? 'bg-green-600 text-white shadow-lg shadow-green-500/20' 
            : 'bg-gradient-to-r from-primary to-primary-hover text-white hover:shadow-[0_0_20px_rgba(162,89,255,0.4)]'
        }
      `}
      whileHover={product.stock > 0 && !justAdded ? { scale: 1.02 } : {}}
      whileTap={product.stock > 0 && !justAdded ? { scale: 0.98 } : {}}
      initial={{ opacity: 0 }}
      animate={{ 
        opacity: 1,
        boxShadow: justAdded ? '0 10px 25px -5px rgba(22, 163, 74, 0.3)' : '0 10px 25px -5px rgba(162, 89, 255, 0.2)'
      }}
      transition={{ duration: 0.3 }}
    >
      {isLoading ? (
        <div className="flex space-x-2">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
          <span className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
          <span className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></span>
        </div>
      ) : justAdded ? (
        <motion.div 
          className="flex items-center"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <FaCheck className="mr-2" />
          Sepete Eklendi!
        </motion.div>
      ) : (
        <div className="flex items-center">
          <FaCartPlus className="mr-2 text-xl" />
          Sepete Ekle
        </div>
      )}
    </motion.button>
  );
} 