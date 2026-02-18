import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { addYears, format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { GraduationCap } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useUpdateGrade } from "./queries";
import { DatePicker } from "@/components/DatePicker";
import { Input } from "@/components/ui/input";


const formSchema = z
  .object({
    grade: z
      .string()
      .min(1, "Grade is required")
      .max(30, "Grade cannot exceed 30 characters"),
    effectiveStartDate: z.string().min(1, "Effective start date is required"),
    effectiveEndDate: z.string().min(1, "Effective end date is required"),
  })
  .refine(
    (data) =>
      new Date(data.effectiveEndDate) > new Date(data.effectiveStartDate),
    {
      message: "End date must be after start date",
      path: ["effectiveEndDate"],
    }
  );

export default function UpdateGradeDialog({
  open,
  onOpenChange,
  showConfirmation,
  grade,
}) {
  const updateGradeMutation = useUpdateGrade();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      grade: "",
      effectiveStartDate: "",
      effectiveEndDate: "",
    },
  });

  const {
    formState: { isDirty },
  } = form;

  // Populate form when grade data changes
  useEffect(() => {
    if (grade) {
      form.reset({
        grade: grade.GRADE || "",
        effectiveStartDate: grade.EFFECTIVE_START_DATE
          ? format(new Date(grade.EFFECTIVE_START_DATE), "yyyy-MM-dd")
          : "",
        effectiveEndDate: grade.EFFECTIVE_END_DATE
          ? format(new Date(grade.EFFECTIVE_END_DATE), "yyyy-MM-dd")
          : "",
      });
    }
  }, [grade, form]);

  // Auto-set end date to +100 years when start date changes
  // only if the user is actively changing it (isDirty guard)
  const startDate = form.watch("effectiveStartDate");

  useEffect(() => {
    if (startDate && isDirty) {
      const endDate = format(addYears(new Date(startDate), 100), "yyyy-MM-dd");
      form.setValue("effectiveEndDate", endDate, { shouldDirty: true });
    }
  }, [startDate]);

  const onSubmit = async (data) => {
    if (!grade?.ID) {
      toast.error("Grade ID is missing");
      return;
    }

    try {
      const backendData = {
        grade: data.grade,
        startDate: data.effectiveStartDate,
        endDate: data.effectiveEndDate,
      };

      await updateGradeMutation.mutateAsync({
        id: grade.ID,
        data: backendData,
      });

      toast.success("Grade updated successfully!");
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(error?.message || "Failed to update grade. Please try again.");
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

  const isSubmitting = updateGradeMutation.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) handleCancel();
      }}
    >
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Update Grade</DialogTitle>
              <DialogDescription>
                Edit grade details for "{grade?.GRADE}"
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4">

              {/* Grade Name */}
              <FormField
                control={form.control}
                name="grade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Grade <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Grade-1"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Dates - side by side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="effectiveStartDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Start Date <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <DatePicker
                          className="w-full"
                          placeholder="Select start date"
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

                <FormField
                  control={form.control}
                  name="effectiveEndDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        End Date <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <DatePicker
                          className="w-full"
                          placeholder="Select end date"
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
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={form.handleSubmit(onSubmit)}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Updating...
                  </>
                ) : (
                  "Update Grade"
                )}
              </Button>
            </DialogFooter>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}