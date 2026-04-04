import { useEffect } from "react";
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
import { DatePicker } from "@/components/DatePicker";
import { ArchiveIcon } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useUpdateInventory } from "./queries";

const formSchema = z.object({
  storeId:          z.coerce.number({ required_error: "Store ID is required" }).min(1, "Store ID is required"),
  item:             z.coerce.number({ required_error: "Item ID is required" }).min(1, "Item ID is required"),
  invQty:           z.coerce.number().min(0).optional(),
  grnNo:            z.string().max(30).optional(),
  poNo:             z.coerce.number().optional(),
  price:            z.coerce.number().min(0).optional(),
  sellingUnitPrice: z.coerce.number().min(0).optional(),
  unit:             z.string().max(10).optional(),
  unitPrice:        z.string().max(10).optional(),
  unitId:           z.coerce.number().optional(),
  inventoryType:    z.coerce.number().optional(),
  itemType:         z.coerce.number().optional(),
  accounted:        z.coerce.number().optional(),
  invDate:          z.string().optional(),
  invStatus:        z.string().optional(),
  invoiceStatus:    z.string().optional(),
});

export default function UpdateInventorySheet({ open, onOpenChange, showConfirmation, inventory }) {
  const updateMutation = useUpdateInventory();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      storeId: "", item: "", invQty: "", grnNo: "", poNo: "",
      price: "", sellingUnitPrice: "", unit: "", unitPrice: "", unitId: "",
      inventoryType: "", itemType: "", accounted: "", invDate: "",
      invStatus: "0", invoiceStatus: "0",
    },
  });

  const { formState: { isDirty } } = form;

  useEffect(() => {
    if (inventory) {
      form.reset({
        storeId:          inventory.STOREID            ?? "",
        item:             inventory.INV_ITEM_ID        ?? "",
        invQty:           inventory.INVQTY             ?? "",
        grnNo:            inventory.GRNNO              || "",
        poNo:             inventory.PONO               ?? "",
        price:            inventory.INV_PRICE          ?? "",
        sellingUnitPrice: inventory.SELLING_UNIT_PRICE ?? "",
        unit:             inventory.INV_UNIT           || "",
        unitPrice:        inventory.UNIT_PRICE         || "",
        unitId:           inventory.INV_UNIT_ID        ?? "",
        inventoryType:    inventory.INVENTORY_TYPE     ?? "",
        itemType:         inventory.ITEMTYPE           ?? "",
        accounted:        inventory.ACCOUNTED          ?? "",
        invDate:          inventory.INVDATE
          ? format(new Date(inventory.INVDATE), "yyyy-MM-dd") : "",
        invStatus:        inventory.INVSTATUS       != null ? String(inventory.INVSTATUS)      : "0",
        invoiceStatus:    inventory.INVOICE_STATUS  != null ? String(inventory.INVOICE_STATUS) : "0",
      });
    }
  }, [inventory]);

  const onSubmit = async (data) => {
    if (!inventory?.TID) { toast.error("TID is missing."); return; }
    try {
      await updateMutation.mutateAsync({
        tid: inventory.TID,
        data: {
          storeId:          data.storeId,
          item:             data.item,
          invQty:           data.invQty           || null,
          grnNo:            data.grnNo            || null,
          poNo:             data.poNo             || null,
          price:            data.price            || null,
          sellingUnitPrice: data.sellingUnitPrice || null,
          unit:             data.unit             || null,
          unitPrice:        data.unitPrice        || null,
          unitId:           data.unitId           || null,
          inventoryType:    data.inventoryType    || null,
          itemType:         data.itemType         || null,
          accounted:        data.accounted        || null,
          invDate:          data.invDate          || null,
          invStatus:        Number(data.invStatus     ?? 0),
          invoiceStatus:    Number(data.invoiceStatus ?? 0),
        },
      });
      toast.success("Inventory updated successfully!");
      form.reset();
      onOpenChange(false);
    } catch (err) {
      toast.error(err?.message || "Failed to update inventory. Please try again.");
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

  const isSubmitting = updateMutation.isPending;

  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) handleCancel(); }}>
      <SheetContent className="sm:max-w-xl w-full flex flex-col gap-0 p-0">

        {/* Header */}
        <SheetHeader className="px-6 py-5 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <ArchiveIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <SheetTitle>Update Inventory</SheetTitle>
              <SheetDescription>Editing TID #{inventory?.TID}</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

              {/* Item ID + Store ID */}
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="item" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item ID <span className="text-destructive">*</span></FormLabel>
                    <FormControl><Input type="number" disabled={isSubmitting} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="storeId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Store ID <span className="text-destructive">*</span></FormLabel>
                    <FormControl><Input type="number" disabled={isSubmitting} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {/* Inv Qty + GRN No */}
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="invQty" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inv Qty</FormLabel>
                    <FormControl><Input type="number" placeholder="0" disabled={isSubmitting} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="grnNo" render={({ field }) => (
                  <FormItem>
                    <FormLabel>GRN No</FormLabel>
                    <FormControl><Input placeholder="GRN-001" disabled={isSubmitting} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {/* PO No + Inv Date */}
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="poNo" render={({ field }) => (
                  <FormItem>
                    <FormLabel>PO No</FormLabel>
                    <FormControl><Input type="number" disabled={isSubmitting} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="invDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inv Date</FormLabel>
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
                )} />
              </div>

              {/* Price + Selling Unit Price */}
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="price" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl><Input type="number" step="0.01" disabled={isSubmitting} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="sellingUnitPrice" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Selling Unit Price</FormLabel>
                    <FormControl><Input type="number" step="0.01" disabled={isSubmitting} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {/* Unit + Unit Price */}
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="unit" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <FormControl><Input disabled={isSubmitting} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="unitPrice" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit Price</FormLabel>
                    <FormControl><Input disabled={isSubmitting} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {/* Unit ID + Inventory Type */}
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="unitId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit ID</FormLabel>
                    <FormControl><Input type="number" disabled={isSubmitting} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="inventoryType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inventory Type</FormLabel>
                    <FormControl><Input type="number" disabled={isSubmitting} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {/* Inv Status + Invoice Status */}
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="invStatus" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inv Status</FormLabel>
                    <Select disabled={isSubmitting} onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="0">Pending</SelectItem>
                        <SelectItem value="1">Active</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="invoiceStatus" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice Status</FormLabel>
                    <Select disabled={isSubmitting} onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="0">Pending</SelectItem>
                        <SelectItem value="1">Invoiced</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-border shrink-0">
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <><Spinner className="mr-2 h-4 w-4" />Updating...</>
                ) : (
                  "Update Inventory"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}