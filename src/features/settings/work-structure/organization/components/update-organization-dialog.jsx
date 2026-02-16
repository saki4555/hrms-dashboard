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
import { useUpdateOrganization, useOrganizations } from "../queries";
import { useOrgTypes } from "../../organization-types/queries";
import { useHrLocations } from "../../locations/queries";

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

// Zod schema
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
  status: z.number(), // Added back
  updatedBy: z.number().optional(),
});

export default function UpdateOrganizationDialog({
  open,
  onOpenChange,
  showConfirmation,
  organization,
}) {
  const [parentOrgOpen, setParentOrgOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [costCenterOpen, setCostCenterOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  console.log("organization", organization);

  // Fetch data
  const { data: organizationData = [], isLoading: orgLoading } =
    useOrganizations();
  const { data: organizationTypes = [], isLoading: orgTypesLoading } =
    useOrgTypes();
  const { data: locations = [], isLoading: locationsLoading } =
    useHrLocations();

  const updateOrganizationMutation = useUpdateOrganization();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      orgTypeId: undefined,
      parentOrgId: null,
      location: "",
      costCenterId: null,
      status: 1, // Added back
      updatedBy: undefined,
    },
  });

  const {
    formState: { isDirty },
  } = form;

  // Populate form when organization changes
  useEffect(() => {
    if (organization) {
      form.reset({
        name: organization.NAME || "",
        orgTypeId: organization.ORG_TYPE_ID || undefined,
        parentOrgId: organization.PARENT_ORG_ID || null,
        location: organization.LOCATION || "",
        costCenterId: organization.COST_CENTER_ID || null,
        status: organization.STATUS ?? 1, // Added back
        updatedBy: undefined, // TODO: Get from user session
      });
    }
  }, [organization, form]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  const onSubmit = async (data) => {
    if (!organization || !organization.ID) {
      toast.error("Organization ID is missing");
      return;
    }

    try {
      // Prepare data for backend
      const backendData = {
        NAME: data.name,
        ORG_TYPE_ID: data.orgTypeId,
        PARENT_ORG_ID: data.parentOrgId,
        LOCATION: data.location || null,
        COST_CENTER_ID: data.costCenterId,
        STATUS: data.status || 1,
        UPDATED_BY: data.updatedBy || 1, // TODO: Get from user session
        // STATUS is not included - it's managed by soft delete functionality
      };

      console.log("Updating organization ID:", organization.ID);
      console.log("Sending to backend:", backendData);

      // Use the mutation hook
      await updateOrganizationMutation.mutateAsync({
        id: organization.ID,
        data: backendData,
      });

      console.log("Organization updated successfully");
      toast.success("Organization updated successfully!");

      // Reset form and close dialog
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating organization:", error);
      toast.error(
        error.message || "Failed to update organization. Please try again.",
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

  const isSubmitting = updateOrganizationMutation.isPending;

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
              <DialogTitle>Update Organization</DialogTitle>
              <DialogDescription>
                Edit organization details for "{organization?.NAME}"
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
                      <Input
                        placeholder="Enter organization name"
                        disabled={isSubmitting}
                        {...field}
                      />
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
                      disabled={isSubmitting}
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
                            disabled={isSubmitting}
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
                              <CommandItem
                                value="clear-selection"
                                onSelect={() => {
                                  field.onChange(null);
                                  setParentOrgOpen(false);
                                }}
                              >
                                <span className="text-muted-foreground">
                                  Clear selection
                                </span>
                              </CommandItem>
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
                  const costCenterOrgs = organizationData.filter(
                    (org) => org.ORG_TYPE_ID === 24,
                  );

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
                              disabled={isSubmitting}
                              className={`w-full justify-between font-normal ${
                                !field.value && "text-muted-foreground"
                              }`}
                            >
                              {field.value
                                ? costCenterOrgs.find(
                                    (cc) => cc.ID === field.value,
                                  )?.NAME
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
                                <CommandItem
                                  value="clear-selection"
                                  onSelect={() => {
                                    field.onChange(null);
                                    setCostCenterOpen(false);
                                  }}
                                >
                                  <span className="text-muted-foreground">
                                    Clear selection
                                  </span>
                                </CommandItem>
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
                    <Popover
                      modal={true}
                      open={locationOpen}
                      onOpenChange={setLocationOpen}
                    >
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            disabled={isSubmitting}
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
                          <CommandInput
                            placeholder="Search locations..."
                            className="h-9"
                          />
                          <CommandList>
                            <CommandEmpty>No location found.</CommandEmpty>
                            <CommandGroup>
                              <CommandItem
                                value="clear-selection"
                                onSelect={() => {
                                  field.onChange("");
                                  setLocationOpen(false);
                                }}
                              >
                                <span className="text-muted-foreground">
                                  Clear selection
                                </span>
                              </CommandItem>
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
                                      field.value === loc.LOCATION_NAME
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
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={form.handleSubmit(onSubmit)}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Updating...
                  </>
                ) : (
                  "Update Organization"
                )}
              </Button>
            </DialogFooter>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
