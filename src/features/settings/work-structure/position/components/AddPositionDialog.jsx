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
import { Check, ChevronsUpDown, Briefcase, Lock } from "lucide-react";
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
import { useCreatePosition, useOrgPositions } from "../queries";
import { usePositions } from "../../hr-position/queries";
import { useOrganizations } from "../../organization/queries";

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

export default function AddPositionDialog({ open, onOpenChange, showConfirmation }) {
  const [orgComboboxOpen, setOrgComboboxOpen] = useState(false);
  const [positionComboboxOpen, setPositionComboboxOpen] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState(null);
  const [isMounted, setIsMounted] = useState(false);

  const { data: organizations = [], isLoading: organizationsLoading } = useOrganizations();
  const { data: hrPositions = [], isLoading: hrPositionsLoading } = usePositions();
  const { data: orgPositions = [] } = useOrgPositions();

  const createPositionMutation = useCreatePosition();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      orgId: null,
      positionId: null,
      fte: "1",
      effectiveStartDate: "",
      effectiveEndDate: "",
    },
  });

  const { formState: { isDirty } } = form;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Auto-set end date to +100 years when start date changes — same pattern as AddGradeDialog
  const startDate = form.watch("effectiveStartDate");
  useEffect(() => {
    if (startDate) {
      const endDate = format(addYears(new Date(startDate), 100), "yyyy-MM-dd");
      form.setValue("effectiveEndDate", endDate, { shouldDirty: true });
    }
  }, [startDate]);

  // Set of POSITION_IDs already assigned to the selected org
  const assignedPositionIds = useMemo(() => {
    if (!selectedOrgId) return new Set();
    return new Set(
      orgPositions
        .filter((op) => op.ORG_ID === selectedOrgId)
        .map((op) => op.POSITION_ID)
    );
  }, [orgPositions, selectedOrgId]);

  if (!isMounted) return null;

  const onSubmit = async (data) => {
    try {
      const backendData = {
        POSITION_ID: data.positionId,
        ORG_ID: data.orgId,
        FTE: parseFloat(data.fte),
        ACTUAL_COUNT: 0,
        EFFECTIVE_START_DATE: data.effectiveStartDate,
        EFFECTIVE_END_DATE: data.effectiveEndDate,
        STATUS: 1,
      };

      await createPositionMutation.mutateAsync(backendData);
      toast.success("Position assigned successfully!");
      handleReset();
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating position:", error);
      toast.error(error?.message || "Failed to assign position. Please try again.");
    }
  };

  const handleReset = () => {
    form.reset({
      orgId: null,
      positionId: null,
      fte: "1",
      effectiveStartDate: "",
      effectiveEndDate: "",
    });
    setSelectedOrgId(null);
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
    handleReset();
    onOpenChange(false);
  };

  const positionFieldDisabled = !selectedOrgId || hrPositionsLoading;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleCancel(); }}>
      <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Briefcase className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Assign Position</DialogTitle>
              <DialogDescription>
                Select an organization first, then choose a position to assign to it.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* ── 1. Organization ───────────────────────────────────────── */}
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
                                    setSelectedOrgId(org.ID);
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

              {/* ── 2. Position (locked until org selected) ───────────────── */}
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
                            <span className="flex items-center gap-2 truncate">
                              {!selectedOrgId && (
                                <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                              )}
                              {!selectedOrgId
                                ? "Select an organization first"
                                : hrPositionsLoading
                                ? "Loading..."
                                : field.value
                                ? hrPositions.find((p) => p.POSITION_ID === field.value)?.TITLE
                                : "Select position"}
                            </span>
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
                  <FormItem className="md:col-span-2">
                    <FormLabel>
                      FTE (Full-Time Equivalent) <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="1"
                        min="1"
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
                    Assigning...
                  </>
                ) : (
                  "Assign Position"
                )}
              </Button>
            </DialogFooter>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}