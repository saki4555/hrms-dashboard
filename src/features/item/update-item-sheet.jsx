import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
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
import { Package } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useUpdateItem } from "./queries";

// ১. Top-এ BASE এবং fetchJSON যোগ করো (existing imports এর পরে)
const BASE = import.meta.env.VITE_API_BASE_URL;
const fetchJSON = async (url) => {
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `${res.status} ${res.statusText}`);
  }
  const json = await res.json();
  return json.data ?? json;
};

// ২. useQuery import যোগ করো
import { useQuery } from "@tanstack/react-query";

// ৩. UOM hook যোগ করো
const useUoms = () =>
  useQuery({
    queryKey: ["uoms"],
    queryFn: () => fetchJSON(`${BASE}/api/inv-uom`),
    staleTime: 10 * 60 * 1000,
  });

  const useInvTypes = () =>
    useQuery({
      queryKey: ["invTypes"],
      queryFn: () => fetchJSON(`${BASE}/api/inv-type`),
      staleTime: 10 * 60 * 1000,
    });

const formSchema = z.object({
  name:        z.string().min(1, "Name is required").max(1000),
  description: z.string().max(1000).optional(),
  model:       z.string().max(50).optional(),
  brandId:     z.string().max(100).optional(),
  sizeId:      z.string().max(100).optional(),
  originId:    z.coerce.number().optional(),
  categoryId:  z.coerce.number().optional(),
  price:       z.coerce.number().min(0).optional(),
  unitId:      z.coerce.number().optional(),
  typeId:      z.coerce.number().optional(),
  colorId:     z.coerce.number().optional(),
  minLevel:    z.coerce.number().min(0).optional(),
  status:      z.string().min(1, "Status is required"),
  subcatId:    z.coerce.number().optional(),
  unit:        z.string().max(20).optional(),
});

export default function UpdateItemSheet({ open, onOpenChange, showConfirmation, item }) {
  const updateMutation = useUpdateItem();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "", description: "", model: "", brandId: "", sizeId: "",
      originId: "", categoryId: "", price: "", unitId: "", typeId: "",
      colorId: "", minLevel: "", status: "1", subcatId: "", unit: "",
    },
  });

  const { formState: { isDirty } } = form;

  useEffect(() => {
    if (item) {
      form.reset({
        name:        item.NAME        || "",
        description: item.DESCRIPTION || "",
        model:       item.MODEL       || "",
        brandId:     item.BRAND_ID    || "",
        sizeId:      item.SIZE_ID     || "",
        originId:    item.ORIGIN_ID   ?? "",
        categoryId:  item.CATEGORY_ID ?? "",
        price:       item.PRICE       ?? "",
        unitId:      item.UNIT_ID     ?? "",
        typeId:      item.TYPE_ID     ?? "",
        colorId:     item.COLOR_ID    ?? "",
        minLevel:    item.MIN_LEVEL   ?? "",
        status:      item.STATUS      != null ? String(item.STATUS) : "1",
        subcatId:    item.SUBCAT_ID   ?? "",
        unit:        item.UNIT        || "",
      });
    }
  }, [item]);

  const onSubmit = async (data) => {
    if (!item?.ITEM_ID) { toast.error("Item ID is missing."); return; }
    try {
      await updateMutation.mutateAsync({
        itemId: item.ITEM_ID,
        data: {
          name:        data.name,
          description: data.description || null,
          model:       data.model       || null,
          brandId:     data.brandId     || null,
          sizeId:      data.sizeId      || null,
          originId:    data.originId    || null,
          categoryId:  data.categoryId  || null,
          price:       data.price       || null,
          unitId:      data.unitId      || null,
          typeId:      data.typeId      || null,
          colorId:     data.colorId     || null,
          minLevel:    data.minLevel    ?? 0,
          status:      Number(data.status),
          subcatId:    data.subcatId    || null,
          unit:        data.unit        || null,
        },
      });
      toast.success("Item updated successfully!");
      form.reset();
      onOpenChange(false);
    } catch (err) {
      toast.error(err?.message || "Failed to update item. Please try again.");
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

const { data: uoms = [], isLoading: uomsLoading } = useUoms();
const { data: invTypes = [], isLoading: invTypesLoading } = useInvTypes();
  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) handleCancel(); }}>
      <SheetContent className="sm:max-w-xl w-full flex flex-col gap-0 p-0">

        {/* Header */}
        <SheetHeader className="px-6 py-5 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <SheetTitle>Update Item</SheetTitle>
              <SheetDescription>Editing item #{item?.ITEM_ID}</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

              {/* Status */}
              {/* <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status <span className="text-destructive">*</span></FormLabel>
                  <Select disabled={isSubmitting} onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="1">Active</SelectItem>
                      <SelectItem value="0">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} /> */}

              {/* Name */}
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Name <span className="text-destructive">*</span></FormLabel>
                  <FormControl><Input placeholder="Item name" disabled={isSubmitting} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Description */}
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Optional description" className="resize-none" rows={2} disabled={isSubmitting} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Model + Unit */}
          
<div className="grid grid-cols-2 gap-4">
  {/* <FormField control={form.control} name="model" render={({ field }) => (
    <FormItem>
      <FormLabel>Model</FormLabel>
      <FormControl><Input placeholder="Model" disabled={isSubmitting} {...field} /></FormControl>
      <FormMessage />
    </FormItem>
  )} /> */}
  <FormField control={form.control} name="unitId" render={({ field }) => (
    <FormItem>
      <FormLabel>Unit</FormLabel>
      <Select
        disabled={isSubmitting || uomsLoading}
        onValueChange={(val) => {
          field.onChange(Number(val));
          const selected = uoms.find(u => String(u.ID) === val);
          if (selected) form.setValue("unit", selected.NAME);
        }}
        value={field.value ? String(field.value) : ""}
      >
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder={uomsLoading ? "Loading..." : "Select unit"} />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          {uoms.map((u) => (
            <SelectItem key={u.ID} value={String(u.ID)}>
              {u.NAME}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  )} />

   {/* <FormField control={form.control} name="typeId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type ID</FormLabel>
                    <FormControl><Input type="number" placeholder="Type" disabled={isSubmitting} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} /> */}

                 <FormField control={form.control} name="typeId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select
                      disabled={isSubmitting || invTypesLoading}
                      onValueChange={(val) => field.onChange(Number(val))}
                      value={field.value ? String(field.value) : ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={invTypesLoading ? "Loading..." : "Select type"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {invTypes.map((t) => (
                          <SelectItem key={t.ID} value={String(t.ID)}>
                            {t.DESCRIPTIO}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
</div>

              {/* Brand + Size */}
              {/* <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="brandId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand ID</FormLabel>
                    <FormControl><Input placeholder="Brand" disabled={isSubmitting} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="sizeId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Size ID</FormLabel>
                    <FormControl><Input placeholder="Size" disabled={isSubmitting} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div> */}

              {/* Price + Min Level */}
              <div className="grid grid-cols-2 gap-4">
                {/* <FormField control={form.control} name="price" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl><Input type="number" step="0.01" placeholder="0.00" disabled={isSubmitting} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} /> */}
                <FormField control={form.control} name="minLevel" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min Level</FormLabel>
                    <FormControl><Input type="number" placeholder="0" disabled={isSubmitting} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                 <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status <span className="text-destructive">*</span></FormLabel>
                    <Select disabled={isSubmitting} onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="1">Active</SelectItem>
                        <SelectItem value="0">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {/* Category + Origin */}
              {/* <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="categoryId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category ID</FormLabel>
                    <FormControl><Input type="number" placeholder="Category" disabled={isSubmitting} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="originId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Origin ID</FormLabel>
                    <FormControl><Input type="number" placeholder="Origin" disabled={isSubmitting} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div> */}

              {/* Type + Color */}
              <div className="grid grid-cols-2 gap-4">
                {/* <FormField control={form.control} name="typeId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type ID</FormLabel>
                    <FormControl><Input type="number" placeholder="Type" disabled={isSubmitting} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} /> */}
                {/* <FormField control={form.control} name="colorId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color ID</FormLabel>
                    <FormControl><Input type="number" placeholder="Color" disabled={isSubmitting} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} /> */}
              </div>

              {/* Unit ID + Subcat */}
              <div className="grid grid-cols-2 gap-4">
                {/* <FormField control={form.control} name="unitId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit ID</FormLabel>
                    <FormControl><Input type="number" placeholder="Unit ID" disabled={isSubmitting} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} /> */}
                {/* <FormField control={form.control} name="subcatId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subcat ID</FormLabel>
                    <FormControl><Input type="number" placeholder="Subcategory" disabled={isSubmitting} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} /> */}
                 {/* <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status <span className="text-destructive">*</span></FormLabel>
                    <Select disabled={isSubmitting} onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="1">Active</SelectItem>
                        <SelectItem value="0">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} /> */}
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
                  "Update Item"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}