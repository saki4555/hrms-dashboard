// src\features\core-hr\employee-management\components\edit-assignment-sheet.jsx

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addYears } from "date-fns";
import { Building2, Sparkles, Check, ChevronsUpDown } from "lucide-react";
import { IconX } from "@tabler/icons-react";
import { toast } from "sonner";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DatePicker } from "@/components/DatePicker";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { getAvatarColor } from "@/lib/avatar-utils";

import { ComboboxField } from "./combobox-field";
import { PositionComboboxField } from "./position-combobox-field";
import {
  SheetFormFooter,
  DISCARD_CONFIRM,
  employeeBasePayload,
  addrToPayload,
  fd,
  parseDate,
} from "./sheet-helper";
import { assignmentSchema } from "./employee-detail-schemas";
import { useUpdateEmployee } from "../queries";
import { useCompanies } from "@/features/settings/work-structure/company/queries";
import { useOrganizations } from "@/features/settings/work-structure/organization/queries";
import { useOrgPositions } from "@/features/settings/work-structure/position/queries";
import { useGrades } from "@/features/settings/work-structure/hr-grade/queries";
import { useShifts } from "@/features/settings/work-structure/shift/queries";
import { useHrLocations } from "@/features/settings/work-structure/locations/queries";
import { useSupervisorLiteSearch } from "@/hooks/use-lite-search";

export function EditAssignmentSheet({
  employee,
  open,
  onClose,
  showConfirmation,
}) {
  const { mutateAsync, isPending } = useUpdateEmployee();
  const { data: companies = [], isLoading: compL } = useCompanies();
  const { data: organizations = [], isLoading: orgL } = useOrganizations();
  const { data: orgPositions = [], isLoading: posL } = useOrgPositions();
  const { data: grades = [] } = useGrades();
  const { data: shifts = [], isLoading: shiftsL } = useShifts();
  const { data: locations = [], isLoading: locL } = useHrLocations();
  console.log("locations sample:", locations[0]); // ← check actual keys

  // Supervisor search state
  const [supOpen, setSupOpen] = useState(false);
  const [supSearch, setSupSearch] = useState("");
  const [selectedSupervisor, setSelectedSupervisor] = useState(null);
  const { data: supervisors = [], isFetching: supFetching } =
    useSupervisorLiteSearch(supSearch);

  const [selectedOrgId, setSelectedOrgId] = useState(null);
  const [formSeeded, setFormSeeded] = useState(false);

  const filteredPositions = useMemo(
    () =>
      !selectedOrgId
        ? []
        : orgPositions.filter(
            (p) => String(p.ORG_ID) === String(selectedOrgId),
          ),
    [orgPositions, selectedOrgId],
  );

  const form = useForm({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      companyId: "",
      ouId: "",
      orgId: "",
      positionId: "",
      orgPositionId: "",
      gradeId: "",
      payrollId: "",
      shiftId: "",
      locationId: "",
      supervisorId: undefined,
      assignmentEffectiveStartDate: new Date(),
      assignmentEffectiveEndDate: addYears(new Date(), 5),
    },
  });

  const { isDirty } = form.formState;

  useEffect(() => {
    if (!open || !employee) return;
    const a = employee.assignment;
    if (a?.ORG_ID) setSelectedOrgId(a.ORG_ID);

    const today = new Date();
    const fiveYearsLater = addYears(today, 5);

    form.reset({
      companyId: a?.COMPANY_ID?.toString() || "",
      ouId: a?.OU_ID?.toString() || "",
      orgId: a?.ORG_ID?.toString() || "",
      positionId: "",
      orgPositionId: "",
      gradeId: a?.GRADE_ID?.toString() || "",
      payrollId: a?.PAYROLL_ID?.toString() || "",
      shiftId: employee.shift?.SHIFT_ID?.toString() || "",
      locationId: a?.LOCATION_ID?.toString() || "",
      supervisorId: undefined,
      assignmentEffectiveStartDate: parseDate(a?.EFFECTIVE_START_DATE) ?? today,
      assignmentEffectiveEndDate:
        parseDate(a?.EFFECTIVE_END_DATE) ?? fiveYearsLater,
    });

    // Pre-fill supervisor if employee already has one
    if (employee.supervisor) {
      setSelectedSupervisor(employee.supervisor);
      form.setValue("supervisorId", employee.supervisor.employeeId, {
        shouldValidate: false,
      });
    } else {
      setSelectedSupervisor(null);
    }

    setFormSeeded(true);
  }, [open, employee]); // eslint-disable-line react-hooks/exhaustive-deps

  // Resolve position once orgPositions have loaded
  useEffect(() => {
    if (!formSeeded || !employee || !orgPositions.length) return;
    const a = employee.assignment;
    const match = orgPositions.find(
      (p) =>
        String(p.ID) === String(a?.POSITION_ID) &&
        String(p.ORG_ID) === String(a?.ORG_ID),
    );
    if (match) {
      form.setValue("positionId", String(match.POSITION_ID), {
        shouldValidate: false,
      });
      form.setValue("orgPositionId", String(match.ID), {
        shouldValidate: false,
      });
      if (match.GRADE) {
        const g = grades.find((g) => g.GRADE === match.GRADE);
        if (g)
          form.setValue("gradeId", String(g.ID), { shouldValidate: false });
      }
    }
  }, [formSeeded, employee, orgPositions, grades]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-update end date when start date changes
  const assignmentStart = form.watch("assignmentEffectiveStartDate");
  useEffect(() => {
    if (assignmentStart) {
      form.setValue(
        "assignmentEffectiveEndDate",
        addYears(assignmentStart, 5),
        { shouldDirty: true },
      );
    }
  }, [assignmentStart]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAttemptClose = async () => {
    if (isDirty) {
      const ok = await showConfirmation(DISCARD_CONFIRM);
      if (!ok) return;
    }
    form.reset();
    setFormSeeded(false);
    setSelectedSupervisor(null);
    setSupSearch("");
    onClose();
  };

  const onSubmit = async (data) => {
    try {
      await mutateAsync({
        personId: employee.PERSON_ID,
        data: {
          employee: employeeBasePayload(employee),
          address: {
            present: addrToPayload(employee.presentAddress),
            permanent: addrToPayload(employee.permanentAddress),
          },
          assignment: {
            COMPANY_ID:  parseInt(data.companyId),
            OU_ID:       parseInt(data.ouId),
            ORG_ID:      parseInt(data.orgId),
            POSITION_ID: parseInt(data.orgPositionId),
            PAYROLL_ID:  parseInt(data.payrollId),
            GRADE_ID:    parseInt(data.gradeId),
            LOCATION_ID: data.locationId ? parseInt(data.locationId) : null,
            EFFECTIVE_START_DATE: fd(data.assignmentEffectiveStartDate),
            EFFECTIVE_END_DATE:   fd(data.assignmentEffectiveEndDate),
          },
          shift: data.shiftId
            ? {
                SHIFT_ID:            parseInt(data.shiftId),
                EFFECTIVE_START_DATE: fd(data.assignmentEffectiveStartDate),
                EFFECTIVE_END_DATE:   fd(data.assignmentEffectiveEndDate),
              }
            : null,
          supervisor: data.supervisorId
            ? { SUPERVISOR_ID: data.supervisorId }
            : null,
          STATUS: employee.STATUS,
        },
      });
      toast.success("Assignment updated!");
      form.reset(data);
      onClose();
    } catch (err) {
      toast.error(err?.message || "Failed to update assignment.");
    }
  };

  const gradeValue = form.watch("gradeId");
  const gradeLabel =
    grades.find((g) => String(g.ID) === String(gradeValue))?.GRADE || "";

  return (
    <Sheet
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) handleAttemptClose();
      }}
    >
      <SheetContent className="sm:max-w-xl flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 py-5 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <Building2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <SheetTitle>Assignment</SheetTitle>
              <SheetDescription>
                Update organisation, position, grade, shift, location,
                supervisor, and assignment period.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col flex-1 overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              <ComboboxField
                form={form}
                name="companyId"
                label="Company"
                items={companies}
                idKey="COMPANY_ID"
                nameKey="COMPANY_NAME"
                placeholder={compL ? "Loading…" : "Select company"}
                disabled={isPending || compL}
              />

              <ComboboxField
                form={form}
                name="ouId"
                label="Operational Unit"
                items={organizations}
                idKey="ID"
                nameKey="NAME"
                placeholder={orgL ? "Loading…" : "Select operational unit"}
                disabled={isPending || orgL}
              />

              <ComboboxField
                form={form}
                name="orgId"
                label="Organisation"
                items={organizations}
                idKey="ID"
                nameKey="NAME"
                placeholder={orgL ? "Loading…" : "Select organisation"}
                disabled={isPending || orgL}
                onSelect={(org) => {
                  setSelectedOrgId(org.ID);
                  form.setValue("positionId", "", { shouldValidate: false });
                  form.setValue("orgPositionId", "", { shouldValidate: false });
                  form.setValue("gradeId", "", { shouldValidate: false });
                }}
              />

              <PositionComboboxField
                form={form}
                filteredPositions={filteredPositions}
                selectedOrgId={selectedOrgId}
                orgPositionsLoading={posL}
                grades={grades}
                disabled={isPending}
              />

              {/* Grade — read-only, auto-filled from position */}
              <FormField
                control={form.control}
                name="gradeId"
                render={() => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Grade{" "}
                      <span className="text-muted-foreground text-xs">
                        (auto-filled)
                      </span>
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          readOnly
                          disabled
                          value={gradeLabel}
                          placeholder="Auto-filled from position"
                          className="bg-muted/40 cursor-not-allowed pl-9"
                        />
                        <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="payrollId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Payroll ID
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter payroll ID"
                        disabled={isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <ComboboxField
                form={form}
                name="shiftId"
                label="Shift"
                items={shifts}
                idKey="SHIFT_ID"
                nameKey="NAME"
                placeholder={shiftsL ? "Loading..." : "Select shift"}
                disabled={isPending || shiftsL}
                renderItem={(shift) => (
                  <div className="flex flex-col">
                    <span className="font-medium">{shift.NAME}</span>
                    <span className="text-xs text-muted-foreground">
                      {shift.CODE} · {shift.START_TIME} – {shift.END_TIME}
                    </span>
                  </div>
                )}
              />

              {/* Location */}
              <ComboboxField
                form={form}
                name="locationId"
                label="Location"
                items={locations}
                idKey="ID"
                nameKey="LOCATION_NAME"
                placeholder={locL ? "Loading..." : "Select location"}
                disabled={isPending || locL}
              />

              {/* Supervisor — search combobox */}
              <FormField
                control={form.control}
                name="supervisorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Supervisor
                    </FormLabel>
                    <Popover open={supOpen} onOpenChange={setSupOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            disabled={isPending}
                            className={cn(
                              "w-full justify-between font-normal px-2",
                              !selectedSupervisor && "text-muted-foreground",
                            )}
                          >
                            {selectedSupervisor ? (
                              <div className="flex items-center gap-2 min-w-0">
                                <Avatar className="h-5 w-5 shrink-0">
                                  <AvatarImage
                                    src={`${import.meta.env.VITE_API_BASE_URL}/api/emp-images/person/${selectedSupervisor.employeeId}`}
                                  />
                                  <AvatarFallback
                                    className={cn(
                                      "text-[10px] font-semibold text-white",
                                      getAvatarColor(selectedSupervisor.name),
                                    )}
                                  >
                                    {selectedSupervisor.name
                                      ?.split(" ")
                                      .map((n) => n[0])
                                      .join("")
                                      .slice(0, 2)
                                      .toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="truncate text-sm text-foreground">
                                  {selectedSupervisor.name}
                                </span>
                                <span className="text-xs text-muted-foreground shrink-0">
                                  ({selectedSupervisor.empNo})
                                </span>
                                {selectedSupervisor.role && (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] shrink-0"
                                  >
                                    {selectedSupervisor.role}
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span>Search by name or emp no...</span>
                            )}
                            <div className="flex items-center gap-0.5 ml-1 shrink-0">
                              {selectedSupervisor && (
                                <span
                                  role="button"
                                  className="rounded p-0.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedSupervisor(null);
                                    setSupSearch("");
                                    field.onChange(undefined);
                                  }}
                                >
                                  <IconX className="h-3.5 w-3.5" />
                                </span>
                              )}
                              <ChevronsUpDown className="h-4 w-4 opacity-50" />
                            </div>
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[380px] p-0" align="start">
                        <Command shouldFilter={false}>
                          <CommandInput
                            placeholder="Type 2+ characters..."
                            value={supSearch}
                            onValueChange={setSupSearch}
                          />
                          <CommandList>
                            {supFetching && (
                              <div className="flex items-center justify-center py-4">
                                <Spinner className="h-4 w-4" />
                              </div>
                            )}
                            {!supFetching && supSearch.length < 2 && (
                              <CommandEmpty>
                                Type at least 2 characters to search.
                              </CommandEmpty>
                            )}
                            {!supFetching &&
                              supSearch.length >= 2 &&
                              supervisors.length === 0 && (
                                <CommandEmpty>
                                  No supervisors found.
                                </CommandEmpty>
                              )}
                            {!supFetching && supervisors.length > 0 && (
                              <CommandGroup>
                                {supervisors.map((sup) => (
                                  <CommandItem
                                    key={sup.id}
                                    value={String(sup.id)}
                                    onSelect={() => {
                                      setSelectedSupervisor(sup);
                                      field.onChange(sup.employeeId);
                                      setSupOpen(false);
                                      setSupSearch("");
                                    }}
                                  >
                                    <Avatar className="h-6 w-6 shrink-0 mr-2">
                                      <AvatarImage
                                        src={`${import.meta.env.VITE_API_BASE_URL}/api/emp-images/person/${sup.employeeId}`}
                                      />
                                      <AvatarFallback
                                        className={cn(
                                          "text-[10px] font-semibold text-white",
                                          getAvatarColor(sup.name),
                                        )}
                                      >
                                        {sup.name
                                          ?.split(" ")
                                          .map((n) => n[0])
                                          .join("")
                                          .slice(0, 2)
                                          .toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="truncate">{sup.name}</span>
                                    {sup.role && (
                                      <Badge
                                        variant="outline"
                                        className="ml-2 text-xs shrink-0"
                                      >
                                        {sup.role}
                                      </Badge>
                                    )}
                                    <span className="ml-auto text-xs text-muted-foreground shrink-0 pl-2">
                                      {sup.empNo}
                                    </span>
                                    <Check
                                      className={cn(
                                        "ml-2 h-4 w-4 shrink-0",
                                        selectedSupervisor?.id === sup.id
                                          ? "opacity-100"
                                          : "opacity-0",
                                      )}
                                    />
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            )}
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <Separator />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Assignment Period
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="assignmentEffectiveStartDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Start Date
                      </FormLabel>
                      <FormControl>
                        <DatePicker
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select start date"
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="assignmentEffectiveEndDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        End Date
                      </FormLabel>
                      <FormControl>
                        <DatePicker
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select end date"
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <SheetFormFooter
              onCancel={handleAttemptClose}
              isPending={isPending}
            />
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}