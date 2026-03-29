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
import { useCreateLeaveType } from "./queries";

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

export default function AddLeaveTypeDialog({ open, onOpenChange, showConfirmation }) {
  const createMutation = useCreateLeaveType();

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
    if (open) form.reset({ code: "", name: "", accrualPolicy: "", maxBalance: "" });
  }, [open]);

  const onSubmit = async (data) => {
    try {
      await createMutation.mutateAsync({
        CODE:           data.code,
        NAME:           data.name,
        ACCRUAL_POLICY: data.accrualPolicy || null,
        MAX_BALANCE:    data.maxBalance    || null,
        CREATED_BY:     "admin", // TODO: replace with logged-in user
      });
      toast.success("Leave type created successfully!");
      form.reset();
      onOpenChange(false);
    } catch (err) {
      toast.error(err?.message || "Failed to create leave type.");
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

  const isSubmitting = createMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleCancel(); }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <CalendarDays className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Add Leave Type</DialogTitle>
              <DialogDescription>Create a new leave type in the system</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <div className="space-y-4">

            {/* Code + Name */}
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

            {/* Accrual Policy + Max Balance */}
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
                {isSubmitting ? <><Spinner className="mr-2 h-4 w-4" />Creating...</> : "Save"}
              </Button>
            </DialogFooter>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}