import React from "react";
import { Metadata } from 'next';
import { getSiteSettings } from '@/lib/settings';

export async function generateMetadata(): Promise<Metadata> {
  const siteSettings = await getSiteSettings();
  
  return {
    title: `Destek | ${siteSettings.siteName}`,
  };
}

export default function TicketsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        <div>

        </div>
        <div className="h-px w-full bg-gray-200 dark:bg-gray-700" />
        {children}
      </div>
    </div>
  );
} 