import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react"
import { motion, type Variants } from "framer-motion"

import { cn } from "@/lib/utils"

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:max-w-[450px]",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center gap-4 overflow-hidden rounded-md border backdrop-blur-md bg-opacity-70 p-5 shadow-lg transition-all data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-right-full data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none",
  {
    variants: {
      variant: {
        default: "border-slate-700/20 bg-slate-900/70 text-slate-50 shadow-[0_0_10px_rgba(124,58,237,0.2)]",
        success: "border-green-700/20 bg-slate-900/70 text-slate-50 shadow-[0_0_10px_rgba(34,197,94,0.2)]",
        destructive: "border-red-700/20 bg-slate-900/70 text-slate-50 shadow-[0_0_10px_rgba(239,68,68,0.2)]",
        warning: "border-yellow-700/20 bg-slate-900/70 text-slate-50 shadow-[0_0_10px_rgba(234,179,8,0.2)]",
        info: "border-blue-700/20 bg-slate-900/70 text-slate-50 shadow-[0_0_10px_rgba(59,130,246,0.2)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-10 shrink-0 items-center justify-center rounded-sm border border-slate-700/30 bg-slate-800/50 px-4 text-base font-bold tracking-wide ring-offset-background transition-colors hover:bg-slate-700/50 focus:outline-none focus:ring-1 focus:ring-primary focus:ring-offset-1 disabled:pointer-events-none disabled:opacity-50",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-3 top-3 rounded-sm p-1 text-slate-400 transition-all hover:text-slate-50 hover:bg-slate-700/30 hover:scale-110 focus:outline-none focus:ring-1 focus:ring-primary",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-5 w-5" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-base font-bold tracking-wide uppercase", className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm opacity-90 font-medium tracking-wide", className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

// Animation variants - only entrance animation, no continuous animations
const iconAnimation: Variants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: { 
      duration: 0.2,
    }
  }
};

const ToastIcon = React.forwardRef<
  SVGSVGElement,
  IconProps & { variant?: VariantProps<typeof toastVariants>["variant"] }
>(({ variant, className, ...props }, ref) => {
  const Icon = React.useMemo(() => {
    switch (variant) {
      case "success":
        return CheckCircle;
      case "destructive":
        return AlertCircle;
      case "warning":
        return AlertTriangle;
      case "info":
        return Info;
      default:
        return Info;
    }
  }, [variant]);

  const iconColorClass = React.useMemo(() => {
    switch (variant) {
      case "success":
        return "text-green-400";
      case "destructive":
        return "text-red-400";
      case "warning":
        return "text-yellow-400";
      case "info":
        return "text-blue-400";
      default:
        return "text-primary";
    }
  }, [variant]);

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={iconAnimation}
      className="flex items-center justify-center"
    >
      <Icon
        ref={ref}
        className={cn("h-6 w-6", iconColorClass, className)}
        {...props}
        strokeWidth={2.5}
      />
    </motion.div>
  );
});
ToastIcon.displayName = "ToastIcon";

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>

type ToastActionElement = React.ReactElement<typeof ToastAction>

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
  ToastIcon,
} 