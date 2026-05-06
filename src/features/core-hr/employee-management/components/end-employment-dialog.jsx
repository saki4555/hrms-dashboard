import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { UserX } from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { DatePicker } from "@/components/DatePicker";

import { useEndEmployment } from "../core-hr.queries";

// ── Schema ────────────────────────────────────────────────────────────────────

const schema = z.object({
  TYPE:           z.enum(["RESIGNATION", "TERMINATION", "RETIREMENT"], {
    required_error: "Please select an employment end type",
  }),
  EFFECTIVE_DATE: z.string().min(1, "Effective date is required"),
  REMARKS:        z.string().max(500).optional(),
});

// ── Component ─────────────────────────────────────────────────────────────────

export default function EndEmploymentDialog({ open, onOpenChange, employee, showConfirmation }) {
  const endEmploymentMutation = useEndEmployment();

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      TYPE:           "",
      EFFECTIVE_DATE: "",
      REMARKS:        "",
    },
  });

  const { formState: { isDirty } } = form;

  // Reset on open
  useEffect(() => {
    if (open) {
      form.reset({
        TYPE:           "",
        EFFECTIVE_DATE: format(new Date(), "yyyy-MM-dd"),
        REMARKS:        "",
      });
    }
  }, [open]);

  const onSubmit = async (data) => {
    // Extra confirmation — this is a destructive action
    if (showConfirmation) {
      const confirmed = await showConfirmation({
        title: `Confirm ${data.TYPE.charAt(0) + data.TYPE.slice(1).toLowerCase()}?`,
        description: `This will end employment for ${employee?.FIRST_NAME} ${employee?.LAST_NAME} (${employee?.EMP_NO}). This action cannot be undone from the list.`,
        confirmText: "Yes, Proceed",
        cancelText: "Cancel",
        variant: "destructive",
      });
      if (!confirmed) return;
    }

    try {
      await endEmploymentMutation.mutateAsync({
        personId: employee.PERSON_ID,
        data: {
          TYPE:           data.TYPE,
          EFFECTIVE_DATE: data.EFFECTIVE_DATE,
          REMARKS:        data.REMARKS || null,
          CHANGED_BY:     "admin", // TODO: replace with logged-in user
        },
      });
      toast.success(`Employment ended (${data.TYPE}) successfully.`);
      onOpenChange(false);
    } catch (err) {
      toast.error(err?.message || "Failed to end employment. Please try again.");
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

  const isSubmitting = endEmploymentMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleCancel(); }}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <UserX className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <DialogTitle>End Employment</DialogTitle>
              <DialogDescription>
                {employee
                  ? `${employee.FIRST_NAME} ${employee.LAST_NAME} (${employee.EMP_NO})`
                  : "Terminate, accept resignation, or retire an employee"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <div className="space-y-4">

            {/* Type */}
            <FormField
              control={form.control}
              name="TYPE"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type <span className="text-destructive">*</span></FormLabel>
                  <Select disabled={isSubmitting} onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="RESIGNATION">Resignation</SelectItem>
                      <SelectItem value="TERMINATION">Termination</SelectItem>
                      <SelectItem value="RETIREMENT">Retirement</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Effective Date */}
            <FormField
              control={form.control}
              name="EFFECTIVE_DATE"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Effective Date <span className="text-destructive">*</span></FormLabel>
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
                      placeholder="Reason or notes..."
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
              <Button
                variant="destructive"
                onClick={form.handleSubmit(onSubmit)}
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? <><Spinner className="mr-2 h-4 w-4" />Processing...</>
                  : "End Employment"
                }
              </Button>
            </DialogFooter>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}