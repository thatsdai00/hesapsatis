import * as React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { db } from '@/lib/db';
import {FaChevronRight} from 'react-icons/fa';
import Link from 'next/link';
import ProductDescription from '@/components/products/ProductDescription';
import { MotionDiv, pageVariants, itemVariants } from '@/components/framer/motion-components';
import { getServerSiteSettings } from '@/lib/server-utils';
import { FaHome } from 'react-icons/fa';


type Props = {
  params: { slug: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

// Generate metadata for the page
export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const slug = params.slug;

  const customPage = await db.customPage.findUnique({
    where: { slug } });

  if (!customPage) {
    return {
      title: 'Sayfa Bulunamadı' };
  }

  // Get site settings for the site name
  const siteSettings = await getServerSiteSettings();
  const seoTitle = `${customPage.title} | ${siteSettings.siteName}`;

  const description = customPage.content?.replace(/<[^>]*>?/gm, '').substring(0, 160) || customPage.title;
  
  return {
    title: seoTitle,
    description: customPage.seoDescription || description,
    keywords: customPage.seoKeywords || '',
    openGraph: {
      title: seoTitle,
      description: customPage.seoDescription || description } };
}

const Breadcrumbs = ({ title }: { title: string }) => (
  <MotionDiv variants={itemVariants} className="flex items-center text-sm text-gray-400 mb-6">
    <Link href="/" className="hover:text-white transition-colors flex items-center gap-2">
      <FaHome />
      Anasayfa
    </Link>
    <FaChevronRight className="mx-3" />
    <span className="text-white font-semibold">{title}</span>
  </MotionDiv>
);

export default async function CustomPageView({ params }: Props) {
  const customPage = await db.customPage.findUnique({
    where: {
      slug: params.slug,
      published: true } });

  if (!customPage) {
    notFound();
  }

  return (
    <MotionDiv 
      className="container mx-auto px-4 py-8"
      initial="hidden"
      animate="visible"
      variants={pageVariants}
    >
      <Breadcrumbs title={customPage.title} />
      
      <MotionDiv variants={itemVariants} className="bg-gray-800/50 border border-gray-700 rounded-xl p-8 shadow-lg mb-8">
        <h1 className="text-3xl lg:text-4xl font-bold text-white mb-6">{customPage.title}</h1>
        
        <div className="mt-6">
          <ProductDescription description={customPage.content} />
        </div>
      </MotionDiv>
    </MotionDiv>
  );
} 