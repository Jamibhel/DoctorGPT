import React from "react";
import { cn } from "@/lib/utils";

export type BadgeTone = "success" | "info" | "warning" | "critical" | "danger" | "neutral";
export type BadgeVariant =
  | "subtle"
  | "solid"
  | "outline"
  | "blue"
  | "red"
  | "emerald"
  | "amber"
  | "green"
  | "gray"
  | "neutral";
export type BadgeSize = "xs" | "sm";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  tone,
  variant = "subtle",
  size = "sm",
  dot = false,
  children,
  ...props
}) => {
  const legacyVariantToneMap: Record<string, BadgeTone> = {
    blue: "info",
    red: "critical",
    emerald: "success",
    amber: "warning",
    green: "success",
    gray: "neutral",
    danger: "critical",
    neutral: "neutral",
    success: "success",
    info: "info",
    warning: "warning",
    critical: "critical",
  };

  const resolvedTone = tone ?? legacyVariantToneMap[variant] ?? "neutral";
  const resolvedVariant: "subtle" | "solid" | "outline" = ["subtle", "solid", "outline"].includes(variant)
    ? variant
    : "subtle";

  const toneStyles: Record<BadgeTone, Record<"subtle" | "solid" | "outline", string>> = {
    success: {
      subtle: "bg-bji-green-50 text-bji-green-800 border-bji-green-200/80",
      solid: "bg-bji-green-600 text-white border-transparent",
      outline: "bg-transparent text-bji-green-700 border-bji-green-300",
    },
    info: {
      subtle: "bg-bji-blue-50 text-bji-blue-800 border-bji-blue-200/80",
      solid: "bg-bji-blue-600 text-white border-transparent",
      outline: "bg-transparent text-bji-blue-700 border-bji-blue-300",
    },
    warning: {
      subtle: "bg-bji-amber-50 text-bji-amber-800 border-bji-amber-200/80",
      solid: "bg-bji-amber-600 text-white border-transparent",
      outline: "bg-transparent text-bji-amber-700 border-bji-amber-300",
    },
    critical: {
      subtle: "bg-bji-red-50 text-bji-red-800 border-bji-red-200/80",
      solid: "bg-bji-red-600 text-white border-transparent",
      outline: "bg-transparent text-bji-red-700 border-bji-red-300",
    },
    danger: {
      subtle: "bg-bji-red-50 text-bji-red-800 border-bji-red-200/80",
      solid: "bg-bji-red-600 text-white border-transparent",
      outline: "bg-transparent text-bji-red-700 border-bji-red-300",
    },
    neutral: {
      subtle: "bg-bji-slate-100 text-bji-slate-700 border-bji-slate-200",
      solid: "bg-bji-slate-700 text-white border-transparent",
      outline: "bg-transparent text-bji-slate-600 border-bji-slate-300",
    },
  };

  const dotColors: Record<BadgeTone, string> = {
    success: "bg-bji-green-500",
    info: "bg-bji-blue-500",
    warning: "bg-bji-amber-500",
    critical: "bg-bji-red-500",
    danger: "bg-bji-red-500",
    neutral: "bg-bji-slate-400",
  };

  const sizeStyles = {
    xs: "text-[10px] px-1.5 py-0.5 gap-1 rounded-bji-sm font-medium tracking-tight",
    sm: "text-meta px-2 py-0.5 gap-1.5 rounded-bji font-medium",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center border select-none whitespace-nowrap",
        toneStyles[resolvedTone][resolvedVariant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full shrink-0",
            resolvedVariant === "solid" ? "bg-white" : dotColors[resolvedTone]
          )}
        />
      )}
      <span>{children}</span>
    </span>
  );
};
