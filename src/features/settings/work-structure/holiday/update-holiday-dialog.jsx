import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { format } from "date-fns";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarDays } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { DatePicker } from "@/components/DatePicker";
import { useUpdateHoliday } from "./queries";
import { useHrLocations } from "../locations/queries";
import { useHolidayTypes } from "../holiday-type/queries";
import { useAuthV2 } from "@/features/authentication-v2/use-auth-v2";

const formSchema = z.object({
  locationId: z.string().min(1, "Location is required"),
  tdate: z.string().min(1, "Holiday date is required"),
  holidayTypeId: z.string().min(1, "Holiday type is required"),
  description: z
    .string()
    .max(100, "Description cannot exceed 100 characters")
    .optional(),
});

export default function UpdateHolidayDialog({ open, onOpenChange, showConfirmation, holiday }) {
  const updateHolidayMutation = useUpdateHoliday();
  const { data: locations = [], isLoading: locationsLoading } = useHrLocations();
  const { data: holidayTypes = [], isLoading: typesLoading } = useHolidayTypes();
  const {user} = useAuthV2();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      locationId: "",
      tdate: "",
      holidayTypeId: "",
      description: "",
    },
  });

  const { formState: { isDirty } } = form;

  // Populate form when holiday data is available
  useEffect(() => {
    if (holiday) {
      form.reset({
        locationId: holiday.LOCATION_ID ? String(holiday.LOCATION_ID) : "",
        tdate: holiday.TDATE ? format(new Date(holiday.TDATE), "yyyy-MM-dd") : "",
        holidayTypeId: holiday.HOLIDAY_TYPE_ID ? String(holiday.HOLIDAY_TYPE_ID) : "",
        description: holiday.DESCRIPTION || "",
      });
    }
  }, [holiday, form]);

  const onSubmit = async (data) => {
    if (!holiday?.ID) {
      toast.error("Holiday ID is missing");
      return;
    }

    try {
      const backendData = {
        LOCATION_ID: Number(data.locationId),
        TDATE: data.tdate,
        HOLIDAY_TYPE_ID: Number(data.holidayTypeId),
        DESCRIPTION: data.description || null,
         UPDATED_BY: user?.id ?? null,
      };

      await updateHolidayMutation.mutateAsync({ id: holiday.ID, data: backendData });
      toast.success("Holiday updated successfully!");
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(error?.message || "Failed to update holiday. Please try again.");
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

  const isSubmitting = updateHolidayMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleCancel(); }}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <CalendarDays className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Update Holiday</DialogTitle>
              <DialogDescription>
                Edit holiday details for "{holiday?.DESCRIPTION || formatDate(holiday?.TDATE)}"
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4">

              {/* Location */}
              <FormField
                control={form.control}
                name="locationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Location <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select
                      disabled={locationsLoading || isSubmitting}
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              locationsLoading ? "Loading locations..." : "Select location"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {locations.map((loc) => (
                          <SelectItem key={loc.ID} value={String(loc.ID)}>
                            {loc.LOCATION_NAME}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Holiday Type */}
              <FormField
                control={form.control}
                name="holidayTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Holiday Type <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select
                      disabled={typesLoading || isSubmitting}
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              typesLoading ? "Loading types..." : "Select holiday type"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {holidayTypes.map((type) => (
                          <SelectItem key={type.ID} value={String(type.ID)}>
                            {type.NAME}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Holiday Date */}
              <FormField
                control={form.control}
                name="tdate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Holiday Date <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <DatePicker
                        className="w-full"
                        placeholder="Select holiday date"
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

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. National Independence Day"
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
              <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Updating...
                  </>
                ) : (
                  "Update Holiday"
                )}
              </Button>
            </DialogFooter>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  try {
    return format(new Date(dateStr), "MMM dd, yyyy");
  } catch {
    return "";
  }
}