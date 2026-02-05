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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, Briefcase } from "lucide-react";
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

// Demo data - easy to replace later with API calls
const ORGANIZATIONS = [
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

const POSITIONS = [
  { id: 1, name: "Senior Software Engineer" },
  { id: 2, name: "Marketing Manager" },
  { id: 3, name: "HR Specialist" },
  { id: 4, name: "Financial Analyst" },
  { id: 5, name: "Sales Director" },
  { id: 6, name: "Product Manager" },
  { id: 7, name: "Data Scientist" },
  { id: 8, name: "DevOps Engineer" },
  { id: 9, name: "UX Designer" },
  { id: 10, name: "Business Analyst" },
  { id: 11, name: "Project Manager" },
  { id: 12, name: "Quality Assurance Engineer" },
  { id: 13, name: "Customer Success Manager" },
  { id: 14, name: "Operations Coordinator" },
  { id: 15, name: "Executive Assistant" },
];

const STATUS_OPTIONS = [
  { id: 1, label: "Active" },
  { id: 0, label: "Inactive" },
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

// Zod schema matching database fields
const formSchema = z.object({
  positionId: z.number().optional().nullable(),
  orgId: z.number().optional().nullable(),
  fte: z
    .string()
    .optional()
    .refine((val) => {
      if (!val || val === "") return true; // Optional field
      const num = parseFloat(val);
      return !isNaN(num) && num > 0 && num <= 1;
    }, "FTE must be a number between 0 and 1 (e.g., 0.5 for part-time, 1 for full-time)"),
  effectiveStartDate: z.date().optional().nullable(),
  effectiveEndDate: z.date().optional().nullable(),
  status: z.number().default(1),
}).refine((data) => {
  if (data.effectiveStartDate && data.effectiveEndDate) {
    return data.effectiveEndDate > data.effectiveStartDate;
  }
  return true;
}, {
  message: "End date must be after start date",
  path: ["effectiveEndDate"],
});

export default function AddPositionDialog({ open, onOpenChange, showConfirmation }) {
  const [orgComboboxOpen, setOrgComboboxOpen] = useState(false);
  const [positionComboboxOpen, setPositionComboboxOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      positionId: null,
      orgId: null,
      fte: "1",
      effectiveStartDate: getDefaultStartDate(),
      effectiveEndDate: getDefaultEndDate(),
      status: 1, // Default to Active
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
      POSITION_ID: data.positionId,
      ORG_ID: data.orgId,
      FTE: data.fte ? parseFloat(data.fte) : null,
      EFFECTIVE_START_DATE: data.effectiveStartDate?.toISOString().split('T')[0],
      EFFECTIVE_END_DATE: data.effectiveEndDate?.toISOString().split('T')[0],
      STATUS: data.status,
      // ACTUAL_COUNT is not in add form - will be managed elsewhere
      // ID is auto-increment
    };

    // For display purposes (showing names instead of IDs)
    const displayData = {
      ...backendData,
      positionName: POSITIONS.find(p => p.id === data.positionId)?.name || "None",
      organizationName: ORGANIZATIONS.find(o => o.id === data.orgId)?.name || "None",
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
              <Briefcase className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Add New Position</DialogTitle>
              <DialogDescription>Assign a position to an organization</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Position */}
              <FormField
                control={form.control}
                name="positionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position</FormLabel>
                    <Popover modal={true} open={positionComboboxOpen} onOpenChange={setPositionComboboxOpen}>
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
                              ? POSITIONS.find(pos => pos.id === field.value)?.name
                              : "Select position (optional)"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0">
                        <Command>
                          <CommandInput placeholder="Search positions..." className="h-9" />
                          <CommandList>
                            <CommandEmpty>No position found.</CommandEmpty>
                            <CommandGroup>
                              {POSITIONS.map((pos) => (
                                <CommandItem
                                  key={pos.id}
                                  value={pos.name}
                                  onSelect={() => {
                                    field.onChange(pos.id);
                                    setPositionComboboxOpen(false);
                                  }}
                                >
                                  {pos.name}
                                  <Check
                                    className={`ml-auto h-4 w-4 ${
                                      field.value === pos.id ? "opacity-100" : "opacity-0"
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

              {/* Organization */}
              <FormField
                control={form.control}
                name="orgId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization</FormLabel>
                    <Popover modal={true} open={orgComboboxOpen} onOpenChange={setOrgComboboxOpen}>
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
                              ? ORGANIZATIONS.find(org => org.id === field.value)?.name
                              : "Select organization (optional)"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0">
                        <Command>
                          <CommandInput placeholder="Search organizations..." className="h-9" />
                          <CommandList>
                            <CommandEmpty>No organization found.</CommandEmpty>
                            <CommandGroup>
                              {ORGANIZATIONS.map((org) => (
                                <CommandItem
                                  key={org.id}
                                  value={org.name}
                                  onSelect={() => {
                                    field.onChange(org.id);
                                    setOrgComboboxOpen(false);
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

              {/* FTE */}
              <FormField
                control={form.control}
                name="fte"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>FTE (Full-Time Equivalent)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.1" 
                        min="0" 
                        max="1" 
                        placeholder="e.g., 1 for full-time, 0.5 for part-time" 
                        {...field} 
                      />
                    </FormControl>
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
                    <FormLabel>Effective Start Date</FormLabel>
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
                    <FormLabel>Effective End Date</FormLabel>
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
                    <FormLabel>Status</FormLabel>
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