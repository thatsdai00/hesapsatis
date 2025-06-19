'use client';

import * as React from 'react';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {FaUser, FaUserPlus} from 'react-icons/fa';
import LoginForm from './login/LoginForm';
import RegisterForm from './register/RegisterForm';
import { FaGamepad } from 'react-icons/fa';


interface AuthPageProps {
  initialTab?: 'login' | 'register';
}

export default function AuthPage({ initialTab = 'login' }: AuthPageProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialTab);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const error = searchParams.get('error');
  const reason = searchParams.get('reason');

  return (
    <motion.div 
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5,
        ease: "easeOut"
      }}
    >
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
              <FaGamepad className="text-primary text-4xl" />
            </div>
          </div>
          
          <motion.h2 
            className="mt-6 text-3xl font-bold neon-text"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.4,
              ease: "easeOut",
              delay: 0.1
            }}
          >
            {activeTab === 'login' ? 'Hesabınıza giriş yapın' : 'Hesap oluştur'}
          </motion.h2>
          
          <motion.div 
            className="mt-6 flex justify-center space-x-8"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.4,
              ease: "easeOut",
              delay: 0.2
            }}
          >
            <motion.button
              className={`auth-icon-button flex flex-col items-center space-y-2 transition-all duration-300 ${
                activeTab === 'login' 
                  ? 'active text-primary' 
                  : 'text-gray-400 hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('login')}
              whileHover={{ scale: activeTab === 'login' ? 1.1 : 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className={`icon-container w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                activeTab === 'login' 
                  ? 'bg-primary/20 glow-border' 
                  : 'bg-gray-800/50'
              }`}>
                <FaUser className={`text-2xl ${activeTab === 'login' ? 'text-primary' : 'text-gray-400'}`} />
              </div>
              <span className="text-sm font-medium">Giriş Yap</span>
            </motion.button>
            
            <motion.button
              className={`auth-icon-button flex flex-col items-center space-y-2 transition-all duration-300 ${
                activeTab === 'register' 
                  ? 'active text-primary' 
                  : 'text-gray-400 hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('register')}
              whileHover={{ scale: activeTab === 'register' ? 1.1 : 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className={`icon-container w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                activeTab === 'register' 
                  ? 'bg-primary/20 glow-border' 
                  : 'bg-gray-800/50'
              }`}>
                <FaUserPlus className={`text-2xl ${activeTab === 'register' ? 'text-primary' : 'text-gray-400'}`} />
              </div>
              <span className="text-sm font-medium">Hesap Oluştur</span>
            </motion.button>
          </motion.div>
        </div>
        
        <div className="auth-form-container">
          <AnimatePresence mode="wait">
            {activeTab === 'login' ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="login-form-enter"
              >
                <LoginForm 
                  callbackUrl={callbackUrl} 
                  error={error} 
                  reason={reason} 
                  onSwitchToRegister={() => setActiveTab('register')}
                />
              </motion.div>
            ) : (
              <motion.div
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="register-form-enter"
              >
                <RegisterForm onSwitchToLogin={() => setActiveTab('login')} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
} 