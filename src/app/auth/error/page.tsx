'use client';

import * as React from 'react';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {FaExclamationTriangle, FaBan} from 'react-icons/fa';

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  let errorMessage = 'Bir kimlik doğrulama hatası oluştu';
  let errorDescription = 'Lütfen tekrar deneyin veya sorun devam ederse destek ile iletişime geçin.';
  let errorIcon = <FaExclamationTriangle className="text-red-500 text-4xl" />;

  // Display specific error messages based on the error code
  switch (error) {
    case 'CredentialsSignin':
      errorMessage = 'Geçersiz giriş bilgileri';
      errorDescription = 'Girdiğiniz e-posta veya şifre yanlış.';
      break;
    case 'OAuthSignin':
    case 'OAuthCallback':
      errorMessage = 'Harici sağlayıcı ile giriş yapılırken hata oluştu';
      errorDescription = 'Kimlik doğrulama sağlayıcısına bağlanırken bir sorun oluştu.';
      break;
    case 'SessionRequired':
      errorMessage = 'Kimlik doğrulama gerekli';
      errorDescription = 'Bu sayfaya erişmek için giriş yapmış olmanız gerekir.';
      break;
    case 'AccessDenied':
      errorMessage = 'Erişim reddedildi';
      errorDescription = 'Bu kaynağa erişim izniniz yok.';
      break;
    case 'Verification':
      errorMessage = 'Doğrulama hatası';
      errorDescription = 'Doğrulama bağlantısı geçersiz veya süresi dolmuş.';
      break;
    case 'AccountBanned':
      errorMessage = 'Hesabınız engellendi';
      errorDescription = 'Hesabınız yönetici tarafından engellenmiştir. Daha fazla bilgi için destek ekibimizle iletişime geçin.';
      errorIcon = <FaBan className="text-red-500 text-4xl" />;
      break;
    default:
      // Use the default message
      break;
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-red-900/20 flex items-center justify-center">
              {errorIcon}
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-white">{errorMessage}</h2>
          <p className="mt-2 text-base text-gray-400">{errorDescription}</p>
        </div>
        
        <div className="mt-8 space-y-4">
          {error !== 'AccountBanned' && (
            <div>
              <Link
                href="/auth/login"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
              >
                Giriş yapmaya dön
              </Link>
            </div>
          )}
          
          <div>
            <Link
              href="/"
              className="w-full flex justify-center py-3 px-4 border border-gray-700 rounded-lg text-gray-300 bg-transparent hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              Anasayfaya git
            </Link>
          </div>
          
          <div className="pt-4 text-center">
            <Link href="/help" className="text-sm text-primary hover:text-primary-hover">
              Yardıma mı ihtiyacınız var? Destek ekibimizle iletişime geçin
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 