import React from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

export type AlertSeverity = "critical" | "danger" | "warning" | "info" | "success";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  severity?: AlertSeverity;
  tone?: AlertSeverity;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  onDismiss?: () => void;
  icon?: React.ReactNode;
}

export const Alert: React.FC<AlertProps> = ({
  className,
  severity,
  tone,
  title,
  description,
  action,
  onDismiss,
  icon,
  ...props
}) => {
  const resolvedSeverity = severity ?? tone ?? "info";

  const severityStyles: Record<AlertSeverity, { container: string; iconColor: string; defaultIcon: React.ReactNode }> = {
    critical: {
      container: "bg-bji-red-50/90 border-bji-red-300 text-bji-red-950",
      iconColor: "text-bji-red-600",
      defaultIcon: <AlertCircle className="w-4 h-4" />,
    },
    danger: {
      container: "bg-bji-red-50/90 border-bji-red-300 text-bji-red-950",
      iconColor: "text-bji-red-600",
      defaultIcon: <AlertCircle className="w-4 h-4" />,
    },
    warning: {
      container: "bg-bji-amber-50/90 border-bji-amber-300 text-bji-amber-950",
      iconColor: "text-bji-amber-600",
      defaultIcon: <AlertTriangle className="w-4 h-4" />,
    },
    info: {
      container: "bg-bji-blue-50/90 border-bji-blue-300 text-bji-blue-950",
      iconColor: "text-bji-blue-600",
      defaultIcon: <Info className="w-4 h-4" />,
    },
    success: {
      container: "bg-bji-green-50/90 border-bji-green-300 text-bji-green-950",
      iconColor: "text-bji-green-600",
      defaultIcon: <CheckCircle2 className="w-4 h-4" />,
    },
  };

  const current = severityStyles[resolvedSeverity];

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-2.5 p-3 rounded-bji border text-xs leading-relaxed",
        current.container,
        className
      )}
      {...props}
    >
      <div className={cn("shrink-0 mt-0.5", current.iconColor)}>
        {icon || current.defaultIcon}
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-xs leading-snug">{title}</h4>
        {description && (
          <div className="mt-1 text-meta opacity-90">{description}</div>
        )}
        {action && <div className="mt-2.5">{action}</div>}
      </div>

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 text-bji-slate-400 hover:text-bji-slate-700 p-0.5 rounded transition-colors"
          aria-label="Dismiss alert"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
