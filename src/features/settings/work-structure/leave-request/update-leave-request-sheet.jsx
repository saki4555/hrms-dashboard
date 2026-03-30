import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/authentication/use-auth";
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
import { CalendarDays, ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { DatePicker } from "@/components/DatePicker";
import { useUpdateLeaveRequest, useLeaveTypes } from "./queries";
import { useEmployeeLiteSearch } from "@/hooks/use-employee-lite-search";

const STATUS_OPTIONS = ["PENDING", "APPROVED", "REJECTED", "CANCELLED"];

const formSchema = z
  .object({
    employeeId: z.number({ required_error: "Employee is required" }),
    leave_type_id: z.string().min(1, "Leave type is required"),
    start_date: z.string().min(1, "Start date is required"),
    end_date: z.string().min(1, "End date is required"),
    days: z.string().optional(),
    reason: z
      .string()
      .max(2000, "Reason cannot exceed 2000 characters")
      .optional(),
    status: z.string().min(1, "Status is required"),
  })
  .refine((data) => new Date(data.end_date) >= new Date(data.start_date), {
    message: "End date must be on or after start date",
    path: ["end_date"],
  });

export default function UpdateLeaveRequestSheet({
  open,
  onOpenChange,
  showConfirmation,
  leaveRequest,
}) {
  const updateMutation = useUpdateLeaveRequest();
  const { data: leaveTypes = [], isLoading: leaveTypesLoading } =
    useLeaveTypes();

  const [empOpen, setEmpOpen] = useState(false);
  const { user } = useAuth();
  console.log("user", user)
  const [empSearch, setEmpSearch] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const { data: employees = [], isFetching: empFetching } =
    useEmployeeLiteSearch(empSearch);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      employeeId: undefined,
      leave_type_id: "",
      start_date: "",
      end_date: "",
      days: "",
      reason: "",
      status: "PENDING",
    },
  });

  const {
    formState: { isDirty },
  } = form;

  // Populate form when leaveRequest changes
  useEffect(() => {
    if (leaveRequest) {
      form.reset({
        employeeId: leaveRequest.EMPLOYEE_ID,
        leave_type_id:
          leaveRequest.LEAVE_TYPE_ID != null
            ? String(leaveRequest.LEAVE_TYPE_ID)
            : "",
        start_date: leaveRequest.START_DATE
          ? format(new Date(leaveRequest.START_DATE), "yyyy-MM-dd")
          : "",
        end_date: leaveRequest.END_DATE
          ? format(new Date(leaveRequest.END_DATE), "yyyy-MM-dd")
          : "",
        days: leaveRequest.DAYS != null ? String(leaveRequest.DAYS) : "",
        reason: leaveRequest.REASON || "",
        status: leaveRequest.STATUS || "PENDING",
      });

      // Pre-populate employee display
      if (leaveRequest.EMPLOYEE_ID) {
        setSelectedEmployee({
          id: leaveRequest.EMPLOYEE_ID,
          name:
            [leaveRequest.FIRST_NAME, leaveRequest.LAST_NAME]
              .filter(Boolean)
              .join(" ") || `Employee #${leaveRequest.EMPLOYEE_ID}`,
          empNo: leaveRequest.EMP_NO || "",
        });
      }
    }
  }, [leaveRequest, form]);

  // Auto-recalculate days only when user changes dates (isDirty guard)
  const startDate = form.watch("start_date");
  const endDate = form.watch("end_date");

  useEffect(() => {
    if (startDate && endDate && isDirty) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end >= start) {
        const diff = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
        form.setValue("days", String(diff), { shouldDirty: true });
      }
    }
  }, [startDate, endDate]);

  const onSubmit = async (data) => {
    if (!leaveRequest?.LEAVE_ID) {
      toast.error("Leave request ID is missing");
      return;
    }
    try {
     const payload = {
  employee_id:   data.employeeId,
  leave_type_id: Number(data.leave_type_id),
  start_date:    data.start_date,
  end_date:      data.end_date,
  days:          data.days ? Number(data.days) : null,
  reason:        data.reason || null,
  status:        data.status,
  approver_id:   user?.id ?? null,        // ← USERS.ID
  updated_by:    user?.username ?? null,  // ← USERS.USERNAME
};
      await updateMutation.mutateAsync({
        id: leaveRequest.LEAVE_ID,
        data: payload,
      });
      toast.success("Leave request updated successfully!");
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error?.message || "Failed to update leave request. Please try again.",
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

  const isSubmitting = updateMutation.isPending;

  return (
    <Sheet
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) handleCancel();
      }}
    >
      <SheetContent className="sm:max-w-xl w-full flex flex-col gap-0 p-0">
        {/* ── Header ─────────────────────────────────────────────────── */}
        <SheetHeader className="px-6 py-5 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <CalendarDays className="h-5 w-5 text-primary" />
            </div>
            <div>
              <SheetTitle>Update Leave Request</SheetTitle>
              <SheetDescription>
                Editing leave request #{leaveRequest?.LEAVE_ID}
              </SheetDescription>
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
              {/* Employee Search */}
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
                              !selectedEmployee && "text-muted-foreground",
                            )}
                          >
                            {selectedEmployee
                              ? `${selectedEmployee.name}${selectedEmployee.empNo ? ` (${selectedEmployee.empNo})` : ""}`
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
                            {!empFetching &&
                              empSearch.length >= 2 &&
                              employees.length === 0 && (
                                <CommandEmpty>No employees found.</CommandEmpty>
                              )}
                            {!empFetching && empSearch.length < 2 && (
                              <CommandEmpty>
                                Type at least 2 characters to search.
                              </CommandEmpty>
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
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedEmployee?.id === emp.id
                                        ? "opacity-100"
                                        : "opacity-0",
                                    )}
                                  />
                                  <span>{emp.name}</span>
                                  <span className="ml-auto text-xs text-muted-foreground">
                                    {emp.empNo}
                                  </span>
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

              {/* Leave Type Dropdown + Status — same row */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="leave_type_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Leave Type <span className="text-destructive">*</span>
                      </FormLabel>
                      <Select
                        disabled={isSubmitting || leaveTypesLoading}
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                leaveTypesLoading
                                  ? "Loading..."
                                  : "Select leave type"
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {leaveTypes.map((lt) => (
                            <SelectItem
                              key={lt.LEAVE_TYPE_ID}
                              value={String(lt.LEAVE_TYPE_ID)}
                            >
                              <span>{lt.NAME}</span>
                              <span className="ml-2 text-xs text-muted-foreground">
                                ({lt.CODE})
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Status <span className="text-destructive">*</span>
                      </FormLabel>
                      <Select
                        disabled={isSubmitting}
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {STATUS_OPTIONS.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
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
                  name="start_date"
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
                          value={
                            field.value ? new Date(field.value) : undefined
                          }
                          onChange={(date) =>
                            field.onChange(
                              date ? format(date, "yyyy-MM-dd") : "",
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="end_date"
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
                          value={
                            field.value ? new Date(field.value) : undefined
                          }
                          onChange={(date) =>
                            field.onChange(
                              date ? format(date, "yyyy-MM-dd") : "",
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Days (auto-calculated, read-only) */}
              <FormField
                control={form.control}
                name="days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Days</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Auto-calculated"
                        readOnly
                        className="bg-muted text-muted-foreground cursor-not-allowed"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Reason */}
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Optional: provide a reason for your leave"
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

            {/* ── Footer ───────────────────────────────────────────────── */}
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-border shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Updating...
                  </>
                ) : (
                  "Update Request"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
