"use client"
import React from 'react';
import { twMerge } from 'tailwind-merge';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
}

export const Select: React.FC<SelectProps> = ({ options, className, ...props }) => (
  <select
    className={twMerge(
      'block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm',
      'dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-indigo-500 dark:focus:ring-indigo-500',
      'dashboard-input',
      className
    )}
    {...props}
  >
    {options.map((option) => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
); 