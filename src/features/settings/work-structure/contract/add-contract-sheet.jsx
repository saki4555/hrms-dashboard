// src\features\settings\work-structure\contract\add-contract-sheet.jsx
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { addYears, format } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
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
import { FileText, ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { DatePicker } from "@/components/DatePicker";
import { useCreateContract } from "./queries";
import { useEmployeeLiteSearch } from "@/hooks/use-lite-search";

const CONTRACT_TYPES = [
  "Permanent", "Temporary", "Probationary",
  "Part-time", "Freelance", "Internship",
];

const CURRENCIES = ["BDT", "USD", "EUR", "GBP"];

const formSchema = z
  .object({
    employeeId: z.number({ required_error: "Employee is required" }),
    contractType: z.string().max(50).optional(),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().optional(),
    salaryCurrency: z.string().max(10).default("BDT"),
    salaryAmount: z.coerce
      .number({ invalid_type_error: "Must be a number" })
      .min(0, "Cannot be negative")
      .optional(),
    probationPeriodMonths: z.coerce
      .number({ invalid_type_error: "Must be a number" })
      .int("Must be a whole number")
      .min(0, "Cannot be negative")
      .optional(),
    noticePeriodDays: z.coerce
      .number({ invalid_type_error: "Must be a number" })
      .int("Must be a whole number")
      .min(0, "Cannot be negative")
      .optional(),
  })
  .refine(
    (data) => {
      if (!data.endDate || !data.startDate) return true;
      return new Date(data.endDate) > new Date(data.startDate);
    },
    { message: "End date must be after start date", path: ["endDate"] }
  );

export default function AddContractSheet({ open, onOpenChange, showConfirmation }) {
  const createContractMutation = useCreateContract();

  const [empOpen, setEmpOpen] = useState(false);
  const [empSearch, setEmpSearch] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const { data: employees = [], isFetching: empFetching } = useEmployeeLiteSearch(empSearch);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      employeeId: undefined,
      contractType: "",
      startDate: "",
      endDate: "",
      salaryCurrency: "BDT",
      salaryAmount: "",
      probationPeriodMonths: "",
      noticePeriodDays: "",
    },
  });

  const { formState: { isDirty } } = form;

  // Reset form with today + 5 years when sheet opens
  useEffect(() => {
    if (open) {
      const today = format(new Date(), "yyyy-MM-dd");
      const fiveYearsLater = format(addYears(new Date(), 5), "yyyy-MM-dd");
      form.reset({
        employeeId: undefined,
        contractType: "",
        startDate: today,
        endDate: fiveYearsLater,
        salaryCurrency: "BDT",
        salaryAmount: "",
        probationPeriodMonths: "",
        noticePeriodDays: "",
      });
      setSelectedEmployee(null);
      setEmpSearch("");
    }
  }, [open]);

  // Auto-set end date to +5 years when start date changes
  const startDate = form.watch("startDate");
  useEffect(() => {
    if (startDate) {
      const endDate = format(addYears(new Date(startDate), 5), "yyyy-MM-dd");
      form.setValue("endDate", endDate, { shouldDirty: true });
    }
  }, [startDate]);

  const onSubmit = async (data) => {
    try {
      const backendData = {
        EMPLOYEE_ID:             data.employeeId,
        CONTRACT_TYPE:           data.contractType || null,
        START_DATE:              data.startDate,
        END_DATE:                data.endDate || null,
        SALARY_CURRENCY:         data.salaryCurrency || "BDT",
        SALARY_AMOUNT:           data.salaryAmount || null,
        PROBATION_PERIOD_MONTHS: data.probationPeriodMonths || null,
        NOTICE_PERIOD_DAYS:      data.noticePeriodDays || null,
        CREATED_BY:              "admin", // TODO: replace with logged-in user
      };
      await createContractMutation.mutateAsync(backendData);
      toast.success("Contract created successfully!");
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(error?.message || "Failed to create contract. Please try again.");
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

  const isSubmitting = createContractMutation.isPending;

  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) handleCancel(); }}>
      <SheetContent className="sm:max-w-xl w-full flex flex-col gap-0 p-0">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <SheetHeader className="px-6 py-5 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <SheetTitle>Add New Contract</SheetTitle>
              <SheetDescription>Create a new employee contract</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* ── Scrollable form body ────────────────────────────────────── */}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col flex-1 overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

              {/* Employee */}
              <FormField
                control={form.control}
                name="employeeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Employee <span className="text-destructive">*</span>
                    </FormLabel>
                    <Popover open={empOpen} onOpenChange={setEmpOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            disabled={isSubmitting}
                            className={cn(
                              "w-full justify-between font-normal",
                              !selectedEmployee && "text-muted-foreground"
                            )}
                          >
                            {selectedEmployee
                              ? `${selectedEmployee.name} (${selectedEmployee.empNo})`
                              : "Search by name or emp no..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[420px] p-0" align="start">
                        <Command shouldFilter={false}>
                          <CommandInput
                            placeholder="Type 2+ characters..."
                            value={empSearch}
                            onValueChange={setEmpSearch}
                          />
                          <CommandList>
                            {empFetching && (
                              <div className="flex items-center justify-center py-4">
                                <Spinner className="h-4 w-4" />
                              </div>
                            )}
                            {!empFetching && empSearch.length >= 2 && employees.length === 0 && (
                              <CommandEmpty>No employees found.</CommandEmpty>
                            )}
                            {!empFetching && empSearch.length < 2 && (
                              <CommandEmpty>Type at least 2 characters to search.</CommandEmpty>
                            )}
                            <CommandGroup>
                              {employees.map((emp) => (
                                <CommandItem
                                  key={emp.id}
                                  value={String(emp.id)}
                                  onSelect={() => {
                                    setSelectedEmployee(emp);
                                    field.onChange(emp.id);
                                    setEmpOpen(false);
                                  }}
                                >
                                  <Check className={cn("mr-2 h-4 w-4", selectedEmployee?.id === emp.id ? "opacity-100" : "opacity-0")} />
                                  <span>{emp.name}</span>
                                  <span className="ml-auto text-xs text-muted-foreground">{emp.empNo}</span>
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

              {/* Contract Type + Currency */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contractType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contract Type</FormLabel>
                      <Select disabled={isSubmitting} onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {CONTRACT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="salaryCurrency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select disabled={isSubmitting} onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select currency" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Start Date + End Date */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <DatePicker
                          className="w-full" placeholder="Select start date" disabled={isSubmitting}
                          value={field.value ? new Date(field.value) : undefined}
                          onChange={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <DatePicker
                          className="w-full" placeholder="Select end date" disabled={isSubmitting}
                          value={field.value ? new Date(field.value) : undefined}
                          onChange={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Salary Amount */}
              <FormField
                control={form.control}
                name="salaryAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Salary Amount</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} step="0.01" placeholder="0.00" disabled={isSubmitting} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Probation + Notice */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="probationPeriodMonths"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Probation Period (months)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} placeholder="0" disabled={isSubmitting} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="noticePeriodDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notice Period (days)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} placeholder="0" disabled={isSubmitting} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* ── Footer ───────────────────────────────────────────────── */}
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-border shrink-0">
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <><Spinner className="mr-2 h-4 w-4" />Creating...</> : "Save Contract"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}