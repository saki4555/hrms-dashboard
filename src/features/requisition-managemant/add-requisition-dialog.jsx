import { useEffect} from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { ClipboardList, Plus, Trash2 } from "lucide-react";

import {
  Dialog, DialogContent, DialogHeader,
  DialogFooter, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form, FormControl, FormField,
  FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";

import { useCreateRequisition } from "./queries";

// ─── Schema ───────────────────────────────────────────────────────────────
const itemSchema = z.object({
  itemid:    z.coerce.number({ required_error: "Required" }).min(1, "Required"),
  app_qty:   z.coerce.number({ required_error: "Required" }).min(1, "Min 1"),
  tot_qty:   z.coerce.number().min(0).optional().nullable(),
  than:      z.coerce.number().min(0).optional().nullable(),
  uom:       z.string().max(10).optional(),
  frm_store: z.coerce.number({ required_error: "Required" }).min(1, "Required"),
  store_id:  z.coerce.number({ required_error: "Required" }).min(1, "Required"),
  remarks:   z.string().max(100).optional(),
});

const formSchema = z.object({
  tdate:       z.string().min(1, "Date is required"),
  entry_by:    z.coerce.number({ required_error: "Required" }).min(1, "Required"),
  store_id:    z.coerce.number({ required_error: "Required" }).min(1, "Required"),
  store_id_to: z.coerce.number({ required_error: "Required" }).min(1, "Required"),
  challan_no:  z.string().max(40).optional(),
  dreiver_no:  z.string().max(30).optional(),
  vehicle_no:  z.string().max(30).optional(),
  remarks:     z.string().max(100).optional(),
  items:       z.array(itemSchema).min(1, "Add at least one item"),
});

// ─── Component ────────────────────────────────────────────────────────────
export default function AddRequisitionDialog({ open, onOpenChange, showConfirmation }) {
  const createMutation = useCreateRequisition();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tdate:       new Date().toISOString().split("T")[0],
      entry_by:    "",
      store_id:    "",
      store_id_to: "",
      challan_no:  "",
      dreiver_no:  "",
      vehicle_no:  "",
      remarks:     "",
      items: [
        { itemid: "", app_qty: "", tot_qty: "", than: "", uom: "", frm_store: "", store_id: "", remarks: "" },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "items" });
  const { formState: { isDirty } } = form;

  useEffect(() => {
    if (open) form.reset({
      tdate:       new Date().toISOString().split("T")[0],
      entry_by:    "",
      store_id:    "",
      store_id_to: "",
      challan_no:  "",
      dreiver_no:  "",
      vehicle_no:  "",
      remarks:     "",
      items: [
        { itemid: "", app_qty: "", tot_qty: "", than: "", uom: "", frm_store: "", store_id: "", remarks: "" },
      ],
    });
  }, [open]);

  const onSubmit = async (data) => {
    try {
      const { items, ...master } = data;
      await createMutation.mutateAsync({ master, items });
      toast.success("Requisition created successfully!");
      form.reset();
      onOpenChange(false);
    } catch (err) {
      toast.error(err?.message || "Failed to create requisition.");
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
    onOpenChange(false);
  };

  const isSubmitting = createMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleCancel(); }}>
      <DialogContent className="sm:max-w-[720px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <ClipboardList className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Add Requisition</DialogTitle>
              <DialogDescription>Create a new store requisition</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <div className="space-y-5">

            {/* ── Master Header ─────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="tdate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input type="date" disabled={isSubmitting} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="entry_by"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entry By <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="User ID" disabled={isSubmitting} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="store_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>From Store <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Store ID" disabled={isSubmitting} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="store_id_to"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>To Store <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Store ID" disabled={isSubmitting} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="challan_no"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Challan No</FormLabel>
                    <FormControl>
                      <Input placeholder="CH-001" disabled={isSubmitting} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="dreiver_no"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Driver No</FormLabel>
                    <FormControl>
                      <Input placeholder="DRV-12" disabled={isSubmitting} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="vehicle_no"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehicle No</FormLabel>
                    <FormControl>
                      <Input placeholder="DHA-1234" disabled={isSubmitting} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="remarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remarks</FormLabel>
                    <FormControl>
                      <Input placeholder="Optional note" disabled={isSubmitting} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* ── Items ─────────────────────────────────────── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  Items <span className="text-destructive">*</span>
                </p>
                <Button
                  type="button" size="sm" variant="outline"
                  onClick={() => append({
                    itemid: "", app_qty: "", tot_qty: "", than: "",
                    uom: "", frm_store: "", store_id: "", remarks: "",
                  })}
                  disabled={isSubmitting}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Row
                </Button>
              </div>

              {form.formState.errors.items?.root && (
                <p className="text-destructive text-sm">
                  {form.formState.errors.items.root.message}
                </p>
              )}
              {form.formState.errors.items?.message && (
                <p className="text-destructive text-sm">
                  {form.formState.errors.items.message}
                </p>
              )}

              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="grid grid-cols-2 md:grid-cols-4 gap-2 p-3 border rounded-md bg-muted/30 relative"
                  >
                    <span className="absolute top-2 left-3 text-xs text-muted-foreground font-mono">
                      #{index + 1}
                    </span>

                    <FormField control={form.control} name={`items.${index}.itemid`}
                      render={({ field }) => (
                        <FormItem className="mt-4">
                          <FormLabel className="text-xs">Item ID *</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="Item ID" disabled={isSubmitting} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField control={form.control} name={`items.${index}.app_qty`}
                      render={({ field }) => (
                        <FormItem className="mt-4">
                          <FormLabel className="text-xs">App Qty *</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="Qty" disabled={isSubmitting} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField control={form.control} name={`items.${index}.tot_qty`}
                      render={({ field }) => (
                        <FormItem className="mt-4">
                          <FormLabel className="text-xs">Total Qty</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="Total" disabled={isSubmitting} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField control={form.control} name={`items.${index}.than`}
                      render={({ field }) => (
                        <FormItem className="mt-4">
                          <FormLabel className="text-xs">Than</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0" disabled={isSubmitting} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField control={form.control} name={`items.${index}.uom`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">UOM</FormLabel>
                          <FormControl>
                            <Input placeholder="KG / PCS" disabled={isSubmitting} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField control={form.control} name={`items.${index}.frm_store`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">From Store *</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="Store ID" disabled={isSubmitting} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField control={form.control} name={`items.${index}.store_id`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">To Store *</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="Store ID" disabled={isSubmitting} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField control={form.control} name={`items.${index}.remarks`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Remarks</FormLabel>
                          <FormControl>
                            <Input placeholder="Optional" disabled={isSubmitting} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {fields.length > 1 && (
                      <Button
                        type="button" size="icon" variant="ghost"
                        className="absolute top-2 right-2 h-6 w-6 text-destructive hover:text-destructive"
                        onClick={() => remove(index)}
                        disabled={isSubmitting}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting}>
                {isSubmitting ? <><Spinner className="mr-2 h-4 w-4" />Creating...</> : "Save"}
              </Button>
            </DialogFooter>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}