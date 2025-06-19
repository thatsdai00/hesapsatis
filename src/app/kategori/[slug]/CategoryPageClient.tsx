'use client';

import Image from 'next/image';
import { FaHome, FaChevronRight } from 'react-icons/fa';
import Link from 'next/link';
import ProductCard from '@/components/products/ProductCard';
import { MotionDiv, pageVariants, itemVariants } from '@/components/framer/motion-components';
import { CategoryWithProducts } from '@/interfaces';

interface CategoryPageClientProps {
  category: CategoryWithProducts;
}

const Breadcrumbs = ({ category }: { category: { name: string; slug: string; } }) => (
  <MotionDiv variants={itemVariants} className="flex items-center text-sm text-gray-400 mb-6">
    <Link href="/" className="hover:text-white hover:underline transition-colors flex items-center gap-2">
      <FaHome />
      Anasayfa
    </Link>
    <FaChevronRight className="mx-3" />
    <span className="text-white font-semibold">{category.name}</span>
  </MotionDiv>
);

export default function CategoryPageClient({ category }: CategoryPageClientProps) {
  return (
    <MotionDiv 
      className="container mx-auto px-4 py-8"
      initial="hidden"
      animate="visible"
      variants={pageVariants}
    >
      <Breadcrumbs category={category} />
      
      {/* Category Header Section */}
      <MotionDiv variants={itemVariants} className="mb-10">
        <div className="relative w-full">
          <div className="category-header-card">
            {/* Category Image - Square (1:1 aspect ratio) */}
            {category.image ? (
              <div className="relative w-24 h-24 md:w-32 md:h-32 flex-shrink-0 rounded-lg overflow-hidden border-2 border-purple-500/30 z-10 category-image">
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 96px, 128px"
                  priority
                />
              </div>
            ) : (
              <div className="w-24 h-24 md:w-32 md:h-32 flex-shrink-0 bg-gray-900 rounded-lg flex items-center justify-center z-10 category-image">
                <span className="text-gray-600 text-4xl font-bold">{category.name.charAt(0)}</span>
              </div>
            )}
            
            {/* Category Content */}
            <div className="flex-1 z-10">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 text-center md:text-left text-shadow">{category.name}</h1>
              {category.description && (
                <div 
                  className="text-gray-300 max-w-3xl description-text"
                  dangerouslySetInnerHTML={{ __html: category.description }}
                />
              )}
            </div>
          </div>
        </div>
      </MotionDiv>

      {/* Products Section */}
      <MotionDiv variants={itemVariants}>
        <section className="product-section bg-[#111828] rounded-xl p-6">
          <div className="section-header">
            <h2 className="section-title">
              {category.name} Ürünleri
            </h2>
          </div>

          {/* Product Cards */}
          <div className="product-grid">
            {category.products && category.products.length > 0 ? (
              category.products.map((product) => (
                <ProductCard 
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  price={product.price}
                  rating={5} // Default rating
                  image={product.image}
                  game={product.category?.name?.toLowerCase().includes('valorant') ? 'valorant' : 'pubg'}
                  slug={product.slug}
                  stock={product.stockCount}
                  category={product.category ? { 
                    name: product.category.name,
                    slug: product.category.slug 
                  } : undefined}
                  isBestseller={product.isBestseller || false}
                  isFeatured={product.isFeatured || false}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-10 text-gray-400">
                Bu kategoride henüz ürün bulunmamaktadır.
              </div>
            )}
          </div>
        </section>
      </MotionDiv>

      <style jsx global>{`
        .category-header-card {
          background-color: #111827;
          border: 1px solid rgba(162, 89, 255, 0.2);
          border-radius: 0.75rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 1.5rem;
          position: relative;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.17, 0.67, 0.83, 0.67);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        @media (min-width: 768px) {
          .category-header-card {
            flex-direction: row;
            align-items: center;
            gap: 2rem;
            padding: 2rem;
          }
        }

        .category-header-card:hover {
          border-color: rgba(162, 89, 255, 0.4);
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4), 0 0 20px rgba(162, 89, 255, 0.2);
        }

        .category-header-card:hover::before {
          animation: glow-line 1.5s ease-in-out infinite;
        }

        .category-header-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(162, 89, 255, 0.8), transparent);
          z-index: 1;
        }

        .category-header-card::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle at bottom right, rgba(162, 89, 255, 0.15), transparent 70%);
          z-index: 0;
          animation: pulse-gradient 8s ease-in-out infinite alternate;
        }

        .text-shadow {
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
        }

        .category-image {
          box-shadow: 0 0 15px rgba(162, 89, 255, 0.3);
          transition: all 0.3s ease;
        }

        .category-header-card:hover .category-image {
          border-color: rgba(162, 89, 255, 0.6);
          box-shadow: 0 0 20px rgba(162, 89, 255, 0.5);
          transform: scale(1.05);
        }

        .description-text {
          position: relative;
          z-index: 10;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
          background-color: rgba(17, 24, 39, 0.5);
          padding: 0.75rem;
          border-radius: 0.5rem;
          backdrop-filter: blur(2px);
          margin-top: 0.5rem;
        }

        @keyframes glow-line {
          0% {
            background: linear-gradient(90deg, transparent, rgba(162, 89, 255, 0.8), transparent);
            opacity: 0.5;
          }
          50% {
            background: linear-gradient(90deg, transparent, rgba(162, 89, 255, 1), transparent);
            opacity: 1;
          }
          100% {
            background: linear-gradient(90deg, transparent, rgba(162, 89, 255, 0.8), transparent);
            opacity: 0.5;
          }
        }

        @keyframes pulse-gradient {
          0% {
            background-position: 0% 0%;
            opacity: 0.7;
          }
          50% {
            background-position: 100% 0%;
            opacity: 1;
          }
          100% {
            background-position: 0% 0%;
            opacity: 0.7;
          }
        }
      `}</style>
    </MotionDiv>
  );
} 