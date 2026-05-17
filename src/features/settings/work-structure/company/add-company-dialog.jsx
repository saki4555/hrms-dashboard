// src\features\settings\work-structure\company\add-company-dialog.jsx
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { addYears, format } from "date-fns";
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
import { DatePicker } from "@/components/DatePicker";
import { useCreateCompany } from "./queries";
import { useHrLocations } from "../locations/queries";

const formSchema = z
  .object({
    companyName: z
      .string()
      .min(1, "Company name is required")
      .max(100, "Company name cannot exceed 100 characters"),
    companyDetail: z
      .string()
      .min(1, "Company detail is required")
      .max(200, "Company detail cannot exceed 200 characters"),
    binNo: z
      .string()
      .min(1, "BIN number is required")
      .max(50, "BIN number cannot exceed 50 characters"),
    address: z
      .string()
      .min(1, "Address is required")
      .max(200, "Address cannot exceed 200 characters"),
    effectiveStartDate: z.string().min(1, "Start date is required"),
    effectiveEndDate: z.string().min(1, "End date is required"),
  })
  .refine(
    (data) =>
      new Date(data.effectiveEndDate) > new Date(data.effectiveStartDate),
    {
      message: "End date must be after start date",
      path: ["effectiveEndDate"],
    }
  );

export default function AddCompanyDialog({ open, onOpenChange, showConfirmation }) {
  const [addressOpen, setAddressOpen] = useState(false);

  const createCompanyMutation = useCreateCompany();
  const { data: locations = [], isLoading: locationsLoading } = useHrLocations();
const today = format(new Date(), "yyyy-MM-dd");
const hundredYearsLater = format(addYears(new Date(), 100), "yyyy-MM-dd");

const form = useForm({
  resolver: zodResolver(formSchema),
  defaultValues: {
    companyName: "",
    companyDetail: "",
    binNo: "",
    address: "",
    effectiveStartDate: today,
    effectiveEndDate: hundredYearsLater,
  },
});

  const { formState: { isDirty } } = form;

useEffect(() => {
  if (open) {
    const today = format(new Date(), "yyyy-MM-dd");
    const hundredYearsLater = format(addYears(new Date(), 100), "yyyy-MM-dd");
    form.reset({
      companyName: "",
      companyDetail: "",
      binNo: "",
      address: "",
      effectiveStartDate: today,
      effectiveEndDate: hundredYearsLater,
    });
  }
}, [open]);

  const startDate = form.watch("effectiveStartDate");

  useEffect(() => {
    if (startDate) {
      const endDate = format(addYears(new Date(startDate), 100), "yyyy-MM-dd");
      form.setValue("effectiveEndDate", endDate, { shouldDirty: true });
    }
  }, [startDate]);

  const onSubmit = async (data) => {
    try {
      const backendData = {
        COMPANY_NAME: data.companyName,
        COMPANY_DETAIL: data.companyDetail,
        BIN_NO: data.binNo,
        ADDRESS: data.address,
        EFFECTIVE_START_DATE: data.effectiveStartDate,
        EFFECTIVE_END_DATE: data.effectiveEndDate,
      };

      await createCompanyMutation.mutateAsync(backendData);
      toast.success("Company created successfully!");
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(error?.message || "Failed to create company. Please try again.");
    }
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
        if (!isOpen) handleCancel();
      }}
    >
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Add New Company</DialogTitle>
              <DialogDescription>Create a new company in the system</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Company Name */}
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Company Name <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Acme Corporation" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* BIN No */}
              <FormField
                control={form.control}
                name="binNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      BIN Number <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 000123456-0101" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Company Detail - Full Width */}
              <FormField
                control={form.control}
                name="companyDetail"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>
                      Company Detail <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Brief description of the company"
                        className="resize-none"
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Address - from master location table, Full Width */}
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>
                      Address <span className="text-destructive">*</span>
                    </FormLabel>
                    <Popover modal={true} open={addressOpen} onOpenChange={setAddressOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            disabled={locationsLoading}
                            className={`w-full justify-between font-normal ${!field.value && "text-muted-foreground"}`}
                          >
                            {locationsLoading
                              ? "Loading..."
                              : field.value || "Select address"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Search addresses..." className="h-9" />
                          <CommandList>
                            <CommandEmpty>No address found.</CommandEmpty>
                            <CommandGroup>
                              {locations.map((loc) => (
                                <CommandItem
                                  key={loc.ID}
                                  value={loc.LOCATION_NAME}
                                  onSelect={() => {
                                    field.onChange(loc.LOCATION_NAME);
                                    setAddressOpen(false);
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

              {/* Effective Start Date */}
              <FormField
                control={form.control}
                name="effectiveStartDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Start Date <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <DatePicker
                        className="w-full"
                        placeholder="Select start date"
                        value={field.value ? new Date(field.value) : undefined}
                        onChange={(date) =>
                          field.onChange(date ? format(date, "yyyy-MM-dd") : "")
                        }
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
                      End Date <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <DatePicker
                        className="w-full"
                        placeholder="Select end date"
                        value={field.value ? new Date(field.value) : undefined}
                        onChange={(date) =>
                          field.onChange(date ? format(date, "yyyy-MM-dd") : "")
                        }
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
              <Button
                onClick={form.handleSubmit(onSubmit)}
                disabled={createCompanyMutation.isPending}
              >
                {createCompanyMutation.isPending ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Creating...
                  </>
                ) : (
                  "Save Company"
                )}
              </Button>
            </DialogFooter>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}