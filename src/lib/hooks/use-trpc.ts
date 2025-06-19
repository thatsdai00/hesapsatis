'use client';

import { trpc } from '@/lib/trpc-client';
import { useState } from 'react';
import { toast } from 'react-toastify';

/**
 * A custom hook for handling tRPC mutations with loading state and error handling
 * @param mutationFn - The tRPC mutation function
 * @param options - Options for the mutation
 * @returns An object with the mutation function, loading state, and error
 */
export function useTrpcMutation<TData, TInput, TError>(
  mutationFn: (input: TInput) => Promise<TData>,
  options?: {
    onSuccess?: (data: TData) => void;
    onError?: (error: TError) => void;
    successMessage?: string;
    errorMessage?: string;
  }
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<TError | null>(null);

  const mutate = async (input: TInput) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await mutationFn(input);
      
      if (options?.successMessage) {
        toast.success(options.successMessage);
      }
      
      if (options?.onSuccess) {
        options.onSuccess(data);
      }
      
      return data;
    } catch (err) {
      setError(err as TError);
      
      if (options?.errorMessage) {
        toast.error(options.errorMessage);
      } else if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error('An error occurred');
      }
      
      if (options?.onError) {
        options.onError(err as TError);
      }
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    mutate,
    isLoading,
    error,
  };
}

/**
 * Hook for fetching products with pagination
 */
export function useProducts(options?: {
  limit?: number;
  categoryId?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'popular';
}) {
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  
  const query = trpc.public.getProducts.useQuery({
    limit: options?.limit || 10,
    cursor,
    categoryId: options?.categoryId,
    search: options?.search,
    minPrice: options?.minPrice,
    maxPrice: options?.maxPrice,
    sortBy: options?.sortBy,
  });
  
  const loadMore = () => {
    if (query.data?.nextCursor) {
      setCursor(query.data.nextCursor);
    }
  };
  
  return {
    ...query,
    loadMore,
    hasMore: !!query.data?.nextCursor,
  };
}

/**
 * Hook for fetching categories
 */
export function useCategories() {
  return trpc.public.getCategories.useQuery();
}

/**
 * Hook for fetching a product by slug
 */
export function useProduct(slug: string) {
  return trpc.public.getProductBySlug.useQuery({ slug });
}

/**
 * Hook for fetching featured products
 */
export function useFeaturedProducts() {
  return trpc.public.getFeaturedProducts.useQuery();
}

/**
 * Hook for fetching user balance
 */
export function useUserBalance() {
  return trpc.public.getUserBalance.useQuery();
}

/**
 * Hook for fetching user orders
 */
export function useUserOrders() {
  return trpc.public.getUserOrders.useQuery();
}

/**
 * Hook for checking out with balance
 */
export function useCheckoutWithBalance() {
  return useTrpcMutation(
    (input) => trpc.public.checkoutWithBalance.mutate(input),
    {
      successMessage: 'Order completed successfully!',
      errorMessage: 'Failed to complete order',
    }
  );
}

/**
 * Hook for admin dashboard stats
 */
export function useAdminDashboardStats() {
  return trpc.admin.getDashboardStats.useQuery();
}

/**
 * Hook for admin users management
 */
export function useAdminUsers(options?: {
  limit?: number;
  search?: string;
}) {
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  
  const query = trpc.admin.getUsers.useQuery({
    limit: options?.limit || 10,
    cursor,
    search: options?.search,
  });
  
  const loadMore = () => {
    if (query.data?.nextCursor) {
      setCursor(query.data.nextCursor);
    }
  };
  
  return {
    ...query,
    loadMore,
    hasMore: !!query.data?.nextCursor,
  };
}

/**
 * Hook for admin orders management
 */
export function useAdminOrders(options?: {
  limit?: number;
  status?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
  userId?: string;
  search?: string;
  sortBy?: 'newest' | 'oldest' | 'amount_high' | 'amount_low';
}) {
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  
  const query = trpc.admin.getOrders.useQuery({
    limit: options?.limit || 10,
    cursor,
    status: options?.status,
    userId: options?.userId,
    search: options?.search,
    sortBy: options?.sortBy || 'newest',
  });
  
  const loadMore = () => {
    if (query.data?.nextCursor) {
      setCursor(query.data.nextCursor);
    }
  };
  
  return {
    ...query,
    loadMore,
    hasMore: !!query.data?.nextCursor,
  };
}

/**
 * Hook for admin products management
 */
export function useAdminProducts(options?: {
  limit?: number;
  categoryId?: string;
  search?: string;
  sortBy?: 'newest' | 'oldest' | 'price_high' | 'price_low' | 'name_asc' | 'name_desc';
}) {
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  
  const query = trpc.admin.getProducts.useQuery({
    limit: options?.limit || 10,
    cursor,
    categoryId: options?.categoryId,
    search: options?.search,
    sortBy: options?.sortBy || 'newest',
  });
  
  const loadMore = () => {
    if (query.data?.nextCursor) {
      setCursor(query.data.nextCursor);
    }
  };
  
  return {
    ...query,
    loadMore,
    hasMore: !!query.data?.nextCursor,
  };
}

/**
 * Hook for updating user balance (admin only)
 */
export function useUpdateUserBalance() {
  return useTrpcMutation(
    (input) => trpc.admin.updateUserBalance.mutate(input),
    {
      successMessage: 'User balance updated successfully',
      errorMessage: 'Failed to update user balance',
    }
  );
}

/**
 * Hook for updating order status (admin only)
 */
export function useUpdateOrderStatus() {
  return useTrpcMutation(
    (input) => trpc.admin.updateOrderStatus.mutate(input),
    {
      successMessage: 'Order status updated successfully',
      errorMessage: 'Failed to update order status',
    }
  );
}

/**
 * Hook for creating a product (admin only)
 */
export function useCreateProduct() {
  return useTrpcMutation(
    (input) => trpc.admin.createProduct.mutate(input),
    {
      successMessage: 'Product created successfully',
      errorMessage: 'Failed to create product',
    }
  );
}

/**
 * Hook for updating a product (admin only)
 */
export function useUpdateProduct() {
  return useTrpcMutation(
    (input) => trpc.admin.updateProduct.mutate(input),
    {
      successMessage: 'Product updated successfully',
      errorMessage: 'Failed to update product',
    }
  );
}

/**
 * Hook for deleting a product (admin only)
 */
export function useDeleteProduct() {
  return useTrpcMutation(
    (input) => trpc.admin.deleteProduct.mutate(input),
    {
      successMessage: 'Product deleted successfully',
      errorMessage: 'Failed to delete product',
    }
  );
}

/**
 * Hook for creating a category (admin only)
 */
export function useCreateCategory() {
  return useTrpcMutation(
    (input) => trpc.admin.createCategory.mutate(input),
    {
      successMessage: 'Category created successfully',
      errorMessage: 'Failed to create category',
    }
  );
}

/**
 * Hook for updating a category (admin only)
 */
export function useUpdateCategory() {
  return useTrpcMutation(
    (input) => trpc.admin.updateCategory.mutate(input),
    {
      successMessage: 'Category updated successfully',
      errorMessage: 'Failed to update category',
    }
  );
}

/**
 * Hook for deleting a category (admin only)
 */
export function useDeleteCategory() {
  return useTrpcMutation(
    (input) => trpc.admin.deleteCategory.mutate(input),
    {
      successMessage: 'Category deleted successfully',
      errorMessage: 'Failed to delete category',
    }
  );
} 