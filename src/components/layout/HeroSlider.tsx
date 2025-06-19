'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { motion } from 'framer-motion';

export interface SlideProps {
  id: string;
  mainHeading: string;
  subHeading: string;
  tagline: string;
  description: string;
  buttonText: string;
  buttonUrl: string;
  imageUrl: string;
  game: string;
}

interface HeroSliderProps {
  slides: SlideProps[];
}

export default function HeroSlider({ slides }: HeroSliderProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [autoplay, setAutoplay] = useState(true);

  // Autoplay functionality
  useEffect(() => {
    if (!autoplay) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [autoplay, slides.length]);

  // Handle slider navigation
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setAutoplay(false);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setAutoplay(false);
  };

  return (
    <section className="hero-slider">
      {/* Background overlay */}
      <div className={`absolute inset-0 ${
        slides[currentSlide].game === 'valorant' 
          ? 'valorant-overlay' 
          : 'pubg-overlay'
      } z-10`}></div>
      
      {/* Hero Image */}
      <div className="slide-image" 
        style={{
          backgroundImage: `url(${slides[currentSlide].imageUrl})`,
        }}>
      </div>
      
      {/* Navigation Arrows */}
      <button 
        onClick={prevSlide}
        className="slider-arrow prev"
        aria-label="Önceki slayt"
      >
        <FaChevronLeft />
      </button>
      
      <button 
        onClick={nextSlide}
        className="slider-arrow next"
        aria-label="Sonraki slayt"
      >
        <FaChevronRight />
      </button>
      
      {/* Hero content */}
      <div className="absolute inset-0 flex items-center z-20">
        <div className="container mx-auto px-4">
          <motion.div
            key={slides[currentSlide].id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="slide-content space-y-4"
          >
            <h1 className="text-4xl md:text-6xl font-bold">
              <span className="text-white block">{slides[currentSlide].mainHeading}</span>
              <span className="text-[#ffd700] block">{slides[currentSlide].subHeading}</span>
              <span className="text-white block">{slides[currentSlide].tagline}</span>
            </h1>
            
            <p className="text-gray-200 mb-8">
              {slides[currentSlide].description}
            </p>
            
            <div>
              <Link href={slides[currentSlide].buttonUrl} className="pubg-button-red px-8 py-3 rounded-full inline-block font-medium">
                {slides[currentSlide].buttonText}
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Slider dots */}
      <div className="slider-dots">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setCurrentSlide(index);
              setAutoplay(false);
            }}
            aria-label={`${index + 1}. slayta git`}
            className={`slider-dot ${index === currentSlide ? 'active' : ''}`}
          />
        ))}
      </div>
    </section>
  );
} 