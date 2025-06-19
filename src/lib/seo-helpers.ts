import { SiteSettingsType } from '@/interfaces';

/**
 * Combines item-specific SEO keywords with site-wide keywords
 * @param itemKeywords The specific keywords from a product or category
 * @param siteSettings The site-wide settings object
 * @returns The combined keyword string, or undefined if no keywords are available
 */
export function combineKeywords(
  itemKeywords: string | null | undefined, 
  siteSettings: SiteSettingsType
): string | undefined {
  let combinedKeywords = '';
  
  if (itemKeywords && itemKeywords.trim()) {
    combinedKeywords = itemKeywords.trim();
    if (siteSettings.seoKeywords && siteSettings.seoKeywords.trim()) {
      combinedKeywords += ', ' + siteSettings.seoKeywords.trim();
    }
  } else if (siteSettings.seoKeywords) {
    combinedKeywords = siteSettings.seoKeywords.trim();
  }
  
  return combinedKeywords || undefined;
}

/**
 * Safely extracts SEO keywords from any object that might have a seoKeywords property
 * and combines them with the site-wide SEO keywords
 * 
 * @param item Any object that might contain a seoKeywords property
 * @param siteSettings The site-wide settings object
 * @returns The combined keyword string, or undefined if no keywords are available
 */
export function safelyGetKeywords(
  item: Record<string, unknown> | { seoKeywords?: string | null } | null | undefined,
  siteSettings: SiteSettingsType
): string | undefined {
  // Try to access the seoKeywords property safely
  const itemKeywords = item && typeof item === 'object' && 'seoKeywords' in item 
    ? item.seoKeywords as string | null | undefined
    : undefined;
  
  return combineKeywords(itemKeywords, siteSettings);
} 