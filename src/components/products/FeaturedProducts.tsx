'use client';

import * as React from 'react';
import { useFeaturedProducts } from '@/lib/hooks/use-trpc';
import Link from 'next/link';
import Image from 'next/image';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: string;
  images: { url: string }[];
  stockCount: number;
}

export default function FeaturedProducts() {
  const { data: products, isLoading, error } = useFeaturedProducts();
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold mb-8 text-center">Featured Products</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }
  
  if (error || !products || products.length === 0) {
    return null;
  }
  
  return (
    <div className="container mx-auto px-4 py-12">
      <h2 className="text-2xl font-bold mb-8 text-center">Featured Products</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product: Product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}

interface ProductCardProps {
  product: Product;
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