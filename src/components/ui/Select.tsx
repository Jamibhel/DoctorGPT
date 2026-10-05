import React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  selectSize?: "sm" | "md";
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      error,
      hint,
      selectSize = "sm",
      id,
      disabled,
      required,
      children,
      ...props
    },
    ref
  ) => {
    const selectId = id || (label ? `select-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined);

    const sizeStyles = {
      sm: "h-8 pl-2.5 pr-8 text-xs rounded-bji",
      md: "h-9 pl-3 pr-8 text-sm rounded-bji",
    };

    return (
      <div className="w-full space-y-1">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-semibold text-bji-slate-700"
          >
            {label} {required && <span className="text-bji-red-600">*</span>}
          </label>
        )}

        <div className="relative flex items-center">
          <select
            id={selectId}
            ref={ref}
            disabled={disabled}
            className={cn(
              "w-full appearance-none bg-white border text-bji-slate-900 cursor-pointer",
              "transition-colors focus:outline-none focus:ring-1 focus:ring-bji-green-600 focus:border-bji-green-600",
              "disabled:bg-bji-slate-50 disabled:text-bji-slate-400 disabled:cursor-not-allowed",
              error
                ? "border-bji-red-500 focus:ring-bji-red-500 focus:border-bji-red-500"
                : "border-bji-slate-300 hover:border-bji-slate-400",
              sizeStyles[selectSize],
              className
            )}
            {...props}
          >
            {children}
          </select>

          <div className="absolute right-2.5 pointer-events-none text-bji-slate-500 flex items-center">
            <ChevronDown className="w-3.5 h-3.5" />
          </div>
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

Select.displayName = "Select";
