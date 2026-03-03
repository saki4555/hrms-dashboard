import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Briefcase } from "lucide-react";
import { toast } from "sonner";

import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { DatePicker } from "@/components/DatePicker";

import { SheetFormFooter, DISCARD_CONFIRM, employeeBasePayload, addrToPayload, assignToPayload, fd, parseDate } from "./sheet-helper";
import { employmentSchema } from "./employee-detail-schemas";
import { useUpdateEmployee } from "../queries";
import { usePersonTypes } from "../../employee-types/queries";

export function EditEmploymentSheet({ employee, open, onClose, showConfirmation }) {
  const { mutateAsync, isPending } = useUpdateEmployee();
  const { data: personTypes = [], isLoading: ptLoading } = usePersonTypes();

  const form = useForm({
    resolver: zodResolver(employmentSchema),
    defaultValues: { empNo: "", personTypeId: "" },
  });

  useEffect(() => {
    if (!open || !employee) return;
    form.reset({
      empNo:               employee.EMP_NO || "",
      joinDate:            parseDate(employee.JOIN_DATE),
      personTypeId:        employee.PERSON_TYPE_ID?.toString() || "",
      effectiveStartDate:  parseDate(employee.EFFECTIVE_START_DATE),
      effectiveEndDate:    parseDate(employee.EFFECTIVEEND_DATE),
    });
  }, [open, employee]);

  const handleAttemptClose = async () => {
    if (form.formState.isDirty) {
      const ok = await showConfirmation(DISCARD_CONFIRM);
      if (!ok) return;
    }
    form.reset();
    onClose();
  };

  const onSubmit = async (data) => {
    try {
      await mutateAsync({
        personId: employee.PERSON_ID,
        data: {
          employee: {
            ...employeeBasePayload(employee),
            EMP_NO:               data.empNo,
            JOIN_DATE:            fd(data.joinDate),
            PERSON_TYPE_ID:       parseInt(data.personTypeId),
            EFFECTIVE_START_DATE: fd(data.effectiveStartDate),
            EFFECTIVEEND_DATE:    fd(data.effectiveEndDate),
          },
          address: {
            present:   addrToPayload(employee.presentAddress),
            permanent: addrToPayload(employee.permanentAddress),
          },
          assignment: assignToPayload(employee.assignment),
          STATUS: employee.STATUS,
        },
      });
      toast.success("Employment record updated!");
      form.reset(data);
      onClose();
    } catch (err) {
      toast.error(err?.message || "Failed to update.");
    }
  };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) handleAttemptClose(); }}>
      <SheetContent className="sm:max-w-lg w-full flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 py-5 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Briefcase className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <SheetTitle>Employment Record</SheetTitle>
              <SheetDescription>Update employee number, join date, person type, and effective period.</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

              <FormField
                control={form.control}
                name="empNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Employee Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter employee number" disabled={isPending} {...field} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="joinDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Join Date *</FormLabel>
                    <FormControl>
                      <DatePicker value={field.value} onChange={field.onChange} placeholder="Select join date" disabled={isPending} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="personTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Person Type *</FormLabel>
                    <Select
                      key={`pt-${field.value}-${personTypes.length}`}
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isPending || ptLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={ptLoading ? "Loading…" : "Select person type"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {personTypes.map((pt) => (
                          <SelectItem key={pt.PERSON_TYPE_ID} value={String(pt.PERSON_TYPE_ID)}>
                            {pt.PERSON_TYPE}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <Separator />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Effective Period</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="effectiveStartDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Start Date *</FormLabel>
                      <FormControl>
                        <DatePicker value={field.value} onChange={field.onChange} placeholder="Select start date" disabled={isPending} />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="effectiveEndDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">End Date *</FormLabel>
                      <FormControl>
                        <DatePicker value={field.value} onChange={field.onChange} placeholder="Select end date" disabled={isPending} />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <SheetFormFooter onCancel={handleAttemptClose} isPending={isPending} />
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}