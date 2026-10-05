import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  maxWidth = "lg",
  children,
  footer,
  className,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when modal open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const maxWidthStyles = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    full: "max-w-[92vw]",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      {/* Restrained Backdrop (no blurry glassmorphism) */}
      <div
        className="fixed inset-0 bg-bji-slate-900/60 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog Surface */}
      <div
        ref={dialogRef}
        className={cn(
          "relative w-full bg-white border border-bji-slate-300 rounded-bji-md shadow-lg",
          "flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-100",
          maxWidthStyles[maxWidth],
          className
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-4 py-3 border-b border-bji-slate-200 bg-bji-slate-50/80">
          <div className="space-y-0.5 pr-4">
            <h3 className="text-sm font-semibold text-bji-slate-900 leading-tight">
              {title}
            </h3>
            {subtitle && (
              <div className="text-meta text-bji-slate-500">{subtitle}</div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-bji-slate-400 hover:text-bji-slate-700 p-1 rounded-bji-sm hover:bg-bji-slate-200/60 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="px-4 py-3.5 overflow-y-auto text-xs text-bji-slate-700 space-y-3">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-4 py-2.5 bg-bji-slate-50 border-t border-bji-slate-200 flex items-center justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
