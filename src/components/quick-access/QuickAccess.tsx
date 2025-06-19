'use client';

import * as React from 'react';
import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import './QuickAccess.css';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { Zap } from 'lucide-react';
import { QuickAccessItem } from '@/interfaces';

interface QuickAccessProps {
  items: QuickAccessItem[];
  isLoading: boolean;
}

const QuickAccess = ({ items, isLoading }: QuickAccessProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (isLoading) {
    return (
       <div className="product-section bg-[#111828]">
        <div className="container mx-auto px-4">
            <div className="h-40 w-full bg-gray-800 animate-pulse rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!items.length) {
    return null;
  }

  return (
    <section className="product-section bg-[#111828] relative mt-8 pt-8">
       <div className="neon-separator"></div>
      <div className="container mx-auto px-4">
        <div className="section-header">
            <h2 className="section-title flex items-center gap-2">
              <Zap size={24} className="text-purple-500" fill="currentColor" />
              Hızlı Erişim
            </h2>
             <div className="flex items-center gap-2">
                <button onClick={() => scroll('left')} className="scroll-button">
                    <FaChevronLeft />
                </button>
                <button onClick={() => scroll('right')} className="scroll-button">
                    <FaChevronRight />
                </button>
            </div>
        </div>
      
        <div className="quick-access-slider" ref={scrollContainerRef}>
          {items.map((item) => (
            <Link href={item.destinationUrl} key={item.id} className="quick-access-card-link">
              <div
                className="quick-access-card"
                style={{
                  backgroundColor: item.color || 'transparent',
                }}
              >
                {item.imageUrl && (
                    <Image 
                        src={item.imageUrl}
                        alt={item.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover absolute inset-0 z-0 opacity-40"
                    />
                )}
                <div className="card-title-wrapper">
                    <span className="card-title">{item.title}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default QuickAccess; 