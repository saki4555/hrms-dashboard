// src/features/payroll/pay-structure/pay-structure-detail-sheet.jsx
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, GripVertical, Building2 } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import {
  usePayStructureDetail,
  usePayComponents,
  useAddComponentToStructure,
  useUpdateComponentInStructure,
  useRemoveComponentFromStructure,
} from "./queries";

const fmt = (n) =>
  new Intl.NumberFormat("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n ?? 0);

const TYPE_CONFIG = {
  EARNING:   { label: "Earning",   class: "bg-green-500/10 text-green-600 border-green-500/20" },
  DEDUCTION: { label: "Deduction", class: "bg-red-500/10 text-red-500 border-red-500/20" },
};

// ── Inline edit row ───────────────────────────────────────────────────────────
function ComponentRow({ comp, structureId, onRemove }) {
  const [editing, setEditing]   = useState(false);
  const [value, setValue]       = useState(String(comp.DEFAULT_VALUE ?? 0));

  const { mutate: updateComp, isPending: isUpdating } = useUpdateComponentInStructure();
  const typeCfg = TYPE_CONFIG[comp.TYPE] ?? TYPE_CONFIG.EARNING;

  const handleSave = () => {
    updateComp(
      { structureId, componentId: comp.COMPONENT_ID, default_value: parseFloat(value) || 0, component_order: comp.COMPONENT_ORDER },
      {
        onSuccess: () => { toast.success("Amount updated."); setEditing(false); },
        onError:   (err) => toast.error(err.message),
      }
    );
  };

  return (
    <div className="flex items-center gap-3 py-2.5 px-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
      {/* <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 opacity-40" /> */}
      <span className="text-xs text-muted-foreground w-4 text-center shrink-0">
  {comp.COMPONENT_ORDER}
</span>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{comp.NAME}</span>
          <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-4 shrink-0", typeCfg.class)}>
            {comp.CODE}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{comp.CALCULATION_FORMULA}</p>
      </div>

      {/* Amount edit */}
      {editing ? (
        <div className="flex items-center gap-1.5 shrink-0">
          <Input
            className="h-7 w-28 text-right text-sm tabular-nums"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoFocus
          />
          <Button size="sm" className="h-7 text-xs" onClick={handleSave} disabled={isUpdating}>
            {isUpdating ? <Spinner className="h-3 w-3" /> : "Save"}
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-mono tabular-nums w-24 text-right">
            ৳ {fmt(comp.DEFAULT_VALUE)}
          </span>
          <Button
            variant="ghost" size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={() => { setValue(String(comp.DEFAULT_VALUE ?? 0)); setEditing(true); }}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost" size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={() => onRemove(comp)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Add component form ────────────────────────────────────────────────────────
function AddComponentForm({ structureId, existingIds, allComponents, onClose }) {
  const [selectedId, setSelectedId] = useState("");
  const [amount, setAmount]         = useState("0");

  const { mutate: addComp, isPending } = useAddComponentToStructure();

  const available = allComponents.filter(
    (c) => !existingIds.includes(c.COMPONENT_ID)
  );

  const handleAdd = () => {
    if (!selectedId) return toast.error("Please select a component.");
    addComp(
      { structureId, component_id: parseInt(selectedId), default_value: parseFloat(amount) || 0 },
      {
        onSuccess: () => { toast.success("Component added."); onClose(); },
        onError:   (err) => toast.error(err.message),
      }
    );
  };

  return (
    <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
      <p className="text-sm font-medium">Add Component</p>
      <Select value={selectedId} onValueChange={setSelectedId}>
        <SelectTrigger className="h-9">
          <SelectValue placeholder="Select a component..." />
        </SelectTrigger>
        <SelectContent>
          {available.length === 0 && (
            <SelectItem value="none" disabled>All components already added</SelectItem>
          )}
          {available.map((c) => (
            <SelectItem key={c.COMPONENT_ID} value={String(c.COMPONENT_ID)}>
              <span>{c.NAME}</span>
              <span className="ml-2 text-xs text-muted-foreground">({c.CODE} · {c.TYPE})</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2">
        <Input
          className="h-9 text-right tabular-nums"
          placeholder="Default amount (0 for formula-based)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Set to 0 for formula-based components (e.g. PCT_OF_BASIC).
      </p>

      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onClose} disabled={isPending}>Cancel</Button>
        <Button size="sm" onClick={handleAdd} disabled={isPending || !selectedId}>
          {isPending ? <><Spinner className="mr-1.5 h-3.5 w-3.5" />Adding...</> : "Add"}
        </Button>
      </div>
    </div>
  );
}

// ── Main sheet ────────────────────────────────────────────────────────────────
export default function PayStructureDetailSheet({ open, onOpenChange, structureId }) {
  const [showAddForm, setShowAddForm]       = useState(false);
  const [removeTarget, setRemoveTarget]     = useState(null);

  const { data: structure, isLoading } = usePayStructureDetail(structureId);
  const { data: allComponents = [] }   = usePayComponents();
  const { mutate: removeComp, isPending: isRemoving } = useRemoveComponentFromStructure();

  const components   = structure?.components ?? [];
  const existingIds  = components.map((c) => c.COMPONENT_ID);
  const earnings     = components.filter((c) => c.TYPE === "EARNING");
  const deductions   = components.filter((c) => c.TYPE === "DEDUCTION");

  const handleRemove = () => {
    if (!removeTarget) return;
    removeComp(
      { structureId, componentId: removeTarget.COMPONENT_ID },
      {
        onSuccess: () => { toast.success("Component removed."); setRemoveTarget(null); },
        onError:   (err) => { toast.error(err.message); setRemoveTarget(null); },
      }
    );
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-lg w-full flex flex-col gap-0 p-0">

          {/* Header */}
          <SheetHeader className="px-6 py-5 border-b border-border shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <SheetTitle className="truncate">{structure?.NAME ?? "Pay Structure"}</SheetTitle>
                <SheetDescription>
                  {structure?.DESCRIPTION || "Manage components for this pay structure"}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Spinner className="h-8 w-8" />
              </div>
            ) : (
              <>
                {/* Earnings */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-green-600">
                      Earnings ({earnings.length})
                    </p>
                  </div>
                  {earnings.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">No earnings added yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {earnings.map((c) => (
                        <ComponentRow
                          key={c.COMPONENT_ID}
                          comp={c}
                          structureId={structureId}
                          onRemove={setRemoveTarget}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {deductions.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-semibold text-red-500 mb-3">
                        Deductions ({deductions.length})
                      </p>
                      <div className="space-y-2">
                        {deductions.map((c) => (
                          <ComponentRow
                            key={c.COMPONENT_ID}
                            comp={c}
                            structureId={structureId}
                            onRemove={setRemoveTarget}
                          />
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                {/* Add form */}
                {showAddForm ? (
                  <AddComponentForm
                    structureId={structureId}
                    existingIds={existingIds}
                    allComponents={allComponents}
                    onClose={() => setShowAddForm(false)}
                  />
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-1.5 border-dashed"
                    onClick={() => setShowAddForm(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Add Component
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Footer — totals */}
          {!isLoading && components.length > 0 && (
            <div className="px-6 py-4 border-t border-border shrink-0 space-y-1.5">
              {earnings.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Fixed Earnings</span>
                  <span className="font-medium text-green-600 tabular-nums">
                    ৳ {fmt(earnings.reduce((s, c) => s + (c.DEFAULT_VALUE ?? 0), 0))}
                  </span>
                </div>
              )}
              {deductions.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Fixed Deductions</span>
                  <span className="font-medium text-red-500 tabular-nums">
                    ৳ {fmt(deductions.reduce((s, c) => s + (c.DEFAULT_VALUE ?? 0), 0))}
                  </span>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Remove confirm */}
      <AlertDialog open={!!removeTarget} onOpenChange={(v) => !v && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Component?</AlertDialogTitle>
            <AlertDialogDescription>
              Remove <strong>{removeTarget?.NAME}</strong> from this pay structure?
              This won't delete the component itself.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              disabled={isRemoving}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              {isRemoving ? <><Spinner className="mr-2 h-4 w-4" />Removing...</> : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}