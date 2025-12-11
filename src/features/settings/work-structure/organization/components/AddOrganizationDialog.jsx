import { useEffect, useState } from "react";
import { ChevronDownIcon } from "lucide-react";
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
import { Label } from "@/components/ui/label";
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
import { Calendar } from "@/components/ui/calendar";
import { Check, ChevronsUpDown, Building2 } from "lucide-react";

// DatePicker Component
function DatePicker({ label = "", value, onChange, placeholder = "Select date", className = "w-48", error }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      {label && <Label className="px-0">{label}</Label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={`${className} justify-between font-normal ${!value && "text-muted-foreground"}`}
          >
            {value ? value.toLocaleDateString() : placeholder}
            <ChevronDownIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            captionLayout="dropdown"
            onSelect={(selected) => {
              onChange?.(selected);
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

const ORGANIZATION_TYPES = [
  { value: "headquarters", label: "Headquarters" },
  { value: "branch", label: "Branch Office" },
  { value: "department", label: "Department" },
  { value: "division", label: "Division" },
  { value: "subsidiary", label: "Subsidiary" },
  { value: "regional", label: "Regional Office" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const PARENT_ORGANIZATIONS = [
  { id: "org-1", name: "Corporate Headquarters" },
  { id: "org-2", name: "North American Division" },
  { id: "org-3", name: "European Division" },
  { id: "org-4", name: "Asia Pacific Region" },
  { id: "org-5", name: "Manufacturing Department" },
  { id: "org-6", name: "Sales & Marketing" },
  { id: "org-7", name: "Research & Development" },
  { id: "org-8", name: "Human Resources" },
  { id: "org-9", name: "Finance & Accounting" },
  { id: "org-10", name: "Operations Management" },
];

export default function AddOrganizationDialog({ open, onOpenChange, showConfirmation }) {
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [errors, setErrors] = useState({});
  
  const getDefaultStartDate = () => new Date();
  const getDefaultEndDate = () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 100);
    return date;
  };

  const [formData, setFormData] = useState({
    organizationId: "",
    name: "",
    type: "",
    parentOrganization: "",
    effectiveStartDate: getDefaultStartDate(),
    effectiveEndDate: getDefaultEndDate(),
    status: "active",
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  const validateForm = () => {
    const newErrors = {};

    if (!formData.organizationId.trim()) {
      newErrors.organizationId = "Organization ID is required";
    } else if (!/^[A-Z0-9-]+$/i.test(formData.organizationId)) {
      newErrors.organizationId = "Only letters, numbers, and hyphens allowed";
    }

    if (!formData.name.trim()) {
      newErrors.name = "Organization name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (!formData.type) {
      newErrors.type = "Organization type is required";
    }

    if (!formData.effectiveStartDate) {
      newErrors.effectiveStartDate = "Effective start date is required";
    }

    if (!formData.effectiveEndDate) {
      newErrors.effectiveEndDate = "Effective end date is required";
    }

    if (formData.effectiveStartDate && formData.effectiveEndDate) {
      if (formData.effectiveEndDate <= formData.effectiveStartDate) {
        newErrors.effectiveEndDate = "End date must be after start date";
      }
    }

    if (!formData.status) {
      newErrors.status = "Status is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const parentOrg = PARENT_ORGANIZATIONS.find(org => org.id === formData.parentOrganization);
    
    const formattedData = {
      ...formData,
      parentOrganizationName: parentOrg?.name || "None",
      effectiveStartDate: formData.effectiveStartDate.toISOString().split('T')[0],
      effectiveEndDate: formData.effectiveEndDate.toISOString().split('T')[0],
    };

    console.log("Organization Data:", formattedData);

    setFormData({
      organizationId: "",
      name: "",
      type: "",
      parentOrganization: "",
      effectiveStartDate: getDefaultStartDate(),
      effectiveEndDate: getDefaultEndDate(),
      status: "active",
    });
    setIsDirty(false);
    setErrors({});
    onOpenChange(false);
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

    setFormData({
      organizationId: "",
      name: "",
      type: "",
      parentOrganization: "",
      effectiveStartDate: getDefaultStartDate(),
      effectiveEndDate: getDefaultEndDate(),
      status: "active",
    });
    setIsDirty(false);
    setErrors({});
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          handleCancel();
        }
      }}
    >
      <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Add New Organization</DialogTitle>
              <DialogDescription>Create a new organization in the system</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Organization ID */}
            <div className="flex flex-col gap-2">
              <Label>
                Organization ID <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="e.g., ORG-001"
                value={formData.organizationId}
                onChange={(e) => handleChange("organizationId", e.target.value)}
                className="font-mono"
              />
              {errors.organizationId && (
                <p className="text-sm text-destructive">{errors.organizationId}</p>
              )}
            </div>

            {/* Organization Name */}
            <div className="flex flex-col gap-2">
              <Label>
                Organization Name <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="Enter organization name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>

            {/* Organization Type */}
            <div className="flex flex-col gap-2">
              <Label>
                Organization Type <span className="text-destructive">*</span>
              </Label>
              <Select value={formData.type} onValueChange={(value) => handleChange("type", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {ORGANIZATION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && <p className="text-sm text-destructive">{errors.type}</p>}
            </div>

            {/* Parent Organization */}
            <div className="flex flex-col gap-2">
              <Label>Parent Organization</Label>
              <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className={`justify-between font-normal ${
                      !formData.parentOrganization && "text-muted-foreground"
                    }`}
                  >
                    {formData.parentOrganization
                      ? PARENT_ORGANIZATIONS.find(org => org.id === formData.parentOrganization)?.name
                      : "Select parent (optional)"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <div className="border-b p-2">
                    <Input placeholder="Search..." className="h-8" />
                  </div>
                  <div className="max-h-64 overflow-auto p-1">
                    {PARENT_ORGANIZATIONS.map((org) => (
                      <div
                        key={org.id}
                        className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-accent rounded"
                        onClick={() => {
                          handleChange("parentOrganization", org.id);
                          setComboboxOpen(false);
                        }}
                      >
                        <Check
                          className={`h-4 w-4 ${
                            formData.parentOrganization === org.id ? "opacity-100" : "opacity-0"
                          }`}
                        />
                        {org.name}
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Effective Start Date */}
            <DatePicker
              label={
                <>
                  Effective Start Date <span className="text-destructive">*</span>
                </>
              }
              value={formData.effectiveStartDate}
              onChange={(date) => handleChange("effectiveStartDate", date)}
              placeholder="Select start date"
              className="w-full"
              error={errors.effectiveStartDate}
            />

            {/* Effective End Date */}
            <DatePicker
              label={
                <>
                  Effective End Date <span className="text-destructive">*</span>
                </>
              }
              value={formData.effectiveEndDate}
              onChange={(date) => handleChange("effectiveEndDate", date)}
              placeholder="Select end date"
              className="w-full"
              error={errors.effectiveEndDate}
            />

            {/* Status */}
            <div className="flex flex-col gap-2">
              <Label>
                Status <span className="text-destructive">*</span>
              </Label>
              <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.status && <p className="text-sm text-destructive">{errors.status}</p>}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Save</Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}