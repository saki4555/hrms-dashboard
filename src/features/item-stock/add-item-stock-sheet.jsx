import { useEffect, useState, useRef } from "react";
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
import { Layers } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useQuery } from "@tanstack/react-query";
import { useCreateItemStock } from "./queries";

// ─── Fetcher ──────────────────────────────────────────────────────────────────
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

// ─── Inline hook ──────────────────────────────────────────────────────────────
const useItemSearch = (query) =>
  useQuery({
    queryKey: ["items", "search", query],
    queryFn: () =>
      fetchJSON(`${BASE}/api/item?q=${encodeURIComponent(query)}&limit=20`),
    enabled: typeof query === "string" && query.trim().length >= 2,
    staleTime: 60 * 1000,
  });

// ─── ItemSearchCombobox ───────────────────────────────────────────────────────
function ItemSearchCombobox({ value, onChange, disabled }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  const { data: items = [], isFetching } = useItemSearch(query);

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setOpen(true);
    if (!val) onChange(null);
  };

  const handleSelect = (item) => {
    onChange({ id: item.ITEM_ID, name: item.NAME });
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange(null);
    setQuery("");
    setOpen(false);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const inputValue = open ? query : (value?.name ?? "");

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Input
          ref={inputRef}
          placeholder="Search item by name or model..."
          value={inputValue}
          disabled={disabled}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          className={value && !open ? "pr-8" : ""}
          autoComplete="off"
        />
        {isFetching && open && (
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2">
            <Spinner className="h-4 w-4" />
          </span>
        )}
        {value && !open && !disabled && (
          <button
            type="button"
            onMouseDown={handleClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-lg leading-none"
            aria-label="Clear selection"
          >
            ×
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {value && query.trim().length === 0 && (
            <div className="px-3 py-2 text-sm bg-accent/50 border-b border-border">
              <span className="text-xs text-muted-foreground">Selected: </span>
              <span className="font-medium">{value.name}</span>
            </div>
          )}
          {items.length > 0 ? (
            items.map((item) => (
              <button
                key={item.ITEM_ID}
                type="button"
                className={`w-full text-left px-3 py-2 text-sm hover:bg-accent cursor-pointer ${
                  value?.id === item.ITEM_ID ? "bg-accent" : ""
                }`}
                onMouseDown={(e) => { e.preventDefault(); handleSelect(item); }}
              >
                <div className="font-medium">{item.NAME}</div>
                {item.MODEL && (
                  <div className="text-xs text-muted-foreground">{item.MODEL}</div>
                )}
              </button>
            ))
          ) : (
            query.trim().length >= 2 && !isFetching && (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                No items found.
              </div>
            )
          )}
          {query.trim().length < 2 && items.length === 0 && (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              Type at least 2 characters to search...
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Schema ───────────────────────────────────────────────────────────────────
const formSchema = z.object({
  item:         z.object({ id: z.number(), name: z.string() })
                  .nullable()
                  .refine((val) => val !== null && val.id > 0, { message: "Item is required" }),
  stockQty:     z.coerce.number().min(0).optional(),
  minimumLevel: z.coerce.number().min(0).optional(),
  status:       z.string().min(1, "Status is required"),
  price:        z.coerce.number().min(0).optional(),
  lastPrice:    z.coerce.number().min(0).optional(),
  unitId:       z.coerce.number().optional(),
  uom:          z.string().max(10).optional(),
  entryBy:      z.coerce.number().optional(),
  updateBy:     z.coerce.number().optional(),
  booked:       z.coerce.number().min(0).optional(),
});

// ─── Component ────────────────────────────────────────────────────────────────
export default function AddItemStockSheet({ open, onOpenChange, showConfirmation }) {
  const createMutation = useCreateItemStock();

  const defaultValues = {
    item: null, stockQty: "", minimumLevel: "", status: "1",
    price: "", lastPrice: "", unitId: "", uom: "", entryBy: "", updateBy: "", booked: "",
  };

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const { formState: { isDirty } } = form;

  useEffect(() => {
    if (open) form.reset(defaultValues);
  }, [open]);

  const onSubmit = async (data) => {
    try {
      await createMutation.mutateAsync({
        itemId:       data.item.id,
        stockQty:     data.stockQty      ?? 0,
        minimumLevel: data.minimumLevel  ?? 0,
        status:       Number(data.status),
        price:        data.price         || null,
        lastPrice:    data.lastPrice     || null,
        unitId:       data.unitId        || null,
        uom:          data.uom           || null,
        entryBy:      data.entryBy       || null,
        updateBy:     data.updateBy      || null,
        booked:       data.booked        ?? 0,
      });
      toast.success("Stock record created successfully!");
      form.reset(defaultValues);
      onOpenChange(false);
    } catch (err) {
      toast.error(err?.message || "Failed to create stock record. Please try again.");
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
    form.reset(defaultValues);
    onOpenChange(false);
  };

  const isSubmitting = createMutation.isPending;

  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) handleCancel(); }}>
      <SheetContent className="sm:max-w-xl w-full flex flex-col gap-0 p-0">

        {/* Header */}
        <SheetHeader className="px-6 py-5 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <Layers className="h-5 w-5 text-primary" />
            </div>
            <div>
              <SheetTitle>Add Stock Record</SheetTitle>
              <SheetDescription>Create a new item stock entry</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

              {/* Item Search */}
              <FormField control={form.control} name="item" render={({ field }) => (
                <FormItem>
                  <FormLabel>Item <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <ItemSearchCombobox
                      value={field.value}
                      onChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Stock Qty + Min Level */}
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="stockQty" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock Qty</FormLabel>
                    <FormControl><Input type="number" placeholder="0" disabled={isSubmitting} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="minimumLevel" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min Level</FormLabel>
                    <FormControl><Input type="number" placeholder="0" disabled={isSubmitting} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {/* Price + Last Price */}
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="price" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl><Input type="number" step="0.01" placeholder="0.00" disabled={isSubmitting} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="lastPrice" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Price</FormLabel>
                    <FormControl><Input type="number" step="0.01" placeholder="0.00" disabled={isSubmitting} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {/* UOM + Unit ID */}
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="uom" render={({ field }) => (
                  <FormItem>
                    <FormLabel>UOM</FormLabel>
                    <FormControl><Input placeholder="e.g. BOX, PCS" disabled={isSubmitting} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="unitId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit ID</FormLabel>
                    <FormControl><Input type="number" placeholder="Unit ID" disabled={isSubmitting} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {/* Booked + Status */}
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="booked" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Booked</FormLabel>
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

              {/* Entry By + Update By */}
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="entryBy" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entry By</FormLabel>
                    <FormControl><Input type="number" placeholder="User ID" disabled={isSubmitting} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="updateBy" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Update By</FormLabel>
                    <FormControl><Input type="number" placeholder="User ID" disabled={isSubmitting} {...field} /></FormControl>
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
                  <><Spinner className="mr-2 h-4 w-4" />Creating...</>
                ) : (
                  "Create Stock"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}