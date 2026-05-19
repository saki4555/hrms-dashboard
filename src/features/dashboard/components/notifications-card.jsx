// src/features/dashboard/components/notifications-card.jsx
import { Link } from "react-router";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, BellOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { PATHS } from "@/config/paths";

function relativeTime(dateVal) {
  try {
    return formatDistanceToNow(new Date(dateVal), { addSuffix: true });
  } catch {
    return "";
  }
}

export default function NotificationsCard({ notifications = [] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Recent Notifications
        </CardTitle>
        <Bell className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="pt-1">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-muted-foreground gap-2">
            <BellOff className="h-6 w-6" />
            <p className="text-sm">No new notifications</p>
          </div>
        ) : (
          <ul className="space-y-1">
            {notifications.map((n) => (
              <li
                key={n.ID}
                className={cn(
                  "flex items-start justify-between gap-3 rounded-md px-2 py-2 text-sm",
                  n.STATUS === 0 && "bg-muted/50",
                )}
              >
                <p className="flex-1 truncate text-foreground/80 leading-snug">
                  {n.NOTIFICATION_DETAILS || "—"}
                </p>
                <span className="shrink-0 text-xs text-muted-foreground whitespace-nowrap">
                  {relativeTime(n.CREATED_DATE)}
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-3 pt-3 border-t">
          <Link
            to={PATHS.COMMUNICATION.NOTIFICATIONS}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            View all notifications →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}