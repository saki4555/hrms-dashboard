// src/features/attendance-management/attendance-correction/add-correction-request-sheet.jsx
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { ClipboardEdit } from "lucide-react";
import { Spinner }    from "@/components/ui/spinner";
import { DatePicker } from "@/components/DatePicker";
import { useAuthV2 as useAuth } from "@/features/authentication-v2/use-auth-v2";
import { useCreateCorrection } from "./queries";

// ── Schema ────────────────────────────────────────────────────────────────────

const formSchema = z.object({
  correction_date:     z.string().min(1, "Correction date is required"),
  requested_in_time:   z.string().optional(),
  requested_out_time:  z.string().optional(),
  reason:              z.string().max(2000, "Reason cannot exceed 2000 characters").optional(),
}).refine(
  (data) => data.requested_in_time || data.requested_out_time,
  {
    message: "At least one of In Time or Out Time is required",
    path: ["requested_in_time"],
  }
);

// ── Component ─────────────────────────────────────────────────────────────────

export default function AddCorrectionRequestSheet({
  open,
  onOpenChange,
  showConfirmation,
}) {
  const { user }          = useAuth();
  const createMutation    = useCreateCorrection();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      correction_date:    "",
      requested_in_time:  "",
      requested_out_time: "",
      reason:             "",
    },
  });

  const { formState: { isDirty } } = form;

  // Reset on open
  useEffect(() => {
    if (open) {
      form.reset({
        correction_date:    "",
        requested_in_time:  "",
        requested_out_time: "",
        reason:             "",
      });
    }
  }, [open]);

  const onSubmit = async (data) => {
    const confirmed = await showConfirmation({
      title:       "Submit Correction Request?",
      description: `Submit attendance correction for ${data.correction_date}? Your supervisor will be notified.`,
      confirmText: "Yes, Submit",
      cancelText:  "Review Again",
      variant:     "default",
    });
    if (!confirmed) return;

    try {
      // Combine date + time strings into ISO timestamps
      const toTimestamp = (date, time) => {
        if (!date || !time) return null;
        return new Date(`${date}T${time}`).toISOString();
      };

      const payload = {
        person_id:           user?.employee_id,
        correction_date:     data.correction_date,
        requested_in_time:   toTimestamp(data.correction_date, data.requested_in_time),
        requested_out_time:  toTimestamp(data.correction_date, data.requested_out_time),
        reason:              data.reason || null,
        created_by:          user?.employee_id ?? null,
      };

      await createMutation.mutateAsync(payload);
      toast.success("Correction request submitted successfully!");
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(error?.message || "Failed to submit correction request.");
    }
  };

  const handleCancel = async () => {
    if (isDirty && showConfirmation) {
      const confirmed = await showConfirmation({
        title:       "Discard changes?",
        description: "You have unsaved changes. Are you sure you want to close?",
        confirmText: "Discard",
        cancelText:  "Keep Editing",
        variant:     "destructive",
      });
      if (!confirmed) return;
    }
    form.reset();
    onOpenChange(false);
  };

  const isSubmitting = createMutation.isPending;

  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) handleCancel(); }}>
      <SheetContent className="sm:max-w-lg w-full flex flex-col gap-0 p-0">

        {/* ── Header ───────────────────────────────────────────────────── */}
        <SheetHeader className="px-6 py-5 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <ClipboardEdit className="h-5 w-5 text-primary" />
            </div>
            <div>
              <SheetTitle>Attendance Correction Request</SheetTitle>
              <SheetDescription>
                Request a correction for a wrong or missing attendance record
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* ── Form ─────────────────────────────────────────────────────── */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

              {/* Correction Date */}
              <FormField
                control={form.control}
                name="correction_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Correction Date <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <DatePicker
                        className="w-full"
                        placeholder="Select the date to correct"
                        disabled={isSubmitting}
                        value={field.value ? new Date(field.value) : undefined}
                        onChange={(date) =>
                          field.onChange(date ? format(date, "yyyy-MM-dd") : "")
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Requested In Time + Out Time — same row */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="requested_in_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Requested In Time</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          disabled={isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="requested_out_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Requested Out Time</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          disabled={isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Helper text */}
              <p className="text-xs text-muted-foreground -mt-2">
                Fill in only the time(s) that need correction. Leave blank if that punch is correct.
              </p>

              {/* Reason */}
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Explain why the correction is needed (e.g. forgot to punch out, device error)"
                        className="resize-none"
                        rows={3}
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* ── Footer ───────────────────────────────────────────────── */}
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-border shrink-0">
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <><Spinner className="mr-2 h-4 w-4" />Submitting...</>
                ) : (
                  "Submit Request"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}