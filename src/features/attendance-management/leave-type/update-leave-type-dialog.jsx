import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader,
  DialogFooter, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form, FormControl, FormField,
  FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { CalendarDays } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useUpdateLeaveType } from "./queries";

const formSchema = z.object({
  code: z.string().min(1, "Code is required").max(50, "Max 50 characters"),
  name: z.string().min(1, "Name is required").max(200, "Max 200 characters"),
  accrualPolicy: z.string().max(100).optional(),
  maxBalance: z.coerce
    .number({ invalid_type_error: "Must be a number" })
    .min(0, "Cannot be negative")
    .optional()
    .nullable(),
});

export default function UpdateLeaveTypeDialog({ open, onOpenChange, showConfirmation, leaveType }) {
  const updateMutation = useUpdateLeaveType();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
      name: "",
      accrualPolicy: "",
      maxBalance: "",
    },
  });

  const { formState: { isDirty } } = form;

  useEffect(() => {
    if (leaveType) {
      form.reset({
        code:          leaveType.CODE           || "",
        name:          leaveType.NAME           || "",
        accrualPolicy: leaveType.ACCRUAL_POLICY || "",
        maxBalance:    leaveType.MAX_BALANCE    ?? "",
      });
    }
  }, [leaveType]);

  const onSubmit = async (data) => {
    if (!leaveType?.LEAVE_TYPE_ID) return toast.error("Leave type ID is missing");
    try {
      await updateMutation.mutateAsync({
        id: leaveType.LEAVE_TYPE_ID,
        data: {
          CODE:           data.code,
          NAME:           data.name,
          ACCRUAL_POLICY: data.accrualPolicy || null,
          MAX_BALANCE:    data.maxBalance    || null,
        },
      });
      toast.success("Leave type updated successfully!");
      onOpenChange(false);
    } catch (err) {
      toast.error(err?.message || "Failed to update leave type.");
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

  const isSubmitting = updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleCancel(); }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <CalendarDays className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Update Leave Type</DialogTitle>
              <DialogDescription>
                Editing "{leaveType?.NAME || leaveType?.CODE}"
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <div className="space-y-4">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. AL" disabled={isSubmitting} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Annual Leave" disabled={isSubmitting} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="accrualPolicy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Accrual Policy</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Monthly" disabled={isSubmitting} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="maxBalance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Balance (days)</FormLabel>
                    <FormControl>
                      <Input
                        type="number" min={0} placeholder="e.g. 20"
                        disabled={isSubmitting} {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting}>
                {isSubmitting ? <><Spinner className="mr-2 h-4 w-4" />Updating...</> : "Update"}
              </Button>
            </DialogFooter>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}