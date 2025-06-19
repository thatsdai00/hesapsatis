import React from 'react';
import { twMerge } from 'tailwind-merge';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Additional custom properties can be added here */
  customProp?: boolean;
}

export const Card: React.FC<CardProps> = ({ className, ...props }) => (
  <div
    className={twMerge('bg-card rounded-lg border border-border shadow-sm', className)}
    {...props}
  />
);

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Additional custom properties can be added here */
  customProp?: boolean;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ className, ...props }) => (
  <div
    className={twMerge('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
);

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  /** Additional custom properties can be added here */
  customProp?: boolean;
}

export const CardTitle: React.FC<CardTitleProps> = ({ className, ...props }) => (
  <h3
    className={twMerge('text-2xl font-semibold leading-none tracking-tight', className)}
    {...props}
  />
);

interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  /** Additional custom properties can be added here */
  customProp?: boolean;
}

export const CardDescription: React.FC<CardDescriptionProps> = ({ className, ...props }) => (
  <p
    className={twMerge('text-sm text-muted-foreground', className)}
    {...props}
  />
);

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Additional custom properties can be added here */
  customProp?: boolean;
}

export const CardContent: React.FC<CardContentProps> = ({ className, ...props }) => (
  <div className={twMerge('p-6 pt-0', className)} {...props} />
);

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Additional custom properties can be added here */
  customProp?: boolean;
}

export const CardFooter: React.FC<CardFooterProps> = ({ className, ...props }) => (
  <div
    className={twMerge('flex items-center p-6 pt-0', className)}
    {...props}
  />
); 