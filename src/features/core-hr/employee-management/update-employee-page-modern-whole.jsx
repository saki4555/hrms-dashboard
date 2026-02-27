import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  BriefcaseIcon,
  IdCard,
  UserCog,
  CheckCircle,
  XCircle,
  MapPin,
  Home,
  Check,
  ChevronsUpDown,
  ChevronRight,
  ChevronLeft,
  Copy,
  Sparkles,
  AlertCircle,
  User,
  Building2,
  FileText,
  Lock,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { addYears, format } from "date-fns";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import {
  MARITAL_STATUS_OPTIONS,
  REG_DISABILITY_OPTIONS,
} from "@/lib/constants/employeeOptions";
import { DatePicker } from "@/components/DatePicker";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  useUpdateEmployee,
  useCreateEmployee,
  useEmployeeById,
} from "./queries";
import PageContainer from "@/components/page-container";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { useConfirmationDialog } from "@/hooks/useConfirmationDialog";
import { useCompanies } from "@/features/settings/work-structure/company/queries";
import { useOrganizations } from "@/features/settings/work-structure/organization/queries";
import { useOrgPositions } from "@/features/settings/work-structure/position/queries";
import { useGrades } from "@/features/settings/work-structure/hr-grade/queries";
import { usePersonTypes } from "../employee-types/queries";
import { Badge } from "@/components/ui/badge";
import { IconCirclePlus, IconEdit } from "@tabler/icons-react";
import {
  useCountries,
  useDistricts,
  useRegions,
  useUpazillas,
} from "./location-lookup-queries";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

// ─── Zod Schemas ──────────────────────────────────────────────────────────────
const addressSchema = z
  .object({
    address1: z.string().min(1, "Address is required").max(100).trim(),
    address1B: z.string().min(1, "Address (Bangla) is required").max(100).trim(),
    country: z.string().min(1, "Country is required").max(30).trim(),
    region: z.string().min(1, "Region is required").max(30).trim(),
    district: z.string().min(1, "District is required").max(30).trim(),
    upazilla: z.string().min(1, "Upazilla is required").max(30).trim(),
    unions: z.string().min(1, "Union is required").max(30).trim(),
    area: z.string().min(1, "Area is required").max(30).trim(),
    effectiveStartDate: z.date({ required_error: "Effective start date is required" }),
    effectiveEndDate: z.date({ required_error: "Effective end date is required" }),
  })
  .refine((d) => d.effectiveEndDate > d.effectiveStartDate, {
    message: "Effective end date must be after start date",
    path: ["effectiveEndDate"],
  });

const employeeSchema = z
  .object({
    empNo: z.string().min(1, "Employee number is required").max(20).trim(),
    title: z.string().min(1, "Title is required").max(10).trim(),
    firstName: z.string().min(1, "First name is required").max(50).trim(),
    lastName: z.string().min(1, "Last name is required").max(50).trim(),
    fathersName: z.string().min(1, "Father's name is required").max(100).trim(),
    fathersNameB: z.string().min(1, "Father's name (Bangla) is required").max(100).trim(),
    mothersName: z.string().min(1, "Mother's name is required").max(100).trim(),
    mothersNameB: z.string().min(1, "Mother's name (Bangla) is required").max(100).trim(),
    gender: z.string().min(1, "Gender is required").max(10).trim(),
    dateOfBirth: z.date({ required_error: "Date of birth is required" }),
    nid: z.string().min(1, "NID is required").max(30).trim(),
    birthRegNo: z.string().min(1, "Birth registration number is required").max(30).trim(),
    townOfBirth: z.string().min(1, "Town of birth is required").max(30).trim(),
    regionOfBirth: z.string().min(1, "Region of birth is required").max(30).trim(),
    countryOfBirth: z.string().min(1, "Country of birth is required").max(30).trim(),
    maritalStatus: z.string().min(1, "Marital status is required").trim(),
    nationality: z.string().min(1, "Nationality is required").max(30).trim(),
    joinDate: z.date({ required_error: "Join date is required" }),
    personTypeId: z.string().min(1, "Person type is required").trim(),
    regDisability: z.string().min(1, "Registered disability is required").trim(),
    effectiveStartDate: z.date({ required_error: "Effective start date is required" }),
    effectiveEndDate: z.date({ required_error: "Effective end date is required" }),
    companyId: z.string().min(1, "Company is required").trim(),
    ouId: z.string().min(1, "Operational Unit is required").trim(),
    orgId: z.string().min(1, "Organization is required").trim(),
    positionId: z.string().min(1, "Position is required").trim(),
    orgPositionId: z.string().min(1, "Position is required").trim(),
    payrollId: z.string().min(1, "Payroll ID is required").trim(),
    gradeId: z.string().min(1, "Grade is required").trim(),
    assignmentEffectiveStartDate: z.date({ required_error: "Assignment start date is required" }),
    assignmentEffectiveEndDate: z.date({ required_error: "Assignment end date is required" }),
    presentAddress: addressSchema,
    permanentAddress: addressSchema,
  })
  .refine((d) => d.effectiveEndDate > d.effectiveStartDate, {
    message: "Effective end date must be after start date",
    path: ["effectiveEndDate"],
  })
  .refine((d) => d.assignmentEffectiveEndDate > d.assignmentEffectiveStartDate, {
    message: "Assignment end date must be after start date",
    path: ["assignmentEffectiveEndDate"],
  });

// ─── Step Config ──────────────────────────────────────────────────────────────
const STEPS = [
  {
    id: "personal",
    label: "Personal",
    icon: User,
    color: "from-violet-500 to-purple-600",
    fields: [
      "title", "firstName", "lastName", "fathersName", "fathersNameB",
      "mothersName", "mothersNameB", "gender", "dateOfBirth", "nid",
      "birthRegNo", "townOfBirth", "regionOfBirth", "countryOfBirth",
      "maritalStatus", "nationality",
    ],
  },
  {
    id: "employment",
    label: "Employment",
    icon: BriefcaseIcon,
    color: "from-blue-500 to-cyan-600",
    fields: [
      "empNo", "joinDate", "effectiveStartDate", "effectiveEndDate",
      "personTypeId", "regDisability",
    ],
  },
  {
    id: "assignment",
    label: "Assignment",
    icon: Building2,
    color: "from-emerald-500 to-teal-600",
    fields: [
      "companyId", "ouId", "orgId", "positionId", "orgPositionId",
      "payrollId", "gradeId", "assignmentEffectiveStartDate", "assignmentEffectiveEndDate",
    ],
  },
  {
    id: "address",
    label: "Address",
    icon: MapPin,
    color: "from-orange-500 to-amber-600",
    fields: ["presentAddress", "permanentAddress"],
  },
  {
    id: "review",
    label: "Review",
    icon: FileText,
    color: "from-rose-500 to-pink-600",
    fields: [],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const parseDate = (dateString) => {
  if (!dateString) return undefined;
  return new Date(dateString);
};
const fd = (date) => (date ? format(date, "yyyy-MM-dd") : null);

// ─── Progress Bar ─────────────────────────────────────────────────────────────
function ProgressBar({ currentStep, completedSteps, onStepClick }) {
  return (
    <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border/50 shadow-sm">
      <div className="max-w-5xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-2">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isActive = idx === currentStep;
            const isCompleted = completedSteps.has(idx);
            const isClickable = idx <= currentStep || isCompleted;
            return (
              <React.Fragment key={step.id}>
                <button
                  type="button"
                  disabled={!isClickable}
                  onClick={() => isClickable && onStepClick(idx)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 transition-all duration-300",
                    isClickable ? "cursor-pointer" : "cursor-not-allowed opacity-40",
                  )}
                >
                  <div
                    className={cn(
                      "relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300",
                      isCompleted
                        ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                        : isActive
                          ? `bg-gradient-to-br ${step.color} border-transparent text-white shadow-lg`
                          : "bg-muted border-border text-muted-foreground",
                    )}
                  >
                    {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                    {isActive && (
                      <span className="absolute inset-0 rounded-full animate-ping opacity-20 bg-current" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-xs font-medium hidden sm:block transition-colors",
                      isActive ? "text-foreground" : isCompleted ? "text-emerald-500" : "text-muted-foreground",
                    )}
                  >
                    {step.label}
                  </span>
                </button>
                {idx < STEPS.length - 1 && (
                  <div className="flex-1 h-0.5 relative overflow-hidden rounded-full bg-border">
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-500 rounded-full"
                      style={{ width: completedSteps.has(idx) ? "100%" : "0%" }}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Field Components ─────────────────────────────────────────────────────────
function FieldWithCounter({ form, name, label, placeholder, maxLength, disabled }) {
  const value = form.watch(name) || "";
  const pct = value.length / maxLength;

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem>
          <FormLabel className="text-sm font-medium">{label} *</FormLabel>
          <FormControl>
            <div className="relative">
              <Input
                placeholder={placeholder}
                disabled={disabled}
                {...field}
                className={cn(
                  "transition-all duration-200",
                  !fieldState.error && field.value && "border-emerald-500/50 focus-visible:ring-emerald-500/20",
                )}
              />
              {field.value && !fieldState.error && (
                <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-500" />
              )}
            </div>
          </FormControl>
          <div className="flex justify-between items-center">
            <FormMessage className="text-xs" />
            {maxLength && (
              <span className={cn(
                "text-xs ml-auto",
                pct > 0.9 ? "text-destructive" : pct > 0.7 ? "text-amber-500" : "text-muted-foreground",
              )}>
                {value.length}/{maxLength}
              </span>
            )}
          </div>
        </FormItem>
      )}
    />
  );
}

function SmartRadioGroup({ form, name, label, options, disabled }) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-sm font-medium">{label} *</FormLabel>
          <div className="flex flex-wrap gap-2 pt-1">
            {options.map((opt) => {
              const val = String(opt.value ?? opt);
              const lbl = opt.label ?? opt;
              const isSelected = String(field.value) === val;
              return (
                <button
                  key={val}
                  type="button"
                  disabled={disabled}
                  onClick={() => field.onChange(val)}
                  onBlur={field.onBlur}
                  className={cn(
                    "px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-200 cursor-pointer",
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/30"
                      : "bg-background border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
                    disabled && "opacity-50 cursor-not-allowed pointer-events-none",
                  )}
                >
                  {lbl}
                </button>
              );
            })}
          </div>
          <FormMessage className="text-xs" />
        </FormItem>
      )}
    />
  );
}

function CascadeCombobox({ value, items, idKey, nameKey, placeholder, disabled, onSelect }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover modal={true} open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal transition-all duration-200",
            !value && "text-muted-foreground",
            disabled && "opacity-50",
            value && "border-emerald-500/50",
          )}
        >
          <span className="truncate">{value || placeholder}</span>
          {disabled && !value ? (
            <Lock className="ml-2 h-3.5 w-3.5 shrink-0 opacity-40" />
          ) : (
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search..." className="h-9" />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={item[idKey]}
                  value={item[nameKey]}
                  onSelect={() => { onSelect(item); setOpen(false); }}
                >
                  {item[nameKey]}
                  <Check className={cn("ml-auto h-4 w-4", value === item[nameKey] ? "opacity-100" : "opacity-0")} />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function ComboboxField({ form, name, label, items, idKey, nameKey, placeholder, disabled = false, onSelect }) {
  const [open, setOpen] = useState(false);
  const selectedId = form.watch(name);
  const selectedItem = items.find((item) => String(item[idKey]) === String(selectedId));

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem>
          <FormLabel className="text-sm font-medium">{label} *</FormLabel>
          <Popover modal={true} open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  role="combobox"
                  disabled={disabled}
                  className={cn(
                    "w-full justify-between font-normal transition-all duration-200",
                    !field.value && "text-muted-foreground",
                    fieldState.error && "border-destructive",
                    !fieldState.error && field.value && "border-emerald-500/50",
                  )}
                >
                  {selectedItem ? selectedItem[nameKey] : placeholder}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
              <Command>
                <CommandInput placeholder={`Search ${label.toLowerCase()}...`} className="h-9" />
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
                        <Check className={cn("ml-auto h-4 w-4", String(field.value) === String(item[idKey]) ? "opacity-100" : "opacity-0")} />
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

// ─── Address Fields (with cascade seed IDs for pre-populating on edit) ────────
function AddressFields({
  form,
  prefix,
  disabled,
  initialCountryId = null,
  initialRegionId = null,
  initialDistrictId = null,
}) {
  const [selectedCountryId, setSelectedCountryId] = useState(initialCountryId);
  const [selectedRegionId, setSelectedRegionId] = useState(initialRegionId);
  const [selectedDistrictId, setSelectedDistrictId] = useState(initialDistrictId);

  // Sync if initial IDs arrive late (data loads after render)
  useEffect(() => {
    if (initialCountryId && !selectedCountryId) setSelectedCountryId(initialCountryId);
  }, [initialCountryId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (initialRegionId && !selectedRegionId) setSelectedRegionId(initialRegionId);
  }, [initialRegionId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (initialDistrictId && !selectedDistrictId) setSelectedDistrictId(initialDistrictId);
  }, [initialDistrictId]); // eslint-disable-line react-hooks/exhaustive-deps

  const { data: countries = [], isLoading: countriesLoading } = useCountries();
  const { data: regions = [], isLoading: regionsLoading } = useRegions(selectedCountryId);
  const { data: districts = [], isLoading: districtsLoading } = useDistricts(selectedRegionId);
  const { data: upazillas = [], isLoading: upazillasLoading } = useUpazillas(selectedDistrictId);

  const fieldClass = (fieldState) => cn(
    "transition-all duration-200",
    !fieldState?.error && fieldState?.isDirty && "border-emerald-500/50",
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField control={form.control} name={`${prefix}.address1`}
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Address *</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input placeholder="Enter address" disabled={disabled} {...field} className={fieldClass(fieldState)} />
                  {field.value && !fieldState.error && <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-500" />}
                </div>
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
        <FormField control={form.control} name={`${prefix}.address1B`}
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Address (Bangla) *</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input placeholder="ঠিকানা লিখুন" disabled={disabled} {...field} className={fieldClass(fieldState)} />
                  {field.value && !fieldState.error && <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-500" />}
                </div>
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField control={form.control} name={`${prefix}.country`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Country *</FormLabel>
              <CascadeCombobox
                value={field.value} items={countries} idKey="COUNTRY_ID" nameKey="COUNTRY_NAME"
                placeholder={countriesLoading ? "Loading..." : "Select country"}
                disabled={disabled || countriesLoading}
                onSelect={(item) => {
                  field.onChange(item.COUNTRY_NAME);
                  setSelectedCountryId(item.COUNTRY_ID);
                  form.setValue(`${prefix}.region`, "");
                  form.setValue(`${prefix}.district`, "");
                  form.setValue(`${prefix}.upazilla`, "");
                  setSelectedRegionId(null);
                  setSelectedDistrictId(null);
                }}
              />
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
        <FormField control={form.control} name={`${prefix}.region`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Region / Division *</FormLabel>
              <CascadeCombobox
                value={field.value} items={regions} idKey="REGION_ID" nameKey="REGION_NAME"
                placeholder={!selectedCountryId ? "Select country first" : regionsLoading ? "Loading..." : "Select region"}
                disabled={disabled || !selectedCountryId || regionsLoading}
                onSelect={(item) => {
                  field.onChange(item.REGION_NAME);
                  setSelectedRegionId(item.REGION_ID);
                  form.setValue(`${prefix}.district`, "");
                  form.setValue(`${prefix}.upazilla`, "");
                  setSelectedDistrictId(null);
                }}
              />
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField control={form.control} name={`${prefix}.district`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">District *</FormLabel>
              <CascadeCombobox
                value={field.value} items={districts} idKey="DISTRICT_ID" nameKey="DISTRICT_NAME"
                placeholder={!selectedRegionId ? "Select region first" : districtsLoading ? "Loading..." : "Select district"}
                disabled={disabled || !selectedRegionId || districtsLoading}
                onSelect={(item) => {
                  field.onChange(item.DISTRICT_NAME);
                  setSelectedDistrictId(item.DISTRICT_ID);
                  form.setValue(`${prefix}.upazilla`, "");
                }}
              />
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
        <FormField control={form.control} name={`${prefix}.upazilla`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Upazilla *</FormLabel>
              <CascadeCombobox
                value={field.value} items={upazillas} idKey="UPAZILLA_ID" nameKey="UPAZILLA_NAME"
                placeholder={!selectedDistrictId ? "Select district first" : upazillasLoading ? "Loading..." : "Select upazilla"}
                disabled={disabled || !selectedDistrictId || upazillasLoading}
                onSelect={(item) => field.onChange(item.UPAZILLA_NAME)}
              />
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField control={form.control} name={`${prefix}.unions`}
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Union *</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input placeholder="Enter union" disabled={disabled} {...field} className={fieldClass(fieldState)} />
                  {field.value && !fieldState.error && <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-500" />}
                </div>
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
        <FormField control={form.control} name={`${prefix}.area`}
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Area / Village *</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input placeholder="Enter area" disabled={disabled} {...field} className={fieldClass(fieldState)} />
                  {field.value && !fieldState.error && <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-500" />}
                </div>
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField control={form.control} name={`${prefix}.effectiveStartDate`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Effective Start Date *</FormLabel>
              <FormControl>
                <DatePicker value={field.value} onChange={field.onChange} placeholder="Select start date" disabled={disabled} />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
        <FormField control={form.control} name={`${prefix}.effectiveEndDate`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Effective End Date *</FormLabel>
              <FormControl>
                <DatePicker value={field.value} onChange={field.onChange} placeholder="Select end date" disabled={disabled} />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

// ─── Section Wrapper ──────────────────────────────────────────────────────────
function SectionCard({ title, icon: Icon, gradient, children, fieldCount, filledCount }) {
  const pct = fieldCount > 0 ? (filledCount / fieldCount) * 100 : 0;
  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm">
      <div className={cn("px-6 py-4 flex items-center justify-between bg-gradient-to-r opacity-90", gradient)}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Icon className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-base font-semibold text-white">{title}</h2>
        </div>
        {fieldCount > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-20 h-1.5 bg-white/30 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs text-white/80">{filledCount}/{fieldCount}</span>
          </div>
        )}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ─── Review Step ──────────────────────────────────────────────────────────────
function ReviewStep({ form, personTypes, companies, organizations, grades }) {
  const v = form.getValues();
  const fullName = [v.title, v.firstName, v.lastName].filter(Boolean).join(" ");

  const groups = [
    {
      title: "Personal Information",
      icon: User,
      color: "text-violet-500",
      items: [
        { label: "Full Name", value: fullName },
        { label: "Gender", value: v.gender },
        { label: "Date of Birth", value: v.dateOfBirth ? format(v.dateOfBirth, "dd MMM yyyy") : "—" },
        { label: "NID", value: v.nid },
        { label: "Marital Status", value: v.maritalStatus },
        { label: "Nationality", value: v.nationality },
        { label: "Father's Name", value: v.fathersName },
        { label: "Mother's Name", value: v.mothersName },
      ],
    },
    {
      title: "Employment",
      icon: BriefcaseIcon,
      color: "text-blue-500",
      items: [
        { label: "Employee No", value: v.empNo },
        { label: "Join Date", value: v.joinDate ? format(v.joinDate, "dd MMM yyyy") : "—" },
        { label: "Person Type", value: personTypes.find((p) => String(p.PERSON_TYPE_ID) === v.personTypeId)?.PERSON_TYPE || "—" },
        { label: "Registered Disability", value: v.regDisability === "1" ? "Yes" : "No" },
        {
          label: "Effective Dates",
          value: v.effectiveStartDate
            ? `${format(v.effectiveStartDate, "dd MMM yyyy")} → ${format(v.effectiveEndDate, "dd MMM yyyy")}`
            : "—",
        },
      ],
    },
    {
      title: "Assignment",
      icon: Building2,
      color: "text-emerald-500",
      items: [
        { label: "Company", value: companies.find((c) => String(c.COMPANY_ID) === v.companyId)?.COMPANY_NAME || "—" },
        { label: "Organization", value: organizations.find((o) => String(o.ID) === v.orgId)?.NAME || "—" },
        { label: "Payroll ID", value: v.payrollId },
        { label: "Grade", value: grades.find((g) => String(g.ID) === v.gradeId)?.GRADE || "—" },
      ],
    },
    {
      title: "Present Address",
      icon: MapPin,
      color: "text-orange-500",
      items: [
        { label: "Address", value: v.presentAddress?.address1 },
        { label: "Country", value: v.presentAddress?.country },
        { label: "Region", value: v.presentAddress?.region },
        { label: "District", value: v.presentAddress?.district },
        { label: "Upazilla", value: v.presentAddress?.upazilla },
      ],
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
        <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">Review your changes</p>
          <p className="text-xs text-muted-foreground">
            Use <strong>Correction</strong> to fix data in place, or <strong>Update</strong> to archive the current record and create a new one.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {groups.map(({ title, icon: Icon, color, items }) => (
          <div key={title} className="rounded-xl border border-border/60 bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border/50 flex items-center gap-2">
              <Icon className={cn("w-4 h-4", color)} />
              <h3 className="text-sm font-semibold">{title}</h3>
            </div>
            <div className="p-4 space-y-2.5">
              {items.map(({ label, value }) => (
                <div key={label} className="flex justify-between gap-3 text-sm">
                  <span className="text-muted-foreground shrink-0">{label}</span>
                  <span className="font-medium text-right truncate">{value || "—"}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Error Summary ────────────────────────────────────────────────────────────
function ErrorSummary({ errors }) {
  const flattenErrors = (errs, prefix = "") =>
    Object.entries(errs).flatMap(([key, value]) => {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (value?.message) return [{ key: fullKey, message: value.message }];
      if (typeof value === "object" && value !== null && !value.message)
        return flattenErrors(value, fullKey);
      return [];
    });

  const allErrors = flattenErrors(errors);
  if (!allErrors.length) return null;

  const grouped = STEPS.map((step) => ({
    step,
    errs: allErrors.filter((e) => step.fields.some((f) => e.key.startsWith(f))),
  })).filter((g) => g.errs.length > 0);

  return (
    <Alert variant="destructive" className="border-destructive/50">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        <p className="font-semibold mb-2">Please fix the following errors:</p>
        <div className="space-y-2">
          {grouped.map(({ step, errs }) => (
            <div key={step.id}>
              <p className="text-xs font-semibold opacity-70 uppercase tracking-wide">{step.label}</p>
              <ul className="list-disc list-inside text-sm space-y-0.5 mt-0.5">
                {errs.map(({ key, message }) => <li key={key}>{message}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </AlertDescription>
    </Alert>
  );
}

// ─── Position Combobox ────────────────────────────────────────────────────────
function PositionComboboxField({ form, filteredPositions, selectedOrgId, orgPositionsLoading, grades, disabled }) {
  const [posOpen, setPosOpen] = useState(false);
  const fieldValue = form.watch("positionId");
  const isDisabled = disabled || !selectedOrgId || orgPositionsLoading;
  const selectedPosition = filteredPositions.find((pos) => String(pos.POSITION_ID) === String(fieldValue));

  const handlePositionSelect = (pos, fieldOnChange) => {
    fieldOnChange(String(pos.POSITION_ID));
    form.setValue("orgPositionId", String(pos.ID), { shouldValidate: false });
    if (pos.GRADE) {
      const matchedGrade = grades.find((g) => g.GRADE === pos.GRADE);
      if (matchedGrade) form.setValue("gradeId", String(matchedGrade.ID), { shouldValidate: true });
    }
    setPosOpen(false);
  };

  return (
    <FormField
      control={form.control}
      name="positionId"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-sm font-medium">Position *</FormLabel>
          <Popover modal={true} open={posOpen} onOpenChange={setPosOpen}>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  role="combobox"
                  disabled={isDisabled}
                  className={cn(
                    "w-full justify-between font-normal",
                    !field.value && "text-muted-foreground",
                    field.value && "border-emerald-500/50",
                  )}
                >
                  {!selectedOrgId ? "Select an organization first"
                    : orgPositionsLoading ? "Loading..."
                    : selectedPosition ? selectedPosition.POSITION_TITLE
                    : "Select position"}
                  {!selectedOrgId
                    ? <Lock className="ml-2 h-3.5 w-3.5 opacity-40" />
                    : <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />}
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-0">
              <Command>
                <CommandInput placeholder="Search positions..." className="h-9" />
                <CommandList>
                  <CommandEmpty>
                    {filteredPositions.length === 0 ? "No positions for this org." : "No position found."}
                  </CommandEmpty>
                  <CommandGroup>
                    {filteredPositions.map((pos) => {
                      const isFull = pos.ACTUAL_COUNT >= pos.FTE;
                      return (
                        <CommandItem
                          key={pos.ID}
                          value={pos.POSITION_TITLE}
                          disabled={isFull}
                          onSelect={() => { if (!isFull) handlePositionSelect(pos, field.onChange); }}
                          className={isFull ? "opacity-50 cursor-not-allowed" : ""}
                        >
                          <div className="flex flex-col flex-1 min-w-0">
                            <span className="truncate">{pos.POSITION_TITLE}</span>
                            {pos.GRADE && (
                              <span className="text-xs text-muted-foreground">{pos.GRADE} · {pos.LEVELS}</span>
                            )}
                          </div>
                          {isFull ? (
                            <Badge variant="secondary" className="ml-auto shrink-0 text-xs">
                              Full ({pos.ACTUAL_COUNT}/{pos.FTE})
                            </Badge>
                          ) : (
                            <Check className={cn("ml-auto h-4 w-4", String(field.value) === String(pos.POSITION_ID) ? "opacity-100" : "opacity-0")} />
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
      )}
    />
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function UpdateEmployeePageModernWhole() {
  const { personId } = useParams();
  const navigate = useNavigate();
  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();

  const updateEmployeeMutation = useUpdateEmployee();
  const createEmployeeMutation = useCreateEmployee();

  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [submissionType, setSubmissionType] = useState(null); // "correction" | "update"
  const [submitStatus, setSubmitStatus] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [newPersonId, setNewPersonId] = useState(null);
  const [sameAsPresent, setSameAsPresent] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState(null);
  const [formSeeded, setFormSeeded] = useState(false);

  // Cascade address IDs — unlock dropdowns on load
  const [presentAddressIds, setPresentAddressIds] = useState({ countryId: null, regionId: null, districtId: null });
  const [permanentAddressIds, setPermanentAddressIds] = useState({ countryId: null, regionId: null, districtId: null });

  const isSubmitting = submissionType !== null;

  const { data: employee, isLoading, isError, error } = useEmployeeById(personId);
  const { data: personTypes = [], isLoading: personTypesLoading } = usePersonTypes();
  const { data: companies = [], isLoading: companiesLoading } = useCompanies();
  const { data: organizations = [], isLoading: organizationsLoading } = useOrganizations();
  const { data: orgPositions = [], isLoading: orgPositionsLoading } = useOrgPositions();
  const { data: grades = [], isLoading: gradesLoading } = useGrades();

  const filteredPositions = useMemo(() => {
    if (!selectedOrgId) return [];
    return orgPositions.filter((pos) => String(pos.ORG_ID) === String(selectedOrgId));
  }, [orgPositions, selectedOrgId]);

  const form = useForm({
    resolver: zodResolver(employeeSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      empNo: "", title: "", firstName: "", lastName: "",
      fathersName: "", fathersNameB: "", mothersName: "", mothersNameB: "",
      gender: "", nid: "", birthRegNo: "", townOfBirth: "",
      regionOfBirth: "", countryOfBirth: "", maritalStatus: "", nationality: "",
      personTypeId: "", regDisability: "",
      companyId: "", ouId: "", orgId: "", positionId: "", orgPositionId: "",
      payrollId: "", gradeId: "",
      presentAddress: {
        address1: "", address1B: "", country: "", region: "",
        district: "", upazilla: "", unions: "", area: "",
      },
      permanentAddress: {
        address1: "", address1B: "", country: "", region: "",
        district: "", upazilla: "", unions: "", area: "",
      },
    },
  });

  // ── 1. Seed form from employee data ───────────────────────────────────────
  useEffect(() => {
    if (!employee) return;

    const addr = (a) => ({
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

    const existingOrgId = employee.assignment?.ORG_ID;
    if (existingOrgId) setSelectedOrgId(existingOrgId);

    form.reset({
      empNo: employee.EMP_NO || "",
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
      joinDate: parseDate(employee.JOIN_DATE),
      personTypeId: employee.PERSON_TYPE_ID?.toString() || "",
      regDisability: employee.REG_DISABILITY?.toString() || "",
      effectiveStartDate: parseDate(employee.EFFECTIVE_START_DATE),
      effectiveEndDate: parseDate(employee.EFFECTIVEEND_DATE),
      companyId: employee.assignment?.COMPANY_ID?.toString() || "",
      ouId: employee.assignment?.OU_ID?.toString() || "",
      orgId: employee.assignment?.ORG_ID?.toString() || "",
      positionId: "", // resolved in effect 2
      orgPositionId: "",
      payrollId: employee.assignment?.PAYROLL_ID?.toString() || "",
      gradeId: employee.assignment?.GRADE_ID?.toString() || "",
      assignmentEffectiveStartDate: parseDate(employee.assignment?.EFFECTIVE_START_DATE),
      assignmentEffectiveEndDate: parseDate(employee.assignment?.EFFECTIVE_END_DATE),
      presentAddress: addr(employee.presentAddress),
      permanentAddress: addr(employee.permanentAddress),
    });

    setPresentAddressIds({
      countryId: employee.presentAddress?.COUNTRY_ID || null,
      regionId: employee.presentAddress?.REGION_ID || null,
      districtId: employee.presentAddress?.DISTRICT_ID || null,
    });
    setPermanentAddressIds({
      countryId: employee.permanentAddress?.COUNTRY_ID || null,
      regionId: employee.permanentAddress?.REGION_ID || null,
      districtId: employee.permanentAddress?.DISTRICT_ID || null,
    });

    setFormSeeded(true);
    setCompletedSteps(new Set(STEPS.map((_, i) => i)));
  }, [employee]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 2. Resolve positionId + orgPositionId once orgPositions loads ─────────
  useEffect(() => {
    if (!formSeeded || !employee || orgPositions.length === 0) return;

    const assignedOrgPositionId = employee.assignment?.POSITION_ID?.toString() || "";
    const orgId = employee.assignment?.ORG_ID;
    if (!assignedOrgPositionId || !orgId) return;

    const match = orgPositions.find(
      (pos) =>
        String(pos.ID) === assignedOrgPositionId &&
        String(pos.ORG_ID) === String(orgId),
    );

    if (match) {
      form.setValue("positionId", String(match.POSITION_ID), { shouldValidate: false });
      form.setValue("orgPositionId", String(match.ID), { shouldValidate: false });
      if (match.GRADE) {
        const matchedGrade = grades.find((g) => g.GRADE === match.GRADE);
        if (matchedGrade) form.setValue("gradeId", String(matchedGrade.ID), { shouldValidate: false });
      }
    }
  }, [formSeeded, employee, orgPositions, grades]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── "Same as present address" toggle ─────────────────────────────────────
  const handleSameAsPresent = useCallback((checked) => {
    setSameAsPresent(checked);
    if (checked) {
      const present = form.getValues("presentAddress");
      Object.keys(present).forEach((key) => {
        form.setValue(`permanentAddress.${key}`, present[key], { shouldDirty: true });
      });
    }
  }, [form]);

  // ── Step progress counters ────────────────────────────────────────────────
  const allStepProgress = useMemo(() => {
    const values = form.getValues();
    return STEPS.map((step) => {
      if (!step || step.fields.length === 0) return { filled: 0, total: 0 };
      let filled = 0;
      let total = 0;
      step.fields.forEach((f) => {
        if (f === "presentAddress" || f === "permanentAddress") {
          const addr = values[f] || {};
          const keys = ["address1", "address1B", "country", "region", "district", "upazilla", "unions", "area"];
          total += keys.length;
          filled += keys.filter((k) => addr[k] && String(addr[k]).trim()).length;
        } else {
          total++;
          const val = values[f];
          if (val && (typeof val !== "string" || val.trim())) filled++;
        }
      });
      return { filled, total };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    form.watch("title"), form.watch("firstName"), form.watch("lastName"),
    form.watch("fathersName"), form.watch("fathersNameB"),
    form.watch("mothersName"), form.watch("mothersNameB"),
    form.watch("gender"), form.watch("dateOfBirth"), form.watch("nid"),
    form.watch("birthRegNo"), form.watch("townOfBirth"),
    form.watch("regionOfBirth"), form.watch("countryOfBirth"),
    form.watch("maritalStatus"), form.watch("nationality"),
    form.watch("empNo"), form.watch("joinDate"), form.watch("personTypeId"),
    form.watch("regDisability"),
    form.watch("companyId"), form.watch("ouId"), form.watch("orgId"),
    form.watch("positionId"), form.watch("payrollId"), form.watch("gradeId"),
  ]);

  // ── Step navigation ────────────────────────────────────────────────────────
  const handleNext = async () => {
    const step = STEPS[currentStep];
    const fieldsToValidate = step.fields.flatMap((f) =>
      f === "presentAddress" || f === "permanentAddress"
        ? [
            `${f}.address1`, `${f}.address1B`, `${f}.country`, `${f}.region`,
            `${f}.district`, `${f}.upazilla`, `${f}.unions`, `${f}.area`,
            `${f}.effectiveStartDate`, `${f}.effectiveEndDate`,
          ]
        : [f],
    );
    const valid = await form.trigger(fieldsToValidate);
    if (valid) {
      setCompletedSteps((prev) => new Set([...prev, currentStep]));
      setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    setCurrentStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Payload builder ────────────────────────────────────────────────────────
  const buildPayload = (data) => ({
    employee: {
      EMP_NO: data.empNo, TITLE: data.title, FIRST_NAME: data.firstName,
      LAST_NAME: data.lastName, FATHERS_NAME: data.fathersName,
      FATHERS_NAME_B: data.fathersNameB, MOTHERS_NAME: data.mothersName,
      MOTHERS_NAME_B: data.mothersNameB, GENDER: data.gender,
      DATE_OF_BIRTH: fd(data.dateOfBirth), NID: data.nid,
      BIRTH_REG_NO: data.birthRegNo, TOWN_OF_BIRTH: data.townOfBirth,
      REGION_OF_BIRTH: data.regionOfBirth, COUNTRY_OF_BIRTH: data.countryOfBirth,
      MARRITIAL_STATUS: parseInt(data.maritalStatus), NATIONALITY: data.nationality,
      JOIN_DATE: fd(data.joinDate), PERSON_TYPE_ID: parseInt(data.personTypeId),
      REG_DISABILITY: parseInt(data.regDisability),
      EFFECTIVE_START_DATE: fd(data.effectiveStartDate),
      EFFECTIVEEND_DATE: fd(data.effectiveEndDate),
    },
    address: {
      present: {
        ADDRESS1: data.presentAddress.address1, ADDRESS1_B: data.presentAddress.address1B,
        COUNTRY: data.presentAddress.country, REGION: data.presentAddress.region,
        DISTRICT: data.presentAddress.district, UPAZILLA: data.presentAddress.upazilla,
        UNIONS: data.presentAddress.unions, AREA: data.presentAddress.area,
        EFFECTIVE_START_DATE: fd(data.presentAddress.effectiveStartDate),
        EFFECTIVEEND_DATE: fd(data.presentAddress.effectiveEndDate),
      },
      permanent: {
        ADDRESS1: data.permanentAddress.address1, ADDRESS1_B: data.permanentAddress.address1B,
        COUNTRY: data.permanentAddress.country, REGION: data.permanentAddress.region,
        DISTRICT: data.permanentAddress.district, UPAZILLA: data.permanentAddress.upazilla,
        UNIONS: data.permanentAddress.unions, AREA: data.permanentAddress.area,
        EFFECTIVE_START_DATE: fd(data.permanentAddress.effectiveStartDate),
        EFFECTIVEEND_DATE: fd(data.permanentAddress.effectiveEndDate),
      },
    },
    assignment: {
      COMPANY_ID: parseInt(data.companyId), OU_ID: parseInt(data.ouId),
      ORG_ID: parseInt(data.orgId), POSITION_ID: parseInt(data.orgPositionId),
      PAYROLL_ID: parseInt(data.payrollId), GRADE_ID: parseInt(data.gradeId),
      EFFECTIVE_START_DATE: fd(data.assignmentEffectiveStartDate),
      EFFECTIVE_END_DATE: fd(data.assignmentEffectiveEndDate),
    },
  });

  // ── Submit handlers ────────────────────────────────────────────────────────
  const handleFormSubmit = async (data, operationType) => {
    try {
      setSubmissionType(operationType);
      setSubmitStatus(null);
      setStatusMessage("");
      const payload = buildPayload(data);

      if (operationType === "correction") {
        await updateEmployeeMutation.mutateAsync({
          personId: employee.PERSON_ID,
          data: {
            ...payload,
            employee: { ...payload.employee, LAST_UPDATE_BY: 101 },
            STATUS: employee.STATUS,
          },
        });
        toast.success("Employee corrected successfully!");
        setSubmitStatus("success");
        setStatusMessage("Employee corrected successfully!");
        setCompletedSteps(new Set([0, 1, 2, 3, 4]));
      } else {
        const result = await createEmployeeMutation.mutateAsync(payload);
        setNewPersonId(result?.PERSON_ID || null);
        toast.success("Employee updated (new record created) successfully!");
        setSubmitStatus("success");
        setStatusMessage("Employee updated — new record created.");
        setCompletedSteps(new Set([0, 1, 2, 3, 4]));
      }
    } catch (err) {
      console.error(`Error during ${operationType}:`, err);
      setSubmitStatus("error");
      setStatusMessage(err?.message || `Failed to ${operationType} employee. Please try again.`);
      toast.error(err?.message || `Failed to ${operationType} employee.`);
    } finally {
      setSubmissionType(null);
    }
  };

  const handleCorrectionClick = () => {
    form.handleSubmit(
      (data) => handleFormSubmit(data, "correction"),
      () => {
        setSubmitStatus("error");
        setStatusMessage("Please fill in all required fields correctly.");
      },
    )();
  };

  const handleUpdateClick = async () => {
    const isValid = await form.trigger();
    if (!isValid) {
      setSubmitStatus("error");
      setStatusMessage("Please fill in all required fields correctly.");
      return;
    }
    const confirmed = await showConfirmation({
      title: "Update Employee?",
      description:
        "This will archive the current record and create a new one. Are you sure you want to proceed?",
      confirmText: "Yes, Update",
      cancelText: "Cancel",
    });
    if (!confirmed) {
      toast.info("Update cancelled.");
      return;
    }
    const formData = form.getValues();
    await handleFormSubmit(formData, "update");
  };

  // ── Loading / error guards ─────────────────────────────────────────────────
  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center py-32">
          <Spinner className="h-12 w-12 mb-4" />
          <p className="text-muted-foreground">Loading employee data...</p>
        </div>
      </PageContainer>
    );
  }

  if (isError) {
    return (
      <PageContainer>
        <Alert variant="destructive" className="mt-8">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            {error?.message || "Failed to load employee data. Please go back and try again."}
          </AlertDescription>
        </Alert>
      </PageContainer>
    );
  }

  // ── Page ───────────────────────────────────────────────────────────────────
  return (
    <PageContainer className="px-0 pb-32">
      {/* Header */}
      <header className="px-6 mb-6 pt-2">
        <div className="flex items-center gap-4">
          <div className="p-2 border border-primary/15 bg-gradient-to-br from-blue-500/10 to-cyan-600/10 rounded-xl shadow-sm">
            <UserCog className="w-6 h-6 text-primary" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">Update Employee</h1>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">Core HR</BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/core-hr/employee-management">Employee Management</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-muted-foreground/70 font-normal">Update Employee</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <ProgressBar
        currentStep={currentStep}
        completedSteps={completedSteps}
        onStepClick={setCurrentStep}
      />

      <Form {...form}>
        <form onSubmit={(e) => e.preventDefault()}>
          <div className="px-6 mt-6">
            <div className="flex-1 min-w-0">

              {/* STEP 0: Personal */}
              <div className={cn(currentStep !== 0 && "hidden")}>
                <SectionCard
                  title="Personal Information"
                  icon={IdCard}
                  gradient="from-violet-500/80 to-purple-600/80"
                  fieldCount={STEPS[0].fields.length}
                  filledCount={allStepProgress[0].filled}
                >
                  <div className="space-y-5">
                    <SmartRadioGroup form={form} name="title" label="Title"
                      options={["Mr.", "Mrs.", "Ms.", "Dr."]} disabled={isSubmitting} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FieldWithCounter form={form} name="firstName" label="First Name" placeholder="Enter first name" maxLength={50} disabled={isSubmitting} />
                      <FieldWithCounter form={form} name="lastName" label="Last Name" placeholder="Enter last name" maxLength={50} disabled={isSubmitting} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FieldWithCounter form={form} name="fathersName" label="Father's Name" placeholder="Enter father's name" maxLength={100} disabled={isSubmitting} />
                      <FieldWithCounter form={form} name="fathersNameB" label="Father's Name (Bangla)" placeholder="পিতার নাম" maxLength={100} disabled={isSubmitting} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FieldWithCounter form={form} name="mothersName" label="Mother's Name" placeholder="Enter mother's name" maxLength={100} disabled={isSubmitting} />
                      <FieldWithCounter form={form} name="mothersNameB" label="Mother's Name (Bangla)" placeholder="মাতার নাম" maxLength={100} disabled={isSubmitting} />
                    </div>

                    <SmartRadioGroup form={form} name="gender" label="Gender"
                      options={["Male", "Female", "Other"]} disabled={isSubmitting} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="dateOfBirth"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Date of Birth *</FormLabel>
                            <FormControl>
                              <DatePicker value={field.value} onChange={field.onChange} placeholder="Select date of birth" disabled={isSubmitting} />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                      <FieldWithCounter form={form} name="nid" label="NID" placeholder="Enter NID number" maxLength={30} disabled={isSubmitting} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FieldWithCounter form={form} name="birthRegNo" label="Birth Registration No" placeholder="Enter birth reg. no" maxLength={30} disabled={isSubmitting} />
                      <FieldWithCounter form={form} name="townOfBirth" label="Town of Birth" placeholder="Enter town of birth" maxLength={30} disabled={isSubmitting} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FieldWithCounter form={form} name="regionOfBirth" label="Region of Birth" placeholder="Enter region" maxLength={30} disabled={isSubmitting} />
                      <FieldWithCounter form={form} name="countryOfBirth" label="Country of Birth" placeholder="Enter country" maxLength={30} disabled={isSubmitting} />
                    </div>

                    <SmartRadioGroup form={form} name="maritalStatus" label="Marital Status"
                      options={MARITAL_STATUS_OPTIONS} disabled={isSubmitting} />

                    <FieldWithCounter form={form} name="nationality" label="Nationality" placeholder="Enter nationality" maxLength={30} disabled={isSubmitting} />
                  </div>
                </SectionCard>
              </div>

              {/* STEP 1: Employment */}
              <div className={cn(currentStep !== 1 && "hidden")}>
                <SectionCard
                  title="Employment Information"
                  icon={BriefcaseIcon}
                  gradient="from-blue-500/80 to-cyan-600/80"
                  fieldCount={STEPS[1].fields.length}
                  filledCount={allStepProgress[1].filled}
                >
                  <div className="space-y-5">
                    <FieldWithCounter form={form} name="empNo" label="Employee Number" placeholder="Enter employee number" maxLength={20} disabled={isSubmitting} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="joinDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Join Date *</FormLabel>
                            <FormControl>
                              <DatePicker value={field.value} onChange={field.onChange} placeholder="Select join date" disabled={isSubmitting} />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                      <FormField control={form.control} name="effectiveStartDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Effective Start Date *</FormLabel>
                            <FormControl>
                              <DatePicker value={field.value} onChange={field.onChange} placeholder="Select start date" disabled={isSubmitting} />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField control={form.control} name="effectiveEndDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Effective End Date *</FormLabel>
                          <FormControl>
                            <DatePicker value={field.value} onChange={field.onChange} placeholder="Select end date" disabled={isSubmitting} />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />

                    <FormField control={form.control} name="personTypeId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Person Type *</FormLabel>
                          <Select
                            key={`person-type-${field.value}-${personTypes.length}`}
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={isSubmitting || personTypesLoading}
                          >
                            <FormControl>
                              <SelectTrigger className={cn(field.value && "border-emerald-500/50")}>
                                <SelectValue placeholder={personTypesLoading ? "Loading..." : "Select person type"} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {personTypes.map((type) => (
                                <SelectItem key={type.PERSON_TYPE_ID} value={String(type.PERSON_TYPE_ID)}>
                                  {type.PERSON_TYPE}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />

                    <SmartRadioGroup form={form} name="regDisability" label="Registered Disability"
                      options={REG_DISABILITY_OPTIONS} disabled={isSubmitting} />
                  </div>
                </SectionCard>
              </div>

              {/* STEP 2: Assignment */}
              <div className={cn(currentStep !== 2 && "hidden")}>
                <SectionCard
                  title="Assignment"
                  icon={Building2}
                  gradient="from-emerald-500/80 to-teal-600/80"
                  fieldCount={STEPS[2].fields.length}
                  filledCount={allStepProgress[2].filled}
                >
                  <div className="space-y-5">
                    <ComboboxField form={form} name="companyId" label="Company" items={companies}
                      idKey="COMPANY_ID" nameKey="COMPANY_NAME"
                      placeholder={companiesLoading ? "Loading..." : "Select company"}
                      disabled={isSubmitting || companiesLoading} />

                    <ComboboxField form={form} name="ouId" label="Operational Unit" items={organizations}
                      idKey="ID" nameKey="NAME"
                      placeholder={organizationsLoading ? "Loading..." : "Select operational unit"}
                      disabled={isSubmitting || organizationsLoading} />

                    <ComboboxField form={form} name="orgId" label="Organization" items={organizations}
                      idKey="ID" nameKey="NAME"
                      placeholder={organizationsLoading ? "Loading..." : "Select organization"}
                      disabled={isSubmitting || organizationsLoading}
                      onSelect={(org) => {
                        setSelectedOrgId(org.ID);
                        form.setValue("positionId", "", { shouldValidate: false });
                        form.setValue("orgPositionId", "", { shouldValidate: false });
                        form.setValue("gradeId", "", { shouldValidate: false });
                      }}
                    />

                    <PositionComboboxField
                      form={form}
                      filteredPositions={filteredPositions}
                      selectedOrgId={selectedOrgId}
                      orgPositionsLoading={orgPositionsLoading}
                      grades={grades}
                      disabled={isSubmitting}
                    />

                    <FormField control={form.control} name="gradeId"
                      render={({ field }) => {
                        const selectedGrade = grades.find((g) => String(g.ID) === String(field.value));
                        return (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">
                              Grade <span className="text-muted-foreground text-xs">(auto-filled)</span>
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  readOnly disabled
                                  value={selectedGrade ? selectedGrade.GRADE : ""}
                                  placeholder="Auto-filled from selected position"
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

                    <FieldWithCounter form={form} name="payrollId" label="Payroll ID" placeholder="Enter payroll ID" maxLength={30} disabled={isSubmitting} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="assignmentEffectiveStartDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Assignment Start Date *</FormLabel>
                            <FormControl>
                              <DatePicker value={field.value} onChange={field.onChange} placeholder="Select start date" disabled={isSubmitting} />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                      <FormField control={form.control} name="assignmentEffectiveEndDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Assignment End Date *</FormLabel>
                            <FormControl>
                              <DatePicker value={field.value} onChange={field.onChange} placeholder="Select end date" disabled={isSubmitting} />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </SectionCard>
              </div>

              {/* STEP 3: Address */}
              <div className={cn(currentStep !== 3 && "hidden")}>
                <div className="space-y-5">
                  <SectionCard
                    title="Present Address"
                    icon={MapPin}
                    gradient="from-orange-500/80 to-amber-600/80"
                    fieldCount={8}
                    filledCount={allStepProgress[3].filled}
                  >
                    {formSeeded ? (
                      <AddressFields
                        form={form}
                        prefix="presentAddress"
                        disabled={isSubmitting}
                        initialCountryId={presentAddressIds.countryId}
                        initialRegionId={presentAddressIds.regionId}
                        initialDistrictId={presentAddressIds.districtId}
                      />
                    ) : (
                      <div className="flex items-center gap-2 py-4 text-muted-foreground text-sm">
                        <Spinner className="h-4 w-4" /> Loading address...
                      </div>
                    )}
                  </SectionCard>

                  <div className="flex items-center gap-3 p-4 rounded-xl border border-border/60 bg-card">
                    <Switch id="same-address" checked={sameAsPresent} onCheckedChange={handleSameAsPresent} disabled={isSubmitting} />
                    <div>
                      <Label htmlFor="same-address" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                        <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                        Permanent address same as present address
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">Toggle to copy all present address fields</p>
                    </div>
                  </div>

                  <SectionCard
                    title="Permanent Address"
                    icon={Home}
                    gradient="from-rose-500/80 to-pink-600/80"
                    fieldCount={8}
                    filledCount={0}
                  >
                    {formSeeded ? (
                      <AddressFields
                        form={form}
                        prefix="permanentAddress"
                        disabled={isSubmitting || sameAsPresent}
                        initialCountryId={permanentAddressIds.countryId}
                        initialRegionId={permanentAddressIds.regionId}
                        initialDistrictId={permanentAddressIds.districtId}
                      />
                    ) : (
                      <div className="flex items-center gap-2 py-4 text-muted-foreground text-sm">
                        <Spinner className="h-4 w-4" /> Loading address...
                      </div>
                    )}
                  </SectionCard>
                </div>
              </div>

              {/* STEP 4: Review */}
              <div className={cn(currentStep !== 4 && "hidden")}>
                <SectionCard
                  title="Review & Submit"
                  icon={FileText}
                  gradient="from-rose-500/80 to-pink-600/80"
                  fieldCount={0}
                  filledCount={0}
                >
                  <ReviewStep
                    form={form}
                    personTypes={personTypes}
                    companies={companies}
                    organizations={organizations}
                    grades={grades}
                  />
                </SectionCard>
              </div>

            </div>
          </div>

          {/* Validation error summary */}
          {Object.keys(form.formState.errors).length > 0 && currentStep === STEPS.length - 1 && (
            <div className="px-6 mt-4 mb-6">
              <ErrorSummary errors={form.formState.errors} />
            </div>
          )}

          {/* ── Sticky Bottom Action Bar ── */}
          <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/60 bg-background/95 backdrop-blur-md shadow-2xl">
            <div className="max-w-screen-xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
              {/* Status / step indicator */}
              <div className="flex-1 min-w-0">
                {submitStatus === "error" && (
                  <div className="flex items-center gap-2 text-destructive text-sm">
                    <XCircle className="w-4 h-4 shrink-0" />
                    <span className="truncate">{statusMessage}</span>
                  </div>
                )}
                {submitStatus === "success" && (
                  <div className="flex items-center gap-2 text-emerald-600 text-sm flex-wrap">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span>{statusMessage}</span>
                    <Link to="/core-hr/employees" className="underline font-medium">View Employees</Link>
                    <Link
                      to={`/core-hr/employee-management/employee-details/${newPersonId ?? personId}`}
                      className="underline font-medium"
                    >
                      View Details
                    </Link>
                  </div>
                )}
                {!submitStatus && (
                  <p className="text-xs text-muted-foreground">
                    Step {currentStep + 1} of {STEPS.length} — {STEPS[currentStep].label}
                  </p>
                )}
              </div>

              {/* Navigation buttons */}
              <div className="flex items-center gap-2.5 shrink-0">
                <Button
                  type="button" variant="outline"
                  onClick={() => navigate("/core-hr/employee-management")}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>

                {currentStep > 0 && (
                  <Button type="button" variant="outline" onClick={handleBack} disabled={isSubmitting} className="gap-1.5">
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </Button>
                )}

                {currentStep < STEPS.length - 1 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={isSubmitting}
                    className="gap-1.5 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 border-0 shadow-lg shadow-blue-500/25"
                  >
                    Continue
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                ) : (
                  // On the review step — show both Correction and Update
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCorrectionClick}
                      disabled={isSubmitting}
                      className="gap-1.5 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                    >
                      {submissionType === "correction" ? (
                        <><Spinner className="h-4 w-4" />Processing...</>
                      ) : (
                        <><IconEdit className="w-4 h-4" />Correction</>
                      )}
                    </Button>
                    <Button
                      type="button"
                      onClick={handleUpdateClick}
                      disabled={isSubmitting}
                      className="gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border-0 shadow-lg shadow-emerald-500/25"
                    >
                      {submissionType === "update" ? (
                        <><Spinner className="h-4 w-4" />Processing...</>
                      ) : (
                        <><IconCirclePlus className="w-4 h-4" />Update</>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>
      </Form>

      <ConfirmationDialog />
    </PageContainer>
  );
}