import * as React from 'react';
import '../dashboard.css';
import { Metadata } from 'next';
import { getSiteSettings } from '@/lib/settings';

export async function generateMetadata(): Promise<Metadata> {
  const siteSettings = await getSiteSettings();
  
  return {
    title: `Hesabım | ${siteSettings.siteName}`,
  };
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      {/* Main Content */}
      <main className="p-4 md:p-8">{children}</main>
    </div>
  );
} 