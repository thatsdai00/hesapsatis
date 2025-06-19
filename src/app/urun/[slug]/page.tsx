import * as React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { db } from '@/lib/db';
import ProductPageClient from './ProductPageClient';
import { getServerSiteSettings } from '@/lib/server-utils';
import { safelyGetKeywords } from '@/lib/seo-helpers';



type Props = {
  params: { slug: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

// Generate metadata for the page
export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const slug = params.slug;

  const product = await db.product.findUnique({
    where: { slug } });

  if (!product) {
    return {
      title: 'Ürün Bulunamadı' };
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
      images: product.image ? [product.image] : [] } };
}

export default async function ProductPage({ params }: Props) {
  const product = await db.product.findUnique({
    where: {
      slug: params.slug,
      isActive: true,
      published: true },
    include: {
      category: true } });
  
  if (!product) {
    notFound();
  }

  // Serialize the product to avoid passing Decimal objects to client components
  const serializedProduct = {
    ...product,
    price: product.price.toString(),
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString() };

  return <ProductPageClient product={serializedProduct} />;
} 