// src/features/attendance/manual-edit-dialog.jsx
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Pencil, ShieldAlert } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useManualAttendanceEdit } from "./queries";

// ─────────────────────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extract HH:mm string from a TIMESTAMP(6) WITH TIME ZONE value.
 * Oracle returns these as JS Date-parseable strings.
 */
const toHHmm = (timestamp) => {
  if (!timestamp) return "";
  try {
    const d = new Date(timestamp);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  } catch {
    return "";
  }
};

/**
 * Combine a yyyy-MM-dd date string with an HH:mm time string into an ISO timestamp.
 * Returns null if either is missing — null tells the backend to clear the punch (→ ABSENT).
 */
const buildISO = (dateStr, hhMm) => {
  if (!dateStr || !hhMm) return null;
  try {
    return new Date(`${dateStr}T${hhMm}`).toISOString();
  } catch {
    return null;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  SCHEMA
// ─────────────────────────────────────────────────────────────────────────────

const formSchema = z
  .object({
    in_time:  z.string().optional(),
    out_time: z.string().optional(),
  })
  .refine(
    (data) => {
      // Only validate ordering when both fields are filled in
      if (data.in_time && data.out_time) {
        return data.out_time > data.in_time;
      }
      return true;
    },
    {
      message: "Out time must be after in time",
      path: ["out_time"],
    },
  );

// ─────────────────────────────────────────────────────────────────────────────
//  COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function ManualEditDialog({
  open,
  onOpenChange,
  attendance,    // full HR_ATTENDANCE row — see shape in TODO
  showConfirmation,
}) {
  const mutation = useManualAttendanceEdit();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { in_time: "", out_time: "" },
  });

  const {
    formState: { isDirty },
  } = form;

  // Pre-populate from the selected row every time the dialog opens
  useEffect(() => {
    if (open && attendance) {
      form.reset({
        in_time:  toHHmm(attendance.IN_TIME),
        out_time: toHHmm(attendance.OUT_TIME),
      });
    }
  }, [open, attendance]);

  // ── Derived display values ─────────────────────────────────────────────────
  const fullName = attendance
    ? [attendance.FIRST_NAME, attendance.LAST_NAME].filter(Boolean).join(" ")
    : "";

  const attendanceDateISO = attendance?.ATTENDANCE_DATE
    ? format(new Date(attendance.ATTENDANCE_DATE), "yyyy-MM-dd")
    : "";

  const attendanceDateDisplay = attendance?.ATTENDANCE_DATE
    ? format(new Date(attendance.ATTENDANCE_DATE), "dd MMM yyyy")
    : "";

  // ── Submit ────────────────────────────────────────────────────────────────
  const onSubmit = async (data) => {
    if (!attendance) return;

    // Step 1: Show confirmation before firing the mutation
    if (showConfirmation) {
      const confirmed = await showConfirmation({
        title: "Edit Attendance Record?",
        description: `Manually edit attendance for ${fullName} on ${attendanceDateDisplay}? This will reprocess and reclassify the record. This action is logged.`,
        confirmText: "Confirm Edit",
        cancelText: "Cancel",
        variant: "destructive",
      });
      if (!confirmed) return;
    }

    // Step 2: Build ISO timestamps — null if field left empty (marks as absent)
    const inTimeISO  = buildISO(attendanceDateISO, data.in_time);
    const outTimeISO = buildISO(attendanceDateISO, data.out_time);

    // Step 3: Call mutation
    try {
      await mutation.mutateAsync({
        attendanceId: attendance.ATTENDANCE_ID,
        inTime:       inTimeISO,
        outTime:      outTimeISO,
      });
      toast.success("Attendance updated and reprocessed successfully.");
      onOpenChange(false);
    } catch (err) {
      toast.error(err?.message || "Failed to update attendance. Please try again.");
    }
  };

  // ── Cancel with unsaved-changes guard ─────────────────────────────────────
  const handleCancel = async () => {
    if (isDirty && showConfirmation) {
      const confirmed = await showConfirmation({
        title: "Discard changes?",
        description:
          "You have unsaved changes. Are you sure you want to close without saving?",
        confirmText: "Discard",
        cancelText: "Keep Editing",
        variant: "destructive",
      });
      if (!confirmed) return;
    }
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) handleCancel();
      }}
    >
      <DialogContent className="sm:max-w-[420px]">
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Pencil className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Edit Attendance</DialogTitle>
              <DialogDescription>
                {fullName}
                {attendanceDateDisplay ? ` · ${attendanceDateDisplay}` : ""}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* ── Audit trail warning — required by spec ───────────────────────── */}
        <Alert className="border-amber-500/40 bg-amber-500/10">
          <ShieldAlert className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-700 text-xs leading-relaxed">
            This action is restricted and will be logged in the audit trail.
          </AlertDescription>
        </Alert>

        {/* ── Form ─────────────────────────────────────────────────────────── */}
        <Form {...form}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* In Time */}
              <FormField
                control={form.control}
                name="in_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>In Time</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        disabled={mutation.isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Out Time */}
              <FormField
                control={form.control}
                name="out_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Out Time</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        disabled={mutation.isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <p className="text-xs text-muted-foreground">
              Clear both fields to mark as no-punch. The record will be
              automatically reprocessed and reclassified after saving.
            </p>

            {/* ── Footer ──────────────────────────────────────────────────── */}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={form.handleSubmit(onSubmit)}
                disabled={mutation.isPending}
              >
                {mutation.isPending ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}