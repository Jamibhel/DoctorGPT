import React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
  inputSize?: "sm" | "md";
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      hint,
      leftSlot,
      rightSlot,
      inputSize = "sm",
      id,
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined);

    const sizeStyles = {
      sm: "h-8 px-2.5 text-xs rounded-bji",
      md: "h-9 px-3 text-sm rounded-bji",
    };

    return (
      <div className="w-full space-y-1">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-bji-slate-700"
          >
            {label} {required && <span className="text-bji-red-600">*</span>}
          </label>
        )}

        <div className="relative flex items-center">
          {leftSlot && (
            <div className="absolute left-2.5 flex items-center pointer-events-none text-bji-slate-400">
              {leftSlot}
            </div>
          )}

          <input
            id={inputId}
            ref={ref}
            disabled={disabled}
            className={cn(
              "w-full bg-white border text-bji-slate-900 placeholder:text-bji-slate-400",
              "transition-colors focus:outline-none focus:ring-1 focus:ring-bji-green-600 focus:border-bji-green-600",
              "disabled:bg-bji-slate-50 disabled:text-bji-slate-400 disabled:cursor-not-allowed",
              error
                ? "border-bji-red-500 focus:ring-bji-red-500 focus:border-bji-red-500"
                : "border-bji-slate-300 hover:border-bji-slate-400",
              leftSlot ? "pl-8" : "",
              rightSlot ? "pr-8" : "",
              sizeStyles[inputSize],
              className
            )}
            {...props}
          />

          {rightSlot && (
            <div className="absolute right-2.5 flex items-center text-bji-slate-400">
              {rightSlot}
            </div>
          )}
        </div>

        {error ? (
          <p className="text-meta text-bji-red-600 font-medium">{error}</p>
        ) : hint ? (
          <p className="text-meta text-bji-slate-500">{hint}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
