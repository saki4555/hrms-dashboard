import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Clock } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useUpdateShift } from "./queries";

const formSchema = z
  .object({
    code: z
      .string()
      .min(1, "Code is required")
      .max(50, "Code cannot exceed 50 characters"),
    name: z.string().max(200, "Name cannot exceed 200 characters").optional(),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    graceInMinutes: z.coerce
      .number({ invalid_type_error: "Must be a number" })
      .int("Must be a whole number")
      .min(0, "Cannot be negative")
      .default(0),
    graceOutMinutes: z.coerce
      .number({ invalid_type_error: "Must be a number" })
      .int("Must be a whole number")
      .min(0, "Cannot be negative")
      .default(0),
    overnightFlag: z.boolean().default(false),
  })
  .refine(
    (data) => {
      if (data.overnightFlag) return true;
      return data.endTime > data.startTime;
    },
    {
      message: "End time must be after start time (or enable Overnight)",
      path: ["endTime"],
    }
  );

export default function UpdateShiftDialog({ open, onOpenChange, showConfirmation, shift }) {
  const updateShiftMutation = useUpdateShift();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
      name: "",
      startTime: "",
      endTime: "",
      graceInMinutes: 0,
      graceOutMinutes: 0,
      overnightFlag: false,
    },
  });

  const { formState: { isDirty } } = form;

  useEffect(() => {
    if (shift) {
      form.reset({
        code: shift.CODE || "",
        name: shift.NAME || "",
        startTime: shift.START_TIME || "",
        endTime: shift.END_TIME || "",
        graceInMinutes: shift.GRACE_IN_MINUTES ?? 0,
        graceOutMinutes: shift.GRACE_OUT_MINUTES ?? 0,
        overnightFlag: shift.OVERNIGHT_FLAG === 1 || shift.OVERNIGHT_FLAG === true,
      });
    }
  }, [shift, form]);

  const onSubmit = async (data) => {
    if (!shift?.SHIFT_ID) {
      toast.error("Shift ID is missing");
      return;
    }

    try {
      const backendData = {
        CODE: data.code,
        NAME: data.name || null,
        START_TIME: data.startTime,
        END_TIME: data.endTime,
        GRACE_IN_MINUTES: data.graceInMinutes,
        GRACE_OUT_MINUTES: data.graceOutMinutes,
        OVERNIGHT_FLAG: data.overnightFlag ? 1 : 0,
        UPDATED_BY: "admin", // TODO: replace with logged-in user
      };

      await updateShiftMutation.mutateAsync({ id: shift.SHIFT_ID, data: backendData });
      toast.success("Shift updated successfully!");
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(error?.message || "Failed to update shift. Please try again.");
    }
  };

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

  const isSubmitting = updateShiftMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleCancel(); }}>
      <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Update Shift</DialogTitle>
              <DialogDescription>
                Edit shift details for "{shift?.NAME || shift?.CODE}"
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4">

              {/* Code + Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Code <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. MORNING" disabled={isSubmitting} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Morning Shift" disabled={isSubmitting} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Start Time + End Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Start Time <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input type="time" disabled={isSubmitting} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        End Time <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input type="time" disabled={isSubmitting} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Grace In + Grace Out */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="graceInMinutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grace In (minutes)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} placeholder="0" disabled={isSubmitting} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="graceOutMinutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grace Out (minutes)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} placeholder="0" disabled={isSubmitting} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Overnight Flag */}
              <FormField
                control={form.control}
                name="overnightFlag"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <FormLabel className="text-base">Overnight Shift</FormLabel>
                      <FormDescription className="text-sm text-muted-foreground">
                        Enable if the shift spans across midnight
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Updating...
                  </>
                ) : (
                  "Update Shift"
                )}
              </Button>
            </DialogFooter>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}