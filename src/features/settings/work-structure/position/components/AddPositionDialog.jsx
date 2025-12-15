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

const ORGANIZATIONS = [
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

const FUNCTIONS = [
  { value: "engineering", label: "Engineering" },
  { value: "sales", label: "Sales" },
  { value: "marketing", label: "Marketing" },
  { value: "finance", label: "Finance" },
  { value: "hr", label: "Human Resources" },
  { value: "operations", label: "Operations" },
  { value: "it", label: "Information Technology" },
  { value: "legal", label: "Legal" },
  { value: "research", label: "Research & Development" },
  { value: "customer-service", label: "Customer Service" },
];

// Zod schema
const formSchema = z.object({
  positionName: z
    .string()
    .min(1, "Position name is required")
    .min(2, "Position name must be at least 2 characters"),
  organization: z.string().min(1, "Organization is required"),
  function: z.string().min(1, "Function is required"),
  fte: z
    .string()
    .min(1, "FTE is required")
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0 && num <= 1;
    }, "FTE must be a number between 0 and 1 (e.g., 0.5 for part-time, 1 for full-time)"),
});

export default function AddPositionDialog({ open, onOpenChange, showConfirmation }) {
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      positionName: "",
      organization: "",
      function: "",
      fte: "1",
    },
  });

  const { formState: { isDirty } } = form;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  const onSubmit = (data) => {
    const org = ORGANIZATIONS.find(o => o.id === data.organization);
    
    const formattedData = {
      ...data,
      organizationName: org?.name || "Unknown",
      fte: parseFloat(data.fte),
    };

    console.log("Position Data:", formattedData);
    alert(`Position Created!\n\nPosition: ${formattedData.positionName}\nOrganization: ${formattedData.organizationName}\nFunction: ${formattedData.function}\nFTE: ${formattedData.fte}`);

    form.reset();
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
              <Briefcase className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Add New Position</DialogTitle>
              <DialogDescription>Create a new position in the system</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Position Name */}
              <FormField
                control={form.control}
                name="positionName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Position Name <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Senior Software Engineer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Organization */}
              <FormField
                control={form.control}
                name="organization"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Organization <span className="text-destructive">*</span>
                    </FormLabel>
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
                              ? ORGANIZATIONS.find(org => org.id === field.value)?.name
                              : "Select organization"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[500px] p-0 ">
                        <Command>
                          <CommandInput placeholder="Search organizations..." className="h-9" />
                          <CommandList>
                            <CommandEmpty>No organization found.</CommandEmpty>
                            <CommandGroup className="pb-8">
                              {ORGANIZATIONS.map((org) => (
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

              {/* Function */}
              <FormField
                control={form.control}
                name="function"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Function <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select function" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {FUNCTIONS.map((func) => (
                          <SelectItem key={func.value} value={func.value}>
                            {func.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                    <FormLabel>
                      FTE (Full-Time Equivalent) <span className="text-destructive">*</span>
                    </FormLabel>
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