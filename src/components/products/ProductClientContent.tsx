'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useCart } from '@/components/providers/cart-provider';
import { FaShoppingCart, FaCheck } from 'react-icons/fa';
import { Product } from '@prisma/client';
import { parseNumericString } from '@/lib/decimal-helper';

interface ProductClientContentProps {
  product: Pick<Product, 'id' | 'name' | 'image' | 'stockCount'> & {
    price: string | number | { toString: () => string }; // Support both string, number and Decimal
  };
  className?: string;
}

export default function ProductClientContent({ product, className }: ProductClientContentProps) {
  const { addToCart } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  // Ensure price is a number
  const numericPrice = typeof product.price === 'string' 
    ? parseNumericString(product.price) 
    : (typeof product.price === 'number' ? product.price : parseFloat(product.price.toString()));

  useEffect(() => {
    if (justAdded) {
      const timer = setTimeout(() => {
        setJustAdded(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [justAdded]);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (product.stockCount <= 0) return;

    addToCart({
      id: product.id,
      name: product.name,
      price: numericPrice as number, // Ensure this is a number
      image: product.image || undefined // Convert null to undefined
    });

    setJustAdded(true);
  };

  return (
    <button
      className={`w-full h-full flex items-center justify-center gap-3 text-xl font-bold p-4 rounded-lg transition-all duration-300 ease-in-out cursor-pointer
        ${justAdded 
          ? 'bg-green-500 hover:bg-green-600 text-white' 
          : 'bg-primary hover:bg-primary-dark text-white'
        }
        ${product.stockCount <= 0 ? 'bg-gray-600 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-100'}
        ${className}
      `}
      onClick={handleAddToCart}
      disabled={product.stockCount <= 0 || justAdded}
    >
      {justAdded ? (
        <>
          <FaCheck />
          <span>Eklendi!</span>
        </>
      ) : (
        <>
          <FaShoppingCart />
          <span>Sepete Ekle</span>
        </>
      )}
    </button>
  );
} 