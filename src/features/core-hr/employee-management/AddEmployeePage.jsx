import React, { useState, useMemo, useEffect } from "react";
import {
  BriefcaseIcon,
  IdCard,
  UserPlus,
  CheckCircle,
  XCircle,
  MapPin,
  Home,
  Check,
  ChevronsUpDown,
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Spinner } from "@/components/ui/spinner";
import { useCreateEmployee } from "./queries";
import PageContainer from "@/components/page-container";
import { Link } from "react-router";
import { useCompanies } from "@/features/settings/work-structure/company/queries";
import { useOrganizations } from "@/features/settings/work-structure/organization/queries";
import { useOrgPositions } from "@/features/settings/work-structure/position/queries";
import { useGrades } from "@/features/settings/work-structure/hr-grade/queries";
import { usePersonTypes } from "../employee-types/queries";
import { Badge } from "@/components/ui/badge";
import { useCountries, useDistricts, useRegions, useUpazillas } from "./location-lookup-queries";

// ─── Address sub-schema ───────────────────────────────────────────────────────
const addressSchema = z
  .object({
    address1: z
      .string()
      .min(1, "Address is required")
      .max(100, "Address must be at most 100 characters")
      .trim(),
    address1B: z
      .string()
      .min(1, "Address (Bangla) is required")
      .max(100, "Address (Bangla) must be at most 100 characters")
      .trim(),
    country: z
      .string()
      .min(1, "Country is required")
      .max(30, "Country must be at most 30 characters")
      .trim(),
    region: z
      .string()
      .min(1, "Region is required")
      .max(30, "Region must be at most 30 characters")
      .trim(),
    district: z
      .string()
      .min(1, "District is required")
      .max(30, "District must be at most 30 characters")
      .trim(),
    upazilla: z
      .string()
      .min(1, "Upazilla is required")
      .max(30, "Upazilla must be at most 30 characters")
      .trim(),
    unions: z
      .string()
      .min(1, "Union is required")
      .max(30, "Union must be at most 30 characters")
      .trim(),
    area: z
      .string()
      .min(1, "Area is required")
      .max(30, "Area must be at most 30 characters")
      .trim(),
    effectiveStartDate: z.date({
      required_error: "Effective start date is required",
    }),
    effectiveEndDate: z.date({
      required_error: "Effective end date is required",
    }),
  })
  .refine((data) => data.effectiveEndDate > data.effectiveStartDate, {
    message: "Effective end date must be after start date",
    path: ["effectiveEndDate"],
  });

// ─── Main schema ──────────────────────────────────────────────────────────────
const employeeSchema = z
  .object({
    // ── Personal ──────────────────────────────────────────────────────────────
    empNo: z
      .string()
      .min(1, "Employee number is required")
      .max(20, "Employee number must be at most 20 characters")
      .trim(),
    title: z
      .string()
      .min(1, "Title is required")
      .max(10, "Title must be at most 10 characters")
      .trim(),
    firstName: z
      .string()
      .min(1, "First name is required")
      .max(50, "First name must be at most 50 characters")
      .trim(),
    lastName: z
      .string()
      .min(1, "Last name is required")
      .max(50, "Last name must be at most 50 characters")
      .trim(),
    fathersName: z
      .string()
      .min(1, "Father's name is required")
      .max(100, "Father's name must be at most 100 characters")
      .trim(),
    fathersNameB: z
      .string()
      .min(1, "Father's name (Bangla) is required")
      .max(100, "Father's name (Bangla) must be at most 100 characters")
      .trim(),
    mothersName: z
      .string()
      .min(1, "Mother's name is required")
      .max(100, "Mother's name must be at most 100 characters")
      .trim(),
    mothersNameB: z
      .string()
      .min(1, "Mother's name (Bangla) is required")
      .max(100, "Mother's name (Bangla) must be at most 100 characters")
      .trim(),
    gender: z
      .string()
      .min(1, "Gender is required")
      .max(10, "Gender must be at most 10 characters")
      .trim(),
    dateOfBirth: z.date({ required_error: "Date of birth is required" }),
    nid: z
      .string()
      .min(1, "NID is required")
      .max(30, "NID must be at most 30 characters")
      .trim(),
    birthRegNo: z
      .string()
      .min(1, "Birth registration number is required")
      .max(30, "Birth reg. no must be at most 30 characters")
      .trim(),
    townOfBirth: z
      .string()
      .min(1, "Town of birth is required")
      .max(30, "Town of birth must be at most 30 characters")
      .trim(),
    regionOfBirth: z
      .string()
      .min(1, "Region of birth is required")
      .max(30, "Region of birth must be at most 30 characters")
      .trim(),
    countryOfBirth: z
      .string()
      .min(1, "Country of birth is required")
      .max(30, "Country of birth must be at most 30 characters")
      .trim(),
    maritalStatus: z.string().min(1, "Marital status is required").trim(),
    nationality: z
      .string()
      .min(1, "Nationality is required")
      .max(30, "Nationality must be at most 30 characters")
      .trim(),

    // ── Employment ────────────────────────────────────────────────────────────
    joinDate: z.date({ required_error: "Join date is required" }),
    personTypeId: z.string().min(1, "Person type is required").trim(),
    regDisability: z
      .string()
      .min(1, "Registered disability is required")
      .trim(),
    effectiveStartDate: z.date({
      required_error: "Effective start date is required",
    }),
    effectiveEndDate: z.date({
      required_error: "Effective end date is required",
    }),

    // ── Assignment ────────────────────────────────────────────────────────────
    companyId: z.string().min(1, "Company is required").trim(),
    ouId: z.string().min(1, "Operational Unit is required").trim(),
    orgId: z.string().min(1, "Organization is required").trim(),
    positionId: z.string().min(1, "Position is required").trim(),
    orgPositionId: z.string().min(1, "Position is required").trim(),
    payrollId: z.string().min(1, "Payroll ID is required").trim(),
    gradeId: z.string().min(1, "Grade is required").trim(),
    assignmentEffectiveStartDate: z.date({
      required_error: "Assignment start date is required",
    }),
    assignmentEffectiveEndDate: z.date({
      required_error: "Assignment end date is required",
    }),

    // ── Addresses ─────────────────────────────────────────────────────────────
    presentAddress: addressSchema,
    permanentAddress: addressSchema,
  })
  .refine((data) => data.effectiveEndDate > data.effectiveStartDate, {
    message: "Effective end date must be after start date",
    path: ["effectiveEndDate"],
  })
  .refine(
    (data) =>
      data.assignmentEffectiveEndDate > data.assignmentEffectiveStartDate,
    {
      message: "Assignment end date must be after start date",
      path: ["assignmentEffectiveEndDate"],
    },
  );

// ─── Reusable Address Fields ──────────────────────────────────────────────────
// function AddressFields({ form, prefix }) {
//   return (
//     <div className="space-y-4">
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//         <FormField
//           control={form.control}
//           name={`${prefix}.address1`}
//           render={({ field }) => (
//             <FormItem>
//               <FormLabel>Address *</FormLabel>
//               <FormControl>
//                 <Input placeholder="Enter address" {...field} />
//               </FormControl>
//               <FormMessage />
//             </FormItem>
//           )}
//         />
//         <FormField
//           control={form.control}
//           name={`${prefix}.address1B`}
//           render={({ field }) => (
//             <FormItem>
//               <FormLabel>Address (Bangla) *</FormLabel>
//               <FormControl>
//                 <Input placeholder="ঠিকানা লিখুন" {...field} />
//               </FormControl>
//               <FormMessage />
//             </FormItem>
//           )}
//         />
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//         <FormField
//           control={form.control}
//           name={`${prefix}.country`}
//           render={({ field }) => (
//             <FormItem>
//               <FormLabel>Country *</FormLabel>
//               <FormControl>
//                 <Input placeholder="Enter country" {...field} />
//               </FormControl>
//               <FormMessage />
//             </FormItem>
//           )}
//         />
//         <FormField
//           control={form.control}
//           name={`${prefix}.region`}
//           render={({ field }) => (
//             <FormItem>
//               <FormLabel>Region / Division *</FormLabel>
//               <FormControl>
//                 <Input placeholder="Enter region" {...field} />
//               </FormControl>
//               <FormMessage />
//             </FormItem>
//           )}
//         />
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//         <FormField
//           control={form.control}
//           name={`${prefix}.district`}
//           render={({ field }) => (
//             <FormItem>
//               <FormLabel>District *</FormLabel>
//               <FormControl>
//                 <Input placeholder="Enter district" {...field} />
//               </FormControl>
//               <FormMessage />
//             </FormItem>
//           )}
//         />
//         <FormField
//           control={form.control}
//           name={`${prefix}.upazilla`}
//           render={({ field }) => (
//             <FormItem>
//               <FormLabel>Upazilla *</FormLabel>
//               <FormControl>
//                 <Input placeholder="Enter upazilla" {...field} />
//               </FormControl>
//               <FormMessage />
//             </FormItem>
//           )}
//         />
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//         <FormField
//           control={form.control}
//           name={`${prefix}.unions`}
//           render={({ field }) => (
//             <FormItem>
//               <FormLabel>Union *</FormLabel>
//               <FormControl>
//                 <Input placeholder="Enter union" {...field} />
//               </FormControl>
//               <FormMessage />
//             </FormItem>
//           )}
//         />
//         <FormField
//           control={form.control}
//           name={`${prefix}.area`}
//           render={({ field }) => (
//             <FormItem>
//               <FormLabel>Area / Village *</FormLabel>
//               <FormControl>
//                 <Input placeholder="Enter area" {...field} />
//               </FormControl>
//               <FormMessage />
//             </FormItem>
//           )}
//         />
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//         <FormField
//           control={form.control}
//           name={`${prefix}.effectiveStartDate`}
//           render={({ field }) => (
//             <FormItem>
//               <FormLabel>Effective Start Date *</FormLabel>
//               <FormControl>
//                 <DatePicker
//                   value={field.value}
//                   onChange={field.onChange}
//                   placeholder="Select start date"
//                 />
//               </FormControl>
//               <FormMessage />
//             </FormItem>
//           )}
//         />
//         <FormField
//           control={form.control}
//           name={`${prefix}.effectiveEndDate`}
//           render={({ field }) => (
//             <FormItem>
//               <FormLabel>Effective End Date *</FormLabel>
//               <FormControl>
//                 <DatePicker
//                   value={field.value}
//                   onChange={field.onChange}
//                   placeholder="Select end date"
//                 />
//               </FormControl>
//               <FormMessage />
//             </FormItem>
//           )}
//         />
//       </div>
//     </div>
//   );
// }

function AddressFields({ form, prefix, disabled }) {
  // Local IDs to drive cascade — NOT stored in form (address table stores names)
  const [selectedCountryId, setSelectedCountryId] = useState(null);
  const [selectedRegionId, setSelectedRegionId]   = useState(null);
  const [selectedDistrictId, setSelectedDistrictId] = useState(null);

  const { data: countries = [], isLoading: countriesLoading } = useCountries();
  console.log("countries", countries);
  const { data: regions = [],   isLoading: regionsLoading }   = useRegions(selectedCountryId);
  const { data: districts = [], isLoading: districtsLoading } = useDistricts(selectedRegionId);
  const { data: upazillas = [], isLoading: upazillasLoading } = useUpazillas(selectedDistrictId);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name={`${prefix}.address1`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address *</FormLabel>
              <FormControl>
                <Input placeholder="Enter address" disabled={disabled} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`${prefix}.address1B`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address (Bangla) *</FormLabel>
              <FormControl>
                <Input placeholder="ঠিকানা লিখুন" disabled={disabled} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Country */}
        <FormField
          control={form.control}
          name={`${prefix}.country`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Country *</FormLabel>
              <CascadeCombobox
                value={field.value}
                items={countries}
                idKey="COUNTRY_ID"
                nameKey="COUNTRY_NAME"
                placeholder={countriesLoading ? "Loading..." : "Select country"}
                disabled={disabled || countriesLoading}
                onSelect={(item) => {
                  field.onChange(item.COUNTRY_NAME);
                  setSelectedCountryId(item.COUNTRY_ID);
                  // Clear downstream fields
                  form.setValue(`${prefix}.region`, "");
                  form.setValue(`${prefix}.district`, "");
                  form.setValue(`${prefix}.upazilla`, "");
                  setSelectedRegionId(null);
                  setSelectedDistrictId(null);
                }}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Region */}
        <FormField
          control={form.control}
          name={`${prefix}.region`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Region / Division *</FormLabel>
              <CascadeCombobox
                value={field.value}
                items={regions}
                idKey="REGION_ID"
                nameKey="REGION_NAME"
                placeholder={
                  !selectedCountryId ? "Select country first"
                  : regionsLoading ? "Loading..."
                  : "Select region"
                }
                disabled={disabled || !selectedCountryId || regionsLoading}
                onSelect={(item) => {
                  field.onChange(item.REGION_NAME);
                  setSelectedRegionId(item.REGION_ID);
                  form.setValue(`${prefix}.district`, "");
                  form.setValue(`${prefix}.upazilla`, "");
                  setSelectedDistrictId(null);
                }}
              />
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* District */}
        <FormField
          control={form.control}
          name={`${prefix}.district`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>District *</FormLabel>
              <CascadeCombobox
                value={field.value}
                items={districts}
                idKey="DISTRICT_ID"
                nameKey="DISTRICT_NAME"
                placeholder={
                  !selectedRegionId ? "Select region first"
                  : districtsLoading ? "Loading..."
                  : "Select district"
                }
                disabled={disabled || !selectedRegionId || districtsLoading}
                onSelect={(item) => {
                  field.onChange(item.DISTRICT_NAME);
                  setSelectedDistrictId(item.DISTRICT_ID);
                  form.setValue(`${prefix}.upazilla`, "");
                }}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Upazilla */}
        <FormField
          control={form.control}
          name={`${prefix}.upazilla`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Upazilla *</FormLabel>
              <CascadeCombobox
                value={field.value}
                items={upazillas}
                idKey="UPAZILLA_ID"
                nameKey="UPAZILLA_NAME"
                placeholder={
                  !selectedDistrictId ? "Select district first"
                  : upazillasLoading ? "Loading..."
                  : "Select upazilla"
                }
                disabled={disabled || !selectedDistrictId || upazillasLoading}
                onSelect={(item) => {
                  field.onChange(item.UPAZILLA_NAME);
                }}
              />
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Unions & Area stay as free text */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField control={form.control} name={`${prefix}.unions`}
          render={({ field }) => (
            <FormItem><FormLabel>Union *</FormLabel>
              <FormControl><Input placeholder="Enter union" disabled={disabled} {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField control={form.control} name={`${prefix}.area`}
          render={({ field }) => (
            <FormItem><FormLabel>Area / Village *</FormLabel>
              <FormControl><Input placeholder="Enter area" disabled={disabled} {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField control={form.control} name={`${prefix}.effectiveStartDate`}
          render={({ field }) => (
            <FormItem><FormLabel>Effective Start Date *</FormLabel>
              <FormControl>
                <DatePicker value={field.value} onChange={field.onChange} placeholder="Select start date" disabled={disabled} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField control={form.control} name={`${prefix}.effectiveEndDate`}
          render={({ field }) => (
            <FormItem><FormLabel>Effective End Date *</FormLabel>
              <FormControl>
                <DatePicker value={field.value} onChange={field.onChange} placeholder="Select end date" disabled={disabled} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

// ─── Reusable Combobox Field ──────────────────────────────────────────────────
function ComboboxField({
  form,
  name,
  label,
  items,
  idKey,
  nameKey,
  placeholder,
  disabled = false,
  onSelect,
}) {
  const [open, setOpen] = useState(false);
  const selectedId = form.watch(name);
  const selectedItem = items.find(
    (item) => String(item[idKey]) === String(selectedId),
  );

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label} *</FormLabel>
          <Popover modal={true} open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  role="combobox"
                  disabled={disabled}
                  className={`w-full justify-between font-normal ${!field.value && "text-muted-foreground"}`}
                >
                  {selectedItem ? selectedItem[nameKey] : placeholder}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
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
                          className={`ml-auto h-4 w-4 ${
                            String(field.value) === String(item[idKey])
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
          className={`w-full justify-between font-normal ${!value && "text-muted-foreground"}`}
        >
          <span className="truncate">{value || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
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
                  onSelect={() => {
                    onSelect(item);
                    setOpen(false);
                  }}
                >
                  {item[nameKey]}
                  <Check className={`ml-auto h-4 w-4 ${value === item[nameKey] ? "opacity-100" : "opacity-0"}`} />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AddEmployeePage() {
  const createEmployeeMutation = useCreateEmployee();
  const [submitStatus, setSubmitStatus] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [newPersonId, setNewPersonId] = useState(null);

  // Track selected orgId for filtering positions
  const [selectedOrgId, setSelectedOrgId] = useState(null);

  const { data: personTypes = [], isLoading: personTypesLoading } =
    usePersonTypes();
  const { data: companies = [], isLoading: companiesLoading } = useCompanies();
  const { data: organizations = [], isLoading: organizationsLoading } =
    useOrganizations();
  const { data: orgPositions = [], isLoading: orgPositionsLoading } =
    useOrgPositions();
  const { data: grades = [], isLoading: gradesLoading } = useGrades();

  // Filter org positions by selected org
  const filteredPositions = useMemo(() => {
    if (!selectedOrgId) return [];
    return orgPositions.filter(
      (pos) => String(pos.ORG_ID) === String(selectedOrgId),
    );
  }, [orgPositions, selectedOrgId]);

 const today = new Date();
const fiveYearsLater = addYears(today, 5);

const form = useForm({
  resolver: zodResolver(employeeSchema),
  defaultValues: {
    empNo: "",
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
    personTypeId: "",
    regDisability: "",
    companyId: "",
    ouId: "",
    orgId: "",
    positionId: "",
    orgPositionId: "",
    payrollId: "",
    gradeId: "",
    effectiveStartDate: today,
    effectiveEndDate: fiveYearsLater,
    assignmentEffectiveStartDate: today,
    assignmentEffectiveEndDate: fiveYearsLater,
    presentAddress: {
      address1: "",
      address1B: "",
      country: "",
      region: "",
      district: "",
      upazilla: "",
      unions: "",
      area: "",
      effectiveStartDate: today,
      effectiveEndDate: fiveYearsLater,
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
      effectiveStartDate: today,
      effectiveEndDate: fiveYearsLater,
    },
  },
});


const watchedStartDates = form.watch([
  "effectiveStartDate",
  "assignmentEffectiveStartDate",
  "presentAddress.effectiveStartDate",
  "permanentAddress.effectiveStartDate",
]);

useEffect(() => {
  const [effective, assignment, present, permanent] = watchedStartDates;

  const pairs = [
    [effective, "effectiveEndDate"],
    [assignment, "assignmentEffectiveEndDate"],
    [present, "presentAddress.effectiveEndDate"],
    [permanent, "permanentAddress.effectiveEndDate"],
  ];

  pairs.forEach(([startDate, endField]) => {
    if (startDate) {
      form.setValue(endField, addYears(startDate, 5), { shouldDirty: true });
    }
  });
}, [watchedStartDates]);

  const fd = (date) => (date ? format(date, "yyyy-MM-dd") : null);

  const onSubmit = async (data) => {
    try {
      setSubmitStatus(null);
      setStatusMessage("");

      const payload = {
        employee: {
          EMP_NO: data.empNo,
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
          JOIN_DATE: fd(data.joinDate),
          PERSON_TYPE_ID: parseInt(data.personTypeId),
          REG_DISABILITY: parseInt(data.regDisability),
          EFFECTIVE_START_DATE: fd(data.effectiveStartDate),
          EFFECTIVEEND_DATE: fd(data.effectiveEndDate),
        },

        address: {
          present: {
            ADDRESS1: data.presentAddress.address1,
            ADDRESS1_B: data.presentAddress.address1B,
            COUNTRY: data.presentAddress.country,
            REGION: data.presentAddress.region,
            DISTRICT: data.presentAddress.district,
            UPAZILLA: data.presentAddress.upazilla,
            UNIONS: data.presentAddress.unions,
            AREA: data.presentAddress.area,
            EFFECTIVE_START_DATE: fd(data.presentAddress.effectiveStartDate),
            EFFECTIVEEND_DATE: fd(data.presentAddress.effectiveEndDate),
          },
          permanent: {
            ADDRESS1: data.permanentAddress.address1,
            ADDRESS1_B: data.permanentAddress.address1B,
            COUNTRY: data.permanentAddress.country,
            REGION: data.permanentAddress.region,
            DISTRICT: data.permanentAddress.district,
            UPAZILLA: data.permanentAddress.upazilla,
            UNIONS: data.permanentAddress.unions,
            AREA: data.permanentAddress.area,
            EFFECTIVE_START_DATE: fd(data.permanentAddress.effectiveStartDate),
            EFFECTIVEEND_DATE: fd(data.permanentAddress.effectiveEndDate),
          },
        },

        // assignment: {
        //   COMPANY_ID: parseInt(data.companyId),
        //   OU_ID: parseInt(data.ouId),
        //   ORG_ID: parseInt(data.orgId),
        //   POSITION_ID: parseInt(data.positionId),
        //   ORG_POSITION_ID: parseInt(data.orgPositionId),
        //   PAYROLL_ID: parseInt(data.payrollId),
        //   GRADE_ID: parseInt(data.gradeId),
        //   EFFECTIVE_START_DATE: fd(data.assignmentEffectiveStartDate),
        //   EFFECTIVE_END_DATE: fd(data.assignmentEffectiveEndDate),
        // },
        assignment: {
          COMPANY_ID: parseInt(data.companyId),
          OU_ID: parseInt(data.ouId),
          ORG_ID: parseInt(data.orgId),
          POSITION_ID: parseInt(data.orgPositionId), // HR_ORG_POSITION.ID → what backend inserts
          PAYROLL_ID: parseInt(data.payrollId),
          GRADE_ID: parseInt(data.gradeId),
          EFFECTIVE_START_DATE: fd(data.assignmentEffectiveStartDate),
          EFFECTIVE_END_DATE: fd(data.assignmentEffectiveEndDate),
        },
      };

      console.log("Sending to backend:", payload);

      const result = await createEmployeeMutation.mutateAsync(payload);
      console.log({ result });
      setNewPersonId(result?.PERSON_ID);

      setSubmitStatus("success");
      setStatusMessage("Employee created successfully!");
      // form.reset();
      setSelectedOrgId(null);
    } catch (error) {
      console.error("Error creating employee:", error);
      setSubmitStatus("error");
      setStatusMessage(
        error?.message || "Failed to create employee. Please try again.",
      );
    }
  };

  const handleFormError = (errors) => {
    console.log("Form validation errors:", errors);
    setSubmitStatus("error");
    setStatusMessage("Please fill in all required fields correctly.");
  };

  const flattenErrors = (errors, prefix = "") =>
    Object.entries(errors).flatMap(([key, value]) => {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (value?.message) return [{ key: fullKey, message: value.message }];
      if (typeof value === "object" && value !== null && !value.message)
        return flattenErrors(value, fullKey);
      return [];
    });

  const allErrors = flattenErrors(form.formState.errors);

  return (
    <PageContainer className="px-3 group-has-data-[collapsible=offcanvas]/sidebar-wrapper:px-6">
      <header className="mb-8 bg-card p-4 rounded-md shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-1.5 border border-primary/10 bg-primary/10 rounded-md shadow-xs">
              <UserPlus className="w-6 h-6 text-primary" />
            </div>
            <div className="space-y-0.5">
              <h1 className="text-lg md:text-2xl font-semibold tracking-tight">
                New Employee Onboarding
              </h1>
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    Core HR
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to="/core-hr/employees">
                        Employee Management
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="text-muted-foreground/80 font-normal">
                      Add Employee
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </div>
        </div>
      </header>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit, handleFormError)}>
          <div className="grid  grid-cols-2 gap-5 @max-3xl/main:grid-cols-1">
            {/* ── LEFT COLUMN ── Personal Info + Present Address ───────────── */}
            <div className="space-y-6">
              {/* Personal Information */}
              <Accordion
                type="single"
                collapsible
                defaultValue="personal"
                className="bg-card/70 px-4 rounded-md shadow-sm"
              >
                <AccordionItem value="personal">
                  <AccordionTrigger className="text-lg font-medium flex items-center gap-2">
                    <span className="p-1 rounded-sm shadow-sm bg-primary/10 text-primary">
                      <IdCard className="w-5 h-5 text-primary" />
                    </span>
                    Personal Information
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      {/* Title */}
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title *</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                value={field.value}
                                className="flex flex-row gap-4"
                              >
                                {["Mr.", "Mrs.", "Ms.", "Dr."].map((t) => (
                                  <div
                                    key={t}
                                    className="flex items-center space-x-1"
                                  >
                                    <RadioGroupItem
                                      value={t}
                                      id={`title-${t}`}
                                    />
                                    <Label htmlFor={`title-${t}`}>{t}</Label>
                                  </div>
                                ))}
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name *</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter first name"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last Name *</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter last name"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="fathersName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Father's Name *</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter father's name"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="fathersNameB"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Father's Name (Bangla) *</FormLabel>
                              <FormControl>
                                <Input placeholder="পিতার নাম" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="mothersName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mother's Name *</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter mother's name"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="mothersNameB"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mother's Name (Bangla) *</FormLabel>
                              <FormControl>
                                <Input placeholder="মাতার নাম" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gender *</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                value={field.value}
                                className="flex flex-row gap-3"
                              >
                                {["Male", "Female", "Other"].map((g) => (
                                  <div
                                    key={g}
                                    className="flex items-center space-x-1"
                                  >
                                    <RadioGroupItem
                                      value={g}
                                      id={`gender-${g}`}
                                    />
                                    <Label htmlFor={`gender-${g}`}>{g}</Label>
                                  </div>
                                ))}
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="dateOfBirth"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Date of Birth *</FormLabel>
                              <FormControl>
                                <DatePicker
                                  value={field.value}
                                  onChange={field.onChange}
                                  placeholder="Select date of birth"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="nid"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>NID *</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter NID number"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="birthRegNo"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Birth Registration No *</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter birth reg. no"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="townOfBirth"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Town of Birth *</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter town of birth"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="regionOfBirth"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Region of Birth *</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter region" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="countryOfBirth"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Country of Birth *</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter country" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="maritalStatus"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Marital Status *</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                value={field.value}
                                className="flex flex-row gap-3 flex-wrap"
                              >
                                {MARITAL_STATUS_OPTIONS.map((option) => (
                                  <div
                                    key={option.value}
                                    className="flex items-center space-x-1"
                                  >
                                    <RadioGroupItem
                                      value={option.value}
                                      id={`marital-${option.value}`}
                                    />
                                    <Label htmlFor={`marital-${option.value}`}>
                                      {option.label}
                                    </Label>
                                  </div>
                                ))}
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="nationality"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nationality *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter nationality"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {/* Present Address */}
              <Accordion
                type="single"
                collapsible
                defaultValue="present-address"
                className="bg-card/70 px-4 rounded-md shadow-sm"
              >
                <AccordionItem value="present-address">
                  <AccordionTrigger className="text-lg font-medium flex items-center gap-2">
                    <span className="p-1 rounded-sm shadow-sm bg-primary/10 text-primary">
                      <MapPin className="w-5 h-5 text-primary" />
                    </span>
                    Present Address
                  </AccordionTrigger>
                  <AccordionContent>
                    <AddressFields form={form} prefix="presentAddress" />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            {/* ── RIGHT COLUMN ── Employment Info + Permanent Address ──────── */}
            <div className="space-y-6">
              {/* Employment Information */}
              <Accordion
                type="single"
                collapsible
                defaultValue="employment"
                className="bg-card/70 px-4 rounded-md shadow-sm"
              >
                <AccordionItem value="employment">
                  <AccordionTrigger className="text-lg font-medium flex items-center gap-2">
                    <span className="p-1 rounded-sm shadow-sm bg-primary/10 text-primary">
                      <BriefcaseIcon className="w-5 h-5 text-primary" />
                    </span>
                    Employment Information
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      {/* Employee Number */}
                      <FormField
                        control={form.control}
                        name="empNo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Employee Number *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter employee number"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Join Date & Effective Start Date */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="joinDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Join Date *</FormLabel>
                              <FormControl>
                                <DatePicker
                                  value={field.value}
                                  onChange={field.onChange}
                                  placeholder="Select join date"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="effectiveStartDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Effective Start Date *</FormLabel>
                              <FormControl>
                                <DatePicker
                                  value={field.value}
                                  onChange={field.onChange}
                                  placeholder="Select effective start date"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Effective End Date */}
                      <FormField
                        control={form.control}
                        name="effectiveEndDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Effective End Date *</FormLabel>
                            <FormControl>
                              <DatePicker
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="Select effective end date"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Person Type — Select */}
                      <FormField
                        control={form.control}
                        name="personTypeId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Person Type *</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              disabled={personTypesLoading}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue
                                    placeholder={
                                      personTypesLoading
                                        ? "Loading..."
                                        : "Select person type"
                                    }
                                  />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {personTypes.map((type) => (
                                  <SelectItem
                                    key={type.PERSON_TYPE_ID}
                                    value={String(type.PERSON_TYPE_ID)}
                                  >
                                    {type.PERSON_TYPE}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Registered Disability */}
                      <FormField
                        control={form.control}
                        name="regDisability"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Registered Disability *</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                value={field.value}
                                className="flex flex-row gap-3"
                              >
                                {REG_DISABILITY_OPTIONS.map((option) => (
                                  <div
                                    key={option.value}
                                    className="flex items-center space-x-1"
                                  >
                                    <RadioGroupItem
                                      value={option.value}
                                      id={`disability-${option.value}`}
                                    />
                                    <Label
                                      htmlFor={`disability-${option.value}`}
                                    >
                                      {option.label}
                                    </Label>
                                  </div>
                                ))}
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* ── Assignment ──────────────────────────────────────── */}
                      <div className="pt-3 border-t">
                        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                          Assignment
                        </p>
                        <div className="space-y-4">
                          {/* Company — Combobox */}
                          <ComboboxField
                            form={form}
                            name="companyId"
                            label="Company"
                            items={companies}
                            idKey="COMPANY_ID"
                            nameKey="COMPANY_NAME"
                            placeholder={
                              companiesLoading ? "Loading..." : "Select company"
                            }
                            disabled={companiesLoading}
                          />

                          {/* Operational Unit (OU) — Combobox using organizations */}
                          <ComboboxField
                            form={form}
                            name="ouId"
                            label="Operational Unit"
                            items={organizations}
                            idKey="ID"
                            nameKey="NAME"
                            placeholder={
                              organizationsLoading
                                ? "Loading..."
                                : "Select operational unit"
                            }
                            disabled={organizationsLoading}
                          />

                          {/* Organization — Combobox; clears position + grade on change */}
                          <ComboboxField
                            form={form}
                            name="orgId"
                            label="Organization"
                            items={organizations}
                            idKey="ID"
                            nameKey="NAME"
                            placeholder={
                              organizationsLoading
                                ? "Loading..."
                                : "Select organization"
                            }
                            disabled={organizationsLoading}
                            onSelect={(org) => {
                              setSelectedOrgId(org.ID);
                              form.setValue("positionId", "", {
                                shouldValidate: false,
                              });
                              form.setValue("orgPositionId", "", {
                                shouldValidate: false,
                              });
                              form.setValue("gradeId", "", {
                                shouldValidate: false,
                              });
                            }}
                          />

                          {/* Position — Combobox, disabled until org selected, filtered by org; auto-fills grade */}
                          <FormField
                            control={form.control}
                            name="positionId"
                            render={({ field }) => {
                              const [posOpen, setPosOpen] = useState(false);
                              const isDisabled =
                                !selectedOrgId || orgPositionsLoading;
                              // Match on POSITION_ID (master), not pos.ID (junction row)
                              const selectedPosition = filteredPositions.find(
                                (pos) =>
                                  String(pos.POSITION_ID) ===
                                  String(field.value),
                              );

                              const handlePositionSelect = (pos) => {
                                // pos.POSITION_ID → master position ID (sent as POSITION_ID)
                                field.onChange(String(pos.POSITION_ID));
                                // pos.ID → HR_ORG_POSITION row ID (sent as ORG_POSITION_ID)
                                form.setValue("orgPositionId", String(pos.ID), {
                                  shouldValidate: false,
                                });
                                // Auto-fill grade
                                if (pos.GRADE) {
                                  const matchedGrade = grades.find(
                                    (g) => g.GRADE === pos.GRADE,
                                  );
                                  if (matchedGrade) {
                                    form.setValue(
                                      "gradeId",
                                      String(matchedGrade.ID),
                                      { shouldValidate: true },
                                    );
                                  }
                                }
                                setPosOpen(false);
                              };

                              return (
                                <FormItem>
                                  <FormLabel>Position *</FormLabel>
                                  <Popover
                                    modal={true}
                                    open={posOpen}
                                    onOpenChange={setPosOpen}
                                  >
                                    <PopoverTrigger asChild>
                                      <FormControl>
                                        <Button
                                          variant="outline"
                                          role="combobox"
                                          disabled={isDisabled}
                                          className={`w-full justify-between font-normal ${
                                            !field.value &&
                                            "text-muted-foreground"
                                          }`}
                                        >
                                          {!selectedOrgId
                                            ? "Select an organization first"
                                            : orgPositionsLoading
                                              ? "Loading..."
                                              : selectedPosition
                                                ? selectedPosition.POSITION_TITLE
                                                : "Select position"}
                                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                      </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[300px] p-0">
                                      <Command>
                                        <CommandInput
                                          placeholder="Search positions..."
                                          className="h-9"
                                        />
                                        <CommandList>
                                          <CommandEmpty>
                                            {filteredPositions.length === 0
                                              ? "No positions found for this organization."
                                              : "No position found."}
                                          </CommandEmpty>
                                          <CommandGroup>
                                            {filteredPositions.map((pos) => {
                                              const isFull =
                                                pos.ACTUAL_COUNT >= pos.FTE;
                                              return (
                                                <CommandItem
                                                  key={pos.ID}
                                                  value={pos.POSITION_TITLE}
                                                  disabled={isFull}
                                                  onSelect={() => {
                                                    if (isFull) return;
                                                    handlePositionSelect(pos);
                                                  }}
                                                  className={
                                                    isFull
                                                      ? "opacity-50 cursor-not-allowed"
                                                      : ""
                                                  }
                                                >
                                                  <div className="flex flex-col flex-1 min-w-0">
                                                    <span className="truncate">
                                                      {pos.POSITION_TITLE}
                                                    </span>
                                                    {pos.GRADE && (
                                                      <span className="text-xs text-muted-foreground">
                                                        {pos.GRADE} ·{" "}
                                                        {pos.LEVELS}
                                                      </span>
                                                    )}
                                                  </div>
                                                  {isFull ? (
                                                    <Badge
                                                      variant="secondary"
                                                      className="ml-auto shrink-0 text-xs font-normal"
                                                    >
                                                      Full ({pos.ACTUAL_COUNT}/
                                                      {pos.FTE})
                                                    </Badge>
                                                  ) : (
                                                    <Check
                                                      className={`ml-auto h-4 w-4 shrink-0 ${
                                                        String(field.value) ===
                                                        String(pos.POSITION_ID)
                                                          ? "opacity-100"
                                                          : "opacity-0"
                                                      }`}
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
                                  <FormMessage />
                                </FormItem>
                              );
                            }}
                          />

                          {/* Grade — read-only, auto-filled from selected position */}
                          <FormField
                            control={form.control}
                            name="gradeId"
                            render={({ field }) => {
                              const selectedGrade = grades.find(
                                (g) => String(g.ID) === String(field.value),
                              );
                              return (
                                <FormItem>
                                  <FormLabel>Grade</FormLabel>
                                  <FormControl>
                                    <Input
                                      readOnly
                                      disabled
                                      value={
                                        selectedGrade ? selectedGrade.GRADE : ""
                                      }
                                      placeholder="Auto-filled from selected position"
                                      className="bg-muted/50 cursor-not-allowed"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              );
                            }}
                          />

                          {/* Payroll ID — keep as-is */}
                          <FormField
                            control={form.control}
                            name="payrollId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Payroll ID *</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Enter payroll ID"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="assignmentEffectiveStartDate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Assignment Start Date *</FormLabel>
                                  <FormControl>
                                    <DatePicker
                                      value={field.value}
                                      onChange={field.onChange}
                                      placeholder="Select start date"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="assignmentEffectiveEndDate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Assignment End Date *</FormLabel>
                                  <FormControl>
                                    <DatePicker
                                      value={field.value}
                                      onChange={field.onChange}
                                      placeholder="Select end date"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </div>
                      {/* ── End Assignment ────────────────────────────────── */}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {/* Permanent Address */}
              <Accordion
                type="single"
                collapsible
                defaultValue="permanent-address"
                className="bg-card/70 px-4 rounded-md shadow-sm"
              >
                <AccordionItem value="permanent-address">
                  <AccordionTrigger className="text-lg font-medium flex items-center gap-2">
                    <span className="p-1 rounded-sm shadow-sm bg-primary/10 text-primary">
                      <Home className="w-5 h-5 text-primary" />
                    </span>
                    Permanent Address
                  </AccordionTrigger>
                  <AccordionContent>
                    <AddressFields form={form} prefix="permanentAddress" />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>

          {/* ── Form Actions ───────────────────────────────────────────────── */}
          <div className="flex flex-col items-end gap-3 mt-6">
            {allErrors.length > 0 && (
              <Alert variant="destructive" className="w-full">
                <AlertDescription className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">
                      Please fix the following errors:
                    </p>
                    <ul className="list-disc list-inside mt-1 text-sm">
                      {allErrors.map(({ key, message }) => (
                        <li key={key}>{message}</li>
                      ))}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {submitStatus === "success" && newPersonId && (
              <Alert className="w-full md:w-auto">
                <AlertDescription className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  {statusMessage}
                  <Link
                    to="/core-hr/employees"
                    className="ml-2 underline font-medium hover:no-underline"
                  >
                    View Employees
                  </Link>
                  {newPersonId && (
                    <Link
                      to={`/core-hr/employee-management/employee-details/${newPersonId}`}
                      className="underline font-medium hover:no-underline"
                    >
                      View Details
                    </Link>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={createEmployeeMutation.isPending}>
              {createEmployeeMutation.isPending ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Creating...
                </>
              ) : (
                "Create Employee"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </PageContainer>
  );
}
