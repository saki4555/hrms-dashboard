import React, { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  User,
  MapPin,
  Briefcase,
  ShieldCheck,
  Pencil,
  Ban,
  FileText,
  Copy,
  Check,
  Building2,
  Clock,
  AlertCircle,
  RefreshCw,
  Home,
  Layers,
  ChevronDown,
  Sparkles,
  ChevronsUpDown,
  IdCard,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DatePicker } from "@/components/DatePicker";
import { Link, useParams } from "react-router";
import PageContainer from "@/components/page-container";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useConfirmationDialog } from "@/hooks/useConfirmationDialog";
import { useEmployeeById, useUpdateEmployee } from "./queries";
import { usePersonTypes } from "../employee-types/queries";
import { useCompanies } from "@/features/settings/work-structure/company/queries";
import { useOrganizations } from "@/features/settings/work-structure/organization/queries";
import { useOrgPositions } from "@/features/settings/work-structure/position/queries";
import { useGrades } from "@/features/settings/work-structure/hr-grade/queries";
import {
  useCountries,
  useRegions,
  useDistricts,
  useUpazillas,
} from "../../../api/location-lookup-queries";
import {
  MARITAL_STATUS_OPTIONS,
  REG_DISABILITY_OPTIONS,
} from "@/lib/constants/employeeOptions";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fd = (date) => {
  if (!date) return null;
  if (date instanceof Date) return format(date, "yyyy-MM-dd");
  if (typeof date === "string")
    return date.includes("T") ? date.split("T")[0] : date;
  return null;
};
const parseDate = (s) => (s ? new Date(s) : undefined);

const addrToPayload = (addr) => ({
  ADDRESS1: addr?.ADDRESS1 ?? null,
  ADDRESS1_B: addr?.ADDRESS1_B ?? null,
  COUNTRY: addr?.COUNTRY ?? null,
  REGION: addr?.REGION ?? null,
  DISTRICT: addr?.DISTRICT ?? null,
  UPAZILLA: addr?.UPAZILLA ?? null,
  UNIONS: addr?.UNIONS ?? null,
  AREA: addr?.AREA ?? null,
  EFFECTIVE_START_DATE: addr?.EFFECTIVE_START_DATE
    ? fd(new Date(addr.EFFECTIVE_START_DATE))
    : null,
  EFFECTIVEEND_DATE: addr?.EFFECTIVEEND_DATE
    ? fd(new Date(addr.EFFECTIVEEND_DATE))
    : null,
});

const assignToPayload = (a) => ({
  COMPANY_ID: a?.COMPANY_ID ?? null,
  OU_ID: a?.OU_ID ?? null,
  ORG_ID: a?.ORG_ID ?? null,
  POSITION_ID: a?.POSITION_ID ?? null,
  PAYROLL_ID: a?.PAYROLL_ID ?? null,
  GRADE_ID: a?.GRADE_ID ?? null,
  EFFECTIVE_START_DATE: a?.EFFECTIVE_START_DATE
    ? fd(new Date(a.EFFECTIVE_START_DATE))
    : null,
  EFFECTIVE_END_DATE: a?.EFFECTIVE_END_DATE
    ? fd(new Date(a.EFFECTIVE_END_DATE))
    : null,
});

// Builds the unchanged employee fields for partial-section updates
const employeeBasePayload = (e) => ({
  EMP_NO: e.EMP_NO,
  TITLE: e.TITLE,
  FIRST_NAME: e.FIRST_NAME,
  LAST_NAME: e.LAST_NAME,
  FATHERS_NAME: e.FATHERS_NAME,
  FATHERS_NAME_B: e.FATHERS_NAME_B,
  MOTHERS_NAME: e.MOTHERS_NAME,
  MOTHERS_NAME_B: e.MOTHERS_NAME_B,
  GENDER: e.GENDER,
  DATE_OF_BIRTH: fd(e.DATE_OF_BIRTH),
  NID: e.NID,
  BIRTH_REG_NO: e.BIRTH_REG_NO,
  TOWN_OF_BIRTH: e.TOWN_OF_BIRTH,
  REGION_OF_BIRTH: e.REGION_OF_BIRTH,
  COUNTRY_OF_BIRTH: e.COUNTRY_OF_BIRTH,
  MARRITIAL_STATUS: e.MARRITIAL_STATUS,
  NATIONALITY: e.NATIONALITY,
  JOIN_DATE: fd(e.JOIN_DATE),
  PERSON_TYPE_ID: e.PERSON_TYPE_ID,
  REG_DISABILITY: e.REG_DISABILITY,
  EFFECTIVE_START_DATE: fd(e.EFFECTIVE_START_DATE),
  EFFECTIVEEND_DATE: fd(e.EFFECTIVEEND_DATE),
  LAST_UPDATE_BY: 101,
});

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

const personalSchema = z.object({
  title: z.string().min(1, "Title is required").max(10).trim(),
  firstName: z.string().min(1, "First name is required").max(50).trim(),
  lastName: z.string().min(1, "Last name is required").max(50).trim(),
  fathersName: z.string().min(1, "Father's name is required").max(100).trim(),
  fathersNameB: z
    .string()
    .min(1, "Father's name (Bangla) is required")
    .max(100)
    .trim(),
  mothersName: z.string().min(1, "Mother's name is required").max(100).trim(),
  mothersNameB: z
    .string()
    .min(1, "Mother's name (Bangla) is required")
    .max(100)
    .trim(),
  gender: z.string().min(1, "Gender is required").max(10),
  dateOfBirth: z.date({ required_error: "Date of birth is required" }),
  nid: z.string().min(1, "NID is required").max(30).trim(),
  birthRegNo: z
    .string()
    .min(1, "Birth registration is required")
    .max(30)
    .trim(),
  townOfBirth: z.string().min(1, "Town of birth is required").max(30).trim(),
  regionOfBirth: z
    .string()
    .min(1, "Region of birth is required")
    .max(30)
    .trim(),
  countryOfBirth: z
    .string()
    .min(1, "Country of birth is required")
    .max(30)
    .trim(),
  maritalStatus: z.string().min(1, "Marital status is required"),
  nationality: z.string().min(1, "Nationality is required").max(30).trim(),
  regDisability: z.string().min(1, "Required"),
});

const employmentSchema = z
  .object({
    empNo: z.string().min(1, "Employee number is required").max(20).trim(),
    joinDate: z.date({ required_error: "Join date is required" }),
    personTypeId: z.string().min(1, "Person type is required"),
    effectiveStartDate: z.date({ required_error: "Start date is required" }),
    effectiveEndDate: z.date({ required_error: "End date is required" }),
  })
  .refine((d) => d.effectiveEndDate > d.effectiveStartDate, {
    message: "End date must be after start date",
    path: ["effectiveEndDate"],
  });

const assignmentSchema = z
  .object({
    companyId: z.string().min(1, "Company is required"),
    ouId: z.string().min(1, "Operational unit is required"),
    orgId: z.string().min(1, "Organisation is required"),
    positionId: z.string().min(1, "Position is required"),
    orgPositionId: z.string().min(1, "Position is required"),
    gradeId: z.string().min(1, "Grade is required"),
    payrollId: z.string().min(1, "Payroll ID is required"),
    assignmentEffectiveStartDate: z.date({
      required_error: "Start date is required",
    }),
    assignmentEffectiveEndDate: z.date({
      required_error: "End date is required",
    }),
  })
  .refine(
    (d) => d.assignmentEffectiveEndDate > d.assignmentEffectiveStartDate,
    {
      message: "End date must be after start date",
      path: ["assignmentEffectiveEndDate"],
    },
  );

const addrItemSchema = z
  .object({
    address1: z.string().min(1, "Address is required").max(100).trim(),
    address1B: z
      .string()
      .min(1, "Address (Bangla) is required")
      .max(100)
      .trim(),
    country: z.string().min(1, "Country is required"),
    region: z.string().min(1, "Region is required"),
    district: z.string().min(1, "District is required"),
    upazilla: z.string().min(1, "Upazilla is required"),
    unions: z.string().min(1, "Union is required").max(30).trim(),
    area: z.string().min(1, "Area is required").max(30).trim(),
    effectiveStartDate: z.date({ required_error: "Start date is required" }),
    effectiveEndDate: z.date({ required_error: "End date is required" }),
  })
  .refine((d) => d.effectiveEndDate > d.effectiveStartDate, {
    message: "End date must be after start date",
    path: ["effectiveEndDate"],
  });
const addressSchema = z.object({
  presentAddress: addrItemSchema,
  permanentAddress: addrItemSchema,
});

// ─── Shared field helpers ─────────────────────────────────────────────────────

/** ID-storing combobox, form-aware */
function LocalComboboxField({
  form,
  name,
  label,
  items,
  idKey,
  nameKey,
  placeholder,
  disabled,
  onSelect,
}) {
  const [open, setOpen] = useState(false);
  const selectedId = form.watch(name);
  const selectedItem = items.find(
    (i) => String(i[idKey]) === String(selectedId),
  );
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-sm font-medium">{label} *</FormLabel>
          <Popover modal open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  role="combobox"
                  disabled={disabled}
                  className={`w-full justify-between font-normal ${!field.value && "text-muted-foreground"}`}
                >
                  <span className="truncate">
                    {selectedItem ? selectedItem[nameKey] : placeholder}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-0">
              <Command>
                <CommandInput
                  placeholder={`Search ${label.toLowerCase()}...`}
                  className="h-9"
                />
                <CommandList>
                  <CommandEmpty>No {label.toLowerCase()} found.</CommandEmpty>
                  <CommandGroup>
                    {items.map((item) => (
                      <CommandItem
                        key={item[idKey]}
                        value={item[nameKey]}
                        onSelect={() => {
                          field.onChange(String(item[idKey]));
                          onSelect?.(item);
                          setOpen(false);
                        }}
                      >
                        {item[nameKey]}
                        <Check
                          className={`ml-auto h-4 w-4 ${String(field.value) === String(item[idKey]) ? "opacity-100" : "opacity-0"}`}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <FormMessage className="text-xs" />
        </FormItem>
      )}
    />
  );
}

/** Cascade address section (country → region → district → upazilla) */
function AddressFormSection({
  form,
  prefix,
  disabled,
  initialCountryId,
  initialRegionId,
  initialDistrictId,
}) {
  const [selCountryId, setSelCountryId] = useState(initialCountryId);
  const [selRegionId, setSelRegionId] = useState(initialRegionId);
  const [selDistrictId, setSelDistrictId] = useState(initialDistrictId);

  useEffect(() => {
    if (initialCountryId && !selCountryId) setSelCountryId(initialCountryId);
  }, [initialCountryId]);
  useEffect(() => {
    if (initialRegionId && !selRegionId) setSelRegionId(initialRegionId);
  }, [initialRegionId]);
  useEffect(() => {
    if (initialDistrictId && !selDistrictId)
      setSelDistrictId(initialDistrictId);
  }, [initialDistrictId]);

  const { data: countries = [], isLoading: cL } = useCountries();
  const { data: regions = [], isLoading: rL } = useRegions(selCountryId);
  const { data: districts = [], isLoading: dL } = useDistricts(selRegionId);
  const { data: upazillas = [], isLoading: uL } = useUpazillas(selDistrictId);

  // Mini cascade combobox — name-storing (not ID)
  const CascadePicker = ({
    fieldName,
    items,
    idKey,
    nameKey,
    loading,
    onPick,
  }) => {
    const [open, setOpen] = useState(false);
    return (
      <FormField
        control={form.control}
        name={`${prefix}.${fieldName}`}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium capitalize">
              {fieldName} *
            </FormLabel>
            <Popover modal open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    role="combobox"
                    disabled={disabled || loading || !items.length}
                    className={`w-full justify-between font-normal ${!field.value && "text-muted-foreground"}`}
                  >
                    <span className="truncate">
                      {field.value ||
                        (loading ? "Loading…" : `Select ${fieldName}`)}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-[260px] p-0">
                <Command>
                  <CommandInput placeholder="Search…" className="h-9" />
                  <CommandList>
                    <CommandEmpty>No results.</CommandEmpty>
                    <CommandGroup>
                      {items.map((item) => (
                        <CommandItem
                          key={item[idKey]}
                          value={item[nameKey]}
                          onSelect={() => {
                            field.onChange(item[nameKey]);
                            onPick(item);
                            setOpen(false);
                          }}
                        >
                          {item[nameKey]}
                          <Check
                            className={`ml-auto h-4 w-4 ${field.value === item[nameKey] ? "opacity-100" : "opacity-0"}`}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <FormMessage className="text-xs" />
          </FormItem>
        )}
      />
    );
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name={`${prefix}.address1`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">
                Address Line *
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter address"
                  disabled={disabled}
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`${prefix}.address1B`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">
                Address (Bangla) *
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="ঠিকানা লিখুন"
                  disabled={disabled}
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <CascadePicker
          fieldName="country"
          items={countries}
          idKey="COUNTRY_ID"
          nameKey="COUNTRY_NAME"
          loading={cL}
          onPick={(item) => {
            setSelCountryId(item.COUNTRY_ID);
            form.setValue(`${prefix}.region`, "");
            form.setValue(`${prefix}.district`, "");
            form.setValue(`${prefix}.upazilla`, "");
            setSelRegionId(null);
            setSelDistrictId(null);
          }}
        />
        <CascadePicker
          fieldName="region"
          items={regions}
          idKey="REGION_ID"
          nameKey="REGION_NAME"
          loading={rL}
          onPick={(item) => {
            setSelRegionId(item.REGION_ID);
            form.setValue(`${prefix}.district`, "");
            form.setValue(`${prefix}.upazilla`, "");
            setSelDistrictId(null);
          }}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <CascadePicker
          fieldName="district"
          items={districts}
          idKey="DISTRICT_ID"
          nameKey="DISTRICT_NAME"
          loading={dL}
          onPick={(item) => {
            setSelDistrictId(item.DISTRICT_ID);
            form.setValue(`${prefix}.upazilla`, "");
          }}
        />
        <CascadePicker
          fieldName="upazilla"
          items={upazillas}
          idKey="UPAZILLA_ID"
          nameKey="UPAZILLA_NAME"
          loading={uL}
          onPick={() => {}}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name={`${prefix}.unions`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Union *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter union"
                  disabled={disabled}
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`${prefix}.area`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">
                Area / Village *
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter area"
                  disabled={disabled}
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name={`${prefix}.effectiveStartDate`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">
                Effective Start *
              </FormLabel>
              <FormControl>
                <DatePicker
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select start date"
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`${prefix}.effectiveEndDate`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">
                Effective End *
              </FormLabel>
              <FormControl>
                <DatePicker
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select end date"
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

// ─── Shared sheet footer & close logic ───────────────────────────────────────

function SheetFormFooter({ onCancel, isPending }) {
  return (
    <SheetFooter className="px-6 py-4 border-t border-border bg-muted/30 flex flex-row gap-2 justify-end shrink-0">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={isPending}
      >
        Cancel
      </Button>
      <Button type="submit" disabled={isPending}>
        {isPending ? (
          <>
            <Spinner className="mr-2 h-4 w-4" />
            Saving…
          </>
        ) : (
          "Save Changes"
        )}
      </Button>
    </SheetFooter>
  );
}

const DISCARD_CONFIRM = {
  title: "Discard changes?",
  description:
    "You have unsaved changes. Are you sure you want to close without saving?",
  confirmText: "Discard",
  cancelText: "Keep Editing",
};

// ─── Sheet: Personal Details ──────────────────────────────────────────────────

function EditPersonalSheet({ employee, open, onClose, showConfirmation }) {
  const { mutateAsync, isPending } = useUpdateEmployee();
  const form = useForm({
    resolver: zodResolver(personalSchema),
    defaultValues: {
      title: "",
      firstName: "",
      lastName: "",
      fathersName: "",
      fathersNameB: "",
      mothersName: "",
      mothersNameB: "",
      gender: "",
      nid: "",
      birthRegNo: "",
      townOfBirth: "",
      regionOfBirth: "",
      countryOfBirth: "",
      maritalStatus: "",
      nationality: "",
      regDisability: "",
    },
  });

  useEffect(() => {
    if (!open || !employee) return;
    form.reset({
      title: employee.TITLE || "",
      firstName: employee.FIRST_NAME || "",
      lastName: employee.LAST_NAME || "",
      fathersName: employee.FATHERS_NAME || "",
      fathersNameB: employee.FATHERS_NAME_B || "",
      mothersName: employee.MOTHERS_NAME || "",
      mothersNameB: employee.MOTHERS_NAME_B || "",
      gender: employee.GENDER || "",
      dateOfBirth: parseDate(employee.DATE_OF_BIRTH),
      nid: employee.NID || "",
      birthRegNo: employee.BIRTH_REG_NO || "",
      townOfBirth: employee.TOWN_OF_BIRTH || "",
      regionOfBirth: employee.REGION_OF_BIRTH || "",
      countryOfBirth: employee.COUNTRY_OF_BIRTH || "",
      maritalStatus: employee.MARRITIAL_STATUS?.toString() || "",
      nationality: employee.NATIONALITY || "",
      regDisability: employee.REG_DISABILITY?.toString() || "",
    });
  }, [open, employee]);

  const handleAttemptClose = async () => {
    if (form.formState.isDirty) {
      const ok = await showConfirmation(DISCARD_CONFIRM);
      if (!ok) return;
    }
    form.reset();
    onClose();
  };

  const onSubmit = async (data) => {
    try {
      await mutateAsync({
        personId: employee.PERSON_ID,
        data: {
          employee: {
            ...employeeBasePayload(employee),
            TITLE: data.title,
            FIRST_NAME: data.firstName,
            LAST_NAME: data.lastName,
            FATHERS_NAME: data.fathersName,
            FATHERS_NAME_B: data.fathersNameB,
            MOTHERS_NAME: data.mothersName,
            MOTHERS_NAME_B: data.mothersNameB,
            GENDER: data.gender,
            DATE_OF_BIRTH: fd(data.dateOfBirth),
            NID: data.nid,
            BIRTH_REG_NO: data.birthRegNo,
            TOWN_OF_BIRTH: data.townOfBirth,
            REGION_OF_BIRTH: data.regionOfBirth,
            COUNTRY_OF_BIRTH: data.countryOfBirth,
            MARRITIAL_STATUS: parseInt(data.maritalStatus),
            NATIONALITY: data.nationality,
            REG_DISABILITY: parseInt(data.regDisability),
          },
          address: {
            present: addrToPayload(employee.presentAddress),
            permanent: addrToPayload(employee.permanentAddress),
          },
          assignment: assignToPayload(employee.assignment),
          STATUS: employee.STATUS,
        },
      });
      toast.success("Personal details updated!");
      form.reset(data);
      onClose();
    } catch (err) {
      toast.error(err?.message || "Failed to update personal details.");
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) handleAttemptClose();
      }}
    >
      <SheetContent className="sm:max-w-2xl w-full flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 py-5 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
              <IdCard className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <SheetTitle>Personal Details</SheetTitle>
              <SheetDescription>
                Update identity, family background, and demographic information.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col flex-1 overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Title *
                    </FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isPending}
                        className="flex flex-row gap-4 pt-1"
                      >
                        {["Mr.", "Mrs.", "Ms.", "Dr."].map((t) => (
                          <div
                            key={t}
                            className="flex items-center space-x-1.5"
                          >
                            <RadioGroupItem value={t} id={`ps-t-${t}`} />
                            <Label
                              htmlFor={`ps-t-${t}`}
                              className="cursor-pointer"
                            >
                              {t}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        First Name *
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter first name"
                          disabled={isPending}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Last Name *
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter last name"
                          disabled={isPending}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>
              <Separator />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Parents
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fathersName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Father's Name *
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter father's name"
                          disabled={isPending}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fathersNameB"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Father's Name (Bangla) *
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="পিতার নাম"
                          disabled={isPending}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="mothersName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Mother's Name *
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter mother's name"
                          disabled={isPending}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="mothersNameB"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Mother's Name (Bangla) *
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="মাতার নাম"
                          disabled={isPending}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>
              <Separator />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Demographics
              </p>
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Gender *
                    </FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isPending}
                        className="flex flex-row gap-4 pt-1"
                      >
                        {["Male", "Female", "Other"].map((g) => (
                          <div
                            key={g}
                            className="flex items-center space-x-1.5"
                          >
                            <RadioGroupItem value={g} id={`ps-g-${g}`} />
                            <Label
                              htmlFor={`ps-g-${g}`}
                              className="cursor-pointer"
                            >
                              {g}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Date of Birth *
                      </FormLabel>
                      <FormControl>
                        <DatePicker
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select date"
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nationality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Nationality *
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter nationality"
                          disabled={isPending}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="maritalStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Marital Status *
                    </FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isPending}
                        className="flex flex-row gap-4 pt-1 flex-wrap"
                      >
                        {MARITAL_STATUS_OPTIONS.map((o) => (
                          <div
                            key={o.value}
                            className="flex items-center space-x-1.5"
                          >
                            <RadioGroupItem
                              value={o.value}
                              id={`ps-ms-${o.value}`}
                            />
                            <Label
                              htmlFor={`ps-ms-${o.value}`}
                              className="cursor-pointer"
                            >
                              {o.label}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <Separator />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Identification & Birth
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nid"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        NID *
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="NID number"
                          disabled={isPending}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="birthRegNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Birth Registration No. *
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Birth reg. no"
                          disabled={isPending}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="townOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Town of Birth *
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter town"
                          disabled={isPending}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="regionOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Region of Birth *
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter region"
                          disabled={isPending}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="countryOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Country of Birth *
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter country"
                          disabled={isPending}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="regDisability"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Registered Disability *
                    </FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isPending}
                        className="flex flex-row gap-4 pt-1"
                      >
                        {REG_DISABILITY_OPTIONS.map((o) => (
                          <div
                            key={o.value}
                            className="flex items-center space-x-1.5"
                          >
                            <RadioGroupItem
                              value={o.value}
                              id={`ps-rd-${o.value}`}
                            />
                            <Label
                              htmlFor={`ps-rd-${o.value}`}
                              className="cursor-pointer"
                            >
                              {o.label}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>
            <SheetFormFooter
              onCancel={handleAttemptClose}
              isPending={isPending}
            />
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}

// ─── Sheet: Employment Record ─────────────────────────────────────────────────

function EditEmploymentSheet({ employee, open, onClose, showConfirmation }) {
  const { mutateAsync, isPending } = useUpdateEmployee();
  const { data: personTypes = [], isLoading: ptLoading } = usePersonTypes();
  const form = useForm({
    resolver: zodResolver(employmentSchema),
    defaultValues: { empNo: "", personTypeId: "" },
  });

  useEffect(() => {
    if (!open || !employee) return;
    form.reset({
      empNo: employee.EMP_NO || "",
      joinDate: parseDate(employee.JOIN_DATE),
      personTypeId: employee.PERSON_TYPE_ID?.toString() || "",
      effectiveStartDate: parseDate(employee.EFFECTIVE_START_DATE),
      effectiveEndDate: parseDate(employee.EFFECTIVEEND_DATE),
    });
  }, [open, employee]);

  const handleAttemptClose = async () => {
    if (form.formState.isDirty) {
      const ok = await showConfirmation(DISCARD_CONFIRM);
      if (!ok) return;
    }
    form.reset();
    onClose();
  };

  const onSubmit = async (data) => {
    try {
      await mutateAsync({
        personId: employee.PERSON_ID,
        data: {
          employee: {
            ...employeeBasePayload(employee),
            EMP_NO: data.empNo,
            JOIN_DATE: fd(data.joinDate),
            PERSON_TYPE_ID: parseInt(data.personTypeId),
            EFFECTIVE_START_DATE: fd(data.effectiveStartDate),
            EFFECTIVEEND_DATE: fd(data.effectiveEndDate),
          },
          address: {
            present: addrToPayload(employee.presentAddress),
            permanent: addrToPayload(employee.permanentAddress),
          },
          assignment: assignToPayload(employee.assignment),
          STATUS: employee.STATUS,
        },
      });
      toast.success("Employment record updated!");
      form.reset(data);
      onClose();
    } catch (err) {
      toast.error(err?.message || "Failed to update.");
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) handleAttemptClose();
      }}
    >
      <SheetContent className="sm:max-w-lg w-full flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 py-5 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Briefcase className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <SheetTitle>Employment Record</SheetTitle>
              <SheetDescription>
                Update employee number, join date, person type, and effective
                period.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col flex-1 overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              <FormField
                control={form.control}
                name="empNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Employee Number *
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter employee number"
                        disabled={isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="joinDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Join Date *
                    </FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select join date"
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="personTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Person Type *
                    </FormLabel>
                    <Select
                      key={`pt-${field.value}-${personTypes.length}`}
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isPending || ptLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              ptLoading ? "Loading…" : "Select person type"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {personTypes.map((pt) => (
                          <SelectItem
                            key={pt.PERSON_TYPE_ID}
                            value={String(pt.PERSON_TYPE_ID)}
                          >
                            {pt.PERSON_TYPE}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <Separator />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Effective Period
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="effectiveStartDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Start Date *
                      </FormLabel>
                      <FormControl>
                        <DatePicker
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select start date"
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="effectiveEndDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        End Date *
                      </FormLabel>
                      <FormControl>
                        <DatePicker
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select end date"
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <SheetFormFooter
              onCancel={handleAttemptClose}
              isPending={isPending}
            />
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}

// ─── Sheet: Assignment ────────────────────────────────────────────────────────

function EditAssignmentSheet({ employee, open, onClose, showConfirmation }) {
  const { mutateAsync, isPending } = useUpdateEmployee();
  const { data: companies = [], isLoading: compL } = useCompanies();
  const { data: organizations = [], isLoading: orgL } = useOrganizations();
  const { data: orgPositions = [], isLoading: posL } = useOrgPositions();
  const { data: grades = [] } = useGrades();
  const [selectedOrgId, setSelectedOrgId] = useState(null);
  const [formSeeded, setFormSeeded] = useState(false);

  const filteredPositions = useMemo(() => {
    if (!selectedOrgId) return [];
    return orgPositions.filter(
      (p) => String(p.ORG_ID) === String(selectedOrgId),
    );
  }, [orgPositions, selectedOrgId]);

  const form = useForm({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      companyId: "",
      ouId: "",
      orgId: "",
      positionId: "",
      orgPositionId: "",
      gradeId: "",
      payrollId: "",
    },
  });

  useEffect(() => {
    if (!open || !employee) return;
    const a = employee.assignment;
    if (a?.ORG_ID) setSelectedOrgId(a.ORG_ID);
    form.reset({
      companyId: a?.COMPANY_ID?.toString() || "",
      ouId: a?.OU_ID?.toString() || "",
      orgId: a?.ORG_ID?.toString() || "",
      positionId: "",
      orgPositionId: "",
      gradeId: a?.GRADE_ID?.toString() || "",
      payrollId: a?.PAYROLL_ID?.toString() || "",
      assignmentEffectiveStartDate: parseDate(a?.EFFECTIVE_START_DATE),
      assignmentEffectiveEndDate: parseDate(a?.EFFECTIVE_END_DATE),
    });
    setFormSeeded(true);
  }, [open, employee]);

  // Resolve position once orgPositions load
  useEffect(() => {
    if (!formSeeded || !employee || !orgPositions.length) return;
    const a = employee.assignment;
    const match = orgPositions.find(
      (p) =>
        String(p.ID) === String(a?.POSITION_ID) &&
        String(p.ORG_ID) === String(a?.ORG_ID),
    );
    if (match) {
      form.setValue("positionId", String(match.POSITION_ID), {
        shouldValidate: false,
      });
      form.setValue("orgPositionId", String(match.ID), {
        shouldValidate: false,
      });
      if (match.GRADE) {
        const g = grades.find((g) => g.GRADE === match.GRADE);
        if (g)
          form.setValue("gradeId", String(g.ID), { shouldValidate: false });
      }
    }
  }, [formSeeded, employee, orgPositions, grades]);

  const handleAttemptClose = async () => {
    if (form.formState.isDirty) {
      const ok = await showConfirmation(DISCARD_CONFIRM);
      if (!ok) return;
    }
    form.reset();
    setFormSeeded(false);
    onClose();
  };

  const onSubmit = async (data) => {
    try {
      await mutateAsync({
        personId: employee.PERSON_ID,
        data: {
          employee: employeeBasePayload(employee),
          address: {
            present: addrToPayload(employee.presentAddress),
            permanent: addrToPayload(employee.permanentAddress),
          },
          assignment: {
            COMPANY_ID: parseInt(data.companyId),
            OU_ID: parseInt(data.ouId),
            ORG_ID: parseInt(data.orgId),
            POSITION_ID: parseInt(data.orgPositionId),
            PAYROLL_ID: parseInt(data.payrollId),
            GRADE_ID: parseInt(data.gradeId),
            EFFECTIVE_START_DATE: fd(data.assignmentEffectiveStartDate),
            EFFECTIVE_END_DATE: fd(data.assignmentEffectiveEndDate),
          },
          STATUS: employee.STATUS,
        },
      });
      toast.success("Assignment updated!");
      form.reset(data);
      onClose();
    } catch (err) {
      toast.error(err?.message || "Failed to update assignment.");
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) handleAttemptClose();
      }}
    >
      <SheetContent className="sm:max-w-xl w-full flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 py-5 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <Building2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <SheetTitle>Assignment</SheetTitle>
              <SheetDescription>
                Update organisation, position, grade, and assignment period.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col flex-1 overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              <LocalComboboxField
                form={form}
                name="companyId"
                label="Company"
                items={companies}
                idKey="COMPANY_ID"
                nameKey="COMPANY_NAME"
                placeholder={compL ? "Loading…" : "Select company"}
                disabled={isPending || compL}
              />
              <LocalComboboxField
                form={form}
                name="ouId"
                label="Operational Unit"
                items={organizations}
                idKey="ID"
                nameKey="NAME"
                placeholder={orgL ? "Loading…" : "Select operational unit"}
                disabled={isPending || orgL}
              />
              <LocalComboboxField
                form={form}
                name="orgId"
                label="Organisation"
                items={organizations}
                idKey="ID"
                nameKey="NAME"
                placeholder={orgL ? "Loading…" : "Select organisation"}
                disabled={isPending || orgL}
                onSelect={(org) => {
                  setSelectedOrgId(org.ID);
                  form.setValue("positionId", "", { shouldValidate: false });
                  form.setValue("orgPositionId", "", { shouldValidate: false });
                  form.setValue("gradeId", "", { shouldValidate: false });
                }}
              />

              {/* Position with full/count badge */}
              <FormField
                control={form.control}
                name="positionId"
                render={({ field }) => {
                  const [posOpen, setPosOpen] = useState(false);
                  const selPos = filteredPositions.find(
                    (p) => String(p.POSITION_ID) === String(field.value),
                  );
                  return (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Position *
                      </FormLabel>
                      <Popover modal open={posOpen} onOpenChange={setPosOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              disabled={isPending || !selectedOrgId || posL}
                              className={`w-full justify-between font-normal ${!field.value && "text-muted-foreground"}`}
                            >
                              <span className="truncate">
                                {!selectedOrgId
                                  ? "Select an organisation first"
                                  : posL
                                    ? "Loading…"
                                    : selPos
                                      ? selPos.POSITION_TITLE
                                      : "Select position"}
                              </span>
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0">
                          <Command>
                            <CommandInput
                              placeholder="Search positions…"
                              className="h-9"
                            />
                            <CommandList>
                              <CommandEmpty>No positions found.</CommandEmpty>
                              <CommandGroup>
                                {filteredPositions.map((pos) => {
                                  const isFull = pos.ACTUAL_COUNT >= pos.FTE;
                                  return (
                                    <CommandItem
                                      key={pos.ID}
                                      value={pos.POSITION_TITLE}
                                      disabled={isFull}
                                      className={
                                        isFull
                                          ? "opacity-50 cursor-not-allowed"
                                          : ""
                                      }
                                      onSelect={() => {
                                        if (isFull) return;
                                        field.onChange(String(pos.POSITION_ID));
                                        form.setValue(
                                          "orgPositionId",
                                          String(pos.ID),
                                          { shouldValidate: false },
                                        );
                                        if (pos.GRADE) {
                                          const g = grades.find(
                                            (g) => g.GRADE === pos.GRADE,
                                          );
                                          if (g)
                                            form.setValue(
                                              "gradeId",
                                              String(g.ID),
                                              { shouldValidate: true },
                                            );
                                        }
                                        setPosOpen(false);
                                      }}
                                    >
                                      <div className="flex flex-col flex-1 min-w-0">
                                        <span className="truncate">
                                          {pos.POSITION_TITLE}
                                        </span>
                                        {pos.GRADE && (
                                          <span className="text-xs text-muted-foreground">
                                            {pos.GRADE} · {pos.LEVELS}
                                          </span>
                                        )}
                                      </div>
                                      {isFull ? (
                                        <Badge
                                          variant="secondary"
                                          className="ml-auto text-xs font-normal shrink-0"
                                        >
                                          Full ({pos.ACTUAL_COUNT}/{pos.FTE})
                                        </Badge>
                                      ) : (
                                        <Check
                                          className={`ml-auto h-4 w-4 shrink-0 ${String(field.value) === String(pos.POSITION_ID) ? "opacity-100" : "opacity-0"}`}
                                        />
                                      )}
                                    </CommandItem>
                                  );
                                })}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  );
                }}
              />

              {/* Grade — read-only, auto-filled */}
              <FormField
                control={form.control}
                name="gradeId"
                render={({ field }) => {
                  const g = grades.find(
                    (g) => String(g.ID) === String(field.value),
                  );
                  return (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Grade{" "}
                        <span className="text-muted-foreground text-xs">
                          (auto-filled)
                        </span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            readOnly
                            disabled
                            value={g ? g.GRADE : ""}
                            placeholder="Auto-filled from position"
                            className="bg-muted/40 cursor-not-allowed pl-9"
                          />
                          <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="payrollId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Payroll ID *
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter payroll ID"
                        disabled={isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <Separator />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Assignment Period
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="assignmentEffectiveStartDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Start Date *
                      </FormLabel>
                      <FormControl>
                        <DatePicker
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select start date"
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="assignmentEffectiveEndDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        End Date *
                      </FormLabel>
                      <FormControl>
                        <DatePicker
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select end date"
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <SheetFormFooter
              onCancel={handleAttemptClose}
              isPending={isPending}
            />
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}

// ─── Sheet: Addresses ─────────────────────────────────────────────────────────

function EditAddressSheet({ employee, open, onClose, showConfirmation }) {
  const { mutateAsync, isPending } = useUpdateEmployee();
  const [sameAsPresent, setSameAsPresent] = useState(false);
  const [presentIds, setPresentIds] = useState({
    countryId: null,
    regionId: null,
    districtId: null,
  });
  const [permanentIds, setPermanentIds] = useState({
    countryId: null,
    regionId: null,
    districtId: null,
  });
  const [formSeeded, setFormSeeded] = useState(false);

  const form = useForm({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      presentAddress: {
        address1: "",
        address1B: "",
        country: "",
        region: "",
        district: "",
        upazilla: "",
        unions: "",
        area: "",
      },
      permanentAddress: {
        address1: "",
        address1B: "",
        country: "",
        region: "",
        district: "",
        upazilla: "",
        unions: "",
        area: "",
      },
    },
  });

  const addrDefaults = (a) => ({
    address1: a?.ADDRESS1 || "",
    address1B: a?.ADDRESS1_B || "",
    country: a?.COUNTRY || "",
    region: a?.REGION || "",
    district: a?.DISTRICT || "",
    upazilla: a?.UPAZILLA || "",
    unions: a?.UNIONS || "",
    area: a?.AREA || "",
    effectiveStartDate: parseDate(a?.EFFECTIVE_START_DATE),
    effectiveEndDate: parseDate(a?.EFFECTIVEEND_DATE),
  });

  useEffect(() => {
    if (!open || !employee) return;
    form.reset({
      presentAddress: addrDefaults(employee.presentAddress),
      permanentAddress: addrDefaults(employee.permanentAddress),
    });
    setPresentIds({
      countryId: employee.presentAddress?.COUNTRY_ID || null,
      regionId: employee.presentAddress?.REGION_ID || null,
      districtId: employee.presentAddress?.DISTRICT_ID || null,
    });
    setPermanentIds({
      countryId: employee.permanentAddress?.COUNTRY_ID || null,
      regionId: employee.permanentAddress?.REGION_ID || null,
      districtId: employee.permanentAddress?.DISTRICT_ID || null,
    });
    setFormSeeded(true);
    setSameAsPresent(false);
  }, [open, employee]);

  const handleSameAsPresent = (checked) => {
    setSameAsPresent(checked);
    if (checked) {
      const p = form.getValues("presentAddress");
      Object.keys(p).forEach((k) =>
        form.setValue(`permanentAddress.${k}`, p[k], { shouldDirty: true }),
      );
    }
  };

  const handleAttemptClose = async () => {
    if (form.formState.isDirty) {
      const ok = await showConfirmation(DISCARD_CONFIRM);
      if (!ok) return;
    }
    form.reset();
    setFormSeeded(false);
    onClose();
  };

  const onSubmit = async (data) => {
    const f2p = (a) => ({
      ADDRESS1: a.address1,
      ADDRESS1_B: a.address1B,
      COUNTRY: a.country,
      REGION: a.region,
      DISTRICT: a.district,
      UPAZILLA: a.upazilla,
      UNIONS: a.unions,
      AREA: a.area,
      EFFECTIVE_START_DATE: fd(a.effectiveStartDate),
      EFFECTIVEEND_DATE: fd(a.effectiveEndDate),
    });
    try {
      await mutateAsync({
        personId: employee.PERSON_ID,
        data: {
          employee: employeeBasePayload(employee),
          address: {
            present: f2p(data.presentAddress),
            permanent: f2p(data.permanentAddress),
          },
          assignment: assignToPayload(employee.assignment),
          STATUS: employee.STATUS,
        },
      });
      toast.success("Addresses updated!");
      form.reset(data);
      onClose();
    } catch (err) {
      toast.error(err?.message || "Failed to update addresses.");
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) handleAttemptClose();
      }}
    >
      <SheetContent className="sm:max-w-2xl w-full flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 py-5 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <Home className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <SheetTitle>Addresses</SheetTitle>
              <SheetDescription>
                Update present and permanent address details.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col flex-1 overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold mb-4">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  Present Address
                </p>
                {formSeeded ? (
                  <AddressFormSection
                    form={form}
                    prefix="presentAddress"
                    disabled={isPending}
                    initialCountryId={presentIds.countryId}
                    initialRegionId={presentIds.regionId}
                    initialDistrictId={presentIds.districtId}
                  />
                ) : (
                  <div className="flex items-center gap-2 py-4 text-muted-foreground text-sm">
                    <Spinner className="h-4 w-4" />
                    Loading…
                  </div>
                )}
              </div>

              {/* Same-as-present toggle */}
              <div className="flex items-center gap-3 p-4 rounded-xl border border-border/60 bg-muted/30">
                <Switch
                  id="sap-toggle"
                  checked={sameAsPresent}
                  onCheckedChange={handleSameAsPresent}
                  disabled={isPending}
                />
                <Label
                  htmlFor="sap-toggle"
                  className="text-sm font-medium cursor-pointer flex items-center gap-2"
                >
                  <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                  Permanent address same as present address
                </Label>
              </div>

              <div>
                <p className="flex items-center gap-2 text-sm font-semibold mb-4">
                  <Home className="h-4 w-4 text-muted-foreground" />
                  Permanent Address
                </p>
                {formSeeded ? (
                  <AddressFormSection
                    form={form}
                    prefix="permanentAddress"
                    disabled={isPending || sameAsPresent}
                    initialCountryId={permanentIds.countryId}
                    initialRegionId={permanentIds.regionId}
                    initialDistrictId={permanentIds.districtId}
                  />
                ) : (
                  <div className="flex items-center gap-2 py-4 text-muted-foreground text-sm">
                    <Spinner className="h-4 w-4" />
                    Loading…
                  </div>
                )}
              </div>
            </div>
            <SheetFormFooter
              onCancel={handleAttemptClose}
              isPending={isPending}
            />
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const EmployeeDetailsPageWhole = () => {
  const { empNo } = useParams();
  const {
    data: employee,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useEmployeeById(empNo);
  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();
  const [activeSheet, setActiveSheet] = useState(null);

  const formatDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const calculateTenure = (joinDate) => {
    if (!joinDate) return "";
    const days = Math.ceil(
      Math.abs(new Date() - new Date(joinDate)) / 86400000,
    );
    if (days < 30) return `${days} days`;
    if (days < 365) return `${Math.floor(days / 30)} months`;
    return `${(days / 365).toFixed(1)} years`;
  };

  const CopyButton = ({ text, label }) => {
    const [copied, setCopied] = useState(false);
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 ml-2 text-muted-foreground hover:text-foreground"
              onClick={() => {
                navigator.clipboard.writeText(text);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
            >
              {copied ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{copied ? "Copied!" : `Copy ${label}`}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const DataItem = ({
    label,
    value,
    subValue,
    className = "",
    fullWidth = false,
  }) => (
    <div
      className={`flex flex-col space-y-1 ${fullWidth ? "col-span-full" : ""} ${className}`}
    >
      <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </dt>
      <dd className="text-sm font-medium text-foreground flex items-center">
        {value || "—"}
        {subValue && (
          <span className="ml-2 text-xs text-muted-foreground font-normal">
            ({subValue})
          </span>
        )}
      </dd>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-muted/30">
        <PageContainer>
          <Breadcrumb>
            <BreadcrumbList className="py-2">
              <BreadcrumbItem>Core HR</BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/core-hr/employees">Employee Management</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Employee Details</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <main className="flex-1 space-y-6">
            <Card className="border-none shadow-sm overflow-hidden bg-card">
              <div className="h-32 bg-muted/50" />
              <div className="px-8 pb-8 relative">
                <div className="flex flex-col md:flex-row items-start md:items-end -mt-12 gap-6">
                  <Skeleton className="h-32 w-32 rounded-full border-4 border-card shadow-sm" />
                  <div className="flex-1 space-y-3 pb-2">
                    <Skeleton className="h-8 w-1/3" />
                    <div className="flex gap-4">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-28" />
                    </div>
                  </div>
                  <Skeleton className="h-9 w-36 rounded-md" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mt-10 pt-6 border-t border-border/50">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="space-y-3">
                      <Skeleton className="h-3 w-12" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </main>
        </PageContainer>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col min-h-screen bg-muted/30">
        <PageContainer>
          <main className="flex-1 pt-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error Loading Employee Details</AlertTitle>
              <AlertDescription className="mt-2 flex flex-col gap-2">
                <p>{error?.message || "Failed to load employee details."}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  disabled={isFetching}
                  className="w-fit"
                >
                  {isFetching ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      Retrying…
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Retry
                    </>
                  )}
                </Button>
              </AlertDescription>
            </Alert>
          </main>
        </PageContainer>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex flex-col min-h-screen bg-muted/30">
        <PageContainer>
          <main className="flex-1 pt-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Employee Not Found</AlertTitle>
              <AlertDescription className="mt-2">
                The employee with ID "{empNo}" could not be found.
              </AlertDescription>
            </Alert>
          </main>
        </PageContainer>
      </div>
    );
  }

  const { assignment, presentAddress, permanentAddress, personType } = employee;

  return (
    <div className="flex flex-col min-h-screen bg-muted/30">
      <PageContainer>
        <Breadcrumb>
          <BreadcrumbList className="py-2">
            <BreadcrumbItem>Core HR</BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/core-hr/employees">Employee Management</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Employee Details</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {isFetching && (
          <div className="mb-2">
            <Badge variant="outline" className="gap-2">
              <Spinner className="h-3 w-3" />
              Refreshing…
            </Badge>
          </div>
        )}

        <main className="flex-1 pt-0 space-y-6">
          {/* Hero Card */}
          <Card className="border-border shadow-sm overflow-hidden bg-card">
            <div className="h-32 bg-gradient-to-r from-muted/50 to-muted border-b border-border relative">
              <div className="absolute top-4 right-6 flex gap-3">
                {/* ── Edit Dropdown ── */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-background/60 backdrop-blur-md border-border hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit Profile
                      <ChevronDown className="h-3.5 w-3.5 ml-2 opacity-70" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                      Select section to edit
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="gap-2.5 cursor-pointer"
                      onClick={() => setActiveSheet("personal")}
                    >
                      <div className="p-1 rounded bg-violet-500/10">
                        <IdCard className="h-3.5 w-3.5 text-violet-600" />
                      </div>
                      Personal Details
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="gap-2.5 cursor-pointer"
                      onClick={() => setActiveSheet("employment")}
                    >
                      <div className="p-1 rounded bg-blue-500/10">
                        <Briefcase className="h-3.5 w-3.5 text-blue-600" />
                      </div>
                      Employment Record
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="gap-2.5 cursor-pointer"
                      onClick={() => setActiveSheet("assignment")}
                    >
                      <div className="p-1 rounded bg-emerald-500/10">
                        <Building2 className="h-3.5 w-3.5 text-emerald-600" />
                      </div>
                      Assignment
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="gap-2.5 cursor-pointer"
                      onClick={() => setActiveSheet("address")}
                    >
                      <div className="p-1 rounded bg-orange-500/10">
                        <Home className="h-3.5 w-3.5 text-orange-600" />
                      </div>
                      Addresses
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button variant="destructive" size="sm" className="shadow-sm">
                  <Ban className="h-4 w-4 mr-2" />
                  Deactivate
                </Button>
              </div>
            </div>

            <div className="px-8 pb-8 relative">
              <div className="flex flex-col md:flex-row items-start md:items-end -mt-12 gap-6">
                <div className="relative">
                  <Avatar className="h-32 w-32 border-4 border-card shadow-md">
                    <AvatarImage
                      src={`https://api.dicebear.com/7.x/initials/svg?seed=${employee.FIRST_NAME}`}
                    />
                    <AvatarFallback className="text-2xl bg-muted text-muted-foreground">
                      {employee.FIRST_NAME?.[0] || ""}
                      {employee.LAST_NAME?.[0] || ""}
                    </AvatarFallback>
                  </Avatar>
                  <span
                    className={`absolute bottom-2 right-2 h-5 w-5 rounded-full border-4 border-card ${employee.STATUS === 1 ? "bg-green-500" : "bg-red-500"}`}
                  />
                </div>

                <div className="flex-1 pt-2 md:pt-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">
                      {employee.TITLE} {employee.FIRST_NAME}{" "}
                      {employee.LAST_NAME}
                    </h1>
                    {employee.STATUS === 1 ? (
                      <Badge
                        variant="outline"
                        className="border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400 px-3 py-0.5"
                      >
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="destructive">Inactive</Badge>
                    )}
                    {personType && (
                      <Badge variant="secondary" className="px-3 py-0.5">
                        {personType.PERSON_TYPE}
                      </Badge>
                    )}
                  </div>
                  {assignment && (
                    <p className="text-base font-medium text-foreground/80 mb-2">
                      {assignment.POSITION_TITLE}
                      <span className="text-muted-foreground font-normal">
                        {" "}
                        · {assignment.ORG_NAME} · {assignment.COMPANY_NAME}
                      </span>
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground mt-1">
                    {assignment && (
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-4 w-4" />
                        <span>{assignment.COMPANY_NAME}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {employee.TOWN_OF_BIRTH}, {employee.COUNTRY_OF_BIRTH}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      <span>Joined {formatDate(employee.JOIN_DATE)}</span>
                      <span className="bg-muted px-2 py-0.5 rounded text-xs font-medium border border-border">
                        {calculateTenure(employee.JOIN_DATE)}
                      </span>
                    </div>
                    {assignment?.GRADE_NAME && (
                      <div className="flex items-center gap-1.5">
                        <Layers className="h-4 w-4" />
                        <span>
                          {assignment.GRADE_NAME} ·{" "}
                          {assignment.POSITION_LEVEL?.toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="hidden md:block bg-muted/50 p-3 rounded-lg border border-border">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Employee ID
                  </div>
                  <div className="flex items-center gap-2 font-mono text-lg font-medium text-foreground">
                    {employee.EMP_NO}
                    <CopyButton text={employee.EMP_NO} label="ID" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mt-8 pt-6 border-t border-border">
                <DataItem label="Gender" value={employee.GENDER} />
                <DataItem
                  label="Date of Birth"
                  value={formatDate(employee.DATE_OF_BIRTH)}
                />
                <DataItem label="Nationality" value={employee.NATIONALITY} />
                <DataItem
                  label="Marital Status"
                  value={employee.MARRITIAL_STATUS === 1 ? "Married" : "Single"}
                />
                <div className="flex flex-col space-y-1">
                  <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    NID
                  </dt>
                  <dd className="text-sm font-medium text-foreground flex items-center">
                    {employee.NID}
                    <CopyButton text={employee.NID} label="NID" />
                  </dd>
                </div>
              </div>
            </div>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="bg-background border shadow-sm p-1 h-auto mb-4">
              <TabsTrigger value="personal" className="px-5 py-2">
                Personal
              </TabsTrigger>
              <TabsTrigger value="address" className="px-5 py-2">
                Address
              </TabsTrigger>
              <TabsTrigger value="identification" className="px-5 py-2">
                Identification
              </TabsTrigger>
              <TabsTrigger value="employment" className="px-5 py-2">
                Employment
              </TabsTrigger>
              <TabsTrigger value="system" className="px-5 py-2">
                System Audit
              </TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <User className="h-5 w-5 text-accent-foreground" />
                      Family Background
                    </CardTitle>
                    <CardDescription>
                      Details regarding parents and disability status.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <DataItem
                        label="Father's Name"
                        value={employee.FATHERS_NAME}
                      />
                      <DataItem
                        label="Father's Name (Local)"
                        value={employee.FATHERS_NAME_B}
                        className="font-bengali"
                      />
                      <Separator className="col-span-full" />
                      <DataItem
                        label="Mother's Name"
                        value={employee.MOTHERS_NAME}
                      />
                      <DataItem
                        label="Mother's Name (Local)"
                        value={employee.MOTHERS_NAME_B}
                        className="font-bengali"
                      />
                      <Separator className="col-span-full" />
                      <DataItem
                        label="Disability Registered"
                        value={employee.REG_DISABILITY === 0 ? "No" : "Yes"}
                        className={
                          employee.REG_DISABILITY === 1 ? "text-amber-600" : ""
                        }
                      />
                    </dl>
                  </CardContent>
                </Card>
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <MapPin className="h-5 w-5 text-accent-foreground" />
                      Place of Birth
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="space-y-6">
                      <DataItem
                        label="Country"
                        value={employee.COUNTRY_OF_BIRTH}
                      />
                      <DataItem
                        label="Region / Division"
                        value={employee.REGION_OF_BIRTH}
                      />
                      <DataItem
                        label="Town / City"
                        value={employee.TOWN_OF_BIRTH}
                      />
                    </dl>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="address" className="mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Home className="h-5 w-5 text-accent-foreground" />
                      Present Address
                    </CardTitle>
                    <CardDescription>
                      {presentAddress
                        ? `Valid: ${formatDate(presentAddress.EFFECTIVE_START_DATE)} – ${formatDate(presentAddress.EFFECTIVEEND_DATE)}`
                        : "No present address on record."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {presentAddress ? (
                      <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <DataItem
                          label="Address Line"
                          value={presentAddress.ADDRESS1}
                          fullWidth
                        />
                        <DataItem
                          label="Address (Local)"
                          value={presentAddress.ADDRESS1_B}
                          className="font-bengali"
                        />
                        <DataItem label="Area" value={presentAddress.AREA} />
                        <DataItem label="Union" value={presentAddress.UNIONS} />
                        <DataItem
                          label="Upazilla"
                          value={presentAddress.UPAZILLA}
                        />
                        <DataItem
                          label="District"
                          value={presentAddress.DISTRICT}
                        />
                        <DataItem
                          label="Division / Region"
                          value={presentAddress.REGION}
                        />
                        <DataItem
                          label="Country"
                          value={presentAddress.COUNTRY}
                        />
                      </dl>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No present address recorded.
                      </p>
                    )}
                  </CardContent>
                </Card>
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Home className="h-5 w-5 text-accent-foreground" />
                      Permanent Address
                    </CardTitle>
                    <CardDescription>
                      {permanentAddress
                        ? `Valid: ${formatDate(permanentAddress.EFFECTIVE_START_DATE)} – ${formatDate(permanentAddress.EFFECTIVEEND_DATE)}`
                        : "No permanent address on record."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {permanentAddress ? (
                      <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <DataItem
                          label="Address Line"
                          value={permanentAddress.ADDRESS1}
                          fullWidth
                        />
                        <DataItem
                          label="Address (Local)"
                          value={permanentAddress.ADDRESS1_B}
                          className="font-bengali"
                        />
                        <DataItem label="Area" value={permanentAddress.AREA} />
                        <DataItem
                          label="Union"
                          value={permanentAddress.UNIONS}
                        />
                        <DataItem
                          label="Upazilla"
                          value={permanentAddress.UPAZILLA}
                        />
                        <DataItem
                          label="District"
                          value={permanentAddress.DISTRICT}
                        />
                        <DataItem
                          label="Division / Region"
                          value={permanentAddress.REGION}
                        />
                        <DataItem
                          label="Country"
                          value={permanentAddress.COUNTRY}
                        />
                      </dl>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No permanent address recorded.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="identification" className="mt-0">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5 text-accent-foreground" />
                    Official Documents
                  </CardTitle>
                  <CardDescription>
                    Government issued identification details.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-muted/30 p-4 rounded-lg border">
                      <DataItem
                        label="National ID (NID)"
                        value={employee.NID}
                      />
                    </div>
                    <div className="bg-muted/30 p-4 rounded-lg border">
                      <DataItem
                        label="Birth Registration No."
                        value={employee.BIRTH_REG_NO}
                      />
                    </div>
                    <div className="bg-muted/30 p-4 rounded-lg border border-dashed">
                      <DataItem label="Passport Number" value={null} />
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="employment" className="mt-0 space-y-6">
              {assignment && (
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Briefcase className="h-5 w-5 text-accent-foreground" />
                      Assignment Details
                    </CardTitle>
                    <CardDescription>
                      Current position assignment · ID:{" "}
                      {assignment.ASSIGNMENT_ID}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                        Organisation
                      </h3>
                      <dl className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-muted/30 p-4 rounded-lg border">
                          <DataItem
                            label="Company"
                            value={assignment.COMPANY_NAME}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            {assignment.COMPANY_ADDRESS}
                          </p>
                        </div>
                        <div className="bg-muted/30 p-4 rounded-lg border">
                          <DataItem
                            label="Organisation Unit"
                            value={assignment.ORG_NAME}
                            subValue={`ID: ${assignment.ORG_ID}`}
                          />
                        </div>
                        <div className="bg-muted/30 p-4 rounded-lg border">
                          <DataItem
                            label="Payroll"
                            value={`Payroll #${assignment.PAYROLL_ID}`}
                          />
                        </div>
                      </dl>
                    </div>
                    <Separator />
                    <div>
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                        Position & Grade
                      </h3>
                      <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <DataItem
                          label="Position Title"
                          value={assignment.POSITION_TITLE}
                        />
                        <DataItem
                          label="Position Level"
                          value={assignment.POSITION_LEVEL?.toUpperCase()}
                        />
                        <DataItem label="Grade" value={assignment.GRADE_NAME} />
                        <DataItem
                          label="Position ID"
                          value={assignment.POSITION_ID?.toString()}
                        />
                      </dl>
                    </div>
                    <Separator />
                    <div>
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                        Assignment Period
                      </h3>
                      <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <DataItem
                          label="Effective Start Date"
                          value={formatDate(assignment.EFFECTIVE_START_DATE)}
                        />
                        <DataItem
                          label="Effective End Date"
                          value={formatDate(assignment.EFFECTIVE_END_DATE)}
                        />
                      </dl>
                    </div>
                  </CardContent>
                </Card>
              )}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Clock className="h-5 w-5 text-accent-foreground" />
                    Employment Record
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                    <DataItem
                      label="Join Date"
                      value={formatDate(employee.JOIN_DATE)}
                    />
                    <DataItem
                      label="Current Status"
                      value={employee.STATUS === 1 ? "Active" : "Inactive"}
                      className={
                        employee.STATUS === 1
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    />
                    <Separator className="col-span-full" />
                    <DataItem
                      label="Effective Start Date"
                      value={formatDate(employee.EFFECTIVE_START_DATE)}
                    />
                    <DataItem
                      label="Effective End Date"
                      value={formatDate(employee.EFFECTIVEEND_DATE)}
                    />
                  </dl>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="system" className="mt-0">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ShieldCheck className="h-5 w-5 text-accent-foreground" />
                    System Metadata
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="rounded-md border">
                    <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0">
                      <div className="p-4">
                        <DataItem
                          label="Person ID"
                          value={employee.PERSON_ID?.toString()}
                          className="font-mono"
                        />
                      </div>
                      <div className="p-4">
                        <DataItem
                          label="Created On"
                          value={formatDate(employee.CREATION_DATE)}
                        />
                      </div>
                      <div className="p-4">
                        <DataItem
                          label="Last Updated By"
                          value={employee.LAST_UPDATE_BY?.toString()}
                        />
                      </div>
                      <div className="p-4">
                        <DataItem
                          label="Last Updated On"
                          value={formatDate(employee.LAST_UPDATE_DATE)}
                        />
                      </div>
                    </div>
                  </div>
                  {personType && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                          Person Classification
                        </h3>
                        <dl className="grid grid-cols-2 md:grid-cols-3 gap-6">
                          <DataItem
                            label="Person Type"
                            value={personType.PERSON_TYPE}
                          />
                          <DataItem
                            label="Person Type ID"
                            value={personType.PERSON_TYPE_ID?.toString()}
                          />
                        </dl>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </PageContainer>

      {/* Edit Sheets */}
      <EditPersonalSheet
        employee={employee}
        open={activeSheet === "personal"}
        onClose={() => setActiveSheet(null)}
        showConfirmation={showConfirmation}
      />
      <EditEmploymentSheet
        employee={employee}
        open={activeSheet === "employment"}
        onClose={() => setActiveSheet(null)}
        showConfirmation={showConfirmation}
      />
      <EditAssignmentSheet
        employee={employee}
        open={activeSheet === "assignment"}
        onClose={() => setActiveSheet(null)}
        showConfirmation={showConfirmation}
      />
      <EditAddressSheet
        employee={employee}
        open={activeSheet === "address"}
        onClose={() => setActiveSheet(null)}
        showConfirmation={showConfirmation}
      />

      {/* Single shared confirmation dialog for all sheets */}
      <ConfirmationDialog />
    </div>
  );
};

export default EmployeeDetailsPageWhole;
