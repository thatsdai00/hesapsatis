'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { FaEnvelope, FaGamepad } from 'react-icons/fa';
import { motion } from 'framer-motion';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Lütfen e-posta adresinizi girin');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setIsSubmitted(true);
        toast.success(data.message || 'E-posta adresiniz sistemimizde varsa, şifre sıfırlama bağlantısı kısa süre içinde gönderilecektir');
      } else {
        toast.error(data.message || 'Bir hata oluştu. Lütfen tekrar deneyin.');
      }
    } catch (error) {
      toast.error('Bir hata oluştu. Lütfen tekrar deneyin.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="max-w-md w-full space-y-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-green-900/20 flex items-center justify-center">
              <FaEnvelope className="text-green-500 text-4xl" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold neon-text">E-postanızı kontrol edin</h2>
          <p className="mt-2 text-gray-400">
            Girdiğiniz e-posta adresi sistemimizde kayıtlıysa, şifre sıfırlama talimatlarını gönderdik.
          </p>
          <div className="mt-6">
            <Link
              href="/auth/login"
              className="inline-flex justify-center py-3 px-6 border border-transparent rounded-lg text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
            >
              Giriş sayfasına dön
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div 
        className="max-w-md w-full space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
              <FaGamepad className="text-primary text-4xl" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold neon-text">Şifrenizi sıfırlayın</h2>
          <p className="mt-2 text-sm text-gray-400">
            E-posta adresinizi girin, şifrenizi sıfırlamanız için talimatları göndereceğiz
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <label htmlFor="email" className="sr-only">
              E-posta adresi
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaEnvelope className="text-gray-500" />
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
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
            >
              {isLoading ? (
                <div className="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              ) : (
                'Sıfırlama talimatlarını gönder'
              )}
            </button>
          </motion.div>
        </form>
        
        <div className="text-center mt-4">
          <Link href="/auth/login" className="text-sm text-primary hover:text-primary-hover">
            Giriş sayfasına dön
          </Link>
        </div>
      </motion.div>
    </div>
  );
} 