'use client';

import * as React from 'react';
import { useProducts } from '@/lib/hooks/use-trpc';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';

interface ProductType {
  id: string;
  name: string;
  slug: string;
  price: string;
  images: { url: string }[];
  stockCount: number;
}

interface ProductGridProps {
  categoryId?: string;
  search?: string;
  limit?: number;
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'popular';
  minPrice?: number;
  maxPrice?: number;
}

export default function ProductGrid({
  categoryId,
  search,
  limit = 12,
  sortBy = 'newest',
  minPrice,
  maxPrice,
}: ProductGridProps) {
  const { data, isLoading, error, hasMore, loadMore, refetch } = useProducts({
    categoryId,
    search,
    limit,
    sortBy,
    minPrice,
    maxPrice,
  });

  const [products, setProducts] = useState<ProductType[]>([]);

  useEffect(() => {
    if (data?.products) {
      setProducts((prev) => {
        // If we're not using a cursor (initial load), replace products
        if (!data.nextCursor || prev.length === 0) {
          return [...data.products];
        }
        // Otherwise append new products
        const existingIds = new Set(prev.map((p) => p.id));
        const newProducts = data.products.filter((p: ProductType) => !existingIds.has(p.id));
        return [...prev, ...newProducts];
      });
    }
  }, [data]);

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500">Error loading products</p>
        <button
          onClick={() => refetch()}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}

        {isLoading &&
          Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)}
      </div>

      {products.length === 0 && !isLoading && (
        <div className="text-center py-10">
          <p className="text-gray-500">No products found</p>
        </div>
      )}

      {hasMore && (
        <div className="text-center pt-6">
          <button
            onClick={loadMore}
            disabled={isLoading}
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}

interface ProductCardProps {
  product: ProductType;
}

function ProductCard({ product }: ProductCardProps) {
  const { name, slug, price, images } = product;
  const imageUrl = images && images.length > 0 ? images[0].url : '/placeholder.png';

  return (
    <Link
      href={`/products/${slug}`}
      className="group block rounded-lg overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow"
    >
      <div className="relative h-48 bg-gray-100">
        <Image
          src={imageUrl}
          alt={name}
          fill
          className="object-cover group-hover:scale-105 transition-transform"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-lg truncate group-hover:text-blue-600">{name}</h3>
        <div className="flex justify-between items-center mt-2">
          <p className="text-lg font-bold">${parseFloat(price).toFixed(2)}</p>
          <span className="text-sm px-2 py-1 bg-blue-100 text-blue-800 rounded">
            {product.stockCount > 0 ? 'In Stock' : 'Out of Stock'}
          </span>
        </div>
      </div>
    </Link>
  );
}

function ProductCardSkeleton() {
  return (
    <div className="rounded-lg overflow-hidden border border-gray-200">
      <div className="h-48 bg-gray-200 animate-pulse"></div>
      <div className="p-4">
        <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
        <div className="flex justify-between items-center mt-2">
          <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    </div>
  );
} 