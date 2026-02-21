import { useEffect, useState, useMemo } from "react";
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
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/DatePicker";
import { Spinner } from "@/components/ui/spinner";
import { useUpdatePosition, useOrgPositions } from "../queries";
import { useOrganizations } from "../../organization/queries";
import { usePositions } from "../../hr-position/queries";

const formSchema = z
  .object({
    orgId: z.number({ required_error: "Organization is required" }),
    positionId: z.number({ required_error: "Position is required" }),
    fte: z
      .string({ required_error: "FTE is required" })
      .min(1, "FTE is required")
      .refine(
        (val) => {
          const num = parseFloat(val);
          return !isNaN(num) && num > 0;
        },
        "FTE must be a positive number"
      ),
    actualCount: z
      .string()
      .optional()
      .refine((val) => {
        if (!val || val === "") return true;
        const num = parseInt(val);
        return !isNaN(num) && num >= 0;
      }, "Actual count must be a non-negative number"),
    effectiveStartDate: z.string().min(1, "Start date is required"),
    effectiveEndDate: z.string().min(1, "End date is required"),
  })
  .refine(
    (data) => {
      if (data.effectiveStartDate && data.effectiveEndDate) {
        return new Date(data.effectiveEndDate) > new Date(data.effectiveStartDate);
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
  const [selectedOrgId, setSelectedOrgId] = useState(null);
  const [isMounted, setIsMounted] = useState(false);

  const { data: organizations = [], isLoading: organizationsLoading } = useOrganizations();
  const { data: hrPositions = [], isLoading: hrPositionsLoading } = usePositions();
  const { data: orgPositions = [] } = useOrgPositions();

  const updatePositionMutation = useUpdatePosition();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      orgId: null,
      positionId: null,
      fte: "1",
      actualCount: "0",
      effectiveStartDate: "",
      effectiveEndDate: "",
    },
  });

  const { formState: { isDirty } } = form;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Populate form when position prop changes
  useEffect(() => {
    if (position) {
      const orgId = position.ORG_ID || null;
      setSelectedOrgId(orgId);
      form.reset({
        orgId: orgId,
        positionId: position.POSITION_ID || null,
        fte: position.FTE?.toString() || "1",
        actualCount: position.ACTUAL_COUNT?.toString() || "0",
        effectiveStartDate: position.EFFECTIVE_START_DATE
          ? format(new Date(position.EFFECTIVE_START_DATE), "yyyy-MM-dd")
          : "",
        effectiveEndDate: position.EFFECTIVE_END_DATE
          ? format(new Date(position.EFFECTIVE_END_DATE), "yyyy-MM-dd")
          : "",
      });
    }
  }, [position]);

  // Auto-set end date to +100 years when start date changes — same as AddPositionDialog
  const startDate = form.watch("effectiveStartDate");
  useEffect(() => {
    if (startDate && !position) {
      // Only auto-fill end date when not pre-populated from position prop
      const endDate = format(addYears(new Date(startDate), 100), "yyyy-MM-dd");
      form.setValue("effectiveEndDate", endDate, { shouldDirty: true });
    }
  }, [startDate]);

  // Positions already assigned to selected org (excluding current position being edited)
  const assignedPositionIds = useMemo(() => {
    if (!selectedOrgId) return new Set();
    return new Set(
      orgPositions
        .filter(
          (op) =>
            op.ORG_ID === selectedOrgId &&
            op.POSITION_ID !== position?.POSITION_ID // exclude current
        )
        .map((op) => op.POSITION_ID)
    );
  }, [orgPositions, selectedOrgId, position]);

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
        EFFECTIVE_START_DATE: data.effectiveStartDate,
        EFFECTIVE_END_DATE: data.effectiveEndDate,
      };

      await updatePositionMutation.mutateAsync({ id: position.ID, data: backendData });
      toast.success("Position updated successfully!");
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
    onOpenChange(false);
  };

  const isSubmitting = updatePositionMutation.isPending;
  const positionFieldDisabled = isSubmitting || !selectedOrgId || hrPositionsLoading;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleCancel(); }}>
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

              {/* ── 1. Organization (first) ───────────────────────────────── */}
              <FormField
                control={form.control}
                name="orgId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Organization <span className="text-destructive">*</span>
                    </FormLabel>
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
                                    setSelectedOrgId(org.ID);
                                    // Reset position when org changes
                                    form.setValue("positionId", null, { shouldValidate: false });
                                    setOrgComboboxOpen(false);
                                  }}
                                >
                                  {org.NAME}
                                  <Check
                                    className={`ml-auto h-4 w-4 ${field.value === org.ID ? "opacity-100" : "opacity-0"}`}
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

              {/* ── 2. Position ───────────────────────────────────────────── */}
              <FormField
                control={form.control}
                name="positionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Position <span className="text-destructive">*</span>
                    </FormLabel>
                    <Popover
                      modal={true}
                      open={positionComboboxOpen}
                      onOpenChange={(o) => {
                        if (!positionFieldDisabled) setPositionComboboxOpen(o);
                      }}
                    >
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            disabled={positionFieldDisabled}
                            className={`w-full justify-between font-normal ${!field.value && "text-muted-foreground"}`}
                          >
                            {hrPositionsLoading
                              ? "Loading..."
                              : field.value
                              ? hrPositions.find((p) => p.POSITION_ID === field.value)?.TITLE
                              : "Select position"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0">
                        <Command>
                          <CommandInput placeholder="Search positions..." className="h-9" />
                          <CommandList>
                            <CommandEmpty>No position found.</CommandEmpty>
                            <CommandGroup>
                              {hrPositions.map((pos) => {
                                const isAssigned = assignedPositionIds.has(pos.POSITION_ID);
                                const isSelected = field.value === pos.POSITION_ID;
                                return (
                                  <CommandItem
                                    key={pos.POSITION_ID}
                                    value={pos.TITLE}
                                    disabled={isAssigned}
                                    onSelect={() => {
                                      if (isAssigned) return;
                                      field.onChange(pos.POSITION_ID);
                                      setPositionComboboxOpen(false);
                                    }}
                                    className={isAssigned ? "opacity-50 cursor-not-allowed" : ""}
                                  >
                                    <div className="flex flex-col flex-1 min-w-0">
                                      <span className="truncate">{pos.TITLE}</span>
                                      {pos.GRADE && (
                                        <span className="text-xs text-muted-foreground">
                                          {pos.GRADE} · {pos.LEVELS}
                                        </span>
                                      )}
                                    </div>
                                    {isAssigned ? (
                                      <Badge
                                        variant="secondary"
                                        className="ml-auto shrink-0 text-xs font-normal"
                                      >
                                        Already assigned
                                      </Badge>
                                    ) : (
                                      <Check
                                        className={`ml-auto h-4 w-4 shrink-0 ${isSelected ? "opacity-100" : "opacity-0"}`}
                                      />
                                    )}
                                  </CommandItem>
                                );
                              })}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ── 3. Effective Start Date ───────────────────────────────── */}
              <FormField
                control={form.control}
                name="effectiveStartDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Effective Start Date <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <DatePicker
                        className="w-full"
                        placeholder="Select start date"
                        value={field.value ? new Date(field.value) : undefined}
                        onChange={(date) =>
                          field.onChange(date ? format(date, "yyyy-MM-dd") : "")
                        }
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ── 4. Effective End Date ─────────────────────────────────── */}
              <FormField
                control={form.control}
                name="effectiveEndDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Effective End Date <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <DatePicker
                        className="w-full"
                        placeholder="Select end date"
                        value={field.value ? new Date(field.value) : undefined}
                        onChange={(date) =>
                          field.onChange(date ? format(date, "yyyy-MM-dd") : "")
                        }
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ── 5. FTE ───────────────────────────────────────────────── */}
              <FormField
                control={form.control}
                name="fte"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      FTE (Full-Time Equivalent) <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="1"
                        min="1"
                        placeholder="e.g., 1 for one full-time, 2 for two"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ── 6. Actual Count ───────────────────────────────────────── */}
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