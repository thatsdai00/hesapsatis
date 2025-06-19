'use client';

import { useCheckoutWithBalance } from '@/lib/hooks/use-trpc';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface CheckoutButtonProps {
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  disabled?: boolean;
  onSuccess?: (orderId: string) => void;
  onError?: (error: Error) => void;
}

interface CheckoutResult {
  success: boolean;
  orderId: string;
}

export default function CheckoutButton({
  items,
  totalAmount,
  disabled = false,
  onSuccess,
  onError,
}: CheckoutButtonProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { mutate, isLoading } = useCheckoutWithBalance();
  
  const handleCheckout = async () => {
    if (isLoading || disabled || items.length === 0) return;
    
    setIsProcessing(true);
    
    try {
      const result = await mutate({
        items,
        totalAmount,
      }) as CheckoutResult;
      
      if (result.success && result.orderId) {
        if (onSuccess) {
          onSuccess(result.orderId);
        } else {
          // Default success behavior - redirect to order confirmation
          router.push(`/orders/${result.orderId}`);
        }
      }
    } catch (error) {
      if (onError && error instanceof Error) {
        onError(error);
      }
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <button
      onClick={handleCheckout}
      disabled={isLoading || isProcessing || disabled || items.length === 0}
      className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading || isProcessing ? 'Processing...' : 'Checkout with Balance'}
    </button>
  );
} 