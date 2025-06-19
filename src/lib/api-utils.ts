/**
 * This file contains utility functions to help migrate from REST API to tRPC
 * It provides compatibility wrappers for existing code that uses fetch
 */

import { trpc } from './trpc-client';

/**
 * A compatibility layer for code that uses fetch('/api/products')
 * This function translates REST API calls to tRPC calls
 */
export async function fetchWithTrpc(url: string, options?: RequestInit) {
  // Parse the URL to determine which tRPC procedure to call
  const path = new URL(url, window.location.origin).pathname;
  
  // Extract query parameters
  const searchParams = new URL(url, window.location.origin).searchParams;
  
  // Handle different API endpoints
  if (path.startsWith('/api/products')) {
    if (path === '/api/products/featured') {
      // Get featured products
      // @ts-expect-error - tRPC type inference doesn't work well with this dynamic approach
      const data = await trpc.public.getFeaturedProducts.query();
      return createResponse(data);
    } else if (path.match(/\/api\/products\/[^/]+$/)) {
      // Get product by slug
      const slug = path.split('/').pop() as string;
      // @ts-expect-error - tRPC type inference doesn't work well with this dynamic approach
      const data = await trpc.public.getProductBySlug.query({ slug });
      return createResponse(data);
    } else {
      // Get all products
      const categoryId = searchParams.get('categoryId') || undefined;
      const search = searchParams.get('search') || undefined;
      const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit') as string) : 10;
      const cursor = searchParams.get('cursor') || undefined;
      
      // @ts-expect-error - tRPC type inference doesn't work well with this dynamic approach
      const data = await trpc.public.getProducts.query({
        categoryId,
        search,
        limit,
        cursor,
      });
      
      return createResponse(data);
    }
  } else if (path.startsWith('/api/categories')) {
    if (path === '/api/categories/homepage') {
      // Get homepage categories
      // @ts-expect-error - tRPC type inference doesn't work well with this dynamic approach
      const data = await trpc.public.getHomeCategories.query();
      return createResponse(data);
    } else if (path.match(/\/api\/categories\/[^/]+$/)) {
      // Get products by category slug
      const slug = path.split('/').pop() as string;
      const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit') as string) : 10;
      const cursor = searchParams.get('cursor') || undefined;
      
      // @ts-expect-error - tRPC type inference doesn't work well with this dynamic approach
      const data = await trpc.public.getProductsByCategory.query({
        slug,
        limit,
        cursor,
      });
      
      return createResponse(data);
    } else {
      // Get all categories
      // @ts-expect-error - tRPC type inference doesn't work well with this dynamic approach
      const data = await trpc.public.getCategories.query();
      return createResponse(data);
    }
  } else if (path.startsWith('/api/user/orders')) {
    if (path.match(/\/api\/user\/orders\/[^/]+$/)) {
      // Get order details
      const orderId = path.split('/').pop() as string;
      // @ts-expect-error - tRPC type inference doesn't work well with this dynamic approach
      const data = await trpc.public.getOrderDetails.query({ orderId });
      return createResponse(data);
    } else {
      // Get user orders
      // @ts-expect-error - tRPC type inference doesn't work well with this dynamic approach
      const data = await trpc.public.getUserOrders.query();
      return createResponse(data);
    }
  } else if (path === '/api/user/balance') {
    // Get user balance
    // @ts-expect-error - tRPC type inference doesn't work well with this dynamic approach
    const data = await trpc.public.getUserBalance.query();
    return createResponse({ balance: data });
  } else if (path === '/api/checkout/balance') {
    // Handle checkout with balance
    if (options?.method === 'POST') {
      const body = options.body ? JSON.parse(options.body as string) : {};
      const { items, totalAmount } = body;
      
      // @ts-expect-error - tRPC type inference doesn't work well with this dynamic approach
      const data = await trpc.public.checkoutWithBalance.mutate({
        items,
        totalAmount,
      });
      
      return createResponse(data);
    }
  } else if (path === '/api/sliders') {
    // Get sliders
    // @ts-expect-error - tRPC type inference doesn't work well with this dynamic approach
    const data = await trpc.public.getSliders.query();
    return createResponse(data);
  }
  
  // For endpoints not yet migrated to tRPC, fall back to regular fetch
  console.warn(`API endpoint not yet migrated to tRPC: ${path}`);
  return fetch(url, options);
}

/**
 * Creates a Response object from data
 */
function createResponse(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Wrapper for components that need to use tRPC
 * This function checks if the component is running on the client
 * and returns the appropriate fetch function
 */
export function getApiFetch() {
  if (typeof window !== 'undefined') {
    // Client-side: use tRPC
    return fetchWithTrpc;
  } else {
    // Server-side: use regular fetch
    return fetch;
  }
} 