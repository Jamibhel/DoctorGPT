import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export type ButtonVariant = 
  | "primary"     // Restrained healthcare emerald
  | "secondary"   // Muted slate fill
  | "outline"     // White surface with subtle border
  | "ghost"       // Borderless, hover highlight only
  | "danger"      // Critical / contraindication red
  | "info";       // Clinical communication blue

export type ButtonSize = "xs" | "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "sm",
      isLoading = false,
      disabled,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = 
      "inline-flex items-center justify-center font-medium transition-colors select-none " +
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 " +
      "disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed";

    const variantStyles: Record<ButtonVariant, string> = {
      primary: 
        "bg-bji-green-600 text-white hover:bg-bji-green-700 active:bg-bji-green-800 " +
        "focus-visible:ring-bji-green-500 border border-bji-green-700/20 shadow-sm",
      secondary: 
        "bg-bji-slate-100 text-bji-slate-800 hover:bg-bji-slate-200 active:bg-bji-slate-300 " +
        "focus-visible:ring-bji-slate-400 border border-bji-slate-300/60",
      outline: 
        "bg-white text-bji-slate-700 hover:bg-bji-slate-50 active:bg-bji-slate-100 " +
        "border border-bji-slate-300 focus-visible:ring-bji-slate-400 shadow-sm",
      ghost: 
        "bg-transparent text-bji-slate-700 hover:bg-bji-slate-100 active:bg-bji-slate-200 " +
        "focus-visible:ring-bji-slate-400 border border-transparent",
      danger: 
        "bg-bji-red-600 text-white hover:bg-bji-red-700 active:bg-bji-red-800 " +
        "focus-visible:ring-bji-red-500 border border-bji-red-700/30 shadow-sm",
      info: 
        "bg-bji-blue-600 text-white hover:bg-bji-blue-700 active:bg-bji-blue-800 " +
        "focus-visible:ring-bji-blue-500 border border-bji-blue-700/20 shadow-sm",
    };

    const sizeStyles: Record<ButtonSize, string> = {
      xs: "text-meta px-2 py-1 gap-1 rounded-bji-sm min-h-[26px]",
      sm: "text-xs px-2.5 py-1.5 gap-1.5 rounded-bji min-h-[30px]",
      md: "text-sm px-3.5 py-2 gap-2 rounded-bji min-h-[36px]",
      lg: "text-base px-4 py-2.5 gap-2.5 rounded-bji-md min-h-[42px]",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && (
          <span className="inline-flex shrink-0">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
