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
import { DatePicker } from "@/components/DatePicker";
import { showSubmittedData } from "@/lib/showo-submitted-date";


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

const getDefaultStartDate = () => new Date();
const getDefaultEndDate = () => {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 100);
  return date;
};

const getEndDateFromStart = (startDate) => {
  const endDate = new Date(startDate);
  endDate.setFullYear(endDate.getFullYear() + 100);
  return endDate;
};

// Zod schema
const formSchema = z.object({
  organizationId: z
    .string()
    .min(1, "Organization ID is required")
    .regex(/^[A-Z0-9-]+$/i, "Only letters, numbers, and hyphens allowed"),
  name: z
    .string()
    .min(1, "Organization name is required")
    .min(2, "Name must be at least 2 characters"),
  type: z.string().min(1, "Organization type is required"),
  parentOrganization: z.string().optional(),
  effectiveStartDate: z.date({
    required_error: "Effective start date is required",
  }),
  effectiveEndDate: z.date({
    required_error: "Effective end date is required",
  }),
  status: z.string().min(1, "Status is required"),
}).refine((data) => data.effectiveEndDate > data.effectiveStartDate, {
  message: "End date must be after start date",
  path: ["effectiveEndDate"],
});

export default function AddOrganizationDialog({ open, onOpenChange, showConfirmation }) {
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      organizationId: "",
      name: "",
      type: "",
      parentOrganization: "",
      effectiveStartDate: getDefaultStartDate(),
      effectiveEndDate: getDefaultEndDate(),
      status: "active",
    },
  });

  const { formState: { isDirty } } = form;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  const onSubmit = (data) => {
    const parentOrg = PARENT_ORGANIZATIONS.find(org => org.id === data.parentOrganization);
    
    const formattedData = {
      ...data,
      parentOrganizationName: parentOrg?.name || "None",
      effectiveStartDate: data.effectiveStartDate.toISOString().split('T')[0],
      effectiveEndDate: data.effectiveEndDate.toISOString().split('T')[0],
    };

    console.log("Organization Data:", formattedData);
    showSubmittedData(formattedData);

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

  const handleStartDateChange = (date, field) => {
    field.onChange(date);
    
    // Automatically update end date to 100 years from the selected start date
    if (date) {
      const newEndDate = getEndDateFromStart(date);
      form.setValue("effectiveEndDate", newEndDate, { shouldValidate: true });
    }
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
              {/* Organization ID */}
              <FormField
                control={form.control}
                name="organizationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Organization ID <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., ORG-001"
                        className="font-mono"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Organization Type <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ORGANIZATION_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
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
                name="parentOrganization"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parent Organization</FormLabel>
                    <Popover modal={true} open={comboboxOpen} onOpenChange={setComboboxOpen}>
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
                            <CommandGroup className="pb-8">
                              {PARENT_ORGANIZATIONS.map((org) => (
                                <CommandItem
                                  key={org.id}
                                  value={org.name}
                                  onSelect={() => {
                                    field.onChange(org.id);
                                    setComboboxOpen(false);
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

              {/* Effective Start Date */}
              <FormField
                control={form.control}
                name="effectiveStartDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Effective Start Date <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value}
                        onChange={(date) => handleStartDateChange(date, field)}
                        placeholder="Select start date"
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Effective End Date */}
              <FormField
                control={form.control}
                name="effectiveEndDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Effective End Date <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select end date"
                        className="w-full"
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
                  <FormItem className="space-y-3">
                    <FormLabel>
                      Status <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex flex-row gap-3"
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <FormItem key={status.value} className="flex items-center gap-2">
                            <FormControl>
                              <RadioGroupItem value={status.value} />
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