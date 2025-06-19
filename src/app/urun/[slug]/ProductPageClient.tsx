'use client';

import * as React from 'react';

import Image from 'next/image';
import Link from 'next/link';
import {FaInfoCircle, FaChevronRight, FaTag, FaEdit} from 'react-icons/fa';
import ProductClientContent from '@/components/products/ProductClientContent';
import ProductDescription from '@/components/products/ProductDescription';
import ProductFeatures from '@/components/products/ProductFeatures';
import { MotionDiv, pageVariants, itemVariants } from '@/components/framer/motion-components';

import { useSession } from 'next-auth/react';
import { FaHome } from 'react-icons/fa';


// Define a type for serialized product that includes string price
type SerializedProduct = {
  "id": string;
  "name": string;
  "slug": string;
  "price": string;
  description?: string;
  image?: string;
  "createdAt": string;
  "updatedAt": string;
  category?: {
    "id": string;
    "name": string;
    "slug": string;
    image?: string;
  };
};

interface ProductPageClientProps {
  "product": SerializedProduct;
}

const Breadcrumbs = ({ product }: { 
  "product": { 
    "name": string;
    category?: { 
      "name": string;
      "slug": string;
    } 
  }
}) => (
  <MotionDiv variants={itemVariants} className="flex items-center text-sm text-gray-400 mb-6">
    <Link href="/" className="hover:text-white hover:underline transition-colors flex items-center gap-2">
      <FaHome />
      Anasayfa
    </Link>
    <FaChevronRight className="mx-3" />
    {product.category && (
      <>
        <Link 
          href={`/kategori/${product.category.slug}`} 
          className="text-gray-500 hover:text-white hover:underline transition-colors"
        >
          {product.category.name}
        </Link>
        <FaChevronRight className="mx-3" />
      </>
    )}
    <span className="text-white font-semibold">{product.name}</span>
  </MotionDiv>
);

// Admin Edit Button Component
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const AdminEditButton = ({ productId }: { productId: string }) => {
      const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'ADMIN';

  if (!isAdmin) return null;

  return (
    <MotionDiv 
      variants={itemVariants} 
      className="mt-8 flex justify-end"
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
    >
      <Link 
        href={`/admin/products`}
        className="admin-edit-button"
      >
        <FaEdit />
        <span>Ürünü Düzenle</span>
      </Link>
    </MotionDiv>
  );
};

export default function ProductPageClient({ product }: ProductPageClientProps) {
  return (
    <MotionDiv 
      className="container mx-auto px-4 py-8"
      initial="hidden"
      animate="visible"
      variants={pageVariants}
    >
      <Breadcrumbs product={product} />
      
      <div className="product-detail-layout">
        <MotionDiv variants={itemVariants}>
          <div className="product-image-container">
            {product.image ? (
              <>
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="product-image"
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  priority
                  quality={90}
                />
                <div className="product-image-overlay"></div>
                {product.category && (
                  <div className="product-category-badge">
                    <FaTag size={12} />
                    <span>{product.category.name}</span>
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full aspect-square bg-gray-900 flex items-center justify-center">
                <FaInfoCircle className="text-gray-600 text-6xl" />
              </div>
            )}
          </div>
        </MotionDiv>

        <MotionDiv variants={itemVariants}>
          <div className="product-info-container">
            <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4">{product.name}</h1>
            
            {product.category && (
              <div className="flex items-center gap-2 mb-6">
                <span className="text-sm text-gray-400">Kategori:</span>
                <Link 
                  href={`/kategori/${product.category.slug}`}
                  className="flex items-center gap-2 text-sm bg-gray-900 hover:bg-gray-800 text-gray-300 px-3 py-1 rounded-full transition-colors"
                >
                  {product.category.image && (
                    <div className="relative w-6 h-6 rounded-full overflow-hidden">
                      <Image 
                        src={product.category.image} 
                        alt={product.category.name} 
                        fill
                        className="object-contain" 
                      />
                    </div>
                  )}
                  <span>{product.category.name}</span>
                </Link>
              </div>
            )}
            
            {/* Price Display */}
            <div className='flex flex-col items-start my-6'>
                <span className="text-sm text-gray-400 mb-2">Fiyat</span>
                <div className="bg-primary/20 text-white font-bold text-5xl py-3 px-6 rounded-lg border border-primary/50 font-mono">
                    ₺{product.price}
                </div>
            </div>

            <div className="my-6">
                <ProductFeatures />
            </div>

            <div className="mt-auto pt-6 border-t border-gray-700/50">
                {/* Add to Cart Button */}
                <ProductClientContent product={product} />
            </div>
          </div>
        </MotionDiv>
      </div>
      
      {product.description && (
        <MotionDiv variants={itemVariants} className="bg-gray-800/50 border border-gray-700 rounded-xl p-8 shadow-lg mt-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
            <FaInfoCircle /> Ürün Açıklaması
          </h2>
          <ProductDescription description={product.description} />
        </MotionDiv>
      )}

      {/* Admin-only Edit Button */}
      <AdminEditButton productId={product.id} />
    </MotionDiv>
  );
} 