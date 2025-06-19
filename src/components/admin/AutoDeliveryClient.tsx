'use client';

import { useState, useMemo, useCallback } from 'react';
import ProductRow, { Product } from './ProductRow';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import Image from 'next/image';

export interface Category {
  id: string;
  name: string;
  image?: string;
  products: Product[];
}

interface AutoDeliveryClientProps {
  initialCategories: Category[];
}

export default function AutoDeliveryClient({ initialCategories }: AutoDeliveryClientProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [searchText, setSearchText] = useState('');
  const [stockFilter, setStockFilter] = useState('all'); // 'all', 'withStock', 'noStock'

  const refreshProducts = async () => {
    try {
      const response = await fetch('/api/admin/products/categorized'); // Assuming a new endpoint
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Failed to refresh products:', error);
    }
  };

  const getAvailableStockCount = useCallback((product: Product) => {
    return product.stocks.filter(stock => !stock.isDelivered).length;
  }, []);

  const filteredCategories = useMemo(() => {
    return categories.map(category => {
      const filteredProducts = category.products.filter(product => {
        const hasStock = getAvailableStockCount(product) > 0;
        const stockMatch = 
          (stockFilter === 'all') ||
          (stockFilter === 'withStock' && hasStock) ||
          (stockFilter === 'noStock' && !hasStock);
        
        const searchMatch = product.name.toLowerCase().includes(searchText.toLowerCase());

        return stockMatch && searchMatch;
      });
      return { ...category, products: filteredProducts };
    }).filter(category => category.products.length > 0);
  }, [searchText, stockFilter, categories, getAvailableStockCount]);

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <Input 
            placeholder="Search products..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="pl-10 w-full bg-white dark:bg-gray-800/60 border-gray-200 dark:border-gray-700"
          />
        </div>
        <div className="flex gap-2">
          <button 
            className={`px-4 py-2 rounded-md transition-colors text-sm font-medium ${stockFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700'}`}
            onClick={() => setStockFilter('all')}
          >
            All
          </button>
          <button 
            className={`px-4 py-2 rounded-md transition-colors text-sm font-medium ${stockFilter === 'withStock' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700'}`}
            onClick={() => setStockFilter('withStock')}
          >
            With Stock
          </button>
          <button 
            className={`px-4 py-2 rounded-md transition-colors text-sm font-medium ${stockFilter === 'noStock' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700'}`}
            onClick={() => setStockFilter('noStock')}
          >
            No Stock
          </button>
        </div>
      </div>
      
      <div className="space-y-8">
        {filteredCategories.length > 0 ? (
          filteredCategories.map(category => (
            <div key={category.id} className="space-y-4">
              <div className="flex items-center gap-4">
                {category.image && (
                  <Image src={category.image} alt={category.name} width={40} height={40} className="rounded-full" />
                )}
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{category.name}</h2>
              </div>
              <div className="space-y-4">
                {category.products.map(product => (
                   <ProductRow 
                    key={product.id}
                    product={product} 
                    refreshProducts={refreshProducts} 
                    getAvailableStockCount={getAvailableStockCount}
                  />
                ))}
              </div>
            </div>
          ))
        ) : (
          <p className="py-8 text-center text-gray-500 dark:text-gray-400">No products found. Try adjusting your filters.</p>
        )}
      </div>
    </div>
  );
} 