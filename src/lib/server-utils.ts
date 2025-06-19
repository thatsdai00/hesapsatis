'use server';

import bcrypt from 'bcrypt';
import crypto from 'crypto';
import prisma from "./prisma";
import { SiteSettingsType } from '@/interfaces';

// Use bcrypt if available, otherwise fall back to a simple crypto implementation
export async function hashPassword(password: string): Promise<string> {
  try {
    // Try using bcrypt first
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  } catch (error) {
    console.error('Bcrypt error, falling back to crypto:', error);
    // Fallback to crypto
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
  }
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  try {
    // Try to verify with bcrypt
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    console.error('Bcrypt compare error, falling back to crypto:', error);
    // If the format is salt:hash, use crypto verification
    if (hashedPassword.includes(':')) {
      const [salt, hash] = hashedPassword.split(':');
      const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
      return hash === verifyHash;
    }
    return false;
  }
}

export async function getServerSiteSettings(): Promise<SiteSettingsType> {
  try {
    let dbSettings = await prisma.siteSettings.findUnique({
      where: { id: 1 },
    });

    if (!dbSettings) {
      // Create default settings if they don't exist
      dbSettings = await prisma.siteSettings.create({
        data: {
          id: 1,
          logoWhiteText: 'thats',
          logoAccentText: 'dai',
          logoWhiteColor: '#FFFFFF',
          logoAccentColor: '#7e22ce',
          siteName: 'thatsdai',
          footerDescription: 'Güvenli, hızlı ve uygun fiyatlı oyun hesapları ve içerik satışı.',
          footerBottomText: '© 2025 thatsdai.com. Tüm hakları saklıdır.',
          footerInstitutionalTitle: 'Kurumsal',
        },
      });
    }

    // Cast to our app type
    const settings: SiteSettingsType = {
      id: dbSettings.id,
      logoWhiteText: dbSettings.logoWhiteText,
      logoAccentText: dbSettings.logoAccentText,
      logoWhiteColor: dbSettings.logoWhiteColor || '#FFFFFF',
      logoAccentColor: dbSettings.logoAccentColor || '#7e22ce',
      siteName: dbSettings.siteName || dbSettings.footerBrandName, // Fallback for backward compatibility
      siteTitle: dbSettings.siteTitle || '',
      seoDescription: dbSettings.seoDescription || '',
      seoKeywords: dbSettings.seoKeywords || '',
      ogImage: dbSettings.ogImage || '',
      footerDescription: dbSettings.footerDescription,
      footerBottomText: dbSettings.footerBottomText,
      footerInstitutionalTitle: dbSettings.footerInstitutionalTitle || 'Kurumsal',
      
      // Social media fields
      socialFacebook: dbSettings.socialFacebook,
      socialTwitter: dbSettings.socialTwitter,
      socialInstagram: dbSettings.socialInstagram,
      socialDiscord: dbSettings.socialDiscord,
      socialYoutube: dbSettings.socialYoutube,
      socialFacebookVisible: dbSettings.socialFacebookVisible || false,
      socialTwitterVisible: dbSettings.socialTwitterVisible || false,
      socialInstagramVisible: dbSettings.socialInstagramVisible || false,
      socialDiscordVisible: dbSettings.socialDiscordVisible || false,
      socialYoutubeVisible: dbSettings.socialYoutubeVisible || false,
      
      // Contact information fields
      contactEmail: dbSettings.contactEmail,
      contactPhone: dbSettings.contactPhone,
      contactWhatsapp: dbSettings.contactWhatsapp,
      contactAddress: dbSettings.contactAddress,
      
      createdAt: dbSettings.createdAt,
      updatedAt: dbSettings.updatedAt
    };

    return settings;
  } catch (error) {
    console.error('Error fetching site settings:', error);
    // Return default settings if database access fails
    return {
      id: 1,
      logoWhiteText: 'thats',
      logoAccentText: 'dai',
      logoWhiteColor: '#FFFFFF',
      logoAccentColor: '#7e22ce',
      siteName: 'thatsdai',
      siteTitle: '',
      seoDescription: '',
      seoKeywords: '',
      ogImage: '',
      footerDescription: 'Güvenli, hızlı ve uygun fiyatlı oyun hesapları ve içerik satışı.',
      footerBottomText: '© 2025 thatsdai.com. Tüm hakları saklıdır.',
      footerInstitutionalTitle: 'Kurumsal',
      
      // Social media fields
      socialFacebook: null,
      socialTwitter: null,
      socialInstagram: null,
      socialDiscord: null,
      socialYoutube: null,
      socialFacebookVisible: false,
      socialTwitterVisible: false,
      socialInstagramVisible: false,
      socialDiscordVisible: false,
      socialYoutubeVisible: false,
      
      // Contact information fields
      contactEmail: null,
      contactPhone: null,
      contactWhatsapp: null,
      contactAddress: null,
      
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
} 