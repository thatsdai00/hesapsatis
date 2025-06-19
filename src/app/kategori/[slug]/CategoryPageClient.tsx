'use client';

import * as React from 'react';
import {FaFilter, FaArrowDown} from 'react-icons/fa';
import ProductCard from '@/components/products/ProductCard';
import { motion } from 'framer-motion';
// import { usePathname } from 'next/navigation';
import Link from 'next/link';

import {useState} from 'react';
import { FaHome } from 'react-icons/fa';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  productCount?: number;
}

interface Product {
  id: string;
  name: string;
  price: number | string;
  image?: string | null;
  game: 'valorant' | 'pubg';
  slug?: string;
  stock?: number;
  rating?: number;
  isBestseller?: boolean;
}

interface CategoryWithProducts extends Category {
  products?: Product[];
}

interface CategoryPageClientProps {
  category: CategoryWithProducts;
  products: Product[];
  subCategories: Category[];
}

export default function CategoryPageClient({ category, products, subCategories }: CategoryPageClientProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center text-sm mb-8 text-gray-400">
          <Link href="/" className="hover:text-purple-500 transition flex items-center">
            <FaHome className="mr-1" /> Ana Sayfa
          </Link>
          <span className="mx-2">/</span>
          <span className="text-white">{category.name}</span>
        </div>
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-white">{category.name}</h1>
          {category.description && (
            <p className="text-gray-400">{category.description}</p>
          )}
        </div>
        
        {subCategories.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Alt Kategoriler</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {subCategories.map(subCat => (
                <Link 
                  key={subCat.id}
                  href={`/kategori/${subCat.slug}`} 
                  className="bg-gray-800 hover:bg-gray-700 transition p-4 rounded-lg text-center"
                >
                  {subCat.name}
                  {subCat.productCount && (
                    <span className="text-sm text-gray-400 block mt-1">
                      {subCat.productCount} ürün
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-1/4">
            <div className="bg-gray-800 rounded-lg p-4 sticky top-4">
              <div 
                className="flex justify-between items-center cursor-pointer"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
              >
                <h2 className="text-xl font-semibold flex items-center">
                  <FaFilter className="mr-2" /> Filtreler
                </h2>
                <FaArrowDown className={`transition transform ${isFilterOpen ? 'rotate-180' : ''}`} />
              </div>
              
              {isFilterOpen && (
                <div className="mt-4 border-t border-gray-700 pt-4">
                  <div className="mb-4">
                    <h3 className="font-semibold mb-2">Fiyat Aralığı</h3>
                    {/* Price range filter will be implemented here */}
                    <div className="flex items-center">
                      <input 
                        type="number" 
                        placeholder="Min" 
                        className="w-1/2 bg-gray-700 p-2 rounded-l text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <input 
                        type="number" 
                        placeholder="Max" 
                        className="w-1/2 bg-gray-700 p-2 rounded-r text-white focus:outline-none focus:ring-2 focus:ring-purple-500" 
                      />
                    </div>
                  </div>
                  
                  {/* More filter options will be implemented here */}
                </div>
              )}
            </div>
          </div>
          
          <div className="w-full md:w-3/4">
            {products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map(product => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ProductCard 
                      id={product.id}
                      name={product.name}
                      price={product.price}
                      rating={product.rating || 5}
                      image={product.image}
                      game={product.game}
                      slug={product.slug}
                      stock={product.stock}
                      category={category}
                      isBestseller={product.isBestseller}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-gray-800 rounded-lg">
                <p className="text-xl">Bu kategoride henüz ürün bulunmuyor.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 