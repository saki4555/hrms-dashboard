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
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { UserCog } from "lucide-react";
import { DatePicker } from "@/components/DatePicker";
import { Spinner } from "@/components/ui/spinner";
import { useUpdatePersonType } from "./queries";

const formSchema = z
  .object({
    personType: z.string().min(1, "Person Type name is required"),
    description: z.string().optional().or(z.literal("")),
    effectiveStartDate: z.string().min(1, "Start date is required"),
    effectiveEndDate: z.string().min(1, "End date is required"),
  })
  .refine(
    (data) =>
      new Date(data.effectiveEndDate) > new Date(data.effectiveStartDate),
    {
      message: "End date must be after start date",
      path: ["effectiveEndDate"],
    },
  );

export default function UpdatePersonTypeDialog({
  open,
  onOpenChange,
  showConfirmation,
  personType,
}) {
  const updatePersonTypeMutation = useUpdatePersonType();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      personType: "",
      description: "",
      effectiveStartDate: "",
      effectiveEndDate: "",
    },
  });

  const {
    formState: { isDirty },
  } = form;

  // Populate form when personType data changes
  useEffect(() => {
    if (personType) {
      form.reset({
        personType: personType.PERSON_TYPE || "",
        description: personType.DESCRIPTION || "",
        effectiveStartDate: personType.EFFECTIVE_START_DATE
          ? format(new Date(personType.EFFECTIVE_START_DATE), "yyyy-MM-dd")
          : "",
        effectiveEndDate: personType.EFFECTIVE_END_DATE
          ? format(new Date(personType.EFFECTIVE_END_DATE), "yyyy-MM-dd")
          : "",
      });
    }
  }, [personType, form]);

  // Auto-set end date to +100 years when start date changes
  // isDirty guard prevents overwriting existing end date on initial population
  const startDate = form.watch("effectiveStartDate");

  useEffect(() => {
    if (startDate && isDirty) {
      const endDate = format(addYears(new Date(startDate), 100), "yyyy-MM-dd");
      form.setValue("effectiveEndDate", endDate, { shouldDirty: true });
    }
  }, [startDate]);

  const onSubmit = async (data) => {
    if (!personType?.PERSON_TYPE_ID) {
      toast.error("Person Type ID is missing");
      return;
    }

    try {
      const backendData = {
        PERSON_TYPE: data.personType,
        DESCRIPTION: data.description || null,
        EFFECTIVE_START_DATE: data.effectiveStartDate,
        EFFECTIVE_END_DATE: data.effectiveEndDate,
      };

      await updatePersonTypeMutation.mutateAsync({
        id: personType.PERSON_TYPE_ID,
        data: backendData,
      });

      toast.success("Person type updated successfully!");
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error?.message || "Failed to update person type. Please try again.",
      );
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

  const isSubmitting = updatePersonTypeMutation.isPending;

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
              <UserCog className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Update Person Type</DialogTitle>
              <DialogDescription>
                Edit details for "{personType?.PERSON_TYPE}"
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <div className="space-y-5">

            {/* Read-only ID badge */}
            {personType && (
              <div className="bg-muted/50 p-3 rounded-md">
                <p className="text-sm text-muted-foreground">Person Type ID</p>
                <p className="font-medium">{personType.PERSON_TYPE_ID}</p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4">

              {/* Person Type Name */}
              <FormField
                control={form.control}
                name="personType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Person Type <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Full-Time Employee"
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

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter description (optional)"
                        className="resize-none min-h-[100px]"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                  "Update Person Type"
                )}
              </Button>
            </DialogFooter>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}