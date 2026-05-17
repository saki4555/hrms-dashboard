// src/features/attendance-management/leave-balance/LeaveBalanceInline.jsx
//
//  Compact inline balance indicator — use inside Add Leave Request sheet,
//  right below the Leave Type selector. Updates live as the type changes.
//
//  Usage:
//    import LeaveBalanceInline from "@/features/attendance-management/leave-balance/LeaveBalanceInline";
//
//    // Inside your add-leave-request-sheet.jsx, after the leave type <Select>:
//    <LeaveBalanceInline employeeId={employeeId} leaveTypeId={watch("leave_type_id")} />

import { CalendarDays, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useLeaveBalanceByType } from "./queries";

export default function LeaveBalanceInline({ employeeId, leaveTypeId }) {
  const { data: balance, isLoading } = useLeaveBalanceByType(
    employeeId,
    leaveTypeId,
  );

  // Nothing selected yet — render nothing
  if (!leaveTypeId) return null;

  if (isLoading) {
    return <Skeleton className="h-9 w-56 rounded-md" />;
  }

  // API returned nothing (shouldn't happen normally)
  if (!balance) return null;

  const remaining  = balance.REMAINING ?? 0;
  const isCritical = remaining <= 0;
  const isLow      = remaining > 0 && remaining <= 2;

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md border px-3 py-2 text-sm",
        isCritical
          ? "border-destructive/50 bg-destructive/10 text-destructive"
          : isLow
            ? "border-amber-400/50 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
            : "border-border bg-muted/40 text-muted-foreground",
      )}
    >
      {isCritical ? (
        <AlertCircle className="h-4 w-4 shrink-0" />
      ) : (
        <CalendarDays className="h-4 w-4 shrink-0" />
      )}

      <span>
        {isCritical ? (
          <>
            <strong className="text-destructive">No balance remaining</strong>
            {" "}for {balance.LEAVE_TYPE_NAME}
          </>
        ) : (
          <>
            <strong className="text-foreground">{remaining}</strong>
            {" "}day{remaining !== 1 ? "s" : ""} remaining for {balance.LEAVE_TYPE_NAME}
          </>
        )}

        {/* Show pending if any — so employee knows why balance looks low */}
        {balance.PENDING_DAYS > 0 && (
          <span className="ml-1 text-xs opacity-70">
            ({balance.PENDING_DAYS}d pending approval)
          </span>
        )}
      </span>
    </div>
  );
}