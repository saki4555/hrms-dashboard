// src\features\core-hr\employee-management\components\transfer-employee-sheet.jsx

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { addYears, format } from "date-fns";
import { ArrowLeftRight } from "lucide-react";

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { DatePicker } from "@/components/DatePicker";
import { Badge } from "@/components/ui/badge";

import { useTransferEmployee }  from "../core-hr.queries";
import { useCompanies }         from "@/features/settings/work-structure/company/queries";
import { useOrganizations }     from "@/features/settings/work-structure/organization/queries";
import { useOrgPositions }      from "@/features/settings/work-structure/position/queries";
import { useGrades }            from "@/features/settings/work-structure/hr-grade/queries";
import { CascadeCombobox }      from "./cascade-combobox";

// ── Schema ────────────────────────────────────────────────────────────────────

const schema = z
  .object({
    COMPANY_ID:     z.string().min(1, "Company is required"),
    OU_ID:          z.string().optional(),
    ORG_ID:         z.string().optional(),
    ORG_POSITION_ID: z.string().min(1, "Position is required"),
    GRADE_ID:       z.string().optional(),
    EFFECTIVE_DATE: z.string().min(1, "Effective date is required"),
    END_DATE:       z.string().optional(),
    REMARKS:        z.string().max(500).optional(),
  })
  .refine(
    (d) => {
      if (!d.END_DATE || !d.EFFECTIVE_DATE) return true;
      return new Date(d.END_DATE) > new Date(d.EFFECTIVE_DATE);
    },
    { message: "End date must be after effective date", path: ["END_DATE"] }
  );

// ── Component ─────────────────────────────────────────────────────────────────

export default function TransferEmployeeSheet({ open, onOpenChange, employee, showConfirmation }) {
  const transferMutation = useTransferEmployee();

  // ── Cascade state ──────────────────────────────────────────────────────────
  const [selectedOuId,  setSelectedOuId]  = useState(null);
  const [selectedOrgId, setSelectedOrgId] = useState(null);

  // ── Data ───────────────────────────────────────────────────────────────────
  const { data: companies    = [] } = useCompanies();
  const { data: allOrgs      = [] } = useOrganizations();
  const { data: orgPositions = [] } = useOrgPositions();
  const { data: grades       = [] } = useGrades();

  // OU = top-level orgs (no parent)
  const ouOptions = useMemo(
    () => allOrgs.filter((o) => !o.PARENT_ORG_ID),
    [allOrgs]
  );

  // Org = children of selected OU
  const orgOptions = useMemo(
    () => allOrgs.filter((o) => String(o.PARENT_ORG_ID) === String(selectedOuId)),
    [allOrgs, selectedOuId]
  );

  // Positions = HR_ORG_POSITION rows for selected Org, active only
  const filteredPositions = useMemo(
    () => orgPositions.filter(
      (p) => String(p.ORG_ID) === String(selectedOrgId) && p.STATUS === 1
    ),
    [orgPositions, selectedOrgId]
  );

  // ── Form ───────────────────────────────────────────────────────────────────
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      COMPANY_ID:      "",
      OU_ID:           "",
      ORG_ID:          "",
      ORG_POSITION_ID: "",
      GRADE_ID:        "",
      EFFECTIVE_DATE:  "",
      END_DATE:        "",
      REMARKS:         "",
    },
  });

  const { formState: { isDirty } } = form;

  // Reset everything on open
  useEffect(() => {
    if (open) {
      const today           = format(new Date(), "yyyy-MM-dd");
      const hundredYearsLater = format(addYears(new Date(), 100), "yyyy-MM-dd");
      form.reset({
        COMPANY_ID:      "",
        OU_ID:           "",
        ORG_ID:          "",
        ORG_POSITION_ID: "",
        GRADE_ID:        "",
        EFFECTIVE_DATE:  today,
        END_DATE:        hundredYearsLater,
        REMARKS:         "",
      });
      setSelectedOuId(null);
      setSelectedOrgId(null);
    }
  }, [open]);

  // Auto-update END_DATE when EFFECTIVE_DATE changes
  const effectiveDate = form.watch("EFFECTIVE_DATE");
  useEffect(() => {
    if (effectiveDate) {
      form.setValue(
        "END_DATE",
        format(addYears(new Date(effectiveDate), 100), "yyyy-MM-dd"),
        { shouldDirty: true }
      );
    }
  }, [effectiveDate]);

  // ── Submit ─────────────────────────────────────────────────────────────────
  const onSubmit = async (data) => {

    console.log("data", data);
    try {
      await transferMutation.mutateAsync({
        personId: employee.PERSON_ID,
        data: {
          COMPANY_ID:     Number(data.COMPANY_ID),
          OU_ID:          data.OU_ID           ? Number(data.OU_ID)           : null,
          ORG_ID:         data.ORG_ID          ? Number(data.ORG_ID)          : null,
          POSITION_ID:    Number(data.ORG_POSITION_ID), // HR_ORG_POSITION.ID
          GRADE_ID:       data.GRADE_ID        ? Number(data.GRADE_ID)        : null,
          EFFECTIVE_DATE: data.EFFECTIVE_DATE,
          END_DATE:       data.END_DATE        || null,
          REMARKS:        data.REMARKS         || null,
          CHANGED_BY:     "admin", // TODO: replace with logged-in user
        },
      });
      toast.success("Employee transferred successfully!");
      onOpenChange(false);
    } catch (err) {
      toast.error(err?.message || "Transfer failed. Please try again.");
    }
  };

  const handleCancel = async () => {
    if (isDirty && showConfirmation) {
      const confirmed = await showConfirmation({
        title: "Discard changes?",
        description: "You have unsaved changes. Are you sure you want to close?",
        confirmText: "Discard",
        cancelText: "Keep Editing",
        variant: "destructive",
      });
      if (!confirmed) return;
    }
    form.reset();
    setSelectedOuId(null);
    setSelectedOrgId(null);
    onOpenChange(false);
  };

  const isSubmitting = transferMutation.isPending;

  // Read-only grade label derived from selected position
 const gradeId = form.watch("GRADE_ID"); // ← outside, triggers re-render properly
const selectedGradeLabel = useMemo(() => {
  if (!gradeId) return "";
  return grades.find((g) => String(g.ID) === String(gradeId))?.GRADE ?? "";
}, [gradeId, grades]);

  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) handleCancel(); }}>
      <SheetContent className="sm:max-w-xl w-full flex flex-col gap-0 p-0">

        {/* ── Header ───────────────────────────────────────────────── */}
        <SheetHeader className="px-6 py-5 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <ArrowLeftRight className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <SheetTitle>Transfer Employee</SheetTitle>
              <SheetDescription>
                {employee
                  ? `${employee.FIRST_NAME} ${employee.LAST_NAME} (${employee.EMP_NO})`
                  : "Assign employee to a new position or organization"}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* ── Form ─────────────────────────────────────────────────── */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

              {/* Company */}
              <FormField
                control={form.control}
                name="COMPANY_ID"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company <span className="text-destructive">*</span></FormLabel>
                    <Select disabled={isSubmitting} onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {companies.map((c) => (
                          <SelectItem key={c.COMPANY_ID} value={String(c.COMPANY_ID)}>
                            {c.COMPANY_NAME}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* OU → Org cascade */}
              <div className="grid grid-cols-2 gap-4">

                {/* Operational Unit — top-level orgs (PARENT_ORG_ID is null) */}
                <FormField
                  control={form.control}
                  name="OU_ID"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Operational Unit</FormLabel>
                      <CascadeCombobox
                        value={ouOptions.find((o) => String(o.ID) === field.value)?.NAME ?? ""}
                        items={ouOptions}
                        idKey="ID"
                        nameKey="NAME"
                        placeholder="Select OU"
                        disabled={isSubmitting}
                        onSelect={(item) => {
                          field.onChange(String(item.ID));
                          setSelectedOuId(item.ID);
                          // Reset downstream
                          form.setValue("ORG_ID",          "");
                          form.setValue("ORG_POSITION_ID", "");
                          form.setValue("GRADE_ID",         "");
                          setSelectedOrgId(null);
                        }}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Organization — children of selected OU */}
                <FormField
                  control={form.control}
                  name="ORG_ID"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization</FormLabel>
                      <CascadeCombobox
                        value={orgOptions.find((o) => String(o.ID) === field.value)?.NAME ?? ""}
                        items={orgOptions}
                        idKey="ID"
                        nameKey="NAME"
                        placeholder={!selectedOuId ? "Select OU first" : "Select org"}
                        disabled={isSubmitting || !selectedOuId}
                        onSelect={(item) => {
                          field.onChange(String(item.ID));
                          setSelectedOrgId(item.ID);
                          // Reset downstream
                          form.setValue("ORG_POSITION_ID", "");
                          form.setValue("GRADE_ID",         "");
                        }}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Position — filtered by selected Org */}
              <FormField
                control={form.control}
                name="ORG_POSITION_ID"
                render={({ field }) => {
                  const selectedPos = filteredPositions.find(
                    (p) => String(p.ID) === field.value
                  );
                  return (
                    <FormItem>
                      <FormLabel>
                        Position <span className="text-destructive">*</span>
                      </FormLabel>
                      <CascadeCombobox
                        value={selectedPos?.POSITION_TITLE ?? ""}
                        items={filteredPositions.filter((p) => p.ACTUAL_COUNT < p.FTE)} // only non-full
                        idKey="ID"
                        nameKey="POSITION_TITLE"
                        placeholder={
                          !selectedOrgId
                            ? "Select organization first"
                            : filteredPositions.length === 0
                            ? "No positions available"
                            : "Select position"
                        }
                        disabled={isSubmitting || !selectedOrgId}
                        onSelect={(pos) => {
                          field.onChange(String(pos.ID));
                          // Auto-fill grade from position
                          if (pos.GRADE) {
                            const matchedGrade = grades.find((g) => g.GRADE === pos.GRADE);
                            if (matchedGrade) {
                              form.setValue("GRADE_ID", String(matchedGrade.ID), { shouldDirty: true });
                            }
                          }
                        }}
                      />
                      {/* Show full positions as a hint */}
                      {selectedOrgId && filteredPositions.some((p) => p.ACTUAL_COUNT >= p.FTE) && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {filteredPositions.filter((p) => p.ACTUAL_COUNT >= p.FTE).length} position(s) hidden — already at full capacity
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              {/* Grade — read-only, auto-filled */}
              <FormItem>
                <FormLabel>Grade</FormLabel>
                <Input
                  readOnly
                  disabled
                  value={selectedGradeLabel}
                  placeholder="Auto-filled from selected position"
                  className="bg-muted/50 cursor-not-allowed"
                />
              </FormItem>

              {/* Effective Date + End Date */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="EFFECTIVE_DATE"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Effective Date <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <DatePicker
                          className="w-full"
                          placeholder="Select date"
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
                  name="END_DATE"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <DatePicker
                          className="w-full"
                          placeholder="Select date"
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

              {/* Remarks */}
              <FormField
                control={form.control}
                name="REMARKS"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remarks</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Reason for transfer..."
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

            {/* ── Footer ───────────────────────────────────────────── */}
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-border shrink-0">
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? <><Spinner className="mr-2 h-4 w-4" />Transferring...</>
                  : "Confirm Transfer"
                }
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}