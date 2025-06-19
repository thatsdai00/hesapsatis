'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface FuturisticCheckboxProps {
  id: string;
  name: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
  className?: string;
  disabled?: boolean;
}

const FuturisticCheckbox: React.FC<FuturisticCheckboxProps> = ({
  id,
  name,
  checked,
  onChange,
  label,
  className,
  disabled = false,
}) => {
  return (
    <div className={cn("flex items-center", className)}>
      <div className="relative">
        <input
          type="checkbox"
          id={id}
          name={name}
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="sr-only" // Hide the actual checkbox
        />
        <label
          htmlFor={id}
          className={cn(
            "relative flex items-center cursor-pointer",
            disabled && "cursor-not-allowed opacity-60"
          )}
        >
          <div className="relative">
            {/* Checkbox background */}
            <div
              className={cn(
                "w-12 h-6 rounded-full transition-colors duration-300",
                checked ? "bg-primary" : "bg-gray-700"
              )}
            />
            
            {/* Toggle circle */}
            <motion.div
              className={cn(
                "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md",
                disabled && "bg-gray-300"
              )}
              animate={{
                x: checked ? 24 : 0,
              }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 30
              }}
            />
            
            {/* Glow effect */}
            {checked && !disabled && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 rounded-full bg-primary opacity-30 blur-sm"
              />
            )}
          </div>
          
          {/* Label */}
          <span className="ml-3 text-sm font-medium text-gray-200">
            {label}
          </span>
        </label>
      </div>
    </div>
  );
};

export default FuturisticCheckbox; 