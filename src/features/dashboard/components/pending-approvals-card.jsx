// src/features/dashboard/components/pending-approvals-card.jsx
import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Clock, CalendarX } from "lucide-react";
import { PATHS } from "@/config/paths";

const ITEMS = [
  {
    label: "Leave Requests",
    key:   "pendingLeaves",
    icon:  CalendarX,
    path:  PATHS.ATTENDANCE.LEAVE_REQUEST,
  },
  {
    label: "Late Applications",
    key:   "pendingLateApps",
    icon:  Clock,
    path:  PATHS.ATTENDANCE.LATE_APPLICATION,
  },
  {
    label: "Attendance Corrections",
    key:   "pendingCorrections",
    icon:  ClipboardList,
    path:  PATHS.ATTENDANCE.ATTENDANCE_CORRECTION,
  },
];

export default function PendingApprovalsCard({
  pendingLeaves      = 0,
  pendingLateApps    = 0,
  pendingCorrections = 0,
}) {
  const counts = { pendingLeaves, pendingLateApps, pendingCorrections };
  const total  = pendingLeaves + pendingLateApps + pendingCorrections;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Pending Approvals
        </CardTitle>
        {total > 0 && (
          <Badge variant="warning" className="text-xs">
            {total} pending
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-2 pt-1">
        {ITEMS.map(({ label, key, icon: Icon, path }) => (
          <Link
            key={key}
            to={path}
            className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted transition-colors group"
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground group-hover:text-foreground">
              <Icon className="h-3.5 w-3.5 shrink-0" />
              {label}
            </div>
            <Badge
              variant={counts[key] > 0 ? "warning" : "secondary"}
              className="text-xs min-w-[1.5rem] text-center"
            >
              {counts[key]}
            </Badge>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}