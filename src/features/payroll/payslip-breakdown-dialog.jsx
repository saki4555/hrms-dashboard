// src/features/payroll/payslip-breakdown-dialog.jsx
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  Wallet,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { getAvatarColor } from "@/lib/avatar-utils";

const fmt = (n) =>
  new Intl.NumberFormat("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n ?? 0);

export default function PayslipBreakdownDialog({ open, onOpenChange, payslip }) {
  if (!payslip) return null;

  const b          = payslip.BREAKDOWN;
  const summary    = b?.summary    ?? {};
  const earnings   = b?.earnings   ?? [];
  const deductions = b?.deductions ?? [];

  const initials = payslip.FULL_NAME
    ?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md w-full flex flex-col gap-0 p-0">

        {/* ── Header ── */}
        <SheetHeader className="px-6 py-5 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <div>
              <SheetTitle>Payslip Breakdown</SheetTitle>
              <SheetDescription>
                Earnings and deductions detail
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Employee info */}
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarImage
                src={`${import.meta.env.VITE_API_BASE_URL}/api/emp-images/person/${payslip.EMPLOYEE_ID}`}
              />
              <AvatarFallback
                className={cn("text-sm font-semibold text-white", getAvatarColor(payslip.FULL_NAME))}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold leading-tight">{payslip.FULL_NAME}</p>
              <p className="text-sm text-muted-foreground">{payslip.EMPLOYEE_NUMBER}</p>
            </div>
          </div>

          {/* Attendance summary */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Working Days", value: summary.workingDays ?? 0, icon: Calendar, color: "" },
              { label: "Present Days", value: summary.presentDays ?? 0, icon: Clock,    color: "text-green-600" },
              { label: "Absent Days",  value: summary.absentDays  ?? 0, icon: Clock,
                color: (summary.absentDays ?? 0) > 0 ? "text-red-500" : "text-muted-foreground" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-muted/50 rounded-lg p-3 text-center">
                <Icon className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                <p className={cn("text-xl font-bold", color)}>{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          <Separator />

          {/* Earnings */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm font-semibold text-green-600">Earnings</span>
            </div>
            <div className="space-y-2">
              {earnings.map((e) => (
                <div key={e.code} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{e.name}</span>
                  <span className="text-sm font-medium tabular-nums">৳ {fmt(e.amount)}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t">
              <span className="text-sm font-semibold">Gross Earnings</span>
              <span className="text-sm font-bold tabular-nums text-green-600">
                ৳ {fmt(summary.gross)}
              </span>
            </div>
          </div>

          {/* Deductions */}
          {deductions.length > 0 && (
            <>
              <Separator />
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-semibold text-red-500">Deductions</span>
                </div>
                <div className="space-y-2">
                  {deductions.map((d) => (
                    <div key={d.code} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{d.name}</span>
                      <span className="text-sm font-medium tabular-nums text-red-500">
                        - ৳ {fmt(d.amount)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                  <span className="text-sm font-semibold">Total Deductions</span>
                  <span className="text-sm font-bold tabular-nums text-red-500">
                    - ৳ {fmt(summary.totalDeductions)}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Net Pay footer — always visible ── */}
        <div className="px-6 py-4 border-t border-border shrink-0">
          <div className="flex items-center justify-between bg-muted/50 rounded-lg px-4 py-3">
            <span className="font-semibold">Net Pay</span>
            <span className="text-2xl font-bold tabular-nums text-green-600">
              ৳ {fmt(summary.net)}
            </span>
          </div>
        </div>

      </SheetContent>
    </Sheet>
  );
}