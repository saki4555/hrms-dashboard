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
import { Textarea } from "@/components/ui/textarea";
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
import { CalendarDays, ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { DatePicker } from "@/components/DatePicker";
import { useCreateLeaveRequest } from "./queries";
import { useEmployeeLiteSearch } from "@/hooks/use-lite-search";
import { useLeaveTypes } from "@/features/attendance-management/leave-type/queries";
import { useAuth } from "@/features/authentication/use-auth";

const formSchema = z
  .object({
    employeeId: z.number({ required_error: "Employee is required" }),
    leave_type_id: z.string().min(1, "Leave type is required"),
    start_date: z.string().min(1, "Start date is required"),
    end_date: z.string().min(1, "End date is required"),
    days: z.string().optional(),
    reason: z.string().max(2000, "Reason cannot exceed 2000 characters").optional(),
  })
  .refine((data) => new Date(data.end_date) >= new Date(data.start_date), {
    message: "End date must be on or after start date",
    path: ["end_date"],
  });

export default function AddLeaveRequestSheet({ open, onOpenChange, showConfirmation, isAdminOrHR }) {
  const { user } = useAuth();
  const createMutation = useCreateLeaveRequest();
  const { data: leaveTypes = [], isLoading: leaveTypesLoading } = useLeaveTypes();

  const [empOpen, setEmpOpen] = useState(false);
  const [empSearch, setEmpSearch] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const { data: employees = [], isFetching: empFetching } = useEmployeeLiteSearch(empSearch);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      employeeId: isAdminOrHR ? undefined : user?.employee_id,
      leave_type_id: "",
      start_date: "",
      end_date: "",
      days: "",
      reason: "",
    },
  });

  const { formState: { isDirty } } = form;

  // Reset on open
  useEffect(() => {
    if (open) {
      form.reset({
        employeeId: isAdminOrHR ? undefined : user?.employee_id,
        leave_type_id: "",
        start_date: "",
        end_date: "",
        days: "",
        reason: "",
      });
      setSelectedEmployee(null);
      setEmpSearch("");
    }
  }, [open]);

  // Auto-calculate days
  const startDate = form.watch("start_date");
  const endDate   = form.watch("end_date");
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end   = new Date(endDate);
      if (end >= start) {
        const diff = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
        form.setValue("days", String(diff), { shouldDirty: true });
      }
    }
  }, [startDate, endDate]);

  const onSubmit = async (data) => {
    try {
      const payload = {
        employee_id:   isAdminOrHR ? data.employeeId : user.employee_id,
        leave_type_id: Number(data.leave_type_id),
        start_date:    data.start_date,
        end_date:      data.end_date,
        days:          data.days ? Number(data.days) : null,
        reason:        data.reason || null,
        created_by:    user?.employee_id ?? null,
        // Admin/HR creates leave as APPROVED directly — no approval flow needed
        status:        isAdminOrHR ? "APPROVED" : "PENDING",
        approver_id:   isAdminOrHR ? user?.employee_id : null,
      };
      await createMutation.mutateAsync(payload);
      toast.success(
        isAdminOrHR
          ? "Leave request created and approved!"
          : "Leave request submitted successfully!"
      );
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(error?.message || "Failed to submit leave request.");
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

  const isSubmitting = createMutation.isPending;

  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) handleCancel(); }}>
      <SheetContent className="sm:max-w-xl w-full flex flex-col gap-0 p-0">

        <SheetHeader className="px-6 py-5 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <CalendarDays className="h-5 w-5 text-primary" />
            </div>
            <div>
              <SheetTitle>
                {isAdminOrHR ? "Create Leave Request" : "Apply Leave Request"}
              </SheetTitle>
              <SheetDescription>
                {isAdminOrHR
                  ? "Create and approve a leave request on behalf of an employee"
                  : "Submit a new leave request for approval"}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

              {/* Employee picker — only for Admin/HR */}
              {isAdminOrHR && (
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
              )}

              {/* Leave Type */}
              <FormField
                control={form.control}
                name="leave_type_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Leave Type <span className="text-destructive">*</span></FormLabel>
                    <Select disabled={isSubmitting || leaveTypesLoading} onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={leaveTypesLoading ? "Loading..." : "Select leave type"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {leaveTypes.map((lt) => (
                          <SelectItem key={lt.LEAVE_TYPE_ID} value={String(lt.LEAVE_TYPE_ID)}>
                            <span>{lt.NAME}</span>
                            <span className="ml-2 text-xs text-muted-foreground">({lt.CODE})</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Start + End Date */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <DatePicker
                          className="w-full"
                          placeholder="Select start date"
                          disabled={isSubmitting}
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
                  name="end_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <DatePicker
                          className="w-full"
                          placeholder="Select end date"
                          disabled={isSubmitting}
                          value={field.value ? new Date(field.value) : undefined}
                          onChange={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Days */}
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

            <div className="flex justify-end gap-2 px-6 py-4 border-t border-border shrink-0">
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <><Spinner className="mr-2 h-4 w-4" />Submitting...</>
                ) : isAdminOrHR ? "Create & Approve" : "Submit Request"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}