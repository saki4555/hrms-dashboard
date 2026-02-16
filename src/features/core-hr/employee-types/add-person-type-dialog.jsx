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
import { useCreatePersonType } from "./queries";

const getDefaultStartDate = () => new Date();
const getDefaultEndDate = () => {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 100);
  return date;
};

const getEndDateFromStart = (startDate) => {
  const endDate = new Date(startDate);
  endDate.setFullYear(endDate.getFullYear() + 100);
  return endDate;
};

// Zod schema matching database fields
const formSchema = z.object({
  personTypeId: z
    .string()
    .min(1, "Person Type ID is required")
    .refine((val) => {
      const num = parseInt(val);
      return !isNaN(num) && num > 0;
    }, "Person Type ID must be a positive number"),
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

export default function AddPersonTypeDialog({ open, onOpenChange, showConfirmation }) {
  const [isMounted, setIsMounted] = useState(false);

  const createPersonTypeMutation = useCreatePersonType();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      personTypeId: "",
      personType: "",
      description: "",
      effectiveStartDate: getDefaultStartDate(),
      effectiveEndDate: getDefaultEndDate(),
    },
  });

  const { formState: { isDirty } } = form;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  const onSubmit = async (data) => {
    try {
      // Prepare data for backend
      const backendData = {
        PERSON_TYPE_ID: parseInt(data.personTypeId),
        PERSON_TYPE: data.personType,
        DESCRIPTION: data.description || null,
        EFFECTIVE_START_DATE: data.effectiveStartDate?.toISOString().split('T')[0],
        EFFECTIVE_END_DATE: data.effectiveEndDate?.toISOString().split('T')[0],
      };

      console.log("Sending to backend:", backendData);

      await createPersonTypeMutation.mutateAsync(backendData);

      // Show success message
      toast.success("Person type created successfully!");

      // Reset form and close dialog
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating person type:", error);
      toast.error(error?.message || "Failed to create person type. Please try again.");
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
              <DialogTitle>Add New Person Type</DialogTitle>
              <DialogDescription>Create a new employee person type category</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Person Type ID */}
              <FormField
                control={form.control}
                name="personTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Person Type ID <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Enter person type ID" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Person Type Name */}
              <FormField
                control={form.control}
                name="personType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Person Type <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Full-Time Employee" 
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
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button 
                onClick={form.handleSubmit(onSubmit)}
                disabled={createPersonTypeMutation.isPending}
              >
                {createPersonTypeMutation.isPending ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Creating...
                  </>
                ) : (
                  "Save Person Type"
                )}
              </Button>
            </DialogFooter>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}