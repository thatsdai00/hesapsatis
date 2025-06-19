'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

// Sample sliders data (can be replaced with actual data from API/backend)
const sliders = [
  {
    id: '1',
    mainHeading: 'Premium Gaming',
    subHeading: 'Accounts',
    tagline: 'Level Up Your Experience',
    description: 'High-quality gaming accounts with rare skins and premium collections.',
    buttonText: 'Explore Now',
    buttonUrl: '/products',
    imageUrl: '/images/slider1.svg'
  },
  {
    id: '2',
    mainHeading: 'Special',
    subHeading: 'Offers',
    tagline: 'Limited Time Only',
    description: 'Get up to 40% off on selected premium accounts. Don\'t miss out!',
    buttonText: 'See Deals',
    buttonUrl: '/products?discount=true',
    imageUrl: '/images/slider2.svg'
  },
  {
    id: '3',
    mainHeading: 'New',
    subHeading: 'Arrivals',
    tagline: 'Fresh Stock',
    description: 'Check out our latest collection of game accounts added this week.',
    buttonText: 'View Collection',
    buttonUrl: '/products?new=true',
    imageUrl: '/images/slider3.svg'
  }
];

export default function HeroSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoplay, setAutoplay] = useState(true);

  // Autoplay functionality - slowed down for better performance
  useEffect(() => {
    if (!autoplay || sliders.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % sliders.length);
    }, 7000); // Increased interval time for less intensive animation
    
    return () => clearInterval(interval);
  }, [autoplay, sliders.length]);
  
  // Navigation functions
  const nextSlide = useCallback(() => {
    if (sliders.length <= 1) return;
    setCurrentIndex((prevIndex) => (prevIndex + 1) % sliders.length);
    setAutoplay(false); // Pause autoplay when manually navigating
  }, [sliders.length]);
  
  const prevSlide = useCallback(() => {
    if (sliders.length <= 1) return;
    setCurrentIndex((prevIndex) => (prevIndex - 1 + sliders.length) % sliders.length);
    setAutoplay(false); // Pause autoplay when manually navigating
  }, [sliders.length]);
  
  // Keyboard navigation - simplified
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        prevSlide();
      } else if (e.key === 'ArrowRight') {
        nextSlide();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide]);
  
  const currentSlider = sliders[currentIndex];
  
  return (
    <section className="relative bg-background overflow-hidden">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-secondary/70 to-background/60 z-10"></div>
      
      {/* Slider navigation buttons */}
      {sliders.length > 1 && (
        <>
          <button 
            onClick={prevSlide}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 bg-black/30 hover:bg-primary/50 text-white w-10 h-10 rounded-full flex items-center justify-center transition-all"
            aria-label="Previous slide"
          >
            <FaChevronLeft />
          </button>
          <button 
            onClick={nextSlide}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 bg-black/30 hover:bg-primary/50 text-white w-10 h-10 rounded-full flex items-center justify-center transition-all"
            aria-label="Next slide"
          >
            <FaChevronRight />
          </button>
        </>
      )}
      
      {/* Slider background images - simplified transition */}
      <div className="h-[500px] sm:h-[550px] md:h-[600px] relative overflow-hidden">
        {sliders.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 bg-center bg-cover h-full w-full transition-opacity duration-700 ${
              index === currentIndex ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              backgroundImage: `url(${slide.imageUrl})`,
              backgroundColor: '#131313',
              backgroundSize: 'cover'
            }}
          />
        ))}
      </div>
      
      {/* Slider content - simplified animations */}
      <div className="absolute inset-0 flex items-center z-20">
        <div className="container mx-auto px-4">
          <div className="max-w-lg">
            <motion.div
              key={currentSlider.id + "-content"}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-4"
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold">
                <span className="text-white">{currentSlider.mainHeading}</span>
                {currentSlider.subHeading && (
                  <>
                    <br />
                    <span className="text-primary">{currentSlider.subHeading}</span>
                  </>
                )}
                {currentSlider.tagline && (
                  <>
                    <br />
                    <span className="text-white">{currentSlider.tagline}</span>
                  </>
                )}
              </h1>
              
              <p className="text-gray-200 mb-8 text-lg">
                {currentSlider.description}
              </p>
              
              <div>
                <Link href={currentSlider.buttonUrl || '#'}>
                  <span className="inline-block px-8 py-3 bg-primary hover:bg-primary-hover text-white font-bold rounded-full transition-all">
                    {currentSlider.buttonText}
                  </span>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Slider indicators */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20 flex space-x-2">
        {sliders.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setCurrentIndex(index);
              setAutoplay(false);
            }}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentIndex ? 'bg-primary w-6' : 'bg-white/50 hover:bg-white'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
} 