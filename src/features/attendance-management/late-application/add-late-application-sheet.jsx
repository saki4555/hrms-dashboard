// src/features/attendance-management/late-application/add-late-application-sheet.jsx
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, ChevronsUpDown, Check } from "lucide-react";
import { IconX } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { getAvatarColor } from "@/lib/avatar-utils";
import { Spinner } from "@/components/ui/spinner";
import { DatePicker } from "@/components/DatePicker";
import { useAuthV2 as useAuth } from "@/features/authentication-v2/use-auth-v2";
import { useEmployeeLiteSearch } from "@/hooks/use-lite-search";
import { useCreateLateApplication } from "./queries";

// ── Schema ────────────────────────────────────────────────────────────────────

const formSchema = z.object({
  employeeId:     z.number({ required_error: "Employee is required" }),
  late_date:      z.string().min(1, "Late date is required"),
  actual_in_time: z.string().optional(),
  reason:         z.string().max(2000, "Reason cannot exceed 2000 characters").optional(),
});

// ── Component ─────────────────────────────────────────────────────────────────

export default function AddLateApplicationSheet({
  open,
  onOpenChange,
  showConfirmation,
  isAdminOrHR,
}) {
  const { user } = useAuth();
  const createMutation = useCreateLateApplication();

  const [empOpen, setEmpOpen]               = useState(false);
  const [empSearch, setEmpSearch]           = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const { data: employees = [], isFetching: empFetching } = useEmployeeLiteSearch(empSearch);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      employeeId:     isAdminOrHR ? undefined : user?.employee_id,
      late_date:      "",
      actual_in_time: "",
      reason:         "",
    },
  });

  const { formState: { isDirty } } = form;

  // Reset on open
  useEffect(() => {
    if (open) {
      form.reset({
        employeeId:     isAdminOrHR ? undefined : user?.employee_id,
        late_date:      "",
        actual_in_time: "",
        reason:         "",
      });
      setSelectedEmployee(null);
      setEmpSearch("");
    }
  }, [open]);

  const onSubmit = async (data) => {
    const targetEmployeeId = isAdminOrHR ? data.employeeId : user?.employee_id;
    const targetName       = isAdminOrHR ? selectedEmployee?.name : "your";

    // Confirmation dialog
    const confirmed = await showConfirmation({
      title:       isAdminOrHR ? "Create & Approve Late Application?" : "Submit Late Application?",
      description: isAdminOrHR
        ? `This will immediately approve ${targetName}'s late application for ${data.late_date}.`
        : `Submit late application for ${data.late_date}? Your supervisor will be notified.`,
      confirmText: isAdminOrHR ? "Yes, Create & Approve" : "Yes, Submit",
      cancelText:  "Review Again",
      variant:     "default",
    });
    if (!confirmed) return;

    try {
      // Combine late_date + actual_in_time into a full ISO timestamp
      // e.g. "2025-01-15" + "09:35" → "2025-01-15T09:35:00.000Z"
      let actualInTimestamp = null;
      if (data.late_date && data.actual_in_time) {
        actualInTimestamp = new Date(`${data.late_date}T${data.actual_in_time}`).toISOString();
      }

      const payload = {
        person_id:      targetEmployeeId,
        late_date:      data.late_date,
        actual_in_time: actualInTimestamp,
        reason:         data.reason || null,
        created_by:     user?.employee_id ?? null,
        status:         isAdminOrHR ? "APPROVED" : "PENDING",
        approver_id:    isAdminOrHR ? (user?.employee_id ?? user?.id ?? null) : null,
      };

      await createMutation.mutateAsync(payload);
      toast.success(
        isAdminOrHR
          ? "Late application created and approved!"
          : "Late application submitted successfully!"
      );
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(error?.message || "Failed to submit late application.");
    }
  };

  const handleCancel = async () => {
    if (isDirty && showConfirmation) {
      const confirmed = await showConfirmation({
        title:       "Discard changes?",
        description: "You have unsaved changes. Are you sure you want to close without saving?",
        confirmText: "Discard",
        cancelText:  "Keep Editing",
        variant:     "destructive",
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

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <SheetHeader className="px-6 py-5 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <SheetTitle>
                {isAdminOrHR ? "Create Late Application" : "Apply for Late"}
              </SheetTitle>
              <SheetDescription>
                {isAdminOrHR
                  ? "Create and approve a late application on behalf of an employee"
                  : "Submit a late arrival application for supervisor approval"}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* ── Form ───────────────────────────────────────────────────────── */}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col flex-1 overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

              {/* Employee picker — Admin/HR only */}
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
                                "w-full justify-between font-normal px-2",
                                !selectedEmployee && "text-muted-foreground",
                              )}
                            >
                              {selectedEmployee ? (
                                <div className="flex items-center gap-2 min-w-0">
                                  <Avatar className="h-5 w-5 shrink-0">
                                    <AvatarImage
                                      src={`${import.meta.env.VITE_API_BASE_URL}/api/emp-images/person/${selectedEmployee.id}`}
                                    />
                                    <AvatarFallback
                                      className={cn(
                                        "text-[10px] font-semibold text-white",
                                        getAvatarColor(selectedEmployee.name),
                                      )}
                                    >
                                      {selectedEmployee.name
                                        ?.split(" ")
                                        .map((n) => n[0])
                                        .join("")
                                        .slice(0, 2)
                                        .toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="truncate text-sm text-foreground">
                                    {selectedEmployee.name}
                                  </span>
                                  {selectedEmployee.empNo && (
                                    <span className="text-xs text-muted-foreground shrink-0">
                                      ({selectedEmployee.empNo})
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span>Search by name or emp no...</span>
                              )}
                              <div className="flex items-center gap-0.5 ml-1 shrink-0">
                                {selectedEmployee && (
                                  <span
                                    role="button"
                                    className="rounded p-0.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedEmployee(null);
                                      setEmpSearch("");
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
                                    <Avatar className="h-6 w-6 shrink-0 mr-2">
                                      <AvatarImage
                                        src={`${import.meta.env.VITE_API_BASE_URL}/api/emp-images/person/${emp.id}`}
                                      />
                                      <AvatarFallback
                                        className={cn(
                                          "text-[10px] font-semibold text-white",
                                          getAvatarColor(emp.name),
                                        )}
                                      >
                                        {emp.name
                                          ?.split(" ")
                                          .map((n) => n[0])
                                          .join("")
                                          .slice(0, 2)
                                          .toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="truncate">{emp.name}</span>
                                    <span className="ml-auto text-xs text-muted-foreground shrink-0">
                                      {emp.empNo}
                                    </span>
                                    <Check
                                      className={cn(
                                        "ml-2 h-4 w-4 shrink-0",
                                        selectedEmployee?.id === emp.id
                                          ? "opacity-100"
                                          : "opacity-0",
                                      )}
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
              )}

              {/* Late Date + Actual In Time — same row */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="late_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Late Date <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <DatePicker
                          className="w-full"
                          placeholder="Select date"
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

                <FormField
                  control={form.control}
                  name="actual_in_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Actual In Time</FormLabel>
                      <FormControl>
                        {/* Native time input — simple and reliable */}
                        <Input
                          type="time"
                          disabled={isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Reason */}
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Optional: explain why you were late"
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
                  <><Spinner className="mr-2 h-4 w-4" />Submitting...</>
                ) : isAdminOrHR ? (
                  "Create & Approve"
                ) : (
                  "Submit Application"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}