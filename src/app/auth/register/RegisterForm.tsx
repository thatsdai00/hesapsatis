'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaUser, FaLock, FaEnvelope } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

// Validation schema
const registerSchema = z.object({
  name: z.string().min(2, 'İsim en az 2 karakter olmalıdır'),
  email: z.string().email('Geçersiz e-posta adresi'),
  password: z.string().min(8, 'Şifre en az 8 karakter olmalıdır'),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Şifreler eşleşmiyor",
  path: ["confirmPassword"],
});

type FormData = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

export default function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    const result = registerSchema.safeParse(formData);
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
      // Get current URL dynamically
      const apiUrl = `${window.location.origin}/api/auth/register`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Kayıt başarısız');
      }
      
      toast.success('Kayıt başarılı! Lütfen giriş yapın.');
      onSwitchToLogin();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Bir hata oluştu. Lütfen tekrar deneyin.');
      }
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
            <label htmlFor="name" className="sr-only">
              Ad Soyad
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaUser className="text-gray-500" />
              </div>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={formData.name}
                onChange={handleChange}
                className={`appearance-none rounded-lg relative block w-full pl-10 py-3 px-4 bg-input text-input-foreground focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm border border-gray-700 ${errors.name ? 'border-red-500' : ''}`}
                placeholder="Ad Soyad"
              />
            </div>
            {errors.name && <p className="mt-1 text-red-500 text-xs">{errors.name}</p>}
          </div>
          
          <div>
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
                value={formData.email}
                onChange={handleChange}
                className={`appearance-none rounded-lg relative block w-full pl-10 py-3 px-4 bg-input text-input-foreground focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm border border-gray-700 ${errors.email ? 'border-red-500' : ''}`}
                placeholder="E-posta adresi"
              />
            </div>
            {errors.email && <p className="mt-1 text-red-500 text-xs">{errors.email}</p>}
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
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                className={`appearance-none rounded-lg relative block w-full pl-10 py-3 px-4 bg-input text-input-foreground focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm border border-gray-700 ${errors.password ? 'border-red-500' : ''}`}
                placeholder="Şifre (en az 8 karakter)"
              />
            </div>
            {errors.password && <p className="mt-1 text-red-500 text-xs">{errors.password}</p>}
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className="sr-only">
              Şifreyi Onayla
            </label>
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
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`appearance-none rounded-lg relative block w-full pl-10 py-3 px-4 bg-input text-input-foreground focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm border border-gray-700 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                placeholder="Şifreyi Onayla"
              />
            </div>
            {errors.confirmPassword && <p className="mt-1 text-red-500 text-xs">{errors.confirmPassword}</p>}
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
            Hesap Oluştur
          </Button>
        </motion.div>

        <motion.div 
          className="text-center mt-4 text-sm text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Zaten hesabınız var mı?{' '}
          <button 
            type="button"
            onClick={onSwitchToLogin}
            className="text-primary hover:text-primary-hover"
          >
            Giriş yapın
          </button>
        </motion.div>
        
        <motion.div 
          className="text-sm text-center mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-gray-400">
            Kayıt olarak,{' '}
            <Link href="/terms" className="text-primary hover:text-primary-hover">
              Hizmet Şartlarımızı
            </Link>{' '}
            ve{' '}
            <Link href="/privacy" className="text-primary hover:text-primary-hover">
              Gizlilik Politikamızı
            </Link>
            {' '}kabul etmiş olursunuz.
          </p>
        </motion.div>
      </form>
    </div>
  );
} 