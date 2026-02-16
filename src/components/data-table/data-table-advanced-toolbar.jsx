"use client";;
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { cn } from "@/lib/utils";

export function DataTableAdvancedToolbar(
  {
    table,
    children,
    className,
    ...props
  }
) {
  return (
    <div
      role="toolbar"
      aria-orientation="horizontal"
      className={cn("flex w-full items-start justify-between gap-2 p-1", className)}
      {...props}>
      <div className="flex flex-1 flex-wrap items-center gap-2">{children}</div>
      <div className="flex items-center gap-2">
        <DataTableViewOptions table={table} align="end" />
      </div>
    </div>
  );
}
