'use client';

import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc-client';
import { useSession } from 'next-auth/react';

export function useUserOrders() {
  const { status } = useSession();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Fetch user orders with refetch options
  const {
    data: orders,
    isLoading,
    error,
    refetch
  } = trpc.public.getUserOrders.useQuery(undefined, {
    enabled: status === 'authenticated',
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
    retry: 3,
    retryDelay: 1000,
  });

  // Force refetch on mount
  useEffect(() => {
    if (status === 'authenticated') {
      const fetchData = async () => {
        setIsRefreshing(true);
        try {
          await refetch();
        } catch (err) {
          console.error('Error refetching orders:', err);
        } finally {
          setIsRefreshing(false);
        }
      };
      
      fetchData();
    }
  }, [status, refetch]);

  // Manual refresh function
  const refreshOrders = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } catch (err) {
      console.error('Error refreshing orders:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  return {
    orders,
    isLoading: isLoading || isRefreshing,
    error,
    refreshOrders,
  };
} 