import { format } from "date-fns";
import { ArrowDown, ArrowUp, MapPin, Clock, Monitor, Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { useAttendanceDetail } from "./queries";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDateTime = (dt) => {
  if (!dt) return "—";
  try { return format(new Date(dt), "HH:mm:ss"); } catch { return "—"; }
};

const fmtDate = (dt) => {
  if (!dt) return "—";
  try { return format(new Date(dt), "dd MMM yyyy"); } catch { return "—"; }
};

export default function AttendanceDetailDialog({ open, onOpenChange, employeeId, date, employeeName }) {
  const { data: logs = [], isLoading, isError } = useAttendanceDetail(
    open ? employeeId : null,
    open ? date       : null
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Punch Timeline</DialogTitle>
              <DialogDescription>
                {employeeName} — {fmtDate(date)}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[420px] pr-3">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Spinner className="h-8 w-8" />
              <p className="text-sm text-muted-foreground">Loading punch records...</p>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-destructive">
              <p className="text-sm">Failed to load punch records.</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
              <Clock className="h-10 w-10 opacity-30" />
              <p className="text-sm">No punch records found for this date.</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline vertical line */}
              <div className="absolute left-[19px] top-2 bottom-2 w-px bg-border" />

              <div className="space-y-3">
                {logs.map((log, idx) => {
                  const isIn      = log.AM_TYPE_IN_OUT === 0;
                  const isFirst   = idx === 0;
                  const isLast    = idx === logs.length - 1;

                  return (
                    <div key={idx} className="flex gap-4 items-start relative">
                      {/* Timeline dot */}
                      <div className={cn(
                        "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2",
                        isIn
                          ? "bg-green-500/10 border-green-500 text-green-600"
                          : "bg-red-500/10 border-red-500 text-red-500"
                      )}>
                        {isIn
                          ? <ArrowDown className="h-4 w-4" />
                          : <ArrowUp   className="h-4 w-4" />}
                      </div>

                      {/* Content */}
                      <div className={cn(
                        "flex-1 rounded-lg border p-3 space-y-1.5",
                        isIn ? "bg-green-500/5 border-green-500/20" : "bg-red-500/5 border-red-500/20"
                      )}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs font-semibold",
                                isIn
                                  ? "border-green-500/30 text-green-600"
                                  : "border-red-500/30 text-red-500"
                              )}
                            >
                              {log.PUNCH_LABEL ?? (isIn ? "IN" : "OUT")}
                            </Badge>
                            <span className="text-sm font-semibold">
                              {fmtDateTime(log.AM_TIME_IN_OUT)}
                            </span>
                          </div>
                          {/* First/Last markers */}
                          {(isFirst || isLast) && (
                            <span className="text-xs text-muted-foreground font-medium">
                              {isFirst ? "First Punch" : "Last Punch"}
                            </span>
                          )}
                        </div>

                        {/* Meta row */}
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          {log.AM_MAC_ID && (
                            <span className="flex items-center gap-1">
                              <Monitor className="h-3 w-3" />
                              {log.AM_MAC_ID}
                            </span>
                          )}
                          {log.LOCATION_NAME && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {log.LOCATION_NAME}
                            </span>
                          )}
                          {log.AM_LAT_IN_OUT && log.AM_LON_IN_OUT && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 opacity-50" />
                              {Number(log.AM_LAT_IN_OUT).toFixed(4)},
                              {Number(log.AM_LON_IN_OUT).toFixed(4)}
                            </span>
                          )}
                        </div>

                        {/* Processed status */}
                        <div className="flex items-center gap-1">
                          <span className={cn(
                            "inline-flex items-center gap-1 text-xs",
                            log.PROCESS_STATUS === "Y"
                              ? "text-emerald-600"
                              : "text-amber-500"
                          )}>
                            <span className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              log.PROCESS_STATUS === "Y" ? "bg-emerald-500" : "bg-amber-400"
                            )} />
                            {log.PROCESS_STATUS === "Y" ? "Processed" : "Pending"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </ScrollArea>

        {/* Summary footer */}
        {!isLoading && logs.length > 0 && (
          <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
            <span>{logs.length} total punch{logs.length !== 1 ? "es" : ""}</span>
            <span>
              {logs.filter((l) => l.AM_TYPE_IN_OUT === 0).length} IN ·{" "}
              {logs.filter((l) => l.AM_TYPE_IN_OUT === 1).length} OUT
            </span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}