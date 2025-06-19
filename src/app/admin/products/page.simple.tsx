'use client';

import * as React from 'react';
import { trpc } from '@/lib/trpc-client';
import {FaEdit, FaTrash, FaPlus} from 'react-icons/fa';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number | string | { toFixed: (digits: number) => string }; // Support both number and Decimal
  stockCount: number;
  published: boolean;
  category?: {
    name: string;
  };
}

export default function ProductsPage() {
  const { data: productsData, isLoading } = trpc.admin.getProducts.useQuery({ limit: 10 });
  const products = productsData?.products || [];

  if (isLoading) {
    return <div className="text-center py-10">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <button className="bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-md">
          <FaPlus className="inline mr-2" /> Add Product
        </button>
      </div>

      <div className="bg-card rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-secondary/50">
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Category</th>
              <th className="px-4 py-2 text-left">Price</th>
              <th className="px-4 py-2 text-left">Stock</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product: Product) => (
              <tr key={product.id} className="border-t border-gray-700">
                <td className="px-4 py-2">{product.name}</td>
                <td className="px-4 py-2">{product.category?.name || '-'}</td>
                <td className="px-4 py-2">${typeof product.price === 'string' 
                  ? parseFloat(product.price).toFixed(2) 
                  : (typeof product.price === 'object' && 'toFixed' in product.price 
                    ? product.price.toFixed(2) 
                    : String(product.price))}</td>
                <td className="px-4 py-2">{product.stockCount}</td>
                <td className="px-4 py-2">
                  {product.published ? 'Published' : 'Draft'}
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <button className="text-blue-500"><FaEdit /></button>
                    <button className="text-red-500"><FaTrash /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 