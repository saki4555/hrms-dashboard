import { useEffect, useState } from "react";
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

const getEndDateFromStart = (startDate) => {
  const endDate = new Date(startDate);
  endDate.setFullYear(endDate.getFullYear() + 100);
  return endDate;
};

// Zod schema matching database fields
const formSchema = z.object({
  personType: z.string().min(1, "Person Type name is required"),
  description: z.string().optional(),
  effectiveStartDate: z.date({
    required_error: "Start date is required",
  }),
  effectiveEndDate: z.date().optional().nullable(),
}).refine((data) => {
  if (data.effectiveStartDate && data.effectiveEndDate) {
    return data.effectiveEndDate > data.effectiveStartDate;
  }
  return true;
}, {
  message: "End date must be after start date",
  path: ["effectiveEndDate"],
});

export default function UpdatePersonTypeDialog({ 
  open, 
  onOpenChange, 
  showConfirmation, 
  personType 
}) {
  const [isMounted, setIsMounted] = useState(false);

  const updatePersonTypeMutation = useUpdatePersonType();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      personType: "",
      description: "",
      effectiveStartDate: null,
      effectiveEndDate: null,
    },
  });

  const { formState: { isDirty } } = form;

  // Populate form when personType changes
  useEffect(() => {
    if (personType) {
      form.reset({
        personType: personType.PERSON_TYPE || "",
        description: personType.DESCRIPTION || "",
        effectiveStartDate: personType.EFFECTIVE_START_DATE 
          ? new Date(personType.EFFECTIVE_START_DATE) 
          : null,
        effectiveEndDate: personType.EFFECTIVE_END_DATE 
          ? new Date(personType.EFFECTIVE_END_DATE) 
          : null,
      });
    }
  }, [personType, form]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  const onSubmit = async (data) => {
    if (!personType || !personType.PERSON_TYPE_ID) {
      toast.error("Person Type ID is missing");
      return;
    }

    try {
      // Prepare data for backend
      const backendData = {
        PERSON_TYPE: data.personType,
        DESCRIPTION: data.description || null,
        EFFECTIVE_START_DATE: data.effectiveStartDate?.toISOString().split('T')[0],
        EFFECTIVE_END_DATE: data.effectiveEndDate?.toISOString().split('T')[0],
      };

      console.log("Updating person type ID:", personType.PERSON_TYPE_ID);
      console.log("Sending to backend:", backendData);

      // Use the mutation hook
      await updatePersonTypeMutation.mutateAsync({
        id: personType.PERSON_TYPE_ID,
        data: backendData,
      });

      console.log("Person type updated successfully");
      toast.success("Person type updated successfully!");

      // Reset form and close dialog
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating person type:", error);
      toast.error(error?.message || "Failed to update person type. Please try again.");
    }
  };

  const handleCancel = async () => {
    if (isDirty && showConfirmation) {
      const confirmed = await showConfirmation({
        title: "Discard changes?",
        description: "You have unsaved changes. Are you sure you want to close without saving?",
        confirmText: "Discard",
        cancelText: "Keep Editing",
        variant: "destructive",
      });

      if (!confirmed) return;
    }

    form.reset();
    onOpenChange(false);
  };

  const handleStartDateChange = (date, field) => {
    field.onChange(date);
    
    // Automatically update end date to 100 years from the selected start date
    if (date) {
      const newEndDate = getEndDateFromStart(date);
      form.setValue("effectiveEndDate", newEndDate, { shouldValidate: true });
    }
  };

  const isSubmitting = updatePersonTypeMutation.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          handleCancel();
        }
      }}
    >
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <UserCog className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Update Person Type</DialogTitle>
              <DialogDescription>
                Edit person type category details
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <div className="space-y-5">
            {/* Display Person Type ID (Read-only) */}
            {personType && (
              <div className="bg-muted/50 p-3 rounded-md">
                <p className="text-sm text-muted-foreground">Person Type ID</p>
                <p className="font-medium">{personType.PERSON_TYPE_ID}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Person Type Name */}
              <FormField
                control={form.control}
                name="personType"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Person Type <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Full-Time Employee" 
                        disabled={isSubmitting}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Effective Start Date */}
              <FormField
                control={form.control}
                name="effectiveStartDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Effective Start Date <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value}
                        onChange={(date) => handleStartDateChange(date, field)}
                        placeholder="Select start date"
                        className="w-full"
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Effective End Date */}
              <FormField
                control={form.control}
                name="effectiveEndDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Effective End Date</FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select end date"
                        className="w-full"
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description - Full Width */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter description (optional)" 
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