// src/features/dashboard/index.jsx
// ─────────────────────────────────────────────────────────────────────────────
//  DASHBOARD PAGE
//  Role-aware layout: ADMIN/HR | SUPERVISOR | EMPLOYEE
//  Data: single GET /api/dashboard/summary via useDashboardSummary
// ─────────────────────────────────────────────────────────────────────────────

import { Users, UserCheck, Clock, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { useAuthV2 }            from "@/features/authentication-v2/use-auth-v2";
import { useDashboardSummary }  from "./queries";

import KpiCard               from "./components/kpi-card";
import AttendanceSummaryCard from "./components/attendance-summary-card";
import PendingApprovalsCard  from "./components/pending-approvals-card";
import NotificationsCard     from "./components/notifications-card";
import EmployeeMovementCard  from "./components/employee-movement-card";
import PayrollStatusCard     from "./components/payroll-status-card";

// ─────────────────────────────────────────────────────────────────────────────
//  Skeleton placeholder — mimics a card while loading
// ─────────────────────────────────────────────────────────────────────────────
function CardSkeleton({ rows = 3 }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-32" />
      </CardHeader>
      <CardContent className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Error state
// ─────────────────────────────────────────────────────────────────────────────
function DashboardError({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm font-medium text-destructive">
        Failed to load dashboard
      </p>
      {message && <p className="text-xs">{message}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Leave Balance inline display (EMPLOYEE only — no separate component needed)
// ─────────────────────────────────────────────────────────────────────────────
function LeaveBalanceCard({ leaveBalance = [] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <span className="text-sm font-medium text-muted-foreground">
          Leave Balance
        </span>
      </CardHeader>
      <CardContent className="pt-1">
        {leaveBalance.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">No leave types found.</p>
        ) : (
          <div className="space-y-2">
            {leaveBalance.map((lb) => {
              const pct =
                lb.ALLOCATED > 0
                  ? Math.round(((lb.USED + (lb.PENDING_DAYS ?? 0)) / lb.ALLOCATED) * 100)
                  : 0;
              return (
                <div key={lb.LEAVE_TYPE_NAME} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground/80 font-medium">
                      {lb.LEAVE_TYPE_NAME}
                    </span>
                    <div className="flex items-center gap-2">
                      {lb.PENDING_DAYS > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {lb.PENDING_DAYS} pending
                        </Badge>
                      )}
                      <span className="text-muted-foreground text-xs tabular-nums">
                        {lb.REMAINING ?? 0} / {lb.ALLOCATED ?? 0} left
                      </span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  ADMIN / HR Layout
// ─────────────────────────────────────────────────────────────────────────────
function AdminHrDashboard({ data, isLoading }) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <CardSkeleton rows={1} />
          <CardSkeleton rows={1} />
          <CardSkeleton rows={1} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CardSkeleton rows={4} />
          <CardSkeleton rows={4} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CardSkeleton rows={5} />
          <CardSkeleton rows={5} />
        </div>
      </div>
    );
  }

  const totalPending =
    (data.pendingApprovals?.pendingLeaves      ?? 0) +
    (data.pendingApprovals?.pendingLateApps    ?? 0) +
    (data.pendingApprovals?.pendingCorrections ?? 0);

  return (
    <div className="space-y-4">
      {/* Row 1 — KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          title="Total Employees"
          value={data.kpis?.totalActiveEmployees ?? 0}
          icon={<Users />}
        />
        <KpiCard
          title="New Joiners This Month"
          value={data.kpis?.newJoinersThisMonth ?? 0}
          icon={<UserCheck />}
          description="Active employees joined this month"
        />
        <KpiCard
          title="Pending Approvals"
          value={totalPending}
          icon={<Clock />}
          description="Across leaves, late apps & corrections"
        />
      </div>

      {/* Row 2 — Attendance + Payroll */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AttendanceSummaryCard data={data.todayAttendance} variant="today" />
        <PayrollStatusCard payrollRun={data.latestPayrollRun} />
      </div>

      {/* Row 3 — Pending Approvals detail + Movement + Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <PendingApprovalsCard {...(data.pendingApprovals ?? {})} />
        <EmployeeMovementCard movement={data.employeeMovement} />
        <NotificationsCard notifications={data.recentNotifications ?? []} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  SUPERVISOR Layout
// ─────────────────────────────────────────────────────────────────────────────
function SupervisorDashboard({ data, isLoading }) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CardSkeleton rows={1} />
          <CardSkeleton rows={3} />
        </div>
        <CardSkeleton rows={4} />
        <CardSkeleton rows={5} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Row 1 — Team Size + Pending */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KpiCard
          title="Team Size"
          value={data.kpis?.teamSize ?? 0}
          icon={<Users />}
          description="Active direct reports"
        />
        <PendingApprovalsCard {...(data.pendingApprovals ?? {})} />
      </div>

      {/* Row 2 — Team Attendance */}
      <AttendanceSummaryCard data={data.todayAttendance} variant="today" />

      {/* Row 3 — Notifications */}
      <NotificationsCard notifications={data.recentNotifications ?? []} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  EMPLOYEE Layout
// ─────────────────────────────────────────────────────────────────────────────
function EmployeeDashboard({ data, isLoading }) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <CardSkeleton rows={4} />
        <CardSkeleton rows={5} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CardSkeleton rows={3} />
          <CardSkeleton rows={5} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Row 1 — My Attendance this month */}
      <AttendanceSummaryCard
        data={data.myAttendanceSummary}
        variant="monthly"
      />

      {/* Row 2 — Leave Balance */}
      <LeaveBalanceCard leaveBalance={data.myLeaveBalance ?? []} />

      {/* Row 3 — My Pending + Notifications */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <PendingApprovalsCard {...(data.myPendingRequests ?? {})} />
        <NotificationsCard notifications={data.recentNotifications ?? []} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  ROOT PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuthV2();
  const { data, isLoading, isError, error } = useDashboardSummary();

  // Role resolution — same pattern as leave-request-list.jsx
  const roles        = user?.roles ?? [];
  const isAdminOrHR  = roles.includes("ADMIN") || roles.includes("HR");
  const isSupervisor = !isAdminOrHR && roles.includes("SUPERVISOR");

  return (
    <div className="p-4 md:p-6 max-w-screen-xl mx-auto space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Welcome back
          {user?.username ? `, ${user.username}` : ""}
        </p>
      </div>

      {/* Error state */}
      {isError && !isLoading && (
        <DashboardError message={error?.message} />
      )}

      {/* Role-specific layout */}
      {!isError && (
        <>
          {isAdminOrHR && (
            <AdminHrDashboard data={data ?? {}} isLoading={isLoading} />
          )}
          {isSupervisor && (
            <SupervisorDashboard data={data ?? {}} isLoading={isLoading} />
          )}
          {!isAdminOrHR && !isSupervisor && (
            <EmployeeDashboard data={data ?? {}} isLoading={isLoading} />
          )}
        </>
      )}
    </div>
  );
}