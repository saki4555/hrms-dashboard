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
  ClipboardList,
  Plus,
  Trash2,
  ChevronsUpDown,
  Check,
  PackageSearch,
} from "lucide-react";
import { useCreateRequisition, useStores, useItemsByStore } from "./queries";

/* ─── Zod Schema ─────────────────────────────────────────────────────────── */
const detailSchema = z.object({
  ITEMID: z.number({ required_error: "Item required" }),
  ITEM_NAME: z.string().optional(),
  TOT_QTY: z.coerce
    .number({ invalid_type_error: "Must be a number" })
    .positive("Must be > 0"),
  APP_QTY: z.coerce.number().min(0).default(0),
  UOM: z.string().optional(),
  REMARKS: z.string().optional(),
  THAN: z.string().optional(),
  FRM_STORE: z.string().optional(),
});

const formSchema = z.object({
  TDATE: z.string().min(1, "Date required"),
  ENTRY_DATE: z.string().min(1, "Entry date required"),
  STORE_ID: z.number({ required_error: "From store required" }),
  STORE_ID_TO: z.number({ required_error: "To store required" }),
  VEHICLE_NO: z.string().optional(),
  DREIVER_NO: z.string().optional(),
  CHALLAN_NO: z.string().optional(),
  REMARKS: z.string().optional(),
  details: z.array(detailSchema).min(1, "At least one item required"),
});

/* ─── Item Row Component ─────────────────────────────────────────────────── */
function ItemRow({ index, control, storeId, onRemove, storeItems, storeItemsLoading }) {
  const [itemOpen, setItemOpen] = useState(false);
  const [itemSearch, setItemSearch] = useState("");

  const filteredItems = (storeItems || []).filter(
    (it) =>
      it.ITEM_NAME?.toLowerCase().includes(itemSearch.toLowerCase()) ||
      String(it.ITEM_ID).includes(itemSearch)
  );

  return (
    <div className="grid grid-cols-12 gap-2 items-start py-2 border-b border-border last:border-0">
      {/* Row number */}
      <div className="col-span-1 pt-8 text-center text-xs text-muted-foreground font-medium">
        {index + 1}
      </div>

      {/* Item selector */}
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
                    disabled={!storeId}
                    className={cn(
                      "w-full justify-between font-normal text-xs h-9",
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    {field.value
                      ? storeItems?.find((it) => it.ITEM_ID === field.value)?.ITEM_NAME ||
                        `Item #${field.value}`
                      : storeId
                      ? "Select item..."
                      : "Select from-store first"}
                    <ChevronsUpDown className="ml-1 h-3 w-3 opacity-50 shrink-0" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-[320px] p-0" align="start">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Search item name or ID..."
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
                              Stock: {it.STOCK_QTY ?? it.TOT_QTY ?? "—"} · {it.UOM ?? it.UNIT_NAME ?? "—"}
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

      {/* Total qty */}
      <FormField
        control={control}
        name={`details.${index}.TOT_QTY`}
        render={({ field }) => (
          <FormItem className="col-span-1">
            <FormLabel className="text-xs">Total Qty</FormLabel>
            <FormControl>
              <Input
                placeholder="0"
                className="h-9 text-xs"
                {...field}
                value={field.value || ""}
              />
            </FormControl>
            <FormMessage className="text-xs" />
          </FormItem>
        )}
      />

      {/* App qty */}
      <FormField
        control={control}
        name={`details.${index}.APP_QTY`}
        render={({ field }) => (
          <FormItem className="col-span-1">
            <FormLabel className="text-xs">App Qty</FormLabel>
            <FormControl>
              <Input
                type="number"
                min={0}
                step="1"
                placeholder="0"
                className="h-9 text-xs"
                {...field}
              />
            </FormControl>
            <FormMessage className="text-xs" />
          </FormItem>
        )}
      />

      {/* UOM */}
      <FormField
        control={control}
        name={`details.${index}.UOM`}
        render={({ field }) => (
          <FormItem className="col-span-2">
            <FormLabel className="text-xs">UOM</FormLabel>
            <FormControl>
              <Input
                placeholder="PCS"
                className="h-9 text-xs"
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
          <FormItem className="col-span-2">
            <FormLabel className="text-xs">Remarks</FormLabel>
            <FormControl>
              <Input
                placeholder="Optional"
                className="h-9 text-xs"
                {...field}
                value={field.value || ""}
              />
            </FormControl>
          </FormItem>
        )}
      />

      {/* Status — always Pending on create */}
      <div className="col-span-2 pt-6  flex justify-center">
        {/* <span className="text-xs text-muted-foreground font-medium">Status</span> */}
        <Badge className="w-fit bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-0 text-xs">
          Pending
        </Badge>
      </div>

      {/* Remove */}
      <div className="col-span-1 pt-6 flex justify-center">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={onRemove}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function AddRequisitionSheet({ open, onOpenChange, showConfirmation }) {
  const createMutation = useCreateRequisition();
  const { data: stores = [] } = useStores();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      TDATE: format(new Date(), "yyyy-MM-dd"),
      ENTRY_DATE: format(new Date(), "yyyy-MM-dd"),
      STORE_ID: undefined,
      STORE_ID_TO: undefined,
      VEHICLE_NO: "",
      DREIVER_NO: "",
      CHALLAN_NO: "",
      REMARKS: "",
      details: [
        { ITEMID: undefined, TOT_QTY: "", APP_QTY: 0, UOM: "", REMARKS: "", THAN: "", FRM_STORE: "" },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "details" });
  const { formState: { isDirty } } = form;

  const fromStoreId = form.watch("STORE_ID");
  const toStoreId = form.watch("STORE_ID_TO");
  const { data: storeItems = [], isFetching: storeItemsLoading } = useItemsByStore(fromStoreId);

  // When STORE_ID changes, reset all item rows
  useEffect(() => {
    if (fromStoreId) {
      form.setValue("details", [
        { ITEMID: undefined, TOT_QTY: "", APP_QTY: 0, UOM: "", REMARKS: "", THAN: "", FRM_STORE: "" },
      ]);
    }
  }, [fromStoreId]);

  // Auto-fill UOM and TOT_QTY when item selected
  const watchedDetails = form.watch("details");
  useEffect(() => {
    watchedDetails.forEach((detail, idx) => {
      if (detail.ITEMID && storeItems.length > 0) {
        const found = storeItems.find((it) => it.ITEM_ID === detail.ITEMID);
        if (found) {
          const currentUom = form.getValues(`details.${idx}.UOM`);
          const itemUom = found.UOM || found.UNIT_NAME || "";
          if (!currentUom && itemUom) {
            form.setValue(`details.${idx}.UOM`, itemUom, { shouldDirty: false });
          }
          const currentQty = form.getValues(`details.${idx}.TOT_QTY`);
          const stockQty = found.STOCK_QTY ?? found.TOT_QTY ?? 0;
          if (!currentQty && stockQty) {
            form.setValue(`details.${idx}.TOT_QTY`, stockQty, { shouldDirty: false });
          }
        }
      }
    });
  }, [watchedDetails.map((d) => d.ITEMID).join(","), storeItems]);

  useEffect(() => {
    if (open) {
      form.reset({
        TDATE: format(new Date(), "yyyy-MM-dd"),
        ENTRY_DATE: format(new Date(), "yyyy-MM-dd"),
        STORE_ID: undefined,
        STORE_ID_TO: undefined,
        VEHICLE_NO: "",
        DREIVER_NO: "",
        CHALLAN_NO: "",
        REMARKS: "",
        details: [
          { ITEMID: undefined, TOT_QTY: "", APP_QTY: 0, UOM: "", REMARKS: "", THAN: "", FRM_STORE: "" },
        ],
      });
    }
  }, [open]);

  const onSubmit = async (data) => {
    try {
      const payload = {
        master: {
          TDATE: data.TDATE,
          ENTRY_DATE: data.ENTRY_DATE,
          STORE_ID: data.STORE_ID,
          STORE_ID_TO: data.STORE_ID_TO,
          ENTRY_BY: 1, // TODO: replace with auth user
          VEHICLE_NO: data.VEHICLE_NO || null,
          DREIVER_NO: data.DREIVER_NO || null,
          CHALLAN_NO: data.CHALLAN_NO || null,
          REMARKS: data.REMARKS || null,
        },
        details: data.details.map((d) => ({
          ITEMID: d.ITEMID,
          TOT_QTY: d.TOT_QTY,
          APP_QTY: d.APP_QTY ?? 0,
          UOM: d.UOM || null,
          REMARKS: d.REMARKS || null,
          THAN: d.THAN || null,
          // Pass from-store and to-store so the trigger can update stock correctly
        //   FRM_STORE: String(data.STORE_ID),
        //   STORE_ID: data.STORE_ID_TO,
        FRM_STORE: String(data.STORE_ID),       // ✅ from store
       STORE_ID:  String(data.STORE_ID_TO),    // ✅ to store — trigger এ লাগবে
        })),
      };
      await createMutation.mutateAsync(payload);
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
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) handleCancel(); }}>
      <SheetContent className="!w-screen !h-screen !max-w-none flex flex-col gap-0 p-0 rounded-none">
        {/* Header */}
        <SheetHeader className="px-6 py-5 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <ClipboardList className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <SheetTitle>New Dispatch</SheetTitle>
              <SheetDescription>Create a material transfer requisition</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

              {/* ── Master Fields ── */}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                  Transfer details
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="TDATE"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Transaction date *</FormLabel>
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
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="ENTRY_DATE"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Entry date *</FormLabel>
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
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
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

                <div className="grid grid-cols-3 gap-4 mt-4">
                  <FormField
                    control={form.control}
                    name="VEHICLE_NO"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vehicle no.</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. DHA-1234" disabled={isSubmitting} {...field} value={field.value || ""} />
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

              {/* ── Detail Items ── */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Line items (REQDETAIL) — Status auto = Pending
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      {fields.length}
                    </Badge>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      append({
                        ITEMID: undefined,
                        TOT_QTY: 0,
                        APP_QTY: 0,
                        UOM: "",
                        REMARKS: "",
                        THAN: "",
                        FRM_STORE: "",
                      })
                    }
                    disabled={!fromStoreId}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add item
                  </Button>
                </div>

                {!fromStoreId && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/40 rounded-md px-4 py-3">
                    <PackageSearch className="h-4 w-4" />
                    Select a from-store above to load available items
                  </div>
                )}

                {fromStoreId && (
                  <>
                    {/* Column headers */}
                    <div className="grid grid-cols-12 gap-2 px-0 pb-1">
                      <div className="col-span-1" />
                      <div className="col-span-2 text-xs text-muted-foreground font-medium">Item</div>
                      <div className="col-span-1 text-xs text-muted-foreground font-medium">Total qty</div>
                      <div className="col-span-1 text-xs text-muted-foreground font-medium">App qty</div>
                      <div className="col-span-2 text-xs text-muted-foreground font-medium">UOM</div>
                      <div className="col-span-2 text-xs text-muted-foreground font-medium">Remarks</div>
                      <div className="col-span-2 text-xs text-muted-foreground font-medium flex justify-center">Status</div>
                      <div className="col-span-1" />
                    </div>

                    {fields.map((field, index) => (
                      <ItemRow
                        key={field.id}
                        index={index}
                        control={form.control}
                        storeId={fromStoreId}
                        storeItems={storeItems}
                        storeItemsLoading={storeItemsLoading}
                        onRemove={() => fields.length > 1 && remove(index)}
                      />
                    ))}

                    {form.formState.errors.details?.root && (
                      <p className="text-xs text-destructive mt-1">
                        {form.formState.errors.details.root.message}
                      </p>
                    )}
                    {typeof form.formState.errors.details?.message === "string" && (
                      <p className="text-xs text-destructive mt-1">
                        {form.formState.errors.details.message}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-border shrink-0">
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Creating...
                  </>
                ) : (
                  "Save Dispatch"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}