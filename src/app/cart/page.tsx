'use client';

import * as React from 'react';


import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaArrowLeft } from 'react-icons/fa';
import CartButton from '@/components/cart/CartButton';

export default function CartPage() {
  const router = useRouter();
  
  // Automatically redirect to checkout
  useEffect(() => {
    router.push('/checkout');
  }, [router]);
  
    return (
    <div className="container mx-auto px-4 py-12 min-h-[60vh] flex flex-col items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-6 neon-text">Yönlendiriliyor...</h1>
          <p className="text-gray-300 mb-8">
          Ödeme sayfasına yönlendiriliyorsunuz.
        </p>
        
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/products"
            className="bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-lg transition-colors inline-flex items-center"
          >
            <FaArrowLeft className="mr-2" /> Alışverişe Devam Et
        </Link>
          
          <CartButton className="bg-secondary hover:bg-secondary-hover text-white px-6 py-3 rounded-lg transition-colors inline-flex items-center justify-center" />
        </div>
      </div>
    </div>
  );
} 