import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { DatePicker } from "@/components/DatePicker";

import { ComboboxField } from "./combobox-field";
import { PositionComboboxField } from "./position-combobox-field";
import { SheetFormFooter, DISCARD_CONFIRM, employeeBasePayload, addrToPayload, fd, parseDate } from "./sheet-helper";
import { assignmentSchema } from "./employee-detail-schemas";
import { useUpdateEmployee } from "../queries";
import { useCompanies } from "@/features/settings/work-structure/company/queries";
import { useOrganizations } from "@/features/settings/work-structure/organization/queries";
import { useOrgPositions } from "@/features/settings/work-structure/position/queries";
import { useGrades } from "@/features/settings/work-structure/hr-grade/queries";

export function EditAssignmentSheet({ employee, open, onClose, showConfirmation }) {
  const { mutateAsync, isPending } = useUpdateEmployee();
  const { data: companies = [],     isLoading: compL }    = useCompanies();
  const { data: organizations = [], isLoading: orgL }     = useOrganizations();
  const { data: orgPositions = [],  isLoading: posL }     = useOrgPositions();
  const { data: grades = [] }                             = useGrades();
  const [selectedOrgId, setSelectedOrgId] = useState(null);
  const [formSeeded, setFormSeeded] = useState(false);

  const filteredPositions = useMemo(
    () => (!selectedOrgId ? [] : orgPositions.filter((p) => String(p.ORG_ID) === String(selectedOrgId))),
    [orgPositions, selectedOrgId],
  );

  const form = useForm({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      companyId: "", ouId: "", orgId: "", positionId: "",
      orgPositionId: "", gradeId: "", payrollId: "",
    },
  });

  const { isDirty } = form.formState;

  useEffect(() => {
    if (!open || !employee) return;
    const a = employee.assignment;
    if (a?.ORG_ID) setSelectedOrgId(a.ORG_ID);
    form.reset({
      companyId:                    a?.COMPANY_ID?.toString() || "",
      ouId:                         a?.OU_ID?.toString() || "",
      orgId:                        a?.ORG_ID?.toString() || "",
      positionId:                   "",
      orgPositionId:                "",
      gradeId:                      a?.GRADE_ID?.toString() || "",
      payrollId:                    a?.PAYROLL_ID?.toString() || "",
      assignmentEffectiveStartDate: parseDate(a?.EFFECTIVE_START_DATE),
      assignmentEffectiveEndDate:   parseDate(a?.EFFECTIVE_END_DATE),
    });
    setFormSeeded(true);
  }, [open, employee]);

  // Resolve position once orgPositions have loaded
  useEffect(() => {
    if (!formSeeded || !employee || !orgPositions.length) return;
    const a = employee.assignment;
    const match = orgPositions.find(
      (p) => String(p.ID) === String(a?.POSITION_ID) && String(p.ORG_ID) === String(a?.ORG_ID),
    );
    if (match) {
      form.setValue("positionId", String(match.POSITION_ID), { shouldValidate: false });
      form.setValue("orgPositionId", String(match.ID), { shouldValidate: false });
      if (match.GRADE) {
        const g = grades.find((g) => g.GRADE === match.GRADE);
        if (g) form.setValue("gradeId", String(g.ID), { shouldValidate: false });
      }
    }
  }, [formSeeded, employee, orgPositions, grades]);

  const handleAttemptClose = async () => {
    if (isDirty) {
      const ok = await showConfirmation(DISCARD_CONFIRM);
      if (!ok) return;
    }
    form.reset();
    setFormSeeded(false);
    onClose();
  };

  const onSubmit = async (data) => {
    try {
      await mutateAsync({
        personId: employee.PERSON_ID,
        data: {
          employee: employeeBasePayload(employee),
          address: {
            present:   addrToPayload(employee.presentAddress),
            permanent: addrToPayload(employee.permanentAddress),
          },
          assignment: {
            COMPANY_ID:           parseInt(data.companyId),
            OU_ID:                parseInt(data.ouId),
            ORG_ID:               parseInt(data.orgId),
            POSITION_ID:          parseInt(data.orgPositionId),
            PAYROLL_ID:           parseInt(data.payrollId),
            GRADE_ID:             parseInt(data.gradeId),
            EFFECTIVE_START_DATE: fd(data.assignmentEffectiveStartDate),
            EFFECTIVE_END_DATE:   fd(data.assignmentEffectiveEndDate),
          },
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

  // Grade display value
  const gradeValue = form.watch("gradeId");
  const gradeLabel = grades.find((g) => String(g.ID) === String(gradeValue))?.GRADE || "";

  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) handleAttemptClose(); }}>
      <SheetContent className="sm:max-w-xl  flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 py-5 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <Building2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <SheetTitle>Assignment</SheetTitle>
              <SheetDescription>Update organisation, position, grade, and assignment period.</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

              <ComboboxField
                form={form} name="companyId" label="Company"
                items={companies} idKey="COMPANY_ID" nameKey="COMPANY_NAME"
                placeholder={compL ? "Loading…" : "Select company"}
                disabled={isPending || compL}
              />

              <ComboboxField
                form={form} name="ouId" label="Operational Unit"
                items={organizations} idKey="ID" nameKey="NAME"
                placeholder={orgL ? "Loading…" : "Select operational unit"}
                disabled={isPending || orgL}
              />

              <ComboboxField
                form={form} name="orgId" label="Organisation"
                items={organizations} idKey="ID" nameKey="NAME"
                placeholder={orgL ? "Loading…" : "Select organisation"}
                disabled={isPending || orgL}
                onSelect={(org) => {
                  setSelectedOrgId(org.ID);
                  form.setValue("positionId", "",    { shouldValidate: false });
                  form.setValue("orgPositionId", "", { shouldValidate: false });
                  form.setValue("gradeId", "",       { shouldValidate: false });
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
                      Grade <span className="text-muted-foreground text-xs">(auto-filled)</span>
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          readOnly disabled
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
                    <FormLabel className="text-sm font-medium">Payroll ID *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter payroll ID" disabled={isPending} {...field} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <Separator />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assignment Period</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="assignmentEffectiveStartDate"
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
                  name="assignmentEffectiveEndDate"
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