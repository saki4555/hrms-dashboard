import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Textarea } from "@/components/ui/textarea";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, Building2 } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { showSubmittedData } from "@/lib/showo-submitted-date";

// Demo data - easy to replace later with API calls
const ORGANIZATION_TYPES = [
  { id: 1, name: "Headquarters" },
  { id: 2, name: "Branch Office" },
  { id: 3, name: "Department" },
  { id: 4, name: "Division" },
  { id: 5, name: "Subsidiary" },
  { id: 6, name: "Regional Office" },
];

const STATUS_OPTIONS = [
  { id: 1, label: "Active" },
  { id: 0, label: "Inactive" },
];

const PARENT_ORGANIZATIONS = [
  { id: 1, name: "Corporate Headquarters" },
  { id: 2, name: "North American Division" },
  { id: 3, name: "European Division" },
  { id: 4, name: "Asia Pacific Region" },
  { id: 5, name: "Manufacturing Department" },
  { id: 6, name: "Sales & Marketing" },
  { id: 7, name: "Research & Development" },
  { id: 8, name: "Human Resources" },
  { id: 9, name: "Finance & Accounting" },
  { id: 10, name: "Operations Management" },
];

const COST_CENTERS = [
  { id: 101, name: "CC-001 - Corporate Services" },
  { id: 102, name: "CC-002 - IT Infrastructure" },
  { id: 103, name: "CC-003 - Human Resources" },
  { id: 104, name: "CC-004 - Finance & Accounting" },
  { id: 105, name: "CC-005 - Sales Operations" },
  { id: 106, name: "CC-006 - Marketing" },
  { id: 107, name: "CC-007 - Research & Development" },
  { id: 108, name: "CC-008 - Manufacturing" },
  { id: 109, name: "CC-009 - Logistics" },
  { id: 110, name: "CC-010 - Customer Support" },
];

// Zod schema matching database fields
const formSchema = z.object({
  name: z
    .string()
    .min(1, "Organization name is required")
    .min(2, "Name must be at least 2 characters")
    .max(200, "Name cannot exceed 200 characters"),
  orgTypeId: z.number().optional().nullable(),
  parentOrgId: z.number().optional().nullable(),
  location: z.string().max(200, "Location cannot exceed 200 characters").optional(),
  costCenterId: z.number().optional().nullable(),
  status: z.number().default(1),
  createdBy: z.number().optional(), // Will be set from logged-in user
});

export default function AddOrganizationDialog({ open, onOpenChange, showConfirmation }) {
  const [parentOrgOpen, setParentOrgOpen] = useState(false);
  const [costCenterOpen, setCostCenterOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      orgTypeId: undefined,
      parentOrgId: null,
      location: "",
      costCenterId: null,
      status: 1, // Default to Active
      createdBy: undefined, // TODO: Set this from logged-in user context
    },
  });

  const { formState: { isDirty } } = form;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  const onSubmit = (data) => {
    // Prepare data for backend (sending IDs, not display names)
    const backendData = {
      NAME: data.name,
      ORG_TYPE_ID: data.orgTypeId,
      PARENT_ORG_ID: data.parentOrgId,
      LOCATION: data.location || null,
      COST_CENTER_ID: data.costCenterId,
      STATUS: data.status,
      CREATED_BY: data.createdBy || 1, // TODO: Get from user session
      // CREATED_DATE will be auto-filled by database (SYSTIMESTAMP)
      // ID is auto-increment, no need to send
    };

    // For display purposes (showing names instead of IDs)
    const displayData = {
      ...backendData,
      orgTypeName: ORGANIZATION_TYPES.find(t => t.id === data.orgTypeId)?.name,
      parentOrgName: PARENT_ORGANIZATIONS.find(o => o.id === data.parentOrgId)?.name || "None",
      costCenterName: COST_CENTERS.find(c => c.id === data.costCenterId)?.name || "None",
      statusName: STATUS_OPTIONS.find(s => s.id === data.status)?.label,
    };

    console.log("Backend Data (IDs):", backendData);
    console.log("Display Data (Names):", displayData);
    
    showSubmittedData(displayData);

    // Uncomment to reset and close after successful submission
    // form.reset();
    // onOpenChange(false);
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

    form.reset();
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

        <Form {...form}>
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Organization Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Organization Name <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Enter organization name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Organization Type */}
              <FormField
                control={form.control}
                name="orgTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Organization Type <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(Number(value))} 
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ORGANIZATION_TYPES.map((type) => (
                          <SelectItem key={type.id} value={type.id.toString()}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Parent Organization */}
              <FormField
                control={form.control}
                name="parentOrgId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parent Organization</FormLabel>
                    <Popover modal={true} open={parentOrgOpen} onOpenChange={setParentOrgOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={`w-full justify-between font-normal ${
                              !field.value && "text-muted-foreground"
                            }`}
                          >
                            {field.value
                              ? PARENT_ORGANIZATIONS.find(org => org.id === field.value)?.name
                              : "Select parent (optional)"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0">
                        <Command>
                          <CommandInput placeholder="Search organizations..." className="h-9" />
                          <CommandList>
                            <CommandEmpty>No organization found.</CommandEmpty>
                            <CommandGroup>
                              {PARENT_ORGANIZATIONS.map((org) => (
                                <CommandItem
                                  key={org.id}
                                  value={org.name}
                                  onSelect={() => {
                                    field.onChange(org.id);
                                    setParentOrgOpen(false);
                                  }}
                                >
                                  {org.name}
                                  <Check
                                    className={`ml-auto h-4 w-4 ${
                                      field.value === org.id ? "opacity-100" : "opacity-0"
                                    }`}
                                  />
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Cost Center */}
              <FormField
                control={form.control}
                name="costCenterId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost Center</FormLabel>
                    <Popover modal={true} open={costCenterOpen} onOpenChange={setCostCenterOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={`w-full justify-between font-normal ${
                              !field.value && "text-muted-foreground"
                            }`}
                          >
                            {field.value
                              ? COST_CENTERS.find(cc => cc.id === field.value)?.name
                              : "Select cost center (optional)"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[350px] p-0">
                        <Command>
                          <CommandInput placeholder="Search cost centers..." className="h-9" />
                          <CommandList>
                            <CommandEmpty>No cost center found.</CommandEmpty>
                            <CommandGroup>
                              {COST_CENTERS.map((cc) => (
                                <CommandItem
                                  key={cc.id}
                                  value={cc.name}
                                  onSelect={() => {
                                    field.onChange(cc.id);
                                    setCostCenterOpen(false);
                                  }}
                                >
                                  {cc.name}
                                  <Check
                                    className={`ml-auto h-4 w-4 ${
                                      field.value === cc.id ? "opacity-100" : "opacity-0"
                                    }`}
                                  />
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Location - Full Width */}
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter location address or description (optional)"
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem className="space-y-3 md:col-span-2">
                    <FormLabel>
                      Status <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(value) => field.onChange(Number(value))}
                        value={field.value?.toString()}
                        className="flex flex-row gap-3"
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <FormItem key={status.id} className="flex items-center gap-2">
                            <FormControl>
                              <RadioGroupItem value={status.id.toString()} />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              {status.label}
                            </FormLabel>
                          </FormItem>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={form.handleSubmit(onSubmit)}>Save</Button>
            </DialogFooter>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}