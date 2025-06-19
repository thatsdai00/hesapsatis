'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaFacebook, FaTwitter, FaInstagram, FaDiscord, FaEnvelope, FaMapMarkerAlt, FaPhone, FaWhatsapp, FaYoutube } from 'react-icons/fa';
import { trpc } from '@/lib/trpc-client';

// Define our own type that matches the fields we're using
type FooterSettings = {
  siteName: string;
  footerDescription: string;
  footerBottomText: string;
  footerInstitutionalTitle?: string;
  
  // Social media
  socialFacebook?: string;
  socialTwitter?: string;
  socialInstagram?: string;
  socialDiscord?: string;
  socialYoutube?: string;
  socialFacebookVisible?: boolean;
  socialTwitterVisible?: boolean;
  socialInstagramVisible?: boolean;
  socialDiscordVisible?: boolean;
  socialYoutubeVisible?: boolean;
  
  // Contact information
  contactEmail?: string;
  contactPhone?: string;
  contactWhatsapp?: string;
  contactAddress?: string;
};

// Default settings to prevent UI layout shifts
const defaultSettings: FooterSettings = {
  siteName: 'thatsdai',
  footerDescription: 'Güvenli, hızlı ve uygun fiyatlı oyun hesapları ve içerik satışı.',
  footerBottomText: '© 2025 thatsdai.com. Tüm hakları saklıdır.',
  footerInstitutionalTitle: 'Kurumsal',
};

type FooterLink = {
  id: string;
  text: string;
  url: string;
  order: number;
  isActive: boolean;
  section: string;
  createdAt: Date;
  updatedAt: Date;
};

export default function Footer({ initialSettings }: { initialSettings?: FooterSettings }) {
  const [settings, setSettings] = useState<FooterSettings>(initialSettings || defaultSettings);
  const currentYear = new Date().getFullYear();
  
  // Fetch footer links
  const { data: footerLinks } = trpc.public.getFooterLinks.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  // Fetch site settings
  const { data: siteSettings } = trpc.public.getSiteSettings.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  // Update settings when data is loaded
  useEffect(() => {
    if (siteSettings) {
      setSettings(prevSettings => ({
        ...prevSettings,
        siteName: siteSettings.siteName,
        footerDescription: siteSettings.footerDescription,
        footerBottomText: siteSettings.footerBottomText,
        footerInstitutionalTitle: siteSettings.footerInstitutionalTitle,
        
        // Social media
        socialFacebook: siteSettings.socialFacebook,
        socialTwitter: siteSettings.socialTwitter,
        socialInstagram: siteSettings.socialInstagram,
        socialDiscord: siteSettings.socialDiscord,
        socialYoutube: siteSettings.socialYoutube,
        socialFacebookVisible: siteSettings.socialFacebookVisible,
        socialTwitterVisible: siteSettings.socialTwitterVisible,
        socialInstagramVisible: siteSettings.socialInstagramVisible,
        socialDiscordVisible: siteSettings.socialDiscordVisible,
        socialYoutubeVisible: siteSettings.socialYoutubeVisible,
        
        // Contact information
        contactEmail: siteSettings.contactEmail,
        contactPhone: siteSettings.contactPhone,
        contactWhatsapp: siteSettings.contactWhatsapp,
        contactAddress: siteSettings.contactAddress,
      }));
    }
  }, [siteSettings]);

  // Function to render social media icons
  const renderSocialMediaIcons = () => {
    const socialIcons = [];
    
    if (settings.socialFacebookVisible && settings.socialFacebook) {
      socialIcons.push(
        <a 
          key="facebook"
          href={settings.socialFacebook} 
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-primary transition-colors"
          aria-label="Facebook"
        >
          <FaFacebook size={20} />
        </a>
      );
    }
    
    if (settings.socialTwitterVisible && settings.socialTwitter) {
      socialIcons.push(
        <a 
          key="twitter"
          href={settings.socialTwitter} 
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-primary transition-colors"
          aria-label="Twitter"
        >
          <FaTwitter size={20} />
        </a>
      );
    }
    
    if (settings.socialInstagramVisible && settings.socialInstagram) {
      socialIcons.push(
        <a 
          key="instagram"
          href={settings.socialInstagram} 
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-primary transition-colors"
          aria-label="Instagram"
        >
          <FaInstagram size={20} />
        </a>
      );
    }
    
    if (settings.socialDiscordVisible && settings.socialDiscord) {
      socialIcons.push(
        <a 
          key="discord"
          href={settings.socialDiscord} 
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-primary transition-colors"
          aria-label="Discord"
        >
          <FaDiscord size={20} />
        </a>
      );
    }
    
    if (settings.socialYoutubeVisible && settings.socialYoutube) {
      socialIcons.push(
        <a 
          key="youtube"
          href={settings.socialYoutube} 
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-primary transition-colors"
          aria-label="YouTube"
        >
          <FaYoutube size={20} />
        </a>
      );
    }
    
    return socialIcons.length > 0 ? (
      <div className="flex space-x-4">
        {socialIcons}
      </div>
    ) : (
      <div className="flex space-x-4">
        <span className="text-gray-500 text-sm">Sosyal medya bağlantıları henüz ayarlanmamış.</span>
      </div>
    );
  };

  return (
    <footer className="bg-[#0f0f1a] py-8 border-t border-[#2c1a47]/30">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-white">{settings.siteName}.com</h3>
            <p className="text-gray-400 mb-4">{settings.footerDescription}</p>
            {renderSocialMediaIcons()}
          </div>

          {/* Quick Links - Now Dynamic */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-white">{settings.footerInstitutionalTitle}</h3>
            <ul className="space-y-2">
              {footerLinks && footerLinks.length > 0 ? (
                footerLinks.map((link: FooterLink) => (
                  <li key={link.id}>
                    <Link href={link.url} className="text-gray-400 hover:text-primary transition-colors">
                      {link.text}
                    </Link>
                  </li>
                ))
              ) : (
                <>
                  <li>
                    <Link href="/pubg-mobile" className="text-gray-400 hover:text-primary transition-colors">
                      PUBG Mobile
                    </Link>
                  </li>
                  <li>
                    <Link href="/valorant" className="text-gray-400 hover:text-primary transition-colors">
                      Valorant
                    </Link>
                  </li>
                  <li>
                    <Link href="/about" className="text-gray-400 hover:text-primary transition-colors">
                      Hakkımızda
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" className="text-gray-400 hover:text-primary transition-colors">
                      İletişim
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-white">İletişim</h3>
            <ul className="space-y-3">
              {settings.contactAddress && (
                <li className="flex items-start">
                  <FaMapMarkerAlt className="text-primary mt-1 mr-3" />
                  <span className="text-gray-400">{settings.contactAddress}</span>
                </li>
              )}
              
              {settings.contactPhone && (
                <li className="flex items-center">
                  <FaPhone className="text-primary mr-3" />
                  <span className="text-gray-400">{settings.contactPhone}</span>
                </li>
              )}
              
              {settings.contactEmail && (
                <li className="flex items-center">
                  <FaEnvelope className="text-primary mr-3" />
                  <a href={`mailto:${settings.contactEmail}`} className="text-gray-400 hover:text-primary">
                    {settings.contactEmail}
                  </a>
                </li>
              )}
              
              {settings.contactWhatsapp && (
                <li className="flex items-center">
                  <FaWhatsapp className="text-primary mr-3" />
                  <a 
                    href={settings.contactWhatsapp.startsWith('http') ? settings.contactWhatsapp : `https://wa.me/${settings.contactWhatsapp.replace(/\D/g, '')}`} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-primary"
                  >
                    WhatsApp İletişim
                  </a>
                </li>
              )}
              
              {!settings.contactAddress && !settings.contactPhone && !settings.contactEmail && !settings.contactWhatsapp && (
                <li className="text-gray-500">
                  İletişim bilgileri henüz ayarlanmamış.
                </li>
              )}
            </ul>
          </div>

          {/* Payment Methods */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-white">Ödeme Yöntemleri</h3>
            <div className="flex flex-wrap gap-2">
              <div className="h-8 w-12 bg-gray-700 rounded-md"></div>
              <div className="h-8 w-12 bg-gray-700 rounded-md"></div>
              <div className="h-8 w-12 bg-gray-700 rounded-md"></div>
              <div className="h-8 w-12 bg-gray-700 rounded-md"></div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-6 border-t border-[#2c1a47]/30 text-center">
          <p className="text-gray-500 text-sm">
            {settings.footerBottomText.replace('{year}', currentYear.toString())}
          </p>
        </div>
      </div>
    </footer>
  );
} 