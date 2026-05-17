// src/features/payroll/create-run-dialog.jsx
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { CalendarIcon, Plus } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";

import { useCreatePayrollRun } from "./queries";

const getMonthOptions = () => {
  const options = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    options.push({ value: format(d, "yyyy-MM"), label: format(d, "MMMM yyyy") });
  }
  return options;
};

const MONTH_OPTIONS = getMonthOptions();

const schema = z.object({
  runMonth: z.string().min(1, "Payroll month is required"),
  remarks:  z.string().max(500).optional(),
});

export default function CreateRunDialog({ open, onOpenChange, showConfirmation }) {
  const { mutate: createRun, isPending } = useCreatePayrollRun();

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { runMonth: MONTH_OPTIONS[0]?.value ?? "", remarks: "" },
  });

  const { formState: { isDirty } } = form;

  useEffect(() => {
    if (open) {
      form.reset({ runMonth: MONTH_OPTIONS[0]?.value ?? "", remarks: "" });
    }
  }, [open]);

  const handleCancel = async () => {
    if (isDirty && showConfirmation) {
      const confirmed = await showConfirmation({
        title:       "Discard changes?",
        description: "You have unsaved changes. Are you sure you want to close without saving?",
        confirmText: "Discard",
        cancelText:  "Keep Editing",
        variant:     "destructive",
      });
      if (!confirmed) return;
    }
    form.reset();
    onOpenChange(false);
  };

  const onSubmit = (data) => {
    createRun(
      { run_month: data.runMonth, remarks: data.remarks?.trim() || undefined },
      {
        onSuccess: () => {
          toast.success(`Payroll run for ${data.runMonth} created successfully.`);
          form.reset();
          onOpenChange(false);
        },
        onError: (err) => toast.error(err.message),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleCancel(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-muted-foreground" />
            New Payroll Run
          </DialogTitle>
          <DialogDescription>
            Create a payroll run for a specific month. You can process it after creation.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">

            <FormField control={form.control} name="runMonth" render={({ field }) => (
              <FormItem>
                <FormLabel>Payroll Month <span className="text-destructive">*</span></FormLabel>
                <Select disabled={isPending} onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Select month" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {MONTH_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="remarks" render={({ field }) => (
              <FormItem>
                <FormLabel>Remarks (optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="e.g. Regular monthly payroll"
                    rows={3}
                    disabled={isPending}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? <><Spinner className="mr-2 h-4 w-4" /> Creating...</>
                  : <><Plus className="mr-2 h-4 w-4" /> Create Run</>}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}