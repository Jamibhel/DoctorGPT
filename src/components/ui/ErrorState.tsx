import React from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "./Button";

export interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  message: string;
  errorCode?: string;
  onRetry?: () => void;
  action?: React.ReactNode;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  className,
  title = "An operational error occurred",
  message,
  errorCode,
  onRetry,
  action,
  ...props
}) => {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-bji border border-bji-red-300 bg-bji-red-50/70 p-4 text-xs text-bji-slate-900",
        className
      )}
      {...props}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-bji-sm bg-bji-red-100 text-bji-red-600 flex items-center justify-center shrink-0 mt-0.5">
          <AlertCircle className="w-4 h-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-xs text-bji-red-950">{title}</h4>
            {errorCode && (
              <span className="text-[10px] font-mono bg-bji-red-200/70 text-bji-red-900 px-1.5 py-0.5 rounded-bji-xs">
                {errorCode}
              </span>
            )}
          </div>

          <p className="mt-1 text-meta text-bji-red-900/90 leading-relaxed">
            {message}
          </p>

          <div className="mt-3 flex items-center gap-2">
            {onRetry && (
              <Button
                variant="outline"
                size="xs"
                onClick={onRetry}
                leftIcon={<RotateCcw className="w-3 h-3" />}
                className="bg-white border-bji-red-300 text-bji-red-900 hover:bg-bji-red-50"
              >
                Retry Operation
              </Button>
            )}
            {action}
          </div>
        </div>
      </div>
    </div>
  );
};
