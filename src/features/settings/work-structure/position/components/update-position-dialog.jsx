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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, Briefcase } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { DatePicker } from "@/components/DatePicker";
import { Spinner } from "@/components/ui/spinner";
import { useUpdatePosition } from "../queries";
import { useOrganizations } from "../../organization/queries";
import { usePositions } from "../../hr-position/queries";

const getEndDateFromStart = (startDate) => {
  const endDate = new Date(startDate);
  endDate.setFullYear(endDate.getFullYear() + 100);
  return endDate;
};

const formSchema = z
  .object({
    positionId: z.number({ required_error: "Position is required" }),
    orgId: z.number({ required_error: "Organization is required" }),
    fte: z
      .string({ required_error: "FTE is required" })
      .min(1, "FTE is required")
      .refine((val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num >= 0;
      }, "FTE must be a non-negative number (e.g., 1 for one full-time equivalent, 2 for two)"),
    actualCount: z
      .string()
      .optional()
      .refine((val) => {
        if (!val || val === "") return true;
        const num = parseInt(val);
        return !isNaN(num) && num >= 0;
      }, "Actual count must be a non-negative number"),
    effectiveStartDate: z.date({ required_error: "Start date is required" }),
    effectiveEndDate: z.date({ required_error: "End date is required" }),
  })
  .refine(
    (data) => {
      if (data.effectiveStartDate && data.effectiveEndDate) {
        return data.effectiveEndDate > data.effectiveStartDate;
      }
      return true;
    },
    {
      message: "End date must be after start date",
      path: ["effectiveEndDate"],
    }
  );

export default function UpdatePositionDialog({
  open,
  onOpenChange,
  showConfirmation,
  position,
}) {
  const [orgComboboxOpen, setOrgComboboxOpen] = useState(false);
  const [positionComboboxOpen, setPositionComboboxOpen] = useState(false);
  const [positionSearch, setPositionSearch] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  const { data: organizations = [], isLoading: organizationsLoading } = useOrganizations();
  const { data: hrPositions = [], isLoading: hrPositionsLoading } = usePositions();

  const updatePositionMutation = useUpdatePosition();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      positionId: null,
      orgId: null,
      fte: "1",
      actualCount: "0",
      effectiveStartDate: null,
      effectiveEndDate: null,
    },
  });

  const { formState: { isDirty } } = form;

  // Populate form when position changes
  useEffect(() => {
    if (position) {
      form.reset({
        positionId: position.POSITION_ID || null,
        orgId: position.ORG_ID || null,
        fte: position.FTE?.toString() || "1",
        actualCount: position.ACTUAL_COUNT?.toString() || "0",
        effectiveStartDate: position.EFFECTIVE_START_DATE
          ? new Date(position.EFFECTIVE_START_DATE)
          : null,
        effectiveEndDate: position.EFFECTIVE_END_DATE
          ? new Date(position.EFFECTIVE_END_DATE)
          : null,
      });
    }
  }, [position, form]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  const onSubmit = async (data) => {
    if (!position || !position.ID) {
      toast.error("Position ID is missing");
      return;
    }

    try {
      const backendData = {
        POSITION_ID: data.positionId,
        ORG_ID: data.orgId,
        FTE: parseFloat(data.fte),
        ACTUAL_COUNT: data.actualCount ? parseInt(data.actualCount) : 0,
        EFFECTIVE_START_DATE: data.effectiveStartDate?.toISOString().split("T")[0],
        EFFECTIVE_END_DATE: data.effectiveEndDate?.toISOString().split("T")[0],
      };

      await updatePositionMutation.mutateAsync({
        id: position.ID,
        data: backendData,
      });

      toast.success("Position updated successfully!");
      form.reset();
      setPositionSearch("");
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating position:", error);
      toast.error(error?.message || "Failed to update position. Please try again.");
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
    setPositionSearch("");
    onOpenChange(false);
  };

  const handleStartDateChange = (date, field) => {
    field.onChange(date);
    if (date) {
      const newEndDate = getEndDateFromStart(date);
      form.setValue("effectiveEndDate", newEndDate, { shouldValidate: true });
    }
  };

  const isSubmitting = updatePositionMutation.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) handleCancel();
      }}
    >
      <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Briefcase className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Update Position</DialogTitle>
              <DialogDescription>Edit position assignment details</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Position — API shape: { POSITION_ID, TITLE, ... } */}
              <FormField
                control={form.control}
                name="positionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position</FormLabel>
                    <Popover modal={true} open={positionComboboxOpen} onOpenChange={setPositionComboboxOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            disabled={isSubmitting || hrPositionsLoading}
                            className={`w-full justify-between font-normal ${!field.value && "text-muted-foreground"}`}
                          >
                            {hrPositionsLoading
                              ? "Loading..."
                              : field.value
                              ? hrPositions.find((pos) => pos.POSITION_ID === field.value)?.TITLE
                              : "Select position"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0">
                        <Command>
                          <CommandInput
                            placeholder="Search positions..."
                            className="h-9"
                            value={positionSearch}
                            onValueChange={setPositionSearch}
                          />
                          <CommandList>
                            <CommandEmpty>No position found.</CommandEmpty>
                            <CommandGroup>
                              {hrPositions.map((pos) => (
                                <CommandItem
                                  key={pos.POSITION_ID}
                                  value={pos.TITLE}
                                  onSelect={() => {
                                    field.onChange(pos.POSITION_ID);
                                    setPositionComboboxOpen(false);
                                  }}
                                >
                                  {pos.TITLE}
                                  <Check
                                    className={`ml-auto h-4 w-4 ${
                                      field.value === pos.POSITION_ID ? "opacity-100" : "opacity-0"
                                    }`}
                                  />
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Organization — API shape: { ID, NAME, ... } */}
              <FormField
                control={form.control}
                name="orgId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization</FormLabel>
                    <Popover modal={true} open={orgComboboxOpen} onOpenChange={setOrgComboboxOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            disabled={isSubmitting || organizationsLoading}
                            className={`w-full justify-between font-normal ${!field.value && "text-muted-foreground"}`}
                          >
                            {organizationsLoading
                              ? "Loading..."
                              : field.value
                              ? organizations.find((org) => org.ID === field.value)?.NAME
                              : "Select organization"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0">
                        <Command>
                          <CommandInput placeholder="Search organizations..." className="h-9" />
                          <CommandList>
                            <CommandEmpty>No organization found.</CommandEmpty>
                            <CommandGroup>
                              {organizations.map((org) => (
                                <CommandItem
                                  key={org.ID}
                                  value={org.NAME}
                                  onSelect={() => {
                                    field.onChange(org.ID);
                                    setOrgComboboxOpen(false);
                                  }}
                                >
                                  {org.NAME}
                                  <Check
                                    className={`ml-auto h-4 w-4 ${
                                      field.value === org.ID ? "opacity-100" : "opacity-0"
                                    }`}
                                  />
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
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
                    <FormLabel>Effective Start Date</FormLabel>
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

              {/* FTE */}
              <FormField
                control={form.control}
                name="fte"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>FTE (Full-Time Equivalent)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="1"
                        min="0"
                        placeholder="e.g., 1 for one full-time equivalent, 2 for two"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Actual Count */}
              <FormField
                control={form.control}
                name="actualCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Actual Count</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="1"
                        min="0"
                        placeholder="Number of employees in this position"
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
                  "Update Position"
                )}
              </Button>
            </DialogFooter>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}