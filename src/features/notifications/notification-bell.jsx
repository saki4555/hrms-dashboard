import { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import {
  Bell, Check, CheckCheck, X,
  Calendar, Clock, User, ChevronRight,
  Inbox,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getAvatarColor } from "@/lib/avatar-utils";

import {
  useNotificationsForSupervisor,
  useNotificationsForEmployee,
  useMarkAsRead,
  useMarkAllAsRead,
  useApproveLeave,
  useRejectLeave,
} from "./queries";

// ─── Time helper ──────────────────────────────────────────────────────────────
const timeAgo = (date) => {
  if (!date) return "";
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  } catch {
    return "";
  }
};

const formatDate = (d) => {
  if (!d) return "—";
  try { return format(new Date(d), "MMM d, yyyy"); } catch { return "—"; }
};

// ─── Leave Status Badge ───────────────────────────────────────────────────────
function LeaveStatusBadge({ status }) {
  const map = {
    PENDING:  { label: "Pending",  class: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
    APPROVED: { label: "Approved", class: "bg-green-500/10 text-green-600 border-green-500/20" },
    REJECTED: { label: "Rejected", class: "bg-red-500/10 text-red-600 border-red-500/20" },
  };
  const cfg = map[status] ?? { label: status, class: "" };
  return (
    <Badge variant="outline" className={cn("text-xs px-1.5 py-0", cfg.class)}>
      {cfg.label}
    </Badge>
  );
}

// ─── Single Notification Card ─────────────────────────────────────────────────
function NotificationCard({ notification, supervisorId, onMarkRead }) {
  const approveMutation = useApproveLeave();
  const rejectMutation  = useRejectLeave();

  const isUnread    = notification.STATUS === 0;
  const isPending   = notification.LEAVE_STATUS === "PENDING";
  const hasLeave    = !!notification.LEAVE_ID;

  const fullName = [notification.FIRST_NAME, notification.LAST_NAME]
    .filter(Boolean).join(" ");
  const initials = [notification.FIRST_NAME?.[0], notification.LAST_NAME?.[0]]
    .filter(Boolean).join("").toUpperCase();

  const handleApprove = async (e) => {
    e.stopPropagation();
    try {
      await approveMutation.mutateAsync({
        leaveId:        notification.LEAVE_ID,
        approverId:     supervisorId,
        notificationId: notification.ID,
      });
      toast.success("Leave approved successfully!");
    } catch (err) {
      toast.error(err?.message || "Failed to approve leave.");
    }
  };

  const handleReject = async (e) => {
    e.stopPropagation();
    try {
      await rejectMutation.mutateAsync({
        leaveId:        notification.LEAVE_ID,
        approverId:     supervisorId,
        notificationId: notification.ID,
        reason:         null,
      });
      toast.success("Leave rejected.");
    } catch (err) {
      toast.error(err?.message || "Failed to reject leave.");
    }
  };

  return (
    <div
      onClick={() => isUnread && onMarkRead(notification.ID)}
      className={cn(
        "relative flex gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
        isUnread
          ? "bg-primary/5 border-primary/15 hover:bg-primary/10"
          : "bg-card border-border/50 hover:bg-muted/40"
      )}
    >
      {/* Unread dot */}
      {isUnread && (
        <span className="absolute top-3 right-3 h-2 w-2 rounded-full bg-primary" />
      )}

      {/* Avatar */}
      <Avatar className="h-9 w-9 shrink-0 mt-0.5">
        <AvatarFallback className={cn("text-xs font-semibold text-white", getAvatarColor(fullName))}>
          {initials || <User className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0 space-y-1.5">
        {/* Notification text */}
        <p className={cn("text-sm leading-snug", isUnread ? "font-medium" : "text-muted-foreground")}>
          {notification.NOTIFICATION_DETAILS}
        </p>

        {/* Leave details */}
        {hasLeave && (
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(notification.START_DATE)} → {formatDate(notification.END_DATE)}
            </span>
            {notification.DAYS && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {notification.DAYS} {notification.DAYS === 1 ? "day" : "days"}
              </span>
            )}
            {notification.LEAVE_STATUS && (
              <LeaveStatusBadge status={notification.LEAVE_STATUS} />
            )}
          </div>
        )}

        {/* Approve / Reject buttons — only for pending leaves */}
        {hasLeave && isPending && (
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              className="h-7 px-3 text-xs bg-green-500 hover:bg-green-600 text-white border-0"
              onClick={handleApprove}
              disabled={approveMutation.isPending || rejectMutation.isPending}
            >
              {approveMutation.isPending
                ? <Spinner className="h-3 w-3" />
                : <><Check className="h-3 w-3 mr-1" />Approve</>}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-3 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={handleReject}
              disabled={approveMutation.isPending || rejectMutation.isPending}
            >
              {rejectMutation.isPending
                ? <Spinner className="h-3 w-3" />
                : <><X className="h-3 w-3 mr-1" />Reject</>}
            </Button>
          </div>
        )}

        {/* Time */}
        <p className="text-xs text-muted-foreground/60">
          {timeAgo(notification.CREATED_DATE)}
        </p>
      </div>
    </div>
  );
}

// ─── Employee Notification Card ───────────────────────────────────────────────
function EmployeeNotificationCard({ notification, onMarkRead }) {
  const isUnread = notification.STATUS === 0;
  const isApproved = notification.NOTIFICATION_DETAILS?.toLowerCase().includes("approved");
  const isRejected = notification.NOTIFICATION_DETAILS?.toLowerCase().includes("rejected");

  return (
    <div
      onClick={() => isUnread && onMarkRead(notification.ID)}
      className={cn(
        "relative flex gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
        isUnread
          ? "bg-primary/5 border-primary/15 hover:bg-primary/10"
          : "bg-card border-border/50 hover:bg-muted/40"
      )}
    >
      {isUnread && (
        <span className="absolute top-3 right-3 h-2 w-2 rounded-full bg-primary" />
      )}

      {/* Icon */}
      <div className={cn(
        "h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-white",
        isApproved ? "bg-green-500" : isRejected ? "bg-red-500" : "bg-primary"
      )}>
        {isApproved
          ? <Check className="h-4 w-4" />
          : isRejected
          ? <X className="h-4 w-4" />
          : <Bell className="h-4 w-4" />}
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <p className={cn("text-sm leading-snug", isUnread ? "font-medium" : "text-muted-foreground")}>
          {notification.NOTIFICATION_DETAILS}
        </p>
        <p className="text-xs text-muted-foreground/60">
          {timeAgo(notification.CREATED_DATE)}
        </p>
      </div>
    </div>
  );
}

// ─── Main Notification Bell ───────────────────────────────────────────────────

export default function NotificationBell({ userId, isSupervisor = true }) {
const [open, setOpen] = useState(false);


console.log("[NotificationBell] mode →", isSupervisor);
  const {
    data: supervisorNotifications = [],
    isLoading: supLoading,
    error: supError,
  } = useNotificationsForSupervisor(isSupervisor ? userId : null);

  const {
    data: employeeNotifications = [],
    isLoading: empLoading,
    error: empError,
  } = useNotificationsForEmployee(!isSupervisor ? userId : null);



  console.log("[NotificationBell] employee query →", {
    enabled: !isSupervisor,
    queryUserId: !isSupervisor ? userId : null,
    isLoading: empLoading,
    error: empError?.message,
    count: employeeNotifications.length,
    data: employeeNotifications,
  });

  const notifications = isSupervisor
    ? supervisorNotifications
    : employeeNotifications;



  const isLoading = isSupervisor ? supLoading : empLoading;

  const unreadCount = notifications.filter((n) => n.STATUS === 0).length;

  const markAsReadMutation  = useMarkAsRead();
  const markAllMutation     = useMarkAllAsRead();

  const handleMarkRead = async (id) => {
    try {
      await markAsReadMutation.mutateAsync(id);
    } catch {
      // silent
    }
  };

  const handleMarkAllRead = async () => {
    if (!isSupervisor) return;
    try {
      await markAllMutation.mutateAsync(userId);
      toast.success("All notifications marked as read");
    } catch (err) {
      toast.error(err?.message || "Failed to mark all as read.");
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative h-9 w-9">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className={cn(
              "absolute -top-1.5 -right-1.5 flex items-center justify-center",
              "min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground",
              "text-[10px] font-bold leading-none px-1 shadow-sm"
            )}>
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-[380px] p-0 shadow-xl"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                {unreadCount} new
              </Badge>
            )}
          </div>
          {unreadCount > 0 && isSupervisor && (
            <Button
              variant="ghost" size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
              onClick={handleMarkAllRead}
              disabled={markAllMutation.isPending}
            >
              {markAllMutation.isPending
                ? <Spinner className="h-3 w-3" />
                : <CheckCheck className="h-3 w-3" />}
              Mark all read
            </Button>
          )}
        </div>

        {/* Body */}
        <ScrollArea className="h-[420px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Spinner className="h-8 w-8" />
              <p className="text-sm text-muted-foreground">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <Inbox className="h-6 w-6" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">All caught up!</p>
                <p className="text-xs text-muted-foreground/70 mt-0.5">No notifications yet</p>
              </div>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {/* Unread section */}
              {notifications.some((n) => n.STATUS === 0) && (
                <>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">
                    New
                  </p>
                  {notifications
                    .filter((n) => n.STATUS === 0)
                    .map((n) =>
                      isSupervisor ? (
                        <NotificationCard
                          key={n.ID}
                          notification={n}
                          supervisorId={userId}
                          onMarkRead={handleMarkRead}
                        />
                      ) : (
                        <EmployeeNotificationCard
                          key={n.ID}
                          notification={n}
                          onMarkRead={handleMarkRead}
                        />
                      )
                    )}
                  {notifications.some((n) => n.STATUS === 1) && (
                    <Separator className="my-2" />
                  )}
                </>
              )}

              {/* Read section */}
              {notifications.some((n) => n.STATUS === 1) && (
                <>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">
                    Earlier
                  </p>
                  {notifications
                    .filter((n) => n.STATUS === 1)
                    .map((n) =>
                      isSupervisor ? (
                        <NotificationCard
                          key={n.ID}
                          notification={n}
                          supervisorId={userId}
                          onMarkRead={handleMarkRead}
                        />
                      ) : (
                        <EmployeeNotificationCard
                          key={n.ID}
                          notification={n}
                          onMarkRead={handleMarkRead}
                        />
                      )
                    )}
                </>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-2">
              <Button
                variant="ghost" size="sm"
                className="w-full text-xs text-muted-foreground gap-1 h-8"
                onClick={() => setOpen(false)}
              >
                View all notifications
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}