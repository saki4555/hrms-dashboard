import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { UserCheck } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Spinner } from "@/components/ui/spinner";
import { DatePicker } from "@/components/DatePicker";

import { useReinstateEmployee } from "../core-hr.queries";

// ── Schema ────────────────────────────────────────────────────────────────────

const schema = z.object({
  EFFECTIVE_DATE: z.string().min(1, "Effective date is required"),
  REMARKS:        z.string().max(500).optional(),
});

// ── Component ─────────────────────────────────────────────────────────────────

export default function ReinstateDialog({ open, onOpenChange, employee, showConfirmation }) {
  const reinstateMutation = useReinstateEmployee();

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      EFFECTIVE_DATE: "",
      REMARKS:        "",
    },
  });

  const { formState: { isDirty } } = form;

  // Reset on open
  useEffect(() => {
    if (open) {
      form.reset({
        EFFECTIVE_DATE: format(new Date(), "yyyy-MM-dd"),
        REMARKS:        "",
      });
    }
  }, [open]);

  const onSubmit = async (data) => {
    try {
      await reinstateMutation.mutateAsync({
        personId: employee.PERSON_ID,
        data: {
          EFFECTIVE_DATE: data.EFFECTIVE_DATE,
          REMARKS:        data.REMARKS || null,
          CHANGED_BY:     "admin", // TODO: replace with logged-in user
        },
      });
      toast.success("Employee reinstated successfully!");
      onOpenChange(false);
    } catch (err) {
      toast.error(err?.message || "Failed to reinstate employee. Please try again.");
    }
  };

  const handleCancel = async () => {
    if (isDirty && showConfirmation) {
      const confirmed = await showConfirmation({
        title: "Discard changes?",
        description: "You have unsaved changes. Are you sure you want to close?",
        confirmText: "Discard",
        cancelText: "Keep Editing",
        variant: "destructive",
      });
      if (!confirmed) return;
    }
    form.reset();
    onOpenChange(false);
  };

  const isSubmitting = reinstateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleCancel(); }}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <UserCheck className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <DialogTitle>Reinstate Employee</DialogTitle>
              <DialogDescription>
                {employee
                  ? `${employee.FIRST_NAME} ${employee.LAST_NAME} (${employee.EMP_NO})`
                  : "Reactivate a previously ended employment"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <div className="space-y-4">

            {/* Effective Date */}
            <FormField
              control={form.control}
              name="EFFECTIVE_DATE"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reinstate Date <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <DatePicker
                      className="w-full"
                      placeholder="Select date"
                      disabled={isSubmitting}
                      value={field.value ? new Date(field.value) : undefined}
                      onChange={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Remarks */}
            <FormField
              control={form.control}
              name="REMARKS"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Remarks</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Reason for reinstatement..."
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

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting}>
                {isSubmitting
                  ? <><Spinner className="mr-2 h-4 w-4" />Reinstating...</>
                  : "Confirm Reinstate"
                }
              </Button>
            </DialogFooter>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}