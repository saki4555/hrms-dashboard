// src/features/payroll/salary-sheet.jsx
import { useState } from "react";
import { Link, useParams } from "react-router";
import { format } from "date-fns";
import {
  RefreshCw,
  AlertCircle,
  FileSpreadsheet,
  Users,
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowLeft,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { cn } from "@/lib/utils";
import { getAvatarColor } from "@/lib/avatar-utils";
import { usePayslipsByRun, usePayrollRuns } from "./queries";
import PayslipBreakdownDialog from "./payslip-breakdown-dialog";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const fmt = (n) =>
  new Intl.NumberFormat("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n ?? 0);

const fmtMonth = (ym) => {
  if (!ym) return "—";
  try {
    const [y, m] = ym.split("-");
    return format(new Date(Number(y), Number(m) - 1, 1), "MMMM yyyy");
  } catch { return ym; }
};

const STATUS_CONFIG = {
  APPROVED:  { label: "Approved",  class: "bg-green-500/10 text-green-600 border-green-500/20" },
  PROCESSED: { label: "Processed", class: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  DRAFT:     { label: "Draft",     class: "bg-muted text-muted-foreground border-border" },
};

// ─────────────────────────────────────────────────────────────────────────────
// SUMMARY CARDS
// ─────────────────────────────────────────────────────────────────────────────

function SummaryCards({ payslips }) {
  const totalGross      = payslips.reduce((s, p) => s + (p.GROSS ?? 0), 0);
  const totalNet        = payslips.reduce((s, p) => s + (p.NET ?? 0), 0);
  const totalDeductions = payslips.reduce((s, p) => s + (p.DEDUCTIONS ?? 0), 0);

  const cards = [
    { label: "Employees",        value: payslips.length, icon: Users,        color: "text-foreground",  bg: "bg-muted/50",        format: (v) => v },
    { label: "Total Gross",      value: totalGross,      icon: TrendingUp,   color: "text-green-600",   bg: "bg-green-500/10",    format: (v) => `৳ ${fmt(v)}` },
    { label: "Total Deductions", value: totalDeductions, icon: TrendingDown, color: "text-red-500",     bg: "bg-red-500/10",      format: (v) => `৳ ${fmt(v)}` },
    { label: "Total Net Pay",    value: totalNet,        icon: Wallet,       color: "text-blue-600",    bg: "bg-blue-500/10",     format: (v) => `৳ ${fmt(v)}` },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
      {cards.map(({ label, value, icon: Icon, color, bg, format: f }) => (
        <Card key={label} className="shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0", bg)}>
              <Icon className={cn("h-5 w-5", color)} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={cn("text-lg font-bold truncate", color)}>{f(value)}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function SalarySheet() {
  const { payrollId } = useParams();
  const [selectedPayslip, setSelectedPayslip] = useState(null);

  const { data: payslips = [], isLoading, isError, error, refetch, isFetching } =
    usePayslipsByRun(payrollId);

  // Get run info for the header
  const { data: runs = [] } = usePayrollRuns();
  const run = runs.find((r) => String(r.PAYROLL_ID) === String(payrollId));
  const statusCfg = STATUS_CONFIG[run?.STATUS] ?? STATUS_CONFIG.DRAFT;

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading)
    return (
      <div>
        <PageHeader run={run} />
        <div className="bg-card rounded-md shadow-sm p-4">
          <div className="flex flex-col items-center justify-center py-16">
            <Spinner className="h-12 w-12 mb-4" />
            <p className="text-muted-foreground">Loading salary sheet...</p>
          </div>
        </div>
      </div>
    );

  // ── Error ─────────────────────────────────────────────────────────────────
  if (isError)
    return (
      <div>
        <PageHeader run={run} onRefetch={refetch} isFetching={isFetching} />
        <div className="bg-card rounded-md shadow-sm p-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Salary Sheet</AlertTitle>
            <AlertDescription className="mt-2 flex flex-col gap-2">
              <p>{error?.message || "Failed to load salary data."}</p>
              <Button variant="outline" size="sm" onClick={refetch} disabled={isFetching} className="w-fit">
                {isFetching
                  ? <><Spinner className="mr-2 h-4 w-4" />Retrying...</>
                  : <><RefreshCw className="mr-2 h-4 w-4" />Retry</>}
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <div>
      <PageHeader run={run} onRefetch={refetch} isFetching={isFetching} />

      <SummaryCards payslips={payslips} />

      <div className="bg-card rounded-md shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <p className="text-sm font-medium text-muted-foreground">
              {isFetching ? "Loading..." : `${payslips.length} employee${payslips.length !== 1 ? "s" : ""}`}
            </p>
            {run && (
              <Badge variant="outline" className={cn("text-xs", statusCfg.class)}>
                {statusCfg.label}
              </Badge>
            )}
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead className="text-center">Working Days</TableHead>
              <TableHead className="text-center">Present</TableHead>
              <TableHead className="text-center">Absent</TableHead>
              <TableHead className="text-right">Gross (৳)</TableHead>
              <TableHead className="text-right">Deductions (৳)</TableHead>
              <TableHead className="text-right">Net Pay (৳)</TableHead>
              <TableHead className="text-right">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payslips.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-16 text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <FileSpreadsheet className="h-10 w-10 opacity-30" />
                    <p className="font-medium">No payslips found</p>
                    <p className="text-xs">Process the payroll run first.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              payslips.map((ps) => {
                const summary = ps.BREAKDOWN?.summary ?? {};
                const initials = ps.FULL_NAME?.split(" ")
                  .map((n) => n[0]).join("").slice(0, 2).toUpperCase();

                return (
                  <TableRow
                    key={ps.PAYSLIP_ID}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setSelectedPayslip(ps)}
                  >
                    {/* Employee */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarImage
                            src={`${import.meta.env.VITE_API_BASE_URL}/api/emp-images/person/${ps.EMPLOYEE_ID}`}
                          />
                          <AvatarFallback
                            className={cn("text-xs font-semibold text-white", getAvatarColor(ps.FULL_NAME))}
                          >
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium text-sm truncate">{ps.FULL_NAME}</span>
                          <span className="text-xs text-muted-foreground">{ps.EMPLOYEE_NUMBER}</span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Attendance */}
                    <TableCell className="text-center text-sm">{summary.workingDays ?? "—"}</TableCell>
                    <TableCell className="text-center">
                      <span className="text-sm text-green-600 font-medium">{summary.presentDays ?? "—"}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={cn("text-sm font-medium", (summary.absentDays ?? 0) > 0 ? "text-red-500" : "text-muted-foreground")}>
                        {summary.absentDays ?? "—"}
                      </span>
                    </TableCell>

                    {/* Financials */}
                    <TableCell className="text-right font-mono text-sm">
                      {fmt(ps.GROSS)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-red-500">
                      {ps.DEDUCTIONS > 0 ? `- ${fmt(ps.DEDUCTIONS)}` : "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-semibold text-green-600">
                      {fmt(ps.NET)}
                    </TableCell>

                    {/* Details */}
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPayslip(ps);
                        }}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <PayslipBreakdownDialog
        open={!!selectedPayslip}
        onOpenChange={(v) => !v && setSelectedPayslip(null)}
        payslip={selectedPayslip}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE HEADER
// ─────────────────────────────────────────────────────────────────────────────

function PageHeader({ run, onRefetch, isFetching }) {
  return (
    <div className="bg-card rounded-md shadow-sm p-4 mb-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-lg md:text-2xl font-semibold tracking-tight">
            Salary Sheet {run ? `— ${fmtMonth(run.RUN_MONTH)}` : ""}
          </h1>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild><Link to="/">Dashboard</Link></BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild><Link to="/payroll/runs">Payroll Runs</Link></BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Salary Sheet</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 gap-1.5" asChild>
            <Link to="/payroll/runs">
              <ArrowLeft className="h-4 w-4" />
              Back to Runs
            </Link>
          </Button>
          {onRefetch && (
            <Button variant="outline" size="icon" onClick={onRefetch} disabled={isFetching}>
              <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}