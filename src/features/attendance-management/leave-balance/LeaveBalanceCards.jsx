// src/features/attendance-management/leave-balance/LeaveBalanceCards.jsx
//
//  Grid of cards showing all leave type balances for an employee.
//
//  Usage:
//    import LeaveBalanceCards from "@/features/attendance-management/leave-balance/LeaveBalanceCards";
//    <LeaveBalanceCards employeeId={employeeId} />
//    <LeaveBalanceCards employeeId={employeeId} year={2025} className="mb-4" />

import { Clock, CheckCircle2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useLeaveBalance } from "./queries";

// ── Progress bar ──────────────────────────────────────────────────────────────

function BalanceBar({ used, allocated }) {
  if (!allocated || allocated === 0) return null;
  const pct = Math.min(100, Math.round((used / allocated) * 100));
  const isCritical = pct >= 100;
  const isLow = pct >= 80 && !isCritical;

  return (
    <div className="mt-3 space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{used} used</span>
        <span>{allocated} total</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            isCritical ? "bg-destructive" : isLow ? "bg-amber-500" : "bg-primary",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Single card ───────────────────────────────────────────────────────────────

function BalanceCard({ balance }) {
  const remaining  = balance.REMAINING     ?? 0;
  const allocated  = balance.ALLOCATED     ?? 0;
  const isCritical = remaining <= 0;
  const isLow      = remaining > 0 && remaining <= 2;

  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-4 space-y-2 transition-colors",
        isCritical && "border-destructive/40 bg-destructive/5",
        isLow && !isCritical && "border-amber-400/40 bg-amber-50/50 dark:bg-amber-950/20",
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium leading-tight truncate">
            {balance.LEAVE_TYPE_NAME}
          </p>
          <Badge variant="outline" className="mt-1 font-mono text-xs px-1.5">
            {balance.CODE}
          </Badge>
        </div>
        <div className="text-right shrink-0">
          <p
            className={cn(
              "text-2xl font-bold tabular-nums",
              isCritical
                ? "text-destructive"
                : isLow
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-foreground",
            )}
          >
            {remaining}
          </p>
          <p className="text-xs text-muted-foreground">days left</p>
        </div>
      </div>

      {/* Pending / Approved breakdown */}
      {(balance.PENDING_DAYS > 0 || balance.APPROVED_DAYS > 0) && (
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {balance.PENDING_DAYS > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-amber-500" />
              {balance.PENDING_DAYS}d pending
            </span>
          )}
          {balance.APPROVED_DAYS > 0 && (
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              {balance.APPROVED_DAYS}d approved
            </span>
          )}
        </div>
      )}

      <BalanceBar used={balance.USED} allocated={allocated} />
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function LeaveBalanceCards({
  employeeId,
  year = null,
  className,
}) {
  const { data: balances, isLoading, isError } = useLeaveBalance(
    employeeId,
    year,
  );

  if (isLoading) {
    return (
      <div className={cn("grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3", className)}>
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-lg" />
        ))}
      </div>
    );
  }

  // Silently hide on error or empty — don't break the page
  if (isError || !balances?.length) return null;

  return (
    <div className={cn("grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3", className)}>
      {balances.map((b) => (
        <BalanceCard key={b.LEAVE_TYPE_ID} balance={b} />
      ))}
    </div>
  );
}