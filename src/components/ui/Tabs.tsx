import React, { createContext, useContext, useState } from "react";
import { cn } from "@/lib/utils";

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (val: string) => void;
  orientation: "horizontal" | "vertical";
}

const TabsContext = createContext<TabsContextValue | null>(null);

export interface TabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (val: string) => void;
  orientation?: "horizontal" | "vertical";
  className?: string;
  children: React.ReactNode;
}

export const Tabs: React.FC<TabsProps> = ({
  defaultValue,
  value,
  onValueChange,
  orientation = "horizontal",
  className,
  children,
}) => {
  const [internalValue, setInternalValue] = useState(defaultValue || "");
  const currentTab = value !== undefined ? value : internalValue;

  const handleTabChange = (val: string) => {
    if (value === undefined) {
      setInternalValue(val);
    }
    onValueChange?.(val);
  };

  return (
    <TabsContext.Provider
      value={{
        activeTab: currentTab,
        setActiveTab: handleTabChange,
        orientation,
      }}
    >
      <div
        className={cn(
          "w-full",
          orientation === "vertical" ? "flex gap-4 items-start" : "flex flex-col",
          className
        )}
      >
        {children}
      </div>
    </TabsContext.Provider>
  );
};

export interface TabListProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "underline" | "pills" | "contained";
}

export const TabList: React.FC<TabListProps> = ({
  className,
  variant = "underline",
  children,
  ...props
}) => {
  const context = useContext(TabsContext);
  const isVertical = context?.orientation === "vertical";

  const variantStyles = {
    underline: isVertical
      ? "flex flex-col space-y-1 border-r border-bji-slate-200 pr-2"
      : "flex items-center space-x-1 border-b border-bji-slate-200 overflow-x-auto",
    pills: isVertical
      ? "flex flex-col space-y-1 bg-bji-slate-100 p-1 rounded-bji"
      : "flex items-center space-x-1 bg-bji-slate-100 p-1 rounded-bji",
    contained: isVertical
      ? "flex flex-col border border-bji-slate-200 rounded-bji overflow-hidden"
      : "flex items-center border border-bji-slate-200 rounded-bji overflow-hidden bg-white",
  };

  return (
    <div
      role="tablist"
      className={cn(variantStyles[variant], className)}
      {...props}
    >
      {children}
    </div>
  );
};

export interface TabTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  badge?: number | string;
  badgeTone?: "info" | "critical" | "warning" | "neutral";
  icon?: React.ReactNode;
}

export const TabTrigger: React.FC<TabTriggerProps> = ({
  className,
  value,
  badge,
  badgeTone = "neutral",
  icon,
  children,
  ...props
}) => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error("TabTrigger must be used within Tabs");
  }

  const { activeTab, setActiveTab, orientation } = context;
  const isActive = activeTab === value;

  const toneBadgeColors = {
    neutral: "bg-bji-slate-200 text-bji-slate-700",
    info: "bg-bji-blue-100 text-bji-blue-800",
    warning: "bg-bji-amber-100 text-bji-amber-900",
    critical: "bg-bji-red-100 text-bji-red-800 font-bold",
  };

  return (
    <button
      role="tab"
      type="button"
      aria-selected={isActive}
      onClick={() => setActiveTab(value)}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors select-none whitespace-nowrap",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-bji-green-600 rounded-bji-sm",
        orientation === "horizontal" && [
          "border-b-2 -mb-px",
          isActive
            ? "border-bji-green-600 text-bji-green-700 font-semibold bg-white"
            : "border-transparent text-bji-slate-600 hover:text-bji-slate-900 hover:bg-bji-slate-50",
        ],
        orientation === "vertical" && [
          "border-r-2 -mr-px text-left w-full justify-between",
          isActive
            ? "border-bji-green-600 text-bji-green-700 font-semibold bg-bji-green-50/50"
            : "border-transparent text-bji-slate-600 hover:text-bji-slate-900 hover:bg-bji-slate-50",
        ],
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-1.5">
        {icon && <span className="w-3.5 h-3.5 shrink-0 opacity-80">{icon}</span>}
        <span>{children}</span>
      </div>

      {badge !== undefined && (
        <span
          className={cn(
            "text-[10px] px-1.5 py-0.2 rounded-full font-mono tabular-nums leading-none ml-1",
            toneBadgeColors[badgeTone]
          )}
        >
          {badge}
        </span>
      )}
    </button>
  );
};

export interface TabContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export const TabContent: React.FC<TabContentProps> = ({
  className,
  value,
  children,
  ...props
}) => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error("TabContent must be used within Tabs");
  }

  const { activeTab } = context;
  if (activeTab !== value) return null;

  return (
    <div
      role="tabpanel"
      className={cn("w-full focus:outline-none pt-3", className)}
      {...props}
    >
      {children}
    </div>
  );
};
