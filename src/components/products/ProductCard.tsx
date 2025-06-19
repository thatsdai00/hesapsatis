'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { FaStar, FaShoppingCart, FaCheck, FaImage, FaFire } from 'react-icons/fa';
import Link from 'next/link';
import { useCart } from '@/components/providers/cart-provider';
import { parseNumericString } from '@/lib/decimal-helper';
import { useState, useEffect } from 'react';

export interface ProductCardProps {
  id: string;
  name: string;
  price: number | string;
  rating: number;
  image?: string | null;
  game: 'valorant' | 'pubg';
  slug?: string;
  stock?: number;
  category?: {
    name: string;
    slug?: string;
  };
  isBestseller?: boolean;
  isFeatured?: boolean;
}

const fadeIn = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

export default function ProductCard({ 
  id, 
  name, 
  price, 
  rating, 
  image, 
  game, 
  slug, 
  stock = 1, 
  category,
  isBestseller = false,
  isFeatured = false
}: ProductCardProps) {
  const productUrl = slug ? `/urun/${slug}` : `/products/${game}/${id}`;
  const { addToCart } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  
  // Ensure price is a number - use our utility to handle string prices from server
  const numericPrice = typeof price === 'string' ? parseNumericString(price) as number : price;
  
  // Reset justAdded state after 1 second
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
    
    if (stock <= 0) return;
    
    addToCart({
      id,
      name,
      price: numericPrice,
      image: image || undefined,
    });
    
    setJustAdded(true);
  };
  
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      variants={fadeIn}
      className="product-card"
    >
      <Link href={productUrl}>
        <div className="image-container">
          {image ? (
            <img 
              src={image} 
              alt={name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
              <FaImage className="text-gray-500 text-4xl" />
            </div>
          )}
          <div className="game-tag">
            {category?.name || (game === 'valorant' ? 'Valorant' : 'PUBG Mobile')}
          </div>
          {isBestseller && (
            <div className="bestseller-badge">
              <FaFire className="mr-1" /> Bestseller
            </div>
          )}
          {isFeatured && (
            <div className="featured-badge">
              <FaStar className="mr-1" /> ÇOK SATILAN
            </div>
          )}
        </div>
      </Link>
      
      <div className="card-content">
        <Link href={productUrl}>
          <h3 className="card-title">{name}</h3>
        </Link>
        
        <div className="rating">
          {[...Array(rating)].map((_, i) => (
            <FaStar key={i} />
          ))}
        </div>
        
        <div className="flex justify-between items-center mt-auto">
          <div className="price-container">
            <span className="price">₺{numericPrice}</span>
          </div>
          <button 
            className={`add-to-cart-btn ${justAdded ? 'added' : ''} ${stock <= 0 ? 'disabled' : ''}`}
            onClick={handleAddToCart}
            disabled={stock <= 0}
          >
            {justAdded ? (
              <>
                <FaCheck className="animate-bounce" />
                <span>Sepete Eklendi!</span>
              </>
            ) : (
              <>
                <FaShoppingCart />
                <span>Sepete Ekle</span>
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
} 