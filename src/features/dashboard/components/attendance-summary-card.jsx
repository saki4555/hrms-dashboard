// src/features/dashboard/components/attendance-summary-card.jsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";

// variant: "today" (admin/supervisor) | "monthly" (employee)
export default function AttendanceSummaryCard({ data, variant = "today" }) {
  if (!data) return null;

  const stats =
    variant === "today"
      ? [
          { label: "Present",    value: data.PRESENT,    color: "text-green-600"  },
          { label: "Late",       value: data.LATE,        color: "text-yellow-600" },
          { label: "Absent",     value: data.ABSENT,      color: "text-red-600"    },
          { label: "On Leave",   value: data.ON_LEAVE,    color: "text-blue-600"   },
          { label: "Holiday",    value: data.HOLIDAY,     color: "text-gray-500"   },
          { label: "Weekly Off", value: data.WEEKLY_OFF,  color: "text-gray-500"   },
        ]
      : [
          { label: "Present",    value: data.PRESENT,       color: "text-green-600"  },
          { label: "Late",       value: data.LATE,          color: "text-yellow-600" },
          { label: "Absent",     value: data.ABSENT,        color: "text-red-600"    },
          { label: "On Leave",   value: data.ON_LEAVE,      color: "text-blue-600"   },
          { label: "Holiday",    value: data.HOLIDAY,       color: "text-gray-500"   },
          { label: "Weekly Off", value: data.WEEKLY_OFF,    color: "text-gray-500"   },
        ];

  const title =
    variant === "today" ? "Today's Attendance" : "My Attendance — This Month";

  const subtitle =
    variant === "today"
      ? `${data.TOTAL ?? 0} employees`
      : data.period
        ? `${data.period.from} – ${data.period.to}`
        : null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          {subtitle && (
            <span className="text-xs text-muted-foreground">{subtitle}</span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className={`text-xl font-bold ${s.color}`}>
                {s.value ?? 0}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {s.label}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4 pt-3 border-t text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {data.TOTAL_WORK_HOURS ?? 0} hrs worked
          </span>
          {variant === "today" && data.TOTAL_OVERTIME_HOURS > 0 && (
            <span>+{data.TOTAL_OVERTIME_HOURS} hrs OT</span>
          )}
          {variant === "monthly" && data.AVG_WORK_HOURS_PER_DAY != null && (
            <span>avg {data.AVG_WORK_HOURS_PER_DAY} hrs/day</span>
          )}
          {variant === "monthly" && data.WORKING_DAYS != null && (
            <span>{data.ATTENDED_DAYS}/{data.WORKING_DAYS} working days</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}