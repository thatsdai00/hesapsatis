import React from 'react';
import { twMerge } from 'tailwind-merge';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  htmlFor?: string;
}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, htmlFor, ...props }, ref) => {
    return (
      <label
        htmlFor={htmlFor}
        className={twMerge(
          'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Label.displayName = 'Label'; 