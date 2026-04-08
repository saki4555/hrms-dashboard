import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/DatePicker";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import {
  ClipboardEdit,
  Plus,
  Trash2,
  ChevronsUpDown,
  Check,
  PackageSearch,
  CheckCheck,
} from "lucide-react";
import {
  useUpdateRequisition,
  useStores,
  useItemsByStore,
  useRequisitionById,
  useApproveDetail,
  useApproveAll,
} from "./queries";

/* ─── Zod Schema ─────────────────────────────────────────────────────────── */
const detailSchema = z.object({
  TID: z.number().optional(),
  ITEMID: z.number({ required_error: "Item required" }),
  ITEM_NAME: z.string().optional(),
  TOT_QTY: z.coerce
    .number({ invalid_type_error: "Must be a number" })
    .positive("Must be > 0"),
  APP_QTY: z.coerce.number().min(0).default(0),
  UOM: z.string().optional(),
  REMARKS: z.string().optional(),
});

const formSchema = z.object({
  TDATE: z.string().min(1, "Date required"),
  STORE_ID: z.number({ required_error: "From store required" }),
  STORE_ID_TO: z.number({ required_error: "To store required" }),
  VEHICLE_NO: z.string().optional(),
  DREIVER_NO: z.string().optional(),
  CHALLAN_NO: z.string().optional(),
  REMARKS: z.string().optional(),
  details: z.array(detailSchema).min(1, "At least one item required"),
});

/* ─── Item Row ─────────────────────────────────────────────────────────────── */
function ItemRow({
  index,
  control,
  storeId,
  onRemove,
  storeItems,
  storeItemsLoading,
  isApproved,
  detailTid,
  masterTid,
  onApproved,
}) {
  const [itemOpen, setItemOpen] = useState(false);
  const [itemSearch, setItemSearch] = useState("");
  const approveDetailMutation = useApproveDetail();

  const filteredItems = (storeItems || []).filter(
    (it) =>
      it.ITEM_NAME?.toLowerCase().includes(itemSearch.toLowerCase()) ||
      String(it.ITEM_ID).includes(itemSearch)
  );

  const handleApproveRow = async () => {
    if (!detailTid || !masterTid) return;
    try {
      await approveDetailMutation.mutateAsync({ masterTid, detailTid });
      toast.success("Item approved.");
      if (onApproved) onApproved();
    } catch (err) {
      toast.error(err?.message || "Failed to approve item.");
    }
  };

  return (
    <div
      className={cn(
        "grid grid-cols-12 gap-2 items-start py-2 border-b border-border last:border-0",
        isApproved && "opacity-70"
      )}
    >
      <div className="col-span-1 pt-8 text-center text-xs text-muted-foreground font-medium">
        {index + 1}
      </div>

      <FormField
        control={control}
        name={`details.${index}.ITEMID`}
        render={({ field }) => (
          <FormItem className="col-span-2">
            <FormLabel className="text-xs">Item *</FormLabel>
            <Popover open={itemOpen} onOpenChange={setItemOpen}>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    role="combobox"
                    disabled={!storeId || isApproved}
                    className={cn(
                      "w-full justify-between font-normal text-xs h-9",
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    {field.value
                      ? (storeItems?.find((it) => it.ITEM_ID === field.value)?.ITEM_NAME ||
                        (storeItemsLoading ? "Loading..." : `Item #${field.value}`))
                      : "Select item..."}
                    <ChevronsUpDown className="ml-1 h-3 w-3 opacity-50 shrink-0" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0" align="start">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Search item..."
                    value={itemSearch}
                    onValueChange={setItemSearch}
                  />
                  <CommandList>
                    {storeItemsLoading && (
                      <div className="flex items-center justify-center py-4">
                        <Spinner className="h-4 w-4" />
                      </div>
                    )}
                    {!storeItemsLoading && filteredItems.length === 0 && (
                      <CommandEmpty>No items found.</CommandEmpty>
                    )}
                    <CommandGroup>
                      {filteredItems.map((it) => (
                        <CommandItem
                          key={it.ITEM_ID}
                          value={String(it.ITEM_ID)}
                          onSelect={() => {
                            field.onChange(it.ITEM_ID);
                            setItemOpen(false);
                            setItemSearch("");
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              field.value === it.ITEM_ID ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                            <span className="text-sm">{it.ITEM_NAME}</span>
                            <span className="text-xs text-muted-foreground">
                              Stock: {it.STOCK_QTY ?? "—"} · {it.UOM ?? it.UNIT_NAME ?? "—"}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <FormMessage className="text-xs" />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name={`details.${index}.TOT_QTY`}
        render={({ field }) => (
          <FormItem className="col-span-1">
            <FormLabel className="text-xs">Total qty</FormLabel>
            <FormControl>
              <Input placeholder="0" disabled={isApproved} className="h-9 text-xs" {...field} value={field.value || ""} />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name={`details.${index}.APP_QTY`}
        render={({ field }) => (
          <FormItem className="col-span-1">
            <FormLabel className="text-xs">App qty</FormLabel>
            <FormControl>
              <Input type="number" min={0} step="1" placeholder="0" disabled={isApproved} className="h-9 text-xs" {...field} />
            </FormControl>
            <FormMessage className="text-xs" />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name={`details.${index}.UOM`}
        render={({ field }) => (
          <FormItem className="col-span-1">
            <FormLabel className="text-xs">UOM</FormLabel>
            <FormControl>
              <Input placeholder="PCS" disabled={isApproved} className="h-9 text-xs" {...field} value={field.value || ""} />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name={`details.${index}.REMARKS`}
        render={({ field }) => (
          <FormItem className="col-span-2">
            <FormLabel className="text-xs">Remarks</FormLabel>
            <FormControl>
              <Input placeholder="Optional" disabled={isApproved} className="h-9 text-xs" {...field} value={field.value || ""} />
            </FormControl>
          </FormItem>
        )}
      />

      <div className="col-span-2 pt-6 flex justify-center">
        {isApproved ? (
          <Badge className="w-fit bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-0 text-xs">
            Approved
          </Badge>
        ) : (
          <Badge className="w-fit bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-0 text-xs">
            Pending
          </Badge>
        )}
      </div>

      <div className="col-span-1 pt-6 flex justify-center">
        {isApproved ? (
          <span className="text-xs text-muted-foreground">Already approved</span>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs px-2 text-green-700 border-green-300 hover:bg-green-50 dark:hover:bg-green-950"
            onClick={handleApproveRow}
            disabled={approveDetailMutation.isPending}
          >
            {approveDetailMutation.isPending ? <Spinner className="h-3 w-3" /> : "Approve"}
          </Button>
        )}
      </div>

      <div className="col-span-1 pt-6 flex justify-center">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={onRemove}
          disabled={isApproved}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function UpdateRequisitionSheet({
  open,
  onOpenChange,
  showConfirmation,
  requisitionTid,
}) {
  const updateMutation = useUpdateRequisition();
  const approveAllMutation = useApproveAll();

  // ── stores and req data both needed before reset ──────────────────────────
  const { data: stores = [] } = useStores();

  const {
    data: reqData,
    isLoading: reqLoading,
    refetch: refetchReq,
  } = useRequisitionById(requisitionTid);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      TDATE: "",
      STORE_ID: undefined,
      STORE_ID_TO: undefined,
      VEHICLE_NO: "",
      DREIVER_NO: "",
      CHALLAN_NO: "",
      REMARKS: "",
      details: [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "details" });
  const { formState: { isDirty } } = form;

  const fromStoreId = form.watch("STORE_ID");
  const { data: storeItems = [], isFetching: storeItemsLoading } = useItemsByStore(fromStoreId);

 useEffect(() => {
  if (!reqData?.master || stores.length === 0) return;

  const m = reqData.master;

  // Step 1 — সব কিছু reset করো (STORE_ID গুলো Number দিয়ে)
  form.reset({
    TDATE: m.TDATE ? format(new Date(m.TDATE), "yyyy-MM-dd") : "",
    STORE_ID: m.STORE_ID ? Number(m.STORE_ID) : undefined,
    STORE_ID_TO: m.STORE_ID_TO ? Number(m.STORE_ID_TO) : undefined,
    VEHICLE_NO: m.VEHICLE_NO || "",
    DREIVER_NO: m.DREIVER_NO || "",
    CHALLAN_NO: m.CHALLAN_NO || "",
    REMARKS: m.REMARKS || "",
    details: (reqData.details || []).map((d) => ({
      TID: d.TID,
      ITEMID: d.ITEMID,
      TOT_QTY: d.TOT_QTY,
      APP_QTY: d.APP_QTY || 0,
      UOM: d.UOM || "",
      REMARKS: d.REMARKS || "",
      _status: d.STATUS,
    })),
  });

  // Step 2 — Select DOM mount হওয়ার পর next tick-এ force setValue
  // Shadcn Select, reset()-এর পর controlled value নেয় না, তাই setTimeout দরকার
  const timer = setTimeout(() => {
    if (m.STORE_ID) {
      form.setValue("STORE_ID", Number(m.STORE_ID), { shouldValidate: true, shouldDirty: false });
    }
    if (m.STORE_ID_TO) {
      form.setValue("STORE_ID_TO", Number(m.STORE_ID_TO), { shouldValidate: true, shouldDirty: false });
    }
  }, 0);

  return () => clearTimeout(timer);

}, [reqData?.master?.TID, stores.length]);
  useEffect(() => {
    if (!open) {
      form.reset({
        TDATE: "",
        STORE_ID: undefined,
        STORE_ID_TO: undefined,
        VEHICLE_NO: "",
        DREIVER_NO: "",
        CHALLAN_NO: "",
        REMARKS: "",
        details: [],
      });
    }
  }, [open]);

  const pendingCount = (reqData?.details || []).filter((d) => d.STATUS === 1).length;
  const hasAnyPending = pendingCount > 0;

  // loading হবে যদি req data আসেনি অথবা stores এখনও আসেনি
 const isFormLoading = reqLoading || stores.length === 0 || !reqData?.master;

  const handleApproveAll = async () => {
    if (!requisitionTid) return;
    const confirmed = await showConfirmation?.({
      title: "Approve all pending items?",
      description: `This will approve all ${pendingCount} pending item(s) in requisition #${requisitionTid}. This cannot be undone.`,
      confirmText: "Approve all",
      cancelText: "Cancel",
      variant: "default",
    });
    if (!confirmed) return;
    try {
      await approveAllMutation.mutateAsync(requisitionTid);
      toast.success("All pending items approved!");
      refetchReq();
    } catch (err) {
      toast.error(err?.message || "Failed to approve.");
    }
  };

  const onSubmit = async (data) => {
    try {
      const payload = {
        master: {
          TDATE: data.TDATE,
          STORE_ID: data.STORE_ID,
          STORE_ID_TO: data.STORE_ID_TO,
          VEHICLE_NO: data.VEHICLE_NO || null,
          DREIVER_NO: data.DREIVER_NO || null,
          CHALLAN_NO: data.CHALLAN_NO || null,
          REMARKS: data.REMARKS || null,
        },
        details: data.details.map((d) => ({
          TID: d.TID,
          ITEMID: d.ITEMID,
          TOT_QTY: d.TOT_QTY,
          APP_QTY: d.APP_QTY || 0,
          UOM: d.UOM || null,
          REMARKS: d.REMARKS || null,
        })),
      };
      console.log(payload)
      await updateMutation.mutateAsync({ tid: requisitionTid, data: payload });
      toast.success("Requisition updated successfully!");
      onOpenChange(false);
    } catch (err) {
      toast.error(err?.message || "Failed to Update Dispatch.");
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
    onOpenChange(false);
  };

  const isSubmitting = updateMutation.isPending;

  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) handleCancel(); }}>
      <SheetContent className="!w-screen !h-screen !max-w-none flex flex-col gap-0 p-0 rounded-none">
        <SheetHeader className="px-6 py-5 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <ClipboardEdit className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <SheetTitle>Update Dispatch</SheetTitle>
              <SheetDescription>
                Edit  Dispatch #{requisitionTid}
                {reqData?.master?.CHALLAN_NO && ` · Challan: ${reqData.master.CHALLAN_NO}`}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">

            {isFormLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <Spinner className="h-8 w-8" />
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                    Transfer details
                  </p>

                   <div className="grid grid-cols-3 gap-4 mt-4">
                      <FormField
                    control={form.control}
                    name="TDATE"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Transaction date *</FormLabel>
                        <FormControl>
                          <DatePicker
                            className="w-1/2"
                            placeholder="Select date"
                            disabled={isSubmitting}
                            value={field.value ? new Date(field.value) : undefined}
                            onChange={(d) => field.onChange(d ? format(d, "yyyy-MM-dd") : "")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                      control={form.control}
                      name="STORE_ID"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>From store *</FormLabel>
                          <Select
                            disabled={isSubmitting}
                            onValueChange={(v) => field.onChange(Number(v))}
                            value={field.value ? String(field.value) : ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select source store" />
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
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="STORE_ID_TO"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>To store *</FormLabel>
                          <Select
                            disabled={isSubmitting}
                            onValueChange={(v) => field.onChange(Number(v))}
                            value={field.value ? String(field.value) : ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select destination store" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {stores
                                .filter((s) => s.STORE_ID !== fromStoreId)
                                .map((s) => (
                                  <SelectItem key={s.STORE_ID} value={String(s.STORE_ID)}>
                                    {s.STORE_NAME}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  
                   </div>

                

                  <div className="grid grid-cols-2 gap-4 mt-4">
                   
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <FormField
                      control={form.control}
                      name="VEHICLE_NO"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vehicle no.</FormLabel>
                          <FormControl>
                            <Input placeholder="DHA-1234" disabled={isSubmitting} {...field} value={field.value || ""} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="DREIVER_NO"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Driver no.</FormLabel>
                          <FormControl>
                            <Input placeholder="Phone / ID" disabled={isSubmitting} {...field} value={field.value || ""} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="CHALLAN_NO"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Challan no.</FormLabel>
                          <FormControl>
                            <Input placeholder="CH-XXXX" disabled={isSubmitting} {...field} value={field.value || ""} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="REMARKS"
                    render={({ field }) => (
                      <FormItem className="mt-4">
                        <FormLabel>Remarks</FormLabel>
                        <FormControl>
                        
                          <Textarea
                          className="w-1/2"
                            rows={2}
                            placeholder="Optional notes..."
                            disabled={isSubmitting}
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Line items — Approve item by item (REQDETAIL)
                      </p>
                      <Badge variant="secondary" className="text-xs">{fields.length}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasAnyPending && (
                        <Button
                          type="button"
                          variant="default"
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={handleApproveAll}
                          disabled={approveAllMutation.isPending}
                        >
                          {approveAllMutation.isPending
                            ? <Spinner className="mr-2 h-4 w-4" />
                            : <CheckCheck className="h-4 w-4 mr-1" />}
                          Approve all pending
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => append({ TID: undefined, ITEMID: undefined, TOT_QTY: "", APP_QTY: 0, UOM: "", REMARKS: "" })}
                        disabled={!fromStoreId}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add item
                      </Button>
                    </div>
                  </div>

                  {!fromStoreId && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/40 rounded-md px-4 py-3">
                      <PackageSearch className="h-4 w-4" />
                      Select a from-store to load available items
                    </div>
                  )}

                  {fromStoreId && (
                    <>
                      <div className="grid grid-cols-12 gap-2 pb-1">
                        <div className="col-span-1" />
                        <div className="col-span-2 text-xs text-muted-foreground font-medium">Item</div>
                        <div className="col-span-1 text-xs text-muted-foreground font-medium">Total qty</div>
                        <div className="col-span-1 text-xs text-muted-foreground font-medium">App qty</div>
                        <div className="col-span-1 text-xs text-muted-foreground font-medium">UOM</div>
                        <div className="col-span-2 text-xs text-muted-foreground font-medium">Remarks</div>
                        <div className="col-span-2 text-xs text-muted-foreground font-medium flex justify-center">Status</div>
                        <div className="col-span-1 text-xs text-muted-foreground font-medium">Action</div>
                        <div className="col-span-1" />
                      </div>

                      {fields.map((field, index) => {
                        const rawStatus = form.getValues(`details.${index}._status`);
                        const isApproved = rawStatus === 2;
                        const detailTid = form.getValues(`details.${index}.TID`);
                        return (
                          <ItemRow
                            key={field.id}
                            index={index}
                            control={form.control}
                            storeId={fromStoreId}
                            storeItems={storeItems}
                            storeItemsLoading={storeItemsLoading}
                            isApproved={isApproved}
                            detailTid={detailTid}
                            masterTid={requisitionTid}
                            onApproved={refetchReq}
                            onRemove={() => !isApproved && fields.length > 1 && remove(index)}
                          />
                        );
                      })}
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 px-6 py-4 border-t border-border shrink-0">
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || isFormLoading}>
                {isSubmitting ? (
                  <><Spinner className="mr-2 h-4 w-4" />Updating...</>
                ) : (
                  "Update Dispatch"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}