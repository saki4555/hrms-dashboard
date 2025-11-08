// features/core-hr/components/EditEmployeeModal.jsx
import { useEffect, useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FileEdit, FilePlus } from "lucide-react";

export default function EditEmployeeModal({
  open,
  onOpenChange,
  employee,
  onSave,
  showConfirmation,
}) {
  const [mode, setMode] = useState("correction");
  const [formData, setFormData] = useState({});
  const [isDirty, setIsDirty] = useState(false);

  const initialDataRef = useRef(null);

  // Initialize form when modal opens or employee changes
  useEffect(() => {
    if (employee && open) {
      setMode("correction");
      const clone = { ...employee };
      setFormData(clone);
      initialDataRef.current = clone;
      setIsDirty(false);
    }
  }, [employee, open]);

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleModeChange = async (newMode) => {
    // If mode hasn't changed, do nothing
    if (newMode === mode) return;

    // Always ask for confirmation when switching modes
    if (showConfirmation) {
      const confirmed = await showConfirmation({
        title: "Change mode?",
        description:
          newMode === "update"
            ? "Switching to 'Update' will create a new employee record and keep the old one unchanged. Continue?"
            : "Switching to 'Correction' will modify the existing employee record directly. Continue?",
        confirmText: "Switch Mode",
        cancelText: "Stay",
      });

      if (!confirmed) return;
    }

    setMode(newMode);

    if (newMode === "update") {
      setFormData((prev) => ({
        ...prev,
        EMP_NO: "", // require new EMP_NO
        isUpdatedRecord: true,
      }));
      setIsDirty(true);
    } else {
      // When switching back to correction, restore original EMP_NO
      setFormData((prev) => ({
        ...prev,
        EMP_NO: employee?.EMP_NO || "",
        isUpdatedRecord: false,
      }));
    }
  };

  const handleSave = () => {
    onSave(mode, formData);
  };

  const handleCancel = async () => {
    // Ask for confirmation if there are unsaved changes
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

    onOpenChange(false);
  };

  if (!employee) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          handleCancel();
        }
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Employee</DialogTitle>
          <DialogDescription>
            {mode === "correction"
              ? "Correct existing employee information"
              : "Create a new employee record based on existing one"}
          </DialogDescription>
        </DialogHeader>

        {/* Mode Tabs */}
        <Tabs value={mode} onValueChange={handleModeChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="correction" className="gap-2">
              <FileEdit className="h-4 w-4" />
              Correction
            </TabsTrigger>
            <TabsTrigger value="update" className="gap-2">
              <FilePlus className="h-4 w-4" />
              Update
            </TabsTrigger>
          </TabsList>

          <TabsContent value="correction" className="mt-4">
            <div className="text-sm text-muted-foreground mb-4">
              Edit the existing employee record directly
            </div>
          </TabsContent>

          <TabsContent value="update" className="mt-4">
            <div className="text-sm text-muted-foreground mb-4">
              Create a new employee record while keeping the old one
            </div>
          </TabsContent>
        </Tabs>

        {/* Employee Form Fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Employee No
            </label>
            <Input
              value={formData.EMP_NO || ""}
              onChange={(e) => handleFieldChange("EMP_NO", e.target.value)}
              disabled={mode === "correction"}
              placeholder={mode === "update" ? "Enter new employee number" : ""}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              First Name
            </label>
            <Input
              value={formData.FIRST_NAME || ""}
              onChange={(e) => handleFieldChange("FIRST_NAME", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Last Name
            </label>
            <Input
              value={formData.LAST_NAME || ""}
              onChange={(e) => handleFieldChange("LAST_NAME", e.target.value)}
            />
          </div>

          {/* Add more fields: GENDER, JOIN_DATE, PERSON_TYPE_ID, STATUS, etc. */}
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant="default" onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}