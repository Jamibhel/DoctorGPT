import React, { useEffect } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: React.ReactNode;
  width?: "sm" | "md" | "lg" | "xl";
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  width = "md",
  children,
  footer,
  className,
}) => {
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

  // Lock body scroll
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

  const widthStyles = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-xl",
    xl: "max-w-2xl",
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-bji-slate-900/50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 flex pl-10 max-w-full">
        <div
          className={cn(
            "w-screen bg-white border-l border-bji-slate-300 shadow-xl flex flex-col",
            widthStyles[width],
            className
          )}
        >
          {/* Header */}
          <div className="flex items-start justify-between px-4 py-3.5 border-b border-bji-slate-200 bg-bji-slate-50">
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
              className="text-bji-slate-400 hover:text-bji-slate-700 p-1 rounded-bji-sm hover:bg-bji-slate-200 transition-colors"
              aria-label="Close drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 px-4 py-3.5 overflow-y-auto text-xs text-bji-slate-700 space-y-3">
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
    </div>
  );
};
