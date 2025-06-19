'use client';

import * as React from 'react';

import {useState, FormEvent} from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-toastify';
import {FaLock, FaCheckCircle} from 'react-icons/fa';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { FaGamepad } from 'react-icons/fa';



// Validation schema
const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Şifre en az 8 karakter olmalıdır'),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Şifreler eşleşmiyor",
  path: ["confirmPassword"] });

export default function ResetPasswordPage() {
  
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setIsVerifying(false);
        return;
      }

      try {
        const response = await fetch(`/api/auth/verify-token?token=${token}`, {
          method: 'GET' });
        
        const data = await response.json();
        
        if (response.ok && data.valid) {
          setIsValidToken(true);
        }
      } catch (error) {
        console.error('Token verification error:', error);
      } finally {
        setIsVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      toast.error('Geçersiz veya eksik token');
      return;
    }
    
    // Validate form data
    const result = resetPasswordSchema.safeParse({ password, confirmPassword });
    if (!result.success) {
      const formattedErrors: Record<string, string> = {};
      result.error.errors.forEach(error => {
        if (error.path.length > 0) {
          formattedErrors[error.path[0].toString()] = error.message;
        }
      });
      setErrors(formattedErrors);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }) });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setIsSubmitted(true);
        toast.success('Şifreniz başarıyla sıfırlandı');
      } else {
        toast.error(data.message || 'Şifre sıfırlama başarısız oldu. Lütfen tekrar deneyin.');
      }
    } catch (error) {
      toast.error('Bir hata oluştu. Lütfen tekrar deneyin.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === 'password') {
      setPassword(value);
    } else if (field === 'confirmPassword') {
      setConfirmPassword(value);
    }
    
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };
  
  // Show loading state while verifying token
  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    );
  }
  
  // Show error message for invalid token
  if (!isValidToken && !isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="max-w-md w-full space-y-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-red-900/20 flex items-center justify-center">
              <FaLock className="text-red-500 text-4xl" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold neon-text">Geçersiz veya Süresi Dolmuş Bağlantı</h2>
          <p className="mt-2 text-gray-400">
            Şifre sıfırlama bağlantınız geçersiz veya süresi dolmuş. Lütfen yeni bir şifre sıfırlama talebi oluşturun.
          </p>
          <div className="mt-6">
            <Link
              href="/auth/forgot-password"
              className="inline-flex justify-center py-3 px-6 border border-transparent rounded-lg text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
            >
              Yeni şifre sıfırlama talebi
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

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
              <FaCheckCircle className="text-green-500 text-4xl" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold neon-text">Şifre Başarıyla Sıfırlandı</h2>
          <p className="mt-2 text-gray-400">
            Şifreniz güvenli bir şekilde güncellendi. Şimdi yeni şifrenizle giriş yapabilirsiniz.
          </p>
          <div className="mt-6">
            <Link
              href="/auth/login"
              className="inline-flex justify-center py-3 px-6 border border-transparent rounded-lg text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
            >
              Giriş Yap
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
          <h2 className="mt-6 text-3xl font-bold neon-text">Yeni Şifre Belirleyin</h2>
          <p className="mt-2 text-sm text-gray-400">
            Hesabınız için güçlü bir şifre oluşturun
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <motion.div 
            className="rounded-md shadow-sm space-y-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div>
              <label htmlFor="password" className="sr-only">Yeni Şifre</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="text-gray-500" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`appearance-none rounded-lg relative block w-full pl-10 py-3 px-4 bg-input text-input-foreground focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm border border-gray-700 ${errors.password ? 'border-red-500' : ''}`}
                  placeholder="Yeni Şifre (en az 8 karakter)"
                />
              </div>
              {errors.password && <p className="mt-1 text-red-500 text-xs">{errors.password}</p>}
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="sr-only">Şifreyi Tekrarlayın</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="text-gray-500" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className={`appearance-none rounded-lg relative block w-full pl-10 py-3 px-4 bg-input text-input-foreground focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm border border-gray-700 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                  placeholder="Şifreyi Tekrarlayın"
                />
              </div>
              {errors.confirmPassword && <p className="mt-1 text-red-500 text-xs">{errors.confirmPassword}</p>}
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
                'Şifremi Sıfırla'
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