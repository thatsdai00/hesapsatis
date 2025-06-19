import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines multiple class names using clsx and tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format price to currency format
 */
export function formatPrice(
  price: number | string,
  options: {
    currency?: 'USD' | 'EUR' | 'GBP' | 'TRY';
    notation?: Intl.NumberFormatOptions['notation'];
  } = {}
) {
  const { currency = 'TRY', notation = 'standard' } = options;

  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;

  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency,
    notation,
    maximumFractionDigits: 2,
  }).format(numericPrice);
}

/**
 * Convert text to URL-friendly slug
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

/**
 * Truncate text to a specific length
 */
export function truncateText(text: string, length: number): string {
  if (text.length <= length) {
    return text;
  }
  return text.slice(0, length) + '...';
}

/**
 * Format date string
 */
export function formatDate(dateString: string | Date): string {
  const date = typeof dateString === 'string' 
    ? new Date(dateString) 
    : dateString;
    
  return new Intl.DateTimeFormat('tr-TR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

/**
 * Generate random string
 */
export function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Get random element from array
 */
export function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Calculate time ago (e.g., "2 hours ago")
 */
export function timeAgo(date: Date | string): string {
  const now = new Date();
  const diffInMs = now.getTime() - (typeof date === 'string' ? new Date(date).getTime() : date.getTime());
  
  const seconds = Math.floor(diffInMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(months / 12);
  
  if (years > 0) return `${years} yıl önce`;
  if (months > 0) return `${months} ay önce`;
  if (days > 0) return `${days} gün önce`;
  if (hours > 0) return `${hours} saat önce`;
  if (minutes > 0) return `${minutes} dakika önce`;
  return `${seconds} saniye önce`;
} 