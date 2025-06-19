'use client';

import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface FuturisticRadioButtonProps {
  id: string;
  name: string;
  value: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label: ReactNode;
  icon?: React.ReactNode;
  description?: string | ReactNode;
  className?: string;
  disabled?: boolean;
}

const FuturisticRadioButton: React.FC<FuturisticRadioButtonProps> = ({
  id,
  name,
  value,
  checked,
  onChange,
  label,
  icon,
  description,
  className,
  disabled = false,
}) => {
  return (
    <div 
      className={cn(
        "relative rounded-lg transition-all duration-300 overflow-hidden",
        checked 
          ? "bg-gradient-to-r from-primary/10 to-purple-900/20 border border-primary/50" 
          : "bg-gray-800/50 border border-gray-700 hover:border-gray-600",
        disabled && "opacity-60 cursor-not-allowed",
        className
      )}
    >
      <input
        type="radio"
        id={id}
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="sr-only" // Hide the actual radio button
      />
      
      <label
        htmlFor={id}
        className={cn(
          "flex items-center p-4 cursor-pointer relative z-10",
          disabled && "cursor-not-allowed"
        )}
      >
        {/* Custom radio indicator */}
        <div className="relative mr-4 flex-shrink-0">
          <div className="w-6 h-6 rounded-full border-2 border-gray-400 flex items-center justify-center">
            {checked && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-3 h-3 rounded-full bg-white"
                layoutId={`radio-dot-${name}`}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 30
                }}
              />
            )}
          </div>
          
          {/* Glow effect - reduced */}
          {checked && !disabled && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.15 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 rounded-full bg-white blur-[1px] pointer-events-none"
            />
          )}
        </div>
        
        {/* Label and description */}
        <div className="flex flex-1 items-center">
          {icon && (
            <div className={cn("mr-3 text-xl", checked ? "text-primary" : "text-gray-400")}>
              {icon}
            </div>
          )}
          
          <div>
            <div className="font-medium text-white">{label}</div>
            {description && (
              <div className="text-sm text-gray-400 mt-0.5">{description}</div>
            )}
          </div>
          
          {/* Selected indicator */}
          {checked && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="ml-auto"
            >
              <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white" />
              </div>
            </motion.div>
          )}
        </div>
      </label>
      
      {/* Highlight effect on checked - reduced */}
      {checked && !disabled && (
        <motion.div
          layoutId={`highlight-${name}`}
          className="absolute inset-0 bg-gradient-to-r from-primary/5 to-purple-900/5 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          exit={{ opacity: 0 }}
          style={{ zIndex: 1 }}
        />
      )}
    </div>
  );
};

export default FuturisticRadioButton; 