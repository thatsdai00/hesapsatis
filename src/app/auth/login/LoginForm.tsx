'use client';

import * as React from 'react';

import { useState, FormEvent } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaUser, FaLock } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface LoginFormProps {
  callbackUrl?: string;
  error?: string | null;
  reason?: string | null;
  onSwitchToRegister: () => void;
}

export default function LoginForm({ 
  callbackUrl = '/dashboard',
  error = null, 
  reason = null,
  onSwitchToRegister
}: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Display error message from URL if present
  if ((error || reason) && !isLoading) {
    let errorMessage = 'Giriş yaparken bir hata oluştu';
    
    if (error === 'CredentialsSignin') {
      errorMessage = 'Geçersiz e-posta veya şifre';
    } else if (reason === 'unauthenticated') {
      errorMessage = 'Bu sayfaya erişmek için giriş yapmanız gerekiyor';
    } else if (reason === 'unauthorized') {
      errorMessage = 'Bu sayfaya erişim izniniz yok';
    }
      
    toast.error(errorMessage);
    // Remove the error parameter to prevent showing the error again on refresh
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('error');
    newUrl.searchParams.delete('reason');
    router.replace(newUrl.pathname + newUrl.search);
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Lütfen tüm alanları doldurun');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl,
      });
      
      if (result?.error) {
        toast.error('Geçersiz e-posta veya şifre');
      } else if (result?.url) {
        toast.success('Başarıyla giriş yapıldı');
        router.push(result.url);
        router.refresh();
      }
    } catch (error) {
      toast.error('Bir hata oluştu. Lütfen tekrar deneyin.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-8">
      <form className="space-y-6" onSubmit={handleSubmit}>
        <motion.div 
          className="rounded-md shadow-sm space-y-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div>
            <label htmlFor="email" className="sr-only">
              E-posta adresi
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaUser className="text-gray-500" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-lg relative block w-full pl-10 py-3 px-4 bg-input text-input-foreground focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm border border-gray-700"
                placeholder="E-posta adresi"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="password" className="sr-only">
              Şifre
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className="text-gray-500" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-lg relative block w-full pl-10 py-3 px-4 bg-input text-input-foreground focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm border border-gray-700"
                placeholder="Şifre"
              />
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="flex items-center justify-between"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-primary focus:ring-primary border-gray-600 rounded"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-400">
              Beni hatırla
            </label>
          </div>

          <div className="text-sm">
            <Link href="/auth/forgot-password" className="text-primary hover:text-primary-hover">
              Şifrenizi mi unuttunuz?
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            type="submit"
            className="w-full py-3 px-4"
            isLoading={isLoading}
          >
            Giriş Yap
          </Button>
        </motion.div>
        
        <motion.div 
          className="text-center mt-4 text-sm text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Hesabınız yok mu?{' '}
          <button 
            type="button"
            onClick={onSwitchToRegister}
            className="text-primary hover:text-primary-hover"
          >
            Yeni hesap oluşturun
          </button>
        </motion.div>
      </form>
    </div>
  );
} 