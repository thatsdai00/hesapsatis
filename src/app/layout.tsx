import * as React from 'react';
import "./globals.css";
import "./product-cards.css";
import "./slider.css";
import "./product-detail.css";
import "./auth/auth.css";
import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AuthProvider from "@/components/auth/AuthProvider";
import { TRPCProvider } from '@/components/providers/trpc-provider';
import { CartProvider } from '@/components/providers/cart-provider';
import { Toaster } from "@/components/ui/toaster";
import Logo from "@/components/layout/Logo";
import { getFooterSettings, getLogoSettings, getSiteSettings } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  const siteSettings = await getSiteSettings();
  
  const title = siteSettings.siteName + (siteSettings.siteTitle ? ` | ${siteSettings.siteTitle}` : '');
  
  return {
    title,
    description: siteSettings.seoDescription || "PUBG Mobile ve Valorant hesapları için güvenilir ve hızlı satış platformu. Özel koleksiyonlar ve premium hesaplar.",
    keywords: siteSettings.seoKeywords || "PUBG Mobile hesapları, Valorant hesapları, oyun hesapları, hesap satışı, güvenli hesap alışveriş",
    authors: [{ name: `${siteSettings.siteName} Team` }],
    creator: siteSettings.siteName,
    publisher: siteSettings.siteName,
    openGraph: {
      title,
      description: siteSettings.seoDescription || "PUBG Mobile ve Valorant hesapları için güvenilir ve hızlı satış platformu. Özel koleksiyonlar ve premium hesaplar.",
      url: "https://thatsdai.com",
      siteName: siteSettings.siteName,
      locale: "tr_TR",
      type: "website",
      ...(siteSettings.ogImage && { images: [siteSettings.ogImage] }),
    },
    ...(siteSettings.ogImage && { 
      twitter: {
        card: "summary_large_image",
        title,
        description: siteSettings.seoDescription || "PUBG Mobile ve Valorant hesapları için güvenilir ve hızlı satış platformu.",
        images: [siteSettings.ogImage],
      }
    }),
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const logoSettings = await getLogoSettings();
  const footerSettings = await getFooterSettings();
  
  return (
    <html lang="tr" className="dark">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="min-h-screen flex flex-col bg-[#111828] text-foreground">
        <TRPCProvider>
          <AuthProvider>
            <CartProvider>
              <Header logo={
                <Logo 
                  whiteText={logoSettings.logoWhiteText} 
                  accentText={logoSettings.logoAccentText}
                  whiteColor={logoSettings.logoWhiteColor}
                  accentColor={logoSettings.logoAccentColor}
                />
              } />
              <main className="flex-grow">
                {children}
              </main>
              <Footer initialSettings={footerSettings} />
            </CartProvider>
          </AuthProvider>
        </TRPCProvider>
        <Toaster />
      </body>
    </html>
  );
}
