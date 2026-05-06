import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { TrendingUp } from "lucide-react";

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

import { useProcessIncrement } from "../core-hr.queries";
import { usePositions } from "@/features/settings/work-structure/hr-position/queries";
import { useGrades } from "@/features/settings/work-structure/hr-grade/queries"; 

// ── Schema ────────────────────────────────────────────────────────────────────

const schema = z
  .object({
    ACTION:         z.enum(["INCREMENT", "PROMOTION"]),
    NEW_GRADE_ID:   z.string().optional(),
    NEW_POSITION_ID: z.string().optional(),
    EFFECTIVE_DATE: z.string().min(1, "Effective date is required"),
    REMARKS:        z.string().max(500).optional(),
  })
  .refine(
    (d) => d.NEW_GRADE_ID || d.NEW_POSITION_ID,
    { message: "Provide at least a new grade or new position", path: ["NEW_GRADE_ID"] }
  );

// ── Component ─────────────────────────────────────────────────────────────────

export default function IncrementDialog({ open, onOpenChange, employee, showConfirmation }) {
  const incrementMutation = useProcessIncrement();

  const { data: positions = [] } = usePositions();
  const { data: grades    = [] } = useGrades();

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      ACTION:          "INCREMENT",
      NEW_GRADE_ID:    "",
      NEW_POSITION_ID: "",
      EFFECTIVE_DATE:  "",
      REMARKS:         "",
    },
  });

  const { formState: { isDirty } } = form;

  // Reset on open
  useEffect(() => {
    if (open) {
      form.reset({
        ACTION:          "INCREMENT",
        NEW_GRADE_ID:    "",
        NEW_POSITION_ID: "",
        EFFECTIVE_DATE:  format(new Date(), "yyyy-MM-dd"),
        REMARKS:         "",
      });
    }
  }, [open]);

  const onSubmit = async (data) => {
    try {
      await incrementMutation.mutateAsync({
        personId: employee.PERSON_ID,
        data: {
          ACTION:          data.ACTION,
          NEW_GRADE_ID:    data.NEW_GRADE_ID    ? Number(data.NEW_GRADE_ID)    : null,
          NEW_POSITION_ID: data.NEW_POSITION_ID ? Number(data.NEW_POSITION_ID) : null,
          EFFECTIVE_DATE:  data.EFFECTIVE_DATE,
          REMARKS:         data.REMARKS || null,
          CHANGED_BY:      "admin", // TODO: replace with logged-in user
        },
      });
      toast.success(
        data.ACTION === "PROMOTION"
          ? "Employee promoted successfully!"
          : "Increment applied successfully!"
      );
      onOpenChange(false);
    } catch (err) {
      toast.error(err?.message || "Failed. Please try again.");
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

  const isSubmitting = incrementMutation.isPending;
  const action = form.watch("ACTION");

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleCancel(); }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Increment / Promotion</DialogTitle>
              <DialogDescription>
                {employee
                  ? `${employee.FIRST_NAME} ${employee.LAST_NAME} (${employee.EMP_NO})`
                  : "Update employee grade or position"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <div className="space-y-4">

            {/* Action Type */}
            <FormField
              control={form.control}
              name="ACTION"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Action <span className="text-destructive">*</span></FormLabel>
                  <Select disabled={isSubmitting} onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="INCREMENT">Increment (Grade Change)</SelectItem>
                      <SelectItem value="PROMOTION">Promotion (Position Change)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Grade + Position */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="NEW_GRADE_ID"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Grade</FormLabel>
                    <Select disabled={isSubmitting} onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {grades.map((g) => (
                          <SelectItem key={g.ID} value={String(g.ID)}>{g.GRADE}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="NEW_POSITION_ID"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Position</FormLabel>
                    <Select disabled={isSubmitting} onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select position" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {positions.map((p) => (
                          <SelectItem key={p.POSITION_ID} value={String(p.POSITION_ID)}>
                            {p.TITLE}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                      placeholder={action === "PROMOTION" ? "Reason for promotion..." : "Reason for increment..."}
                      className="resize-none"
                      rows={2}
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
                  ? <><Spinner className="mr-2 h-4 w-4" />Applying...</>
                  : action === "PROMOTION" ? "Confirm Promotion" : "Apply Increment"
                }
              </Button>
            </DialogFooter>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}