'use client';

import * as React from 'react';
import {useState, useEffect} from 'react';
import {FaChevronRight, FaImage} from 'react-icons/fa';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import HeroSlider from '@/components/layout/HeroSlider';
import QuickAccess from '@/components/quick-access/QuickAccess';
import ProductCard from '@/components/products/ProductCard';
import {QuickAccessItem} from '@/interfaces';

// Animation variants
const fadeIn = {
  "hidden": { "opacity": 0, "y": 20 },
  "visible": { "opacity": 1, "y": 0 }
};

// Interface for categories with count
// Removed unused interface
// interface CategoryWithCount {
//   "id": string;
//   "name": string;
//   "slug": string;
//   image?: string;
//   _count?: {
//     "products": number;
//   };
// }

// Removed unused interface
// interface SliderType {
//   "id": string;
//   "title": string;
//   subtitle?: string;
//   link?: string;
//   "image": string;
// }

interface ProductType {
  "id": string;
  "name": string;
  "price": string | number | { "toString": () => string };
  "image": string | null;
  "slug": string;
  "stockCount": number;
  isBestseller?: boolean;
  isFeatured?: boolean;
  category?: {
    "name": string;
    slug?: string;
  };
}

interface CategoryType {
  "id": string;
  "name": string;
  "slug": string;
  image?: string;
  products?: ProductType[];
  _count?: {
    "products": number;
  };
}

export default function Home() {
  // Responsive items count - used in resize handler
  const [, setVisibleItems] = useState(4);
  const [sliders, setSliders] = useState<[]>([]);
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<ProductType[]>([]);
  const [homepageCategories, setHomepageCategories] = useState<CategoryType[]>([]);
  const [quickAccessItems, setQuickAccessItems] = useState<QuickAccessItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch data from the server
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch sliders
        const slidersRes = await fetch('/api/sliders');
        const slidersData = await slidersRes.json();
        setSliders(slidersData);
        
        // Fetch categories
        const categoriesRes = await fetch('/api/categories');
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData);
        
        // Fetch featured products
        const featuredRes = await fetch('/api/products/featured');
        const featuredData = await featuredRes.json();
        setFeaturedProducts(featuredData);
        
        // Fetch homepage categories with products
        const homepageCategoriesRes = await fetch('/api/categories/homepage');
        const homepageCategoriesData = await homepageCategoriesRes.json();
        setHomepageCategories(homepageCategoriesData);

        // Fetch quick access items
        const quickAccessRes = await fetch('/api/quick-access');
        const quickAccessData = await quickAccessRes.json();
        setQuickAccessItems(quickAccessData);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching "data":', error);
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Handle responsive carousel
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setVisibleItems(1);
      } else if (window.innerWidth < 768) {
        setVisibleItems(2);
      } else if (window.innerWidth < 1024) {
        setVisibleItems(3);
      } else {
        setVisibleItems(4);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Category carousel navigation - currently unused
  // const [categoryStart, setCategoryStart] = useState(0);

  // If loading, show a loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Convert sliders data to the format expected by HeroSlider
  const heroSlides = sliders?.map((slider) => ({
    "id": slider.id,
    "mainHeading": slider.title,
    "subHeading": slider.subtitle || '',
    "tagline": '',
    "description": '',
    "buttonText": 'Satın al',
    "buttonUrl": slider.link || '/products',
    "imageUrl": slider.image,
    "game": 'valorant' // Default game type, adjust as needed
  })) || [];

  return (
    <div className="min-h-screen">
      {/* Hero Slider */}
      {heroSlides.length > 0 && <HeroSlider slides={heroSlides} />}

      {/* Quick Access */}
      <QuickAccess items={quickAccessItems} isLoading={isLoading} />

      {/* Homepage Categories with Products Sections */}
      {homepageCategories && homepageCategories.length > 0 ? (
        homepageCategories.map((category) => (
          <section key={category.id} className="product-section bg-[#111828]">
            <div className="container mx-auto px-4">
              <div className="section-header">
                <h2 className="section-title flex items-center gap-2">
                  {category.image && (
                    <div className="relative w-8 h-8 rounded-full overflow-hidden border border-gray-700/50">
                      <Image 
                        src={category.image} 
                        alt={category.name}
                        fill
                        className="object-contain"
                      />
                    </div>
                  )}
                  {category.name}
                </h2>
                <Link href={`/kategori/${category.slug}`} className="view-all-link">
                  Tümünü Gör <FaChevronRight />
                </Link>
              </div>

              {/* Product Cards */}
              <div className="product-grid">
                {category.products && Array.isArray(category.products) && category.products.map((product) => (
                  <ProductCard 
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    price={typeof product.price === 'object' ? product.price.toString() : product.price}
                    rating={5} // Default rating
                    image={product.image || null}
                    game={product.category?.name?.toLowerCase().includes('valorant') ? 'valorant' : 'pubg'}
                    slug={product.slug}
                    category={product.category}
                    stock={product.stockCount}
                    isBestseller={product.isBestseller || false}
                    isFeatured={product.isFeatured || false}
                  />
                ))}
                {(!category.products || !Array.isArray(category.products) || category.products.length === 0) && (
                  <div className="col-span-full text-center py-10 text-gray-400">
                    Bu kategoride henüz ürün bulunmamaktadır.
                  </div>
                )}
              </div>
            </div>
          </section>
        ))
      ) : (
        // Fallback to featured products if no categories are set to show on homepage
        <section className="product-section bg-[#111828]">
          <div className="container mx-auto px-4">
            <div className="section-header">
              <h2 className="section-title">
                <FaChevronRight className="text-purple-500" />
                Öne Çıkan Ürünler
              </h2>
              <Link href="/products" className="view-all-link">
                Tümünü Gör <FaChevronRight />
              </Link>
            </div>

            {/* Product Cards */}
            <div className="product-grid">
              {featuredProducts && Array.isArray(featuredProducts) && featuredProducts.map((product) => (
                <ProductCard 
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  price={typeof product.price === 'object' ? product.price.toString() : product.price}
                  rating={5} // Default rating
                  image={product.image || null}
                  game={product.category?.name?.toLowerCase().includes('valorant') ? 'valorant' : 'pubg'}
                  slug={product.slug}
                  category={product.category}
                  stock={product.stockCount}
                  isBestseller={product.isBestseller || false}
                  isFeatured={product.isFeatured || false}
                />
              ))}
              {(!featuredProducts || !Array.isArray(featuredProducts) || featuredProducts.length === 0) && (
                <div className="col-span-full text-center py-10 text-gray-400">
                  Henüz ürün bulunmamaktadır.
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Categories Section */}
      <section className="product-section bg-[#111828]">
        <div className="container mx-auto px-4">
          <div className="section-header">
            <h2 className="section-title">
              <FaChevronRight className="text-purple-500" />
              Kategoriler
            </h2>
            <Link href="/categories" className="view-all-link">
              Tümünü Gör <FaChevronRight />
            </Link>
          </div>

          {/* Category Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {categories && Array.isArray(categories) && categories.map((category) => (
              <motion.div
                key={category.id}
                initial="hidden"
                whileInView="visible"
                viewport={{ "once": true }}
                transition={{ "duration": 0.4 }}
                variants={fadeIn}
              >
                <Link href={`/kategori/${category.slug}`} className="block">
                  <div className="category-card">
                    {category.image ? (
                      <div className="relative w-12 h-12 rounded-full overflow-hidden border border-purple-500/30 mr-4">
                        <Image 
                          src={category.image} 
                          alt={category.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mr-4">
                        <FaImage className="text-gray-600" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-lg font-medium">{category.name}</h3>
                      <p className="text-sm text-gray-400">
                        {category._count?.products || 0} ürün
                      </p>
                    </div>
                    <FaChevronRight className="text-gray-400" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
