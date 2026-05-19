// src/features/dashboard/components/payroll-status-card.jsx
import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet } from "lucide-react";
import { PATHS } from "@/config/paths";

const STATUS_VARIANT = {
  DRAFT:     { variant: "secondary", label: "Draft"     },
  PROCESSED: { variant: "outline",   label: "Processed" },
  APPROVED:  { variant: "default",   label: "Approved"  },
};

function formatCurrency(amount) {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function PayrollStatusCard({ payrollRun }) {
  const statusConfig =
    payrollRun?.status
      ? (STATUS_VARIANT[payrollRun.status] ?? { variant: "secondary", label: payrollRun.status })
      : null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Latest Payroll Run
        </CardTitle>
        <Wallet className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="pt-1">
        {!payrollRun ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No payroll run found
          </p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Run Month</span>
              <span className="text-sm font-medium">{payrollRun.runMonth ?? "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Status</span>
              {statusConfig && (
                <Badge variant={statusConfig.variant} className="text-xs">
                  {statusConfig.label}
                </Badge>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Gross</span>
              <span className="text-sm font-medium tabular-nums">
                {formatCurrency(payrollRun.totalGross)}
              </span>
            </div>
            <div className="flex items-center justify-between border-t pt-2">
              <span className="text-xs font-medium">Net Total</span>
              <span className="text-base font-bold tabular-nums">
                {formatCurrency(payrollRun.totalNet)}
              </span>
            </div>
          </div>
        )}

        <div className="mt-3 pt-3 border-t">
          <Link
            to={PATHS.PAYROLL.RUNS}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            View all payroll runs →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}