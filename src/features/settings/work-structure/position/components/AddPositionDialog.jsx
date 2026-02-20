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
import { useCreatePosition } from "../queries";
import { usePositions } from "../../hr-position/queries";
import { useOrganizations } from "../../organization/queries";

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

export default function AddPositionDialog({ open, onOpenChange, showConfirmation }) {
  const [orgComboboxOpen, setOrgComboboxOpen] = useState(false);
  const [positionComboboxOpen, setPositionComboboxOpen] = useState(false);
  const [positionSearch, setPositionSearch] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  const { data: organizations = [], isLoading: organizationsLoading } = useOrganizations();
  const { data: hrPositions = [], isLoading: hrPositionsLoading } = usePositions();

  const createPositionMutation = useCreatePosition();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      positionId: null,
      orgId: null,
      fte: "1",
      effectiveStartDate: getDefaultStartDate(),
      effectiveEndDate: getDefaultEndDate(),
    },
  });

  const {
    formState: { isDirty },
  } = form;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  const onSubmit = async (data) => {
    try {
      const backendData = {
        POSITION_ID: data.positionId,
        ORG_ID: data.orgId,
        FTE: parseFloat(data.fte),
        ACTUAL_COUNT: 0,
        EFFECTIVE_START_DATE: data.effectiveStartDate?.toISOString().split("T")[0],
        EFFECTIVE_END_DATE: data.effectiveEndDate?.toISOString().split("T")[0],
        STATUS: 1,
      };

      await createPositionMutation.mutateAsync(backendData);

      toast.success("Position created successfully!");
      form.reset();
      setPositionSearch("");
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating position:", error);
      toast.error(error?.message || "Failed to create position. Please try again.");
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
              <DialogTitle>Add New Position</DialogTitle>
              <DialogDescription>Assign a position to an organization</DialogDescription>
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
                            disabled={hrPositionsLoading}
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
                            disabled={organizationsLoading}
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

              {/* FTE */}
              <FormField
                control={form.control}
                name="fte"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>FTE (Full-Time Equivalent)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="1"
                        min="0"
                        placeholder="e.g., 1 for one full-time equivalent, 2 for two"
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
                disabled={createPositionMutation.isPending}
              >
                {createPositionMutation.isPending ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Creating...
                  </>
                ) : (
                  "Save Position"
                )}
              </Button>
            </DialogFooter>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}