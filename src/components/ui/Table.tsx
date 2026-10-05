import React from "react";
import { cn } from "@/lib/utils";

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  containerClassName?: string;
  dense?: boolean;
}

export const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, containerClassName, dense = true, ...props }, ref) => (
    <div className={cn("w-full overflow-x-auto border border-bji-slate-200 rounded-bji bg-white", containerClassName)}>
      <table
        ref={ref}
        className={cn(
          "w-full text-left border-collapse text-xs text-bji-slate-900",
          dense ? "table-dense" : "",
          className
        )}
        {...props}
      />
    </div>
  )
);
Table.displayName = "Table";

export const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn(
      "bg-bji-slate-50/90 text-bji-slate-600 border-b border-bji-slate-200 uppercase text-[10px] tracking-wider font-semibold sticky top-0 z-10",
      className
    )}
    {...props}
  />
));
TableHeader.displayName = "TableHeader";

export const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("divide-y divide-bji-slate-200/70 bg-white", className)}
    {...props}
  />
));
TableBody.displayName = "TableBody";

export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  isSelected?: boolean;
  isCritical?: boolean;
}

export const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, isSelected, isCritical, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        "transition-colors hover:bg-bji-slate-50/80 cursor-default",
        isSelected ? "bg-bji-blue-50/60 font-medium" : "",
        isCritical ? "bg-bji-red-50/40 hover:bg-bji-red-50/70" : "",
        className
      )}
      {...props}
    />
  )
);
TableRow.displayName = "TableRow";

export const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "px-3 py-2 text-left font-semibold select-none whitespace-nowrap text-bji-slate-600",
      className
    )}
    {...props}
  />
));
TableHead.displayName = "TableHead";

export interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  mono?: boolean;
}

export const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, mono, ...props }, ref) => (
    <td
      ref={ref}
      className={cn(
        "px-3 py-2.5 whitespace-nowrap align-middle",
        mono ? "font-mono tabular-nums text-bji-slate-800" : "",
        className
      )}
      {...props}
    />
  )
);
TableCell.displayName = "TableCell";

export const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-2 text-meta text-bji-slate-500", className)}
    {...props}
  />
));
TableCaption.displayName = "TableCaption";
