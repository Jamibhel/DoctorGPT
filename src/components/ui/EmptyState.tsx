import React from "react";
import { cn } from "@/lib/utils";
import { Inbox } from "lucide-react";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  compact?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  className,
  icon,
  title,
  description,
  action,
  compact = false,
  ...props
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center rounded-bji border border-dashed border-bji-slate-300 bg-bji-slate-50/50",
        compact ? "py-6 px-4" : "py-12 px-6",
        className
      )}
      {...props}
    >
      <div className="w-9 h-9 rounded-bji bg-bji-slate-200/80 text-bji-slate-500 flex items-center justify-center mb-2.5 shrink-0">
        {icon || <Inbox className="w-4 h-4" />}
      </div>

      <h4 className="text-xs font-semibold text-bji-slate-800 leading-snug">
        {title}
      </h4>

      {description && (
        <p className="mt-1 text-meta text-bji-slate-500 max-w-sm leading-relaxed">
          {description}
        </p>
      )}

      {action && <div className="mt-3.5">{action}</div>}
    </div>
  );
};
