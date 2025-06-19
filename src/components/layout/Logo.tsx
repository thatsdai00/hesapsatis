import * as React from 'react';
import Link from 'next/link';

type LogoProps = {
  whiteText: string;
  accentText: string;
  whiteColor?: string;
  accentColor?: string;
};

export default function Logo({ 
  whiteText, 
  accentText, 
  whiteColor = "#FFFFFF", 
  accentColor = "#7e22ce" 
}: LogoProps) {
  return (
    <Link href="/" className="flex items-center">
      <div
        className="relative font-sans font-bold text-2xl tracking-tight"
      >
        <span style={{ color: whiteColor }}>{whiteText}</span>
        <span style={{ color: accentColor }}>{accentText}</span>
      </div>
    </Link>
  );
} 