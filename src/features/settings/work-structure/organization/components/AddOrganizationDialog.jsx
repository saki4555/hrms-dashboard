import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
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
import { Spinner } from "@/components/ui/spinner";
import { useCreateOrganization, useOrganizations } from "../queries";
import { useOrgTypeById, useOrgTypes } from "../../organization-types/queries";
import { useHrLocations } from "../../locations/queries";

// Demo data - easy to replace later with API calls
const ORGANIZATION_TYPES = [
  { id: 1, name: "Headquarters" },
  { id: 2, name: "Branch Office" },
  { id: 3, name: "Department" },
  { id: 4, name: "Division" },
  { id: 5, name: "Subsidiary" },
  { id: 6, name: "Regional Office" },
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
  location: z
    .string()
    .max(200, "Location cannot exceed 200 characters")
    .optional(),
  costCenterId: z.number().optional().nullable(),
  createdBy: z.number().optional(), // Will be set from logged-in user
});

export default function AddOrganizationDialog({
  open,
  onOpenChange,
  showConfirmation,
}) {
  const [parentOrgOpen, setParentOrgOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [costCenterOpen, setCostCenterOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

   const {
      data: organizationData = [],
      isLoading: orgLoading,
    } = useOrganizations();

  console.log("Organization data:", organizationData);

  const { data: organizationTypes = [], isLoading: orgTypesLoading } =
    useOrgTypes();
  console.log("Organization types data:", organizationTypes);

  const { data: locations = [], isLoading: locationsLoading } =
    useHrLocations();
  console.log("Locations data:", locations);

  const createOrganizationMutation = useCreateOrganization();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      orgTypeId: undefined,
      parentOrgId: null,
      location: "",
      costCenterId: null,
      createdBy: undefined, // TODO: Set this from logged-in user context
    },
  });

  const {
    formState: { isDirty },
  } = form;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  const onSubmit = async (data) => {
    try {
      // Prepare data for backend (sending IDs, not display names)
      const backendData = {
        NAME: data.name,
        ORG_TYPE_ID: data.orgTypeId,
        PARENT_ORG_ID: data.parentOrgId,
        LOCATION: data.location || null,
        COST_CENTER_ID: data.costCenterId,
        STATUS: 1, // Always set to Active (1) when creating
        CREATED_BY: data.createdBy || 1, // TODO: Get from user session
        // CREATED_DATE will be auto-filled by database (SYSTIMESTAMP)
        // ID is auto-increment, no need to send
      };

      console.log("Sending to backend:", backendData);
      

      await createOrganizationMutation.mutateAsync(backendData);

      // Show success message
      toast.success("Organization created successfully!");

      // Reset form and close dialog
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating organization:", error);
      toast.error(
        error?.message || "Failed to create organization. Please try again.",
      );
    }
  };

  const handleCancel = async () => {
    if (isDirty && showConfirmation) {
      const confirmed = await showConfirmation({
        title: "Discard changes?",
        description:
          "You have unsaved changes. Are you sure you want to close without saving?",
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
              <DialogDescription>
                Create a new organization in the system
              </DialogDescription>
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
                      Organization Name{" "}
                      <span className="text-destructive">*</span>
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
                      Organization Type{" "}
                      <span className="text-destructive">*</span>
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
                        {organizationTypes.map((type) => (
                          <SelectItem key={type.ID} value={type.ID.toString()}>
                            {type.ORG_TYPE}
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
      <Popover
        modal={true}
        open={parentOrgOpen}
        onOpenChange={setParentOrgOpen}
      >
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
                ? organizationData.find(
                    (org) => org.ID === field.value,
                  )?.NAME
                : "Select parent (optional)"}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </FormControl>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput
              placeholder="Search organizations..."
              className="h-9"
            />
            <CommandList>
              <CommandEmpty>No organization found.</CommandEmpty>
              <CommandGroup>
                {organizationData.map((org) => (
                  <CommandItem
                    key={org.ID}
                    value={org.NAME}
                    onSelect={() => {
                      field.onChange(org.ID);
                      setParentOrgOpen(false);
                    }}
                  >
                    {org.NAME}
                    <Check
                      className={`ml-auto h-4 w-4 ${
                        field.value === org.ID
                          ? "opacity-100"
                          : "opacity-0"
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
  render={({ field }) => {
    // Filter organizations where ORG_TYPE_ID is 24 (Cost Center)
    const costCenterOrgs = organizationData.filter(org => org.ORG_TYPE_ID === 24);
    
    return (
      <FormItem>
        <FormLabel>Cost Center</FormLabel>
        <Popover
          modal={true}
          open={costCenterOpen}
          onOpenChange={setCostCenterOpen}
        >
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
                  ? costCenterOrgs.find((cc) => cc.ID === field.value)?.NAME
                  : "Select cost center (optional)"}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </FormControl>
          </PopoverTrigger>
          <PopoverContent className="w-[350px] p-0">
            <Command>
              <CommandInput
                placeholder="Search cost centers..."
                className="h-9"
              />
              <CommandList>
                <CommandEmpty>No cost center found.</CommandEmpty>
                <CommandGroup>
                  {costCenterOrgs.map((cc) => (
                    <CommandItem
                      key={cc.ID}
                      value={cc.NAME}
                      onSelect={() => {
                        field.onChange(cc.ID);
                        setCostCenterOpen(false);
                      }}
                    >
                      {cc.NAME}
                      <Check
                        className={`ml-auto h-4 w-4 ${
                          field.value === cc.ID
                            ? "opacity-100"
                            : "opacity-0"
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
    );
  }}
/>

             {/* Location - Full Width */}
<FormField
  control={form.control}
  name="location"
  render={({ field }) => (
    <FormItem className="md:col-span-2">
      <FormLabel>Location</FormLabel>
      <Popover modal={true} open={locationOpen} onOpenChange={setLocationOpen}>
        <PopoverTrigger asChild>
          <FormControl>
            <Button
              variant="outline"
              role="combobox"
              className={`w-full justify-between font-normal ${
                !field.value && "text-muted-foreground"
              }`}
            >
              {field.value || "Select location (optional)"}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </FormControl>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Search locations..." className="h-9" />
            <CommandList>
              <CommandEmpty>No location found.</CommandEmpty>
              <CommandGroup>
                {locations.map((loc) => (
                  <CommandItem
                    key={loc.ID}
                    value={loc.LOCATION_NAME}
                    onSelect={() => {
                      field.onChange(loc.LOCATION_NAME);
                      setLocationOpen(false);
                    }}
                  >
                    {loc.LOCATION_NAME}
                    <Check
                      className={`ml-auto h-4 w-4 ${
                        field.value === loc.LOCATION_NAME ? "opacity-100" : "opacity-0"
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
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                onClick={form.handleSubmit(onSubmit)}
                disabled={createOrganizationMutation.isPending}
              >
                {createOrganizationMutation.isPending ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Creating...
                  </>
                ) : (
                  "Save Organization"
                )}
              </Button>
            </DialogFooter>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
