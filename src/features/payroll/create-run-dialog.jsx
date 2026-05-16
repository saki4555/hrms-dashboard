// src/features/payroll/create-run-dialog.jsx
import { useState } from "react";
import { toast } from "sonner";
import { CalendarIcon, Plus } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";

import { useCreatePayrollRun } from "./queries";

// Build a list of the last 12 months as options
const getMonthOptions = () => {
  const options = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = format(d, "yyyy-MM");
    const label = format(d, "MMMM yyyy");
    options.push({ value, label });
  }
  return options;
};

const MONTH_OPTIONS = getMonthOptions();

export default function CreateRunDialog({ open, onOpenChange }) {
  const [runMonth, setRunMonth] = useState(MONTH_OPTIONS[0]?.value ?? "");
  const [remarks, setRemarks] = useState("");

  const { mutate: createRun, isPending } = useCreatePayrollRun();

  const handleSubmit = () => {
    if (!runMonth) return toast.error("Please select a payroll month.");

    createRun(
      { run_month: runMonth, remarks: remarks.trim() || undefined },
      {
        onSuccess: (data) => {
          toast.success(`Payroll run for ${runMonth} created successfully.`);
          onOpenChange(false);
          setRemarks("");
        },
        onError: (err) => toast.error(err.message),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-muted-foreground" />
            New Payroll Run
          </DialogTitle>
          <DialogDescription>
            Create a payroll run for a specific month. You can process it after creation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="run-month">
              Payroll Month <span className="text-destructive">*</span>
            </Label>
            <Select value={runMonth} onValueChange={setRunMonth}>
              <SelectTrigger id="run-month">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {MONTH_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks (optional)</Label>
            <Textarea
              id="remarks"
              placeholder="e.g. Regular monthly payroll"
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || !runMonth}>
            {isPending ? (
              <><Spinner className="mr-2 h-4 w-4" /> Creating...</>
            ) : (
              <><Plus className="mr-2 h-4 w-4" /> Create Run</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}