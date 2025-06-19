import { notFound } from 'next/navigation';
import { Metadata, ResolvingMetadata } from 'next';
import { db } from '@/lib/db';
import Image from 'next/image';
import { FaInfoCircle, FaHome, FaChevronRight } from 'react-icons/fa';
import ProductClientContent from '@/components/products/ProductClientContent';
import ProductDescription from '@/components/products/ProductDescription';
import ProductFeatures from '@/components/products/ProductFeatures';
import Link from 'next/link';
import ProductPageClient from './ProductPageClient';
import { MotionDiv, pageVariants, itemVariants } from '@/components/framer/motion-components';
import { getServerSiteSettings } from '@/lib/server-utils';
import { safelyGetKeywords } from '@/lib/seo-helpers';
import { Product } from '@prisma/client';

type Props = {
  params: { slug: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

// Generate metadata for the page
export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const slug = params.slug;

  const product = await db.product.findUnique({
    where: { slug },
  });

  if (!product) {
    return {
      title: 'Ürün Bulunamadı',
    };
  }

  // Get site settings for the site name
  const siteSettings = await getServerSiteSettings();
  const seoTitle = `${product.name} | ${siteSettings.siteName}`;
  
  const description = product.description?.replace(/<[^>]*>?/gm, '').substring(0, 160) || 'Harika bir ürün';

  // Get combined keywords using the safe helper function
  const keywords = safelyGetKeywords(product, siteSettings);

  return {
    title: seoTitle,
    description: description,
    keywords,
    openGraph: {
      title: seoTitle,
      description: description,
      images: product.image ? [product.image] : [],
    },
  };
}

const Breadcrumbs = ({ product, categoryName }: { product: { name: string }, categoryName?: string }) => (
  <MotionDiv variants={itemVariants} className="flex items-center text-sm text-gray-400 mb-6">
    <Link href="/" className="hover:text-white transition-colors flex items-center gap-2">
      <FaHome />
      Anasayfa
    </Link>
    <FaChevronRight className="mx-3" />
    {categoryName && (
      <>
        <span className="text-gray-500">{categoryName}</span>
        <FaChevronRight className="mx-3" />
      </>
    )}
    <span className="text-white font-semibold">{product.name}</span>
  </MotionDiv>
);

async function ProductPageContent({ slug }: { slug: string }) {
  const product = await db.product.findUnique({
    where: {
      slug: slug,
      isActive: true,
      published: true,
    },
    include: {
      category: true,
    },
  });

  if (!product) {
    notFound();
  }

  return (
    <MotionDiv 
      className="container mx-auto px-4 py-8"
      initial="hidden"
      animate="visible"
      variants={pageVariants}
    >
      <Breadcrumbs product={product} categoryName={product.category?.name} />
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <MotionDiv variants={itemVariants} className="lg:col-span-2">
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 shadow-lg h-full">
            <div className="relative aspect-square rounded-lg overflow-hidden">
              {product.image ? (
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  priority
                />
              ) : (
                <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                  <FaInfoCircle className="text-gray-600 text-6xl" />
                </div>
              )}
            </div>
          </div>
        </MotionDiv>

        <MotionDiv variants={itemVariants} className="lg:col-span-3">
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-8 shadow-lg h-full flex flex-col">
            <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4">{product.name}</h1>
            
            {product.category && (
              <div className="flex items-center gap-2 mb-6">
                <span className="text-sm text-gray-400">Kategori:</span>
                <div className="flex items-center gap-2 text-sm bg-gray-900 text-gray-300 px-3 py-1 rounded-full">
                  {product.category.image && (
                    <Image src={product.category.image} alt={product.category.name} width={18} height={18} className="object-contain" />
                  )}
                  <span>{product.category.name}</span>
                </div>
              </div>
            )}
            
            <div className="mt-auto pt-6">
              <div className="mb-6">
                <span className="text-sm text-gray-400">Fiyat</span>
                <div className="relative inline-block mt-1">
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg blur opacity-75"></div>
                    <div className="relative text-4xl lg:text-5xl font-extrabold text-white bg-black/50 px-6 py-2 rounded-lg">
                        ₺{product.price.toString()}
                    </div>
                </div>
              </div>
              
              <ProductClientContent product={product} />
            </div>
          </div>
        </MotionDiv>
      </div>
      
      <MotionDiv variants={itemVariants}>
        <ProductFeatures />
      </MotionDiv>
      
      {product.description && (
        <MotionDiv variants={itemVariants} className="bg-gray-800/50 border border-gray-700 rounded-xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
            <FaInfoCircle /> Ürün Açıklaması
          </h2>
          <ProductDescription description={product.description} />
        </MotionDiv>
      )}
    </MotionDiv>
  );
}

export default async function ProductPage({ params }: Props) {
    const product = await db.product.findUnique({
        where: {
          slug: params.slug,
          isActive: true,
          published: true,
        },
        include: {
          category: true,
        },
      });
    
      if (!product) {
        notFound();
      }

    // Serialize the product to avoid passing Decimal objects to client components
    const serializedProduct = {
      ...product,
      price: product.price.toString(),
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };

    return <ProductPageClient product={serializedProduct} />;
} 