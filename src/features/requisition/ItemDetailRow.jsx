import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
// import { useItemStockById } from "@/features/item-stock/queries";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useItemStockByItemId } from "../item-stock/queries";
// import { useItemStockById } from "../item-stock/queries";

// ─── Constants ─────────────────────────────────────────────────────────────────
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

// ─── Item Search Hook ───────────────────────────────────────────────────────────
const useItemSearch = (query) =>
  useQuery({
    queryKey: ["items", "search", query],
    queryFn: () =>
      fetchJSON(`${BASE}/api/item?q=${encodeURIComponent(query)}&limit=20`),
    enabled: typeof query === "string" && query.trim().length >= 2,
    staleTime: 60 * 1000,
  });

// ─── Item Stock by ItemId Hook ─────────────────────────────────────────────────
// const useItemStockByItemId = (itemId) =>
//   useQuery({
//     queryKey: ["itemStocks", "byItem", itemId],
//     queryFn: () => fetchJSON(`${BASE}/api/item-stock?itemId=${itemId}`),
//     enabled: !!itemId,
//     staleTime: 30 * 1000,
//     refetchOnWindowFocus: false,
//   });

// ─── ItemSearchCombobox ────────────────────────────────────────────────────────
function ItemSearchCombobox({ value, onChange, disabled, placeholder = "Search item..." }) {
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

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={open ? query : (value?.name ?? "")}
          disabled={disabled}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (!e.target.value) onChange(null);
          }}
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
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-52 overflow-y-auto">
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
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(item);
                }}
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

// ─── ItemDetailRow ─────────────────────────────────────────────────────────────

export function ItemDetailRow({
  row, idx, rows, stores, storesLoading,
  isSubmitting, rowErrors, updateRow, removeRow, isExisting = false,
}) {
  const { data: stockList = [], isFetching: stockFetching } = useItemStockByItemId(
    row.item?.id ?? null
  );

  // ✅ Existing row হলে প্রথমে auto-fill বন্ধ রাখো
  const shouldAutoFill = useRef(!isExisting);

  // ✅ User নিজে item change করলে auto-fill চালু করো
  const prevItemId = useRef(row.item?.id);
  if (prevItemId.current !== row.item?.id) {
    prevItemId.current = row.item?.id;
    shouldAutoFill.current = true;
  }

  useEffect(() => {
    if (!shouldAutoFill.current) return; // ← existing data load এ skip
    if (stockFetching) return;
    if (!row.item?.id) return;
    if (!stockList.length) return;

    if (!row.frm_store) {
      updateRow(idx, "tot_qty", "");
      updateRow(idx, "uom", "");
      return;
    }

    const stock = stockList.find(
      (s) =>
        Number(s.STORE_ID) === Number(row.frm_store) &&
        Number(s.ITEM_ID) === Number(row.item?.id)
    );

    updateRow(idx, "tot_qty", stock ? String(stock.STOCK_QTY ?? "") : "");
    updateRow(idx, "uom", stock ? stock.UOM || "" : "");

  }, [row.frm_store, row.item?.id, stockFetching, stockList]);

  // ... বাকি JSX একই থাকবে

// export function ItemDetailRow({
//   row, idx, rows, stores, storesLoading,
//   isSubmitting, rowErrors, updateRow, removeRow, isExisting = false,
//   //  storeId,  // ← নতুন prop
// }) {
 

// const { data: stockList = [], isFetching: stockFetching } = useItemStockByItemId(
//   row.item?.id ?? null
// );

// useEffect(() => {
//   // ✅ Update mode হলে কিছুই করবো না
//   if (isExisting) return;

//   // fetch শেষ না হলে skip
//   if (stockFetching || !stockList.length) return;

//   // store select না থাকলে clear
//   if (!row.frm_store) {
//     updateRow(idx, "tot_qty", "");
//     updateRow(idx, "uom", "");
//     return;
//   }

//   const stock = stockList.find(
//     (s) =>
//       Number(s.STORE_ID) === Number(row.frm_store) &&
//       Number(s.ITEM_ID) === Number(row.item?.id)
//   );

//   updateRow(idx, "tot_qty", stock ? String(stock.STOCK_QTY ?? "") : "");
//   updateRow(idx, "uom", stock ? stock.UOM || "" : "");

// }, [row.frm_store, row.item?.id, stockFetching, stockList]);

// useEffect(() => {
//   // fetch শেষ না হলে বা data না থাকলে skip
//   if (stockFetching || !stockList.length) return;
//   // store select না করলে clear করো
//   if (!row.frm_store) {
//     updateRow(idx, "tot_qty", "");
//     updateRow(idx, "uom", "");
//     return;
//   }
//    if (isExisting) return;
//   // current item এর stock এ এই store আছে কিনা খোঁজো
//   const stock = stockList.find(
//     (s) => Number(s.STORE_ID) === Number(row.frm_store) && 
//            Number(s.ITEM_ID)  === Number(row.item?.id)
//   );

//   updateRow(idx, "tot_qty", stock ? String(stock.STOCK_QTY ?? "") : "");
//   updateRow(idx, "uom",     stock ? (stock.UOM || "")            : "");

// }, [row.frm_store, row.item?.id, stockFetching]);
// ↑ stockList বাদ দিলাম — শুধু store/item change এ run করবে
  return (
    <div className="border border-border rounded-lg p-3 space-y-3 bg-muted/30">

      {/* Row header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground flex items-center gap-2">
          Item #{idx + 1}
          {row.tid && (
            <Badge variant="outline" className="text-xs">
              TID {row.tid}
            </Badge>
          )}
          {stockFetching && <Spinner className="h-3 w-3" />}
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

       <div className="grid grid-cols-2 gap-2">
         <div className="space-y-1">
        <label className="text-xs font-medium text-foreground">
          Item <span className="text-destructive">*</span>
        </label>
        <ItemSearchCombobox
          value={row.item}
          // onChange={(v) => {
          //   updateRow(idx, "item", v);
          //   // Reset auto-filled fields so new item's stock can fill them
          //   updateRow(idx, "tot_qty", "");
          //   updateRow(idx, "uom", "");
          // }}
          onChange={(v) => {
  updateRow(idx, "item", v);
  updateRow(idx, "tot_qty", "");
  updateRow(idx, "uom", "");
  // item clear হলে store ও clear করুন
  if (!v) updateRow(idx, "frm_store", "");
}}
          disabled={isSubmitting}
          placeholder="Search item..."
        />
        {rowErrors[idx]?.item && (
          <p className="text-xs text-destructive">{rowErrors[idx].item}</p>
        )}
      </div>

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
     
      {/* Total Qty + App Qty + UOM */}
      <div className="grid grid-cols-5 gap-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">
            Total Qty <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <Input
              type="number"
              placeholder="0"
              value={row.tot_qty}
              onChange={(e) => updateRow(idx, "tot_qty", e.target.value)}
              disabled={isSubmitting || stockFetching}
              className="text-sm"
            />
            {stockFetching && (
              <span className="absolute right-2 top-1/2 -translate-y-1/2">
                <Spinner className="h-3 w-3" />
              </span>
            )}
          </div>
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
          <div className="relative">
            <Input
              placeholder="KG / PCS"
              value={row.uom}
              onChange={(e) => updateRow(idx, "uom", e.target.value)}
              disabled={isSubmitting || stockFetching}
              className="text-sm"
            />
            {stockFetching && (
              <span className="absolute right-2 top-1/2 -translate-y-1/2">
                <Spinner className="h-3 w-3" />
              </span>
            )}
          </div>
        </div>
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
            value={String(row.status ?? "1")}
          >
            <SelectTrigger className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Pending</SelectItem>
              <SelectItem value="2">Approved</SelectItem>
             
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* From Store + Status */}
      <div className="grid grid-cols-2 gap-2">
       
      </div>

      {/* Remarks */}
     
    </div>
  );
}