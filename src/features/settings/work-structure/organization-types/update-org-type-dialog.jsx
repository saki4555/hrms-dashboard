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
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Building2 } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useUpdateOrgType } from "./queries";
import { DatePicker } from "@/components/DatePicker";

const formSchema = z
  .object({
    orgType: z
      .string()
      .min(1, "Organization type is required")
      .max(100, "Organization type cannot exceed 100 characters"),
    effectiveStartDate: z.string().min(1, "Effective start date is required"),
    effectiveEndDate: z.string().min(1, "Effective end date is required"),
  })
  .refine(
    (data) =>
      new Date(data.effectiveEndDate) > new Date(data.effectiveStartDate),
    {
      message: "End date must be after start date",
      path: ["effectiveEndDate"],
    },
  );

export default function UpdateOrgTypeDialog({
  open,
  onOpenChange,
  showConfirmation,
  orgType,
}) {
  const updateOrgTypeMutation = useUpdateOrgType();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      orgType: "",
      effectiveStartDate: "",
      effectiveEndDate: "",
    },
  });

  const { formState: { isDirty } } = form;

  // Populate form when orgType data changes
  useEffect(() => {
    if (orgType) {
      form.reset({
        orgType: orgType.ORG_TYPE || "",
        effectiveStartDate: orgType.EFFECTIVE_START_DATE
          ? format(new Date(orgType.EFFECTIVE_START_DATE), "yyyy-MM-dd")
          : "",
        effectiveEndDate: orgType.EFFECTIVE_END_DATE
          ? format(new Date(orgType.EFFECTIVE_END_DATE), "yyyy-MM-dd")
          : "",
      });
    }
  }, [orgType]);

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
    if (!orgType?.ID) {
      toast.error("Organization type ID is missing");
      return;
    }

    try {
      const backendData = {
        orgType: data.orgType,
        startDate: data.effectiveStartDate,
        endDate: data.effectiveEndDate,
      };

      await updateOrgTypeMutation.mutateAsync({
        id: orgType.ID,
        data: backendData,
      });

      toast.success("Organization type updated successfully!");
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(error?.message || "Failed to update organization type. Please try again.");
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

  const isSubmitting = updateOrgTypeMutation.isPending;

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
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Update Organization Type</DialogTitle>
              <DialogDescription>
                Edit organization type details for "{orgType?.ORG_TYPE}"
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4">
              {/* Org Type Name */}
              <FormField
                control={form.control}
                name="orgType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Organization Type <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Department"
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
                  "Update Organization Type"
                )}
              </Button>
            </DialogFooter>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}