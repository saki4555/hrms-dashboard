// src/features/payroll/pay-structure/pay-component-dialog.jsx
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Layers } from "lucide-react";

import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

import { useCreatePayComponent, useUpdatePayComponent } from "./queries";

const schema = z.object({
  code:                z.string().min(1, "Code is required").max(50),
  name:                z.string().min(1, "Name is required").max(200),
  type:                z.enum(["EARNING", "DEDUCTION"], { required_error: "Type is required" }),
  calculation_formula: z.string().min(1, "Formula is required"),
  taxable:             z.enum(["YES", "NO"]),
});

const FORMULA_OPTIONS = [
  { value: "FIXED",            label: "Fixed Amount" },
  { value: "PCT_OF_BASIC:10",  label: "10% of Basic" },
  { value: "PCT_OF_BASIC:20",  label: "20% of Basic" },
  { value: "PCT_OF_BASIC:30",  label: "30% of Basic" },
  { value: "PCT_OF_BASIC:40",  label: "40% of Basic" },
  { value: "PCT_OF_BASIC:50",  label: "50% of Basic" },
  { value: "PCT_OF_BASIC:60",  label: "60% of Basic" },
  { value: "ATTENDANCE_BASED", label: "Attendance Based" },
];

export default function PayComponentDialog({ open, onOpenChange, component, showConfirmation }) {
  const isEdit = !!component;

  const { mutate: create, isPending: isCreating } = useCreatePayComponent();
  const { mutate: update, isPending: isUpdating } = useUpdatePayComponent();
  const isPending = isCreating || isUpdating;

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { code: "", name: "", type: "EARNING", calculation_formula: "FIXED", taxable: "YES" },
  });

  const { formState: { isDirty } } = form;

  useEffect(() => {
    if (open) {
      form.reset(isEdit ? {
        code:                component.CODE,
        name:                component.NAME,
        type:                component.TYPE,
        calculation_formula: component.CALCULATION_FORMULA ?? "FIXED",
        taxable:             component.TAXABLE ?? "YES",
      } : {
        code: "", name: "", type: "EARNING", calculation_formula: "FIXED", taxable: "YES",
      });
    }
  }, [open, component]);

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

  const onSubmit = (data) => {
    if (isEdit) {
      update(
        { id: component.COMPONENT_ID, ...data },
        {
          onSuccess: () => { toast.success("Component updated."); form.reset(); onOpenChange(false); },
          onError:   (err) => toast.error(err.message),
        }
      );
    } else {
      create(data, {
        onSuccess: () => { toast.success("Component created."); form.reset(); onOpenChange(false); },
        onError:   (err) => toast.error(err.message),
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) handleCancel(); }}>
      <SheetContent className="sm:max-w-md w-full flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 py-5 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <Layers className="h-5 w-5 text-primary" />
            </div>
            <div>
              <SheetTitle>{isEdit ? "Edit Component" : "Add Pay Component"}</SheetTitle>
              <SheetDescription>
                {isEdit ? "Update component details" : "Define a new pay or deduction component"}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

              <FormField control={form.control} name="code" render={({ field }) => (
                <FormItem>
                  <FormLabel>Code <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. BASIC, HRA, MEDICAL"
                      disabled={isEdit || isPending}
                      {...field}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Name <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Basic Salary" disabled={isPending} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Type <span className="text-destructive">*</span></FormLabel>
                  <Select disabled={isPending} onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="EARNING">Earning</SelectItem>
                      <SelectItem value="DEDUCTION">Deduction</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="calculation_formula" render={({ field }) => (
                <FormItem>
                  <FormLabel>Calculation Formula <span className="text-destructive">*</span></FormLabel>
                  <Select disabled={isPending} onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {FORMULA_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="taxable" render={({ field }) => (
                <FormItem>
                  <FormLabel>Taxable</FormLabel>
                  <Select disabled={isPending} onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="YES">Yes</SelectItem>
                      <SelectItem value="NO">No</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

            </div>

            <div className="flex justify-end gap-2 px-6 py-4 border-t border-border shrink-0">
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? <><Spinner className="mr-2 h-4 w-4" />{isEdit ? "Saving..." : "Creating..."}</>
                  : isEdit ? "Save Changes" : "Create Component"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}