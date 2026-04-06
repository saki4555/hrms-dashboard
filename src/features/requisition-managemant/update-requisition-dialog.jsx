import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { ClipboardList } from "lucide-react";

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
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";

import { useUpdateRequisition } from "./queries";

// ─── Schema ───────────────────────────────────────────────────────────────
const formSchema = z.object({
  challan_no: z.string().max(40).optional(),
  dreiver_no: z.string().max(30).optional(),
  vehicle_no: z.string().max(30).optional(),
  remarks:    z.string().max(100).optional(),
  status:     z.coerce.number(),
});

const STATUS_OPTIONS = [
  { value: "0", label: "Pending"    },
  { value: "1", label: "Approved"   },
  { value: "2", label: "Dispatched" },
];

// ─── Component ────────────────────────────────────────────────────────────
export default function UpdateRequisitionDialog({
  open, onOpenChange, showConfirmation, requisition,
}) {
  const updateMutation = useUpdateRequisition();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      challan_no: "",
      dreiver_no: "",
      vehicle_no: "",
      remarks:    "",
      status:     0,
    },
  });

  const { formState: { isDirty } } = form;

  useEffect(() => {
    if (requisition) {
      form.reset({
        challan_no: requisition.CHALLAN_NO  || "",
        dreiver_no: requisition.DREIVER_NO  || "",
        vehicle_no: requisition.VEHICLE_NO  || "",
        remarks:    requisition.REMARKS     || "",
        status:     requisition.STATUS      ?? 0,
      });
    }
  }, [requisition]);

  const onSubmit = async (data) => {
    if (!requisition?.TID) return toast.error("Requisition ID is missing");
    try {
      await updateMutation.mutateAsync({
        id:   requisition.TID,
        data: {
          status:     data.status,
          challan_no: data.challan_no || null,
          dreiver_no: data.dreiver_no || null,
          vehicle_no: data.vehicle_no || null,
          remarks:    data.remarks    || null,
        },
      });
      toast.success("Requisition updated successfully!");
      onOpenChange(false);
    } catch (err) {
      toast.error(err?.message || "Failed to update requisition.");
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

  const isSubmitting = updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleCancel(); }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <ClipboardList className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Update Requisition</DialogTitle>
              <DialogDescription>
                Editing Requisition #{requisition?.TID}
                {requisition?.TDATE && (
                  <span className="ml-2 text-muted-foreground">
                    — {new Date(requisition.TDATE).toLocaleDateString()}
                  </span>
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <div className="space-y-4">

            {/* Read-only info row */}
            <div className="flex gap-3 text-sm text-muted-foreground bg-muted/40 rounded-md p-3">
              <span>From Store: <strong>{requisition?.STORE_ID}</strong></span>
              <span>→</span>
              <span>To Store: <strong>{requisition?.STORE_ID_TO}</strong></span>
            </div>

            {/* Status */}
            <FormField control={form.control} name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    disabled={isSubmitting}
                    value={String(field.value)}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {/* Editable fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting}>
                {isSubmitting ? <><Spinner className="mr-2 h-4 w-4" />Updating...</> : "Update"}
              </Button>
            </DialogFooter>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}