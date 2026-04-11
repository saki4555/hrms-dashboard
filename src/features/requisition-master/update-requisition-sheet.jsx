import { useEffect, useState } from "react";
import { useFieldArray, useForm, useFormContext } from "react-hook-form";
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
  Truck,
  Plus,
  Trash2,
  ChevronsUpDown,
  Check,
  PackageSearch,
  CheckCheck,
  CheckCircle2,
} from "lucide-react";
import {
  useUpdateRequisition,
  useStores,
  useItemsByStore,
  useRequisitionById,
  useApproveDetail,
  // useApproveAll,
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
  const form = useFormContext();

  const filteredItems = (storeItems || []).filter(
    (it) =>
      it.ITEM_NAME?.toLowerCase().includes(itemSearch.toLowerCase()) ||
      String(it.ITEM_ID).includes(itemSearch),
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
    <div className={cn(
      "grid grid-cols-12 gap-x-3 items-center py-2.5 border-b border-border last:border-0 transition-colors px-2",
      isApproved ? "opacity-60 bg-muted/10" : "hover:bg-muted/30"
    )}>
      {/* Row index */}
      <div className="col-span-1 text-center">
        <span className="text-[11px] text-muted-foreground/60 font-mono font-semibold">
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>

      {/* Item selector */}
      <FormField
        control={control}
        name={`details.${index}.ITEMID`}
        render={({ field }) => (
          <FormItem className="col-span-3 space-y-0">
            <Popover open={itemOpen} onOpenChange={setItemOpen}>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    role="combobox"
                    disabled={!storeId || isApproved}
                    className={cn(
                      "w-full justify-between font-normal text-xs h-8",
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    <span className="truncate">
                      {field.value
                        ? storeItems?.find((it) => it.ITEM_ID === field.value)?.ITEM_NAME ||
                          (storeItemsLoading ? "Loading…" : `Item #${field.value}`)
                        : "Select item…"}
                    </span>
                    {!isApproved && <ChevronsUpDown className="ml-1 h-3 w-3 opacity-50 shrink-0" />}
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0" align="start">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Search item…"
                    value={itemSearch}
                    onValueChange={setItemSearch}
                    className="text-xs h-9"
                  />
                  <CommandList>
                    {storeItemsLoading && (
                      <div className="flex items-center justify-center py-4">
                        <Spinner className="h-4 w-4" />
                      </div>
                    )}
                    {!storeItemsLoading && filteredItems.length === 0 && (
                      <CommandEmpty className="text-xs">No items found.</CommandEmpty>
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
                            const found = storeItems?.find((s) => s.ITEM_ID === it.ITEM_ID);
                            if (found) {
                              form.setValue(`details.${index}.TOT_QTY`, found.STOCK_QTY ?? found.TOT_QTY ?? "", { shouldDirty: true });
                              form.setValue(`details.${index}.UOM`, found.UOM || found.UNIT_NAME || "", { shouldDirty: true });
                              form.setValue(`details.${index}.APP_QTY`, 0, { shouldDirty: true });
                            }
                          }}
                        >
                          <Check className={cn("mr-2 h-3.5 w-3.5", field.value === it.ITEM_ID ? "opacity-100" : "opacity-0")} />
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-medium truncate">{it.ITEM_NAME}</span>
                            <span className="text-[10px] text-muted-foreground">
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
            <FormMessage className="text-[10px] mt-0.5" />
          </FormItem>
        )}
      />

      {/* Total Qty */}
      <FormField
        control={control}
        name={`details.${index}.TOT_QTY`}
        render={({ field }) => (
          <FormItem className="col-span-1 space-y-0">
            <FormControl>
              <Input
                placeholder="0"
                disabled={isApproved}
                className="h-8 text-xs text-center"
                {...field}
                value={field.value || ""}
              />
            </FormControl>
          </FormItem>
        )}
      />

      {/* App Qty */}
      <FormField
        control={control}
        name={`details.${index}.APP_QTY`}
        render={({ field }) => {
          const totQty = Number(form.getValues(`details.${index}.TOT_QTY`)) || 0;
          return (
            <FormItem className="col-span-1 space-y-0">
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  max={totQty}
                  step="1"
                  placeholder="0"
                  disabled={isApproved}
                  className="h-8 text-xs text-center"
                  {...field}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 0;
                    field.onChange(val > totQty ? totQty : val);
                  }}
                />
              </FormControl>
              <FormMessage className="text-[10px]" />
            </FormItem>
          );
        }}
      />

      {/* UOM */}
      <FormField
        control={control}
        name={`details.${index}.UOM`}
        render={({ field }) => (
          <FormItem className="col-span-1 space-y-0">
            <FormControl>
              <Input
                placeholder="PCS"
                disabled={isApproved}
                className="h-8 text-xs text-center"
                {...field}
                value={field.value || ""}
              />
            </FormControl>
          </FormItem>
        )}
      />

      {/* Remarks */}
      <FormField
        control={control}
        name={`details.${index}.REMARKS`}
        render={({ field }) => (
          <FormItem className="col-span-2 space-y-0">
            <FormControl>
              <Input
                placeholder="Optional note…"
                disabled={isApproved}
                className="h-8 text-xs"
                {...field}
                value={field.value || ""}
              />
            </FormControl>
          </FormItem>
        )}
      />

      {/* Status badge */}
      <div className="col-span-1 flex justify-center">
        {isApproved ? (
          <Badge className="text-[10px] font-semibold uppercase tracking-wide bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-300 dark:border-green-800 hover:bg-green-100">
            Approved
          </Badge>
        ) : (
          <Badge className="text-[10px] font-semibold uppercase tracking-wide bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-800 hover:bg-yellow-100">
            Pending
          </Badge>
        )}
      </div>

      {/* Approve action */}
      <div className="col-span-1 flex justify-center">
        {isApproved ? (
          <CheckCircle2 className="h-4 w-4 text-green-500/50" />
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 w-7 p-0 text-green-700 dark:text-green-400 border-green-300 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30"
            onClick={handleApproveRow}
            disabled={approveDetailMutation.isPending}
            title="Approve this item"
          >
            {approveDetailMutation.isPending ? (
              <Spinner className="h-3 w-3" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
          </Button>
        )}
      </div>

      {/* Remove */}
      <div className="col-span-1 flex justify-center">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={onRemove}
          disabled={isApproved}
        >
          <Trash2 className="h-3.5 w-3.5" />
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
  // const approveAllMutation = useApproveAll();
  const { data: stores = [] } = useStores();
  const { data: reqData, isLoading: reqLoading, refetch: refetchReq } =
    useRequisitionById(requisitionTid);

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
    const timer = setTimeout(() => {
      if (m.STORE_ID) form.setValue("STORE_ID", Number(m.STORE_ID), { shouldValidate: true, shouldDirty: false });
      if (m.STORE_ID_TO) form.setValue("STORE_ID_TO", Number(m.STORE_ID_TO), { shouldValidate: true, shouldDirty: false });
    }, 0);
    return () => clearTimeout(timer);
  }, [reqData?.master?.TID, stores.length]);

  useEffect(() => {
    if (!open) {
      form.reset({ TDATE: "", STORE_ID: undefined, STORE_ID_TO: undefined, VEHICLE_NO: "", DREIVER_NO: "", CHALLAN_NO: "", REMARKS: "", details: [] });
    }
  }, [open]);

  const pendingCount = (reqData?.details || []).filter((d) => d.STATUS === 1).length;
  // const hasAnyPending = pendingCount > 0;
  const isFormLoading = reqLoading || stores.length === 0 || !reqData?.master;

  // const handleApproveAll = async () => {
  //   if (!requisitionTid) return;
  //   const confirmed = await showConfirmation?.({
  //     title: "Approve all pending items?",
  //     description: `This will approve all ${pendingCount} pending item(s) in dispatch #${requisitionTid}. This cannot be undone.`,
  //     confirmText: "Approve all",
  //     cancelText: "Cancel",
  //     variant: "default",
  //   });
  //   if (!confirmed) return;
  //   try {
  //     await approveAllMutation.mutateAsync(requisitionTid);
  //     toast.success("All pending items approved!");
  //     refetchReq();
  //   } catch (err) {
  //     toast.error(err?.message || "Failed to approve.");
  //   }
  // };

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
      console.log(payload);
      await updateMutation.mutateAsync({ tid: requisitionTid, data: payload });
      toast.success("Dispatch updated successfully!");
      onOpenChange(false);
    } catch (err) {
      toast.error(err?.message || "Failed to update dispatch.");
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

        {/* ── Header ── */}
        <SheetHeader className="px-6 py-5 border-b border-border shrink-0 bg-muted/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <Truck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-base font-semibold">Dispatch</SheetTitle>
                <SheetDescription className="text-xs mt-0.5">
                  Edit Dispatch #{requisitionTid}
                  {reqData?.master?.CHALLAN_NO && (
                    <span className="ml-1.5">· {reqData.master.CHALLAN_NO}</span>
                  )}
                </SheetDescription>
              </div>
            </div>
            {/* {hasAnyPending && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 text-green-700 dark:text-green-400 border-green-300 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30"
                onClick={handleApproveAll}
                disabled={approveAllMutation.isPending}
              >
                {approveAllMutation.isPending ? (
                  <Spinner className="h-3.5 w-3.5" />
                ) : (
                  <CheckCheck className="h-3.5 w-3.5" />
                )}
                Approve all pending ({pendingCount})
              </Button>
            )} */}
          </div>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
            {isFormLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <Spinner className="h-7 w-7" />
                  <span className="text-xs text-muted-foreground">Loading dispatch data…</span>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">

                {/* ── Master Fields ── */}
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="TDATE"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                            Transaction Date <span className="text-destructive normal-case">*</span>
                          </FormLabel>
                          <FormControl>
                            <DatePicker
                              className="w-full"
                              placeholder="Select date"
                              disabled={isSubmitting}
                              value={field.value ? new Date(field.value) : undefined}
                              onChange={(d) => field.onChange(d ? format(d, "yyyy-MM-dd") : "")}
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="STORE_ID"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                            From Store <span className="text-destructive normal-case">*</span>
                          </FormLabel>
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
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="STORE_ID_TO"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                            To Store <span className="text-destructive normal-case">*</span>
                          </FormLabel>
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
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="VEHICLE_NO"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                            Vehicle No.
                          </FormLabel>
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
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                            Driver No.
                          </FormLabel>
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
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                            Challan No.
                          </FormLabel>
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
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                          Remarks
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            rows={2}
                            placeholder="Additional logistics notes, handling instructions…"
                            disabled={isSubmitting}
                            className="resize-none"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                {/* ── Line Items ── */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        Line Items
                      </p>
                      <Badge variant="secondary" className="text-xs h-5 px-1.5 rounded-sm">
                        {fields.length}
                      </Badge>
                      {pendingCount > 0 && (
                        <Badge variant="outline" className="text-xs h-5 px-1.5 rounded-sm text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-800">
                          {pendingCount} pending
                        </Badge>
                      )}
                    </div>
                    {/* <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        append({ TID: undefined, ITEMID: undefined, TOT_QTY: "", APP_QTY: 0, UOM: "", REMARKS: "" })
                      }
                      disabled={!fromStoreId}
                      className="h-7 text-xs gap-1.5"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add New Item
                    </Button> */}
                  </div>

                  {!fromStoreId ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/40 border border-dashed border-border rounded-md px-4 py-3">
                      <PackageSearch className="h-4 w-4 shrink-0" />
                      Select a source store to load available items
                    </div>
                  ) : (
                    <div className="rounded-md border border-border overflow-hidden">
                      {/* Column headers */}
                      <div className="grid grid-cols-12 gap-x-3 px-2 py-2 bg-muted/50 border-b border-border">
                        <div className="col-span-1" />
                        <div className="col-span-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Item Name</div>
                        <div className="col-span-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">Total Qty</div>
                        <div className="col-span-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">App Qty</div>
                        <div className="col-span-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">UOM</div>
                        <div className="col-span-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Remarks</div>
                        <div className="col-span-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">Status</div>
                        <div className="col-span-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">Action</div>
                        <div className="col-span-1" />
                      </div>

                      <div className="divide-y divide-border">
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
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Footer ── */}
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-border bg-muted/40 shrink-0">
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || isFormLoading}>
                {isSubmitting ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Updating…
                  </>
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