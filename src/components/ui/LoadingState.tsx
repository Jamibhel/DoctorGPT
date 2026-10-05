import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "xs" | "sm" | "md" | "lg";
  label?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  className,
  size = "sm",
  label,
  ...props
}) => {
  const sizeMap = {
    xs: "w-3 h-3",
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <div
      className={cn("inline-flex items-center gap-2 text-bji-slate-600", className)}
      role="status"
      aria-live="polite"
      {...props}
    >
      <Loader2 className={cn("animate-spin text-bji-green-600 shrink-0", sizeMap[size])} />
      {label && <span className="text-xs font-medium text-bji-slate-600">{label}</span>}
      <span className="sr-only">{label || "Loading..."}</span>
    </div>
  );
};

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "rectangular" | "circular";
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = "rectangular",
  width,
  height,
  style,
  ...props
}) => {
  const variantStyles = {
    text: "h-3.5 w-full rounded-bji-xs",
    rectangular: "w-full rounded-bji",
    circular: "rounded-full",
  };

  return (
    <div
      className={cn("animate-pulse bg-bji-slate-200/80", variantStyles[variant], className)}
      style={{
        width,
        height,
        ...style,
      }}
      aria-hidden="true"
      {...props}
    />
  );
};

export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 4,
}) => {
  return (
    <div className="w-full border border-bji-slate-200 rounded-bji overflow-hidden bg-white">
      <div className="bg-bji-slate-50 border-b border-bji-slate-200 p-2.5 flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} variant="text" className="h-3 max-w-[120px]" />
        ))}
      </div>
      <div className="divide-y divide-bji-slate-100 p-2 space-y-2">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-4 py-1.5 items-center">
            {Array.from({ length: columns }).map((_, c) => (
              <Skeleton key={c} variant="text" className="h-3" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
