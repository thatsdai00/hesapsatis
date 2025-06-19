import { notFound } from 'next/navigation';
import { Metadata, ResolvingMetadata } from 'next';
import { db } from '@/lib/db';
import CategoryPageClient from './CategoryPageClient';
import { getServerSiteSettings } from '@/lib/server-utils';
import { combineKeywords } from '@/lib/seo-helpers';
import { Category } from '@prisma/client';

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

  // Retrieve the category with all required fields
  const category = await db.category.findUnique({
    where: { slug }
  });

  if (!category) {
    return {
      title: 'Kategori Bulunamadı',
    };
  }

  // Get site settings for the site name
  const siteSettings = await getServerSiteSettings();
  const seoTitle = `${category.name} | ${siteSettings.siteName}`;
  
  const description = category.description?.replace(/<[^>]*>?/gm, '').substring(0, 160) || `${category.name} kategorisindeki ürünleri keşfedin`;

  // Get combined keywords using the helper function
  // Use type assertion because TypeScript doesn't correctly infer that the category has the seoKeywords field
  const keywords = combineKeywords((category as Category).seoKeywords, siteSettings);

  return {
    title: seoTitle,
    description: description,
    keywords,
    openGraph: {
      title: seoTitle,
      description: description,
      images: category.image ? [category.image] : [],
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const slug = params.slug;

  const category = await db.category.findUnique({
    where: { slug },
    include: {
      products: {
        where: {
          published: true,
          isActive: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          category: true
        }
      },
    },
  });

  if (!category) {
    notFound();
  }

  // Serialize the category and products to avoid passing Decimal objects to client components
  const serializedCategory = {
    ...category,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
    products: category.products.map(product => ({
      ...product,
      price: product.price.toString(),
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
      category: {
        ...product.category,
        createdAt: product.category.createdAt.toISOString(),
        updatedAt: product.category.updatedAt.toISOString(),
      }
    }))
  };

  return <CategoryPageClient category={serializedCategory} />;
} 