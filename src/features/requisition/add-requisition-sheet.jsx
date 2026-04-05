import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { PlusIcon, Trash2, ClipboardListIcon } from "lucide-react";

import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/DatePicker";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";

import {
  useCreateRequisition,
  useCreateReqDetailBulk,
  useStores,
  useItemSearch,
} from "./queries";

// ─── ItemSearchCombobox ───────────────────────────────────────────────────────
function ItemSearchCombobox({ value, onChange, disabled, placeholder = "Search item..." }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const { data: items = [], isFetching } = useItemSearch(query);

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Input
          placeholder={placeholder}
          value={open ? query : (value?.name ?? "")}
          disabled={disabled}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (!e.target.value) onChange(null);
          }}
          onFocus={() => { if (!value) setOpen(true); }}
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
            onClick={() => { onChange(null); setQuery(""); setOpen(false); }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-lg leading-none"
          >×</button>
        )}
      </div>
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-52 overflow-y-auto">
          {items.length > 0
            ? items.map((item) => (
                <button
                  key={item.ITEM_ID}
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent"
                  onMouseDown={() => {
                    onChange({ id: item.ITEM_ID, name: item.NAME });
                    setQuery(""); setOpen(false);
                  }}
                >
                  <div className="font-medium">{item.NAME}</div>
                  {item.MODEL && <div className="text-xs text-muted-foreground">{item.MODEL}</div>}
                </button>
              ))
            : query.trim().length >= 2 && !isFetching && (
                <div className="px-3 py-2 text-sm text-muted-foreground">No items found.</div>
              )}
          {query.trim().length < 2 && (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              Type at least 2 characters...
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Schema ───────────────────────────────────────────────────────────────────
const masterSchema = z.object({
  tdate:       z.string().min(1, "Date is required"),
  entry_date:  z.string().optional(),
  store_id:    z.coerce.number().min(1, "From Store is required"),
  store_id_to: z.coerce.number().min(1, "To Store is required"),
  status:      z.coerce.number().optional(),
  remarks:     z.string().max(100).optional(),
  dreiver_no:  z.string().max(30).optional(),
  vehicle_no:  z.string().max(30).optional(),
  challan_no:  z.string().max(40).optional(),
});

const emptyRow = () => ({
  item: null,
  tot_qty: "",
  app_qty: "",
  uom: "",
  frm_store: "",
  status: "0",
  remarks: "",
});

// ─── Component ────────────────────────────────────────────────────────────────
export default function AddRequisitionSheet({ open, onOpenChange, showConfirmation }) {
  const createMaster = useCreateRequisition();
  const createDetails = useCreateReqDetailBulk();
  const { data: stores = [], isLoading: storesLoading } = useStores();

  const [rows, setRows] = useState([emptyRow()]);
  const [rowErrors, setRowErrors] = useState([]);

  const today = format(new Date(), "yyyy-MM-dd");

  const defaultValues = {
    tdate: today, entry_date: today,
    store_id: "", store_id_to: "",
    status: 0, remarks: "",
    dreiver_no: "", vehicle_no: "", challan_no: "",
  };

  const form = useForm({
    resolver: zodResolver(masterSchema),
    defaultValues,
  });

  const { formState: { isDirty } } = form;

  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
      setRows([emptyRow()]);
      setRowErrors([]);
    }
  }, [open]);

  // ── Row helpers ──────────────────────────────────────────────────────────────
  const addRow = () => setRows((prev) => [...prev, emptyRow()]);

  const removeRow = (idx) =>
    setRows((prev) => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev);

  const updateRow = (idx, field, value) =>
    setRows((prev) => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));

  // ── Validate rows ────────────────────────────────────────────────────────────
  const validateRows = () => {
    const errors = rows.map((r) => {
      const e = {};
      if (!r.item) e.item = "Item required";
      if (!r.tot_qty || Number(r.tot_qty) <= 0) e.tot_qty = "Required";
      return e;
    });
    setRowErrors(errors);
    return errors.every((e) => Object.keys(e).length === 0);
  };

  // ── Submit ───────────────────────────────────────────────────────────────────
  const onSubmit = async (masterData) => {
    if (!validateRows()) {
      toast.error("Please fill all required item fields.");
      return;
    }

    try {
      // Step 1 — Create master
      const result = await createMaster.mutateAsync({
        tdate:       masterData.tdate,
        entry_date:  masterData.entry_date || masterData.tdate,
        store_id:    masterData.store_id,
        store_id_to: masterData.store_id_to,
        status:      masterData.status ?? 0,
        remarks:     masterData.remarks || null,
        dreiver_no:  masterData.dreiver_no || null,
        vehicle_no:  masterData.vehicle_no || null,
        challan_no:  masterData.challan_no || null,
      });

      const tid = result.tid;

      // Step 2 — Bulk insert details
      const items = rows.map((r) => ({
        itemid:    r.item.id,
        tot_qty:   Number(r.tot_qty) || 0,
        app_qty:   Number(r.app_qty) || 0,
        uom:       r.uom || null,
        frm_store: Number(r.frm_store) || null,
        store_id:  masterData.store_id_to,
        status:    Number(r.status) || 0,
        remarks:   r.remarks || null,
      }));

      await createDetails.mutateAsync({ tid, items });

      toast.success(`Requisition #${tid} created with ${items.length} item(s)!`);
      form.reset(defaultValues);
      setRows([emptyRow()]);
      onOpenChange(false);
    } catch (err) {
      toast.error(err?.message || "Failed to create requisition.");
    }
  };

  const handleCancel = async () => {
    if ((isDirty || rows.some((r) => r.item)) && showConfirmation) {
      const confirmed = await showConfirmation({
        title: "Discard changes?",
        description: "You have unsaved changes. Close without saving?",
        confirmText: "Discard",
        cancelText: "Keep Editing",
        variant: "destructive",
      });
      if (!confirmed) return;
    }
    form.reset(defaultValues);
    setRows([emptyRow()]);
    onOpenChange(false);
  };

  const isSubmitting = createMaster.isPending || createDetails.isPending;

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) handleCancel(); }}>
      <SheetContent className="sm:max-w-2xl w-full flex flex-col gap-0 p-0">

        {/* Header */}
        <SheetHeader className="px-6 py-5 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <ClipboardListIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <SheetTitle>New Requisition</SheetTitle>
              <SheetDescription>Create master + item details</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

              {/* ── Master Section ──────────────────────────────────────────── */}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  Requisition Info
                </p>
                <div className="space-y-4">

                  {/* Date row */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="tdate" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <DatePicker
                            className="w-full"
                            placeholder="Select date"
                            disabled={isSubmitting}
                            value={field.value ? new Date(field.value) : undefined}
                            onChange={(d) => field.onChange(d ? format(d, "yyyy-MM-dd") : "")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="entry_date" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Entry Date</FormLabel>
                        <FormControl>
                          <DatePicker
                            className="w-full"
                            placeholder="Select date"
                            disabled={isSubmitting}
                            value={field.value ? new Date(field.value) : undefined}
                            onChange={(d) => field.onChange(d ? format(d, "yyyy-MM-dd") : "")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  {/* Stores row */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="store_id" render={({ field }) => (
                      <FormItem>
                        <FormLabel>From Store <span className="text-destructive">*</span></FormLabel>
                        <Select
                          disabled={isSubmitting || storesLoading}
                          onValueChange={field.onChange}
                          value={String(field.value ?? "")}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={storesLoading ? "Loading..." : "Select store"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {stores.map((s) => (
                              <SelectItem key={s.STORE_ID} value={String(s.STORE_ID)}>
                                {s.STORE_NAME}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="store_id_to" render={({ field }) => (
                      <FormItem>
                        <FormLabel>To Store <span className="text-destructive">*</span></FormLabel>
                        <Select
                          disabled={isSubmitting || storesLoading}
                          onValueChange={field.onChange}
                          value={String(field.value ?? "")}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={storesLoading ? "Loading..." : "Select store"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {stores.map((s) => (
                              <SelectItem key={s.STORE_ID} value={String(s.STORE_ID)}>
                                {s.STORE_NAME}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  {/* Challan / Vehicle / Driver */}
                  <div className="grid grid-cols-3 gap-4">
                    <FormField control={form.control} name="challan_no" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Challan No</FormLabel>
                        <FormControl>
                          <Input placeholder="CH-001" disabled={isSubmitting} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="vehicle_no" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vehicle No</FormLabel>
                        <FormControl>
                          <Input placeholder="DHK-1234" disabled={isSubmitting} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="dreiver_no" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Driver No</FormLabel>
                        <FormControl>
                          <Input placeholder="DRV-01" disabled={isSubmitting} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  {/* Remarks */}
                  <FormField control={form.control} name="remarks" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Remarks</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Optional remarks..." disabled={isSubmitting} rows={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              {/* ── Detail Items Section ────────────────────────────────────── */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Items
                    <Badge variant="secondary" className="ml-2">{rows.length}</Badge>
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addRow}
                    disabled={isSubmitting}
                  >
                    <PlusIcon className="h-3.5 w-3.5 mr-1" /> Add Row
                  </Button>
                </div>

                <div className="space-y-3">
                  {rows.map((row, idx) => (
                    <div
                      key={idx}
                      className="border border-border rounded-lg p-3 space-y-3 bg-muted/30"
                    >
                      {/* Row header */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">
                          Item #{idx + 1}
                        </span>
                        {rows.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive hover:text-destructive"
                            onClick={() => removeRow(idx)}
                            disabled={isSubmitting}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>

                      {/* Item search */}
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-foreground">
                          Item <span className="text-destructive">*</span>
                        </label>
                        <ItemSearchCombobox
                          value={row.item}
                          onChange={(v) => updateRow(idx, "item", v)}
                          disabled={isSubmitting}
                          placeholder="Search item..."
                        />
                        {rowErrors[idx]?.item && (
                          <p className="text-xs text-destructive">{rowErrors[idx].item}</p>
                        )}
                      </div>

                      {/* Qty + App Qty + UOM */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-foreground">
                            Total Qty <span className="text-destructive">*</span>
                          </label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={row.tot_qty}
                            onChange={(e) => updateRow(idx, "tot_qty", e.target.value)}
                            disabled={isSubmitting}
                            className="text-sm"
                          />
                          {rowErrors[idx]?.tot_qty && (
                            <p className="text-xs text-destructive">{rowErrors[idx].tot_qty}</p>
                          )}
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-foreground">App Qty</label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={row.app_qty}
                            onChange={(e) => updateRow(idx, "app_qty", e.target.value)}
                            disabled={isSubmitting}
                            className="text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-foreground">UOM</label>
                          <Input
                            placeholder="KG / PCS"
                            value={row.uom}
                            onChange={(e) => updateRow(idx, "uom", e.target.value)}
                            disabled={isSubmitting}
                            className="text-sm"
                          />
                        </div>
                      </div>

                      {/* From Store + Status */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-foreground">From Store</label>
                          <Select
                            disabled={isSubmitting || storesLoading}
                            onValueChange={(v) => updateRow(idx, "frm_store", v)}
                            value={String(row.frm_store ?? "")}
                          >
                            <SelectTrigger className="text-sm">
                              <SelectValue placeholder="Select store" />
                            </SelectTrigger>
                            <SelectContent>
                              {stores.map((s) => (
                                <SelectItem key={s.STORE_ID} value={String(s.STORE_ID)}>
                                  {s.STORE_NAME}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-foreground">Status</label>
                          <Select
                            disabled={isSubmitting}
                            onValueChange={(v) => updateRow(idx, "status", v)}
                            value={String(row.status ?? "0")}
                          >
                            <SelectTrigger className="text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">Pending</SelectItem>
                              <SelectItem value="1">Approved</SelectItem>
                              <SelectItem value="2">Dispatched</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Remarks */}
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-foreground">Remarks</label>
                        <Input
                          placeholder="Item remarks..."
                          value={row.remarks}
                          onChange={(e) => updateRow(idx, "remarks", e.target.value)}
                          disabled={isSubmitting}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-border shrink-0">
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? <><Spinner className="mr-2 h-4 w-4" />Creating...</>
                  : "Create Requisition"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
