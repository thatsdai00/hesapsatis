'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StockUploader from './StockUploader';
import Image from 'next/image';

interface Stock {
  id: string;
  content: string;
  isDelivered: boolean;
}

export interface Product {
  id: string;
  name: string;
  stocks: Stock[];
  stockCount: number;
  image?: string; // Optional for now
}

interface ProductRowProps {
  product: Product;
  refreshProducts: () => Promise<void>;
  getAvailableStockCount: (product: Product) => number;
}

export default function ProductRow({ product, refreshProducts, getAvailableStockCount }: ProductRowProps) {
  const availableStock = getAvailableStockCount(product);
  
  return (
    <Card className="bg-white dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300">
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {product.image ? (
            <Image 
              src={product.image} 
              alt={product.name}
              width={60}
              height={60}
              className="rounded-md object-cover"
            />
          ) : (
            <div className="w-[60px] h-[60px] bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center">
              <span className="text-xs text-gray-500 dark:text-gray-400">No Img</span>
            </div>
          )}
          <div className="flex flex-col">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">{product.name}</h3>
            <span className={`text-sm font-medium px-2 py-1 rounded-full w-fit mt-1 ${
              availableStock > 0 
                ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' 
                : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
            }`}>
              {availableStock} / {product.stockCount} available
            </span>
          </div>
        </div>
        <div className="w-full max-w-xs">
          <StockUploader 
            productId={product.id} 
            onSuccess={refreshProducts} 
          />
        </div>
      </div>
    </Card>
  );
} 