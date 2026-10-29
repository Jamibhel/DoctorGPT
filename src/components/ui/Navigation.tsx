import React from "react";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
  isCurrent?: boolean;
}

export interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[];
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className, ...props }) => {
  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center space-x-1.5 text-meta", className)} {...props}>
      <ol className="flex items-center space-x-1.5 list-none p-0 m-0">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="flex items-center gap-1.5">
              {item.onClick ? (
                <button
                  type="button"
                  onClick={item.onClick}
                  className={cn(
                    "hover:text-bji-green-700 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-bji-green-500 rounded-bji-xs",
                    isLast ? "font-semibold text-bji-slate-900 pointer-events-none" : "text-bji-slate-500"
                  )}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </button>
              ) : item.href ? (
                <a
                  href={item.href}
                  className={cn(
                    "hover:text-bji-green-700 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-bji-green-500 rounded-bji-xs",
                    isLast ? "font-semibold text-bji-slate-900" : "text-bji-slate-500"
                  )}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </a>
              ) : (
                <span
                  className={cn(
                    isLast ? "font-semibold text-bji-slate-900" : "text-bji-slate-500"
                  )}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}

              {!isLast && (
                <ChevronRight className="w-3 h-3 text-bji-slate-400 shrink-0" aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export interface NavRailItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  badge?: string | number;
  badgeTone?: "info" | "critical" | "warning" | "neutral" | "danger";
  collapsed?: boolean;
}

export const NavRailItem: React.FC<NavRailItemProps> = ({
  icon,
  label,
  isActive = false,
  badge,
  badgeTone = "neutral",
  collapsed = false,
  className,
  ...props
}) => {
  const badgeToneStyles = {
    neutral: "bg-bji-slate-200 text-bji-slate-800",
    info: "bg-bji-blue-100 text-bji-blue-900",
    warning: "bg-bji-amber-100 text-bji-amber-900",
    critical: "bg-bji-red-600 text-white font-bold",
    danger: "bg-bji-red-600 text-white font-bold",
  };

  return (
    <button
      type="button"
      className={cn(
        "group relative flex items-center w-full transition-colors font-medium text-xs rounded-bji",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bji-green-500 select-none",
        collapsed ? "justify-center p-2" : "px-2.5 py-2 gap-2.5",
        isActive
          ? "bg-bji-green-50 text-bji-green-900 font-semibold"
          : "text-bji-slate-600 hover:bg-bji-slate-100/80 hover:text-bji-slate-900",
        className
      )}
      title={collapsed ? label : undefined}
      {...props}
    >
      {/* Active Left Indicator Bar */}
      {isActive && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-bji-green-600 rounded-r-sm"
          aria-hidden="true"
        />
      )}

      <span className={cn("w-4 h-4 shrink-0 transition-colors", isActive ? "text-bji-green-700" : "text-bji-slate-500 group-hover:text-bji-slate-700")}>
        {icon}
      </span>

      {!collapsed && <span className="flex-1 text-left truncate">{label}</span>}

      {!collapsed && badge !== undefined && (
        <span
          className={cn(
            "text-[10px] px-1.5 py-0.2 rounded-full font-mono tabular-nums leading-none",
            badgeToneStyles[badgeTone]
          )}
        >
          {badge}
        </span>
      )}
    </button>
  );
};
