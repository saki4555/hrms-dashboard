import React, { useEffect, useState, useMemo } from "react";
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
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
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
  useCountriesLookup,
  useRegionsLookup,
  useDistrictsLookup,
  useUpazillasLookup,
} from "../../../api/location-lookup-queries";

// ─── Address sub-schema ───────────────────────────────────────────────────────
const addressSchema = z
  .object({
    address1: z.string().min(1, "Address is required").max(100).trim(),
    address1B: z
      .string()
      .min(1, "Address (Bangla) is required")
      .max(100)
      .trim(),
    country: z.string().min(1, "Country is required").max(30).trim(),
    region: z.string().min(1, "Region is required").max(30).trim(),
    district: z.string().min(1, "District is required").max(30).trim(),
    upazilla: z.string().min(1, "Upazilla is required").max(30).trim(),
    unions: z.string().min(1, "Union is required").max(30).trim(),
    area: z.string().min(1, "Area is required").max(30).trim(),
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
    empNo: z.string().min(1, "Employee number is required").max(20).trim(),
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
    gender: z.string().min(1, "Gender is required").max(10).trim(),
    dateOfBirth: z.date({ required_error: "Date of birth is required" }),
    nid: z.string().min(1, "NID is required").max(30).trim(),
    birthRegNo: z
      .string()
      .min(1, "Birth registration number is required")
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
    maritalStatus: z.string().min(1, "Marital status is required").trim(),
    nationality: z.string().min(1, "Nationality is required").max(30).trim(),
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

// ─── CascadeCombobox — dumb controlled input, no FormField inside ─────────────
function CascadeCombobox({
  value,
  items,
  idKey,
  nameKey,
  placeholder,
  disabled,
  onSelect,
}) {
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
                  <Check
                    className={`ml-auto h-4 w-4 ${
                      value === item[nameKey] ? "opacity-100" : "opacity-0"
                    }`}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ─── AddressFields ────────────────────────────────────────────────────────────
// initialCountryId / initialRegionId / initialDistrictId: IDs from the existing
// employee record, used to seed the cascade state so downstream dropdowns are
// unlocked and already showing the correct options on load.
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
  const [selectedDistrictId, setSelectedDistrictId] =
    useState(initialDistrictId);

  // Sync if initial IDs arrive late (data loads after render)
  useEffect(() => {
    if (initialCountryId && !selectedCountryId)
      setSelectedCountryId(initialCountryId);
  }, [initialCountryId]);

  useEffect(() => {
    if (initialRegionId && !selectedRegionId)
      setSelectedRegionId(initialRegionId);
  }, [initialRegionId]);

  useEffect(() => {
    if (initialDistrictId && !selectedDistrictId)
      setSelectedDistrictId(initialDistrictId);
  }, [initialDistrictId]);

  const { data: countries = [], isLoading: countriesLoading } = useCountriesLookup();
  const { data: regions = [], isLoading: regionsLoading } =
    useRegionsLookup(selectedCountryId);
  const { data: districts = [], isLoading: districtsLoading } =
    useDistrictsLookup(selectedRegionId);
  const { data: upazillas = [], isLoading: upazillasLoading } =
    useUpazillasLookup(selectedDistrictId);

  return (
    <div className="space-y-4">
      {/* Address lines */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name={`${prefix}.address1`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter address"
                  disabled={disabled}
                  {...field}
                />
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
                <Input
                  placeholder="ঠিকানা লিখুন"
                  disabled={disabled}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Country → Region */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name={`${prefix}.country`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Country *</FormLabel>
              <FormControl>
                <CascadeCombobox
                  value={field.value}
                  items={countries}
                  idKey="COUNTRY_ID"
                  nameKey="COUNTRY_NAME"
                  placeholder={
                    countriesLoading ? "Loading..." : "Select country"
                  }
                  disabled={disabled || countriesLoading}
                  onSelect={(item) => {
                    field.onChange(item.COUNTRY_NAME);
                    setSelectedCountryId(item.COUNTRY_ID);
                    // clear downstream
                    form.setValue(`${prefix}.region`, "");
                    form.setValue(`${prefix}.district`, "");
                    form.setValue(`${prefix}.upazilla`, "");
                    setSelectedRegionId(null);
                    setSelectedDistrictId(null);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`${prefix}.region`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Region / Division *</FormLabel>
              <FormControl>
                <CascadeCombobox
                  value={field.value}
                  items={regions}
                  idKey="REGION_ID"
                  nameKey="REGION_NAME"
                  placeholder={
                    !selectedCountryId
                      ? "Select country first"
                      : regionsLoading
                        ? "Loading..."
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
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* District → Upazilla */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name={`${prefix}.district`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>District *</FormLabel>
              <FormControl>
                <CascadeCombobox
                  value={field.value}
                  items={districts}
                  idKey="DISTRICT_ID"
                  nameKey="DISTRICT_NAME"
                  placeholder={
                    !selectedRegionId
                      ? "Select region first"
                      : districtsLoading
                        ? "Loading..."
                        : "Select district"
                  }
                  disabled={disabled || !selectedRegionId || districtsLoading}
                  onSelect={(item) => {
                    field.onChange(item.DISTRICT_NAME);
                    setSelectedDistrictId(item.DISTRICT_ID);
                    form.setValue(`${prefix}.upazilla`, "");
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`${prefix}.upazilla`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Upazilla *</FormLabel>
              <FormControl>
                <CascadeCombobox
                  value={field.value}
                  items={upazillas}
                  idKey="UPAZILLA_ID"
                  nameKey="UPAZILLA_NAME"
                  placeholder={
                    !selectedDistrictId
                      ? "Select district first"
                      : upazillasLoading
                        ? "Loading..."
                        : "Select upazilla"
                  }
                  disabled={
                    disabled || !selectedDistrictId || upazillasLoading
                  }
                  onSelect={(item) => {
                    field.onChange(item.UPAZILLA_NAME);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Unions & Area — free text */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name={`${prefix}.unions`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Union *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter union"
                  disabled={disabled}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`${prefix}.area`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Area / Village *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter area"
                  disabled={disabled}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name={`${prefix}.effectiveStartDate`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Effective Start Date *</FormLabel>
              <FormControl>
                <DatePicker
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select start date"
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`${prefix}.effectiveEndDate`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Effective End Date *</FormLabel>
              <FormControl>
                <DatePicker
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select end date"
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

// ─── Reusable Combobox Field (form-aware, stores ID) ─────────────────────────
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
const parseDate = (dateString) => {
  if (!dateString) return undefined;
  return new Date(dateString);
};

const fd = (date) => (date ? format(date, "yyyy-MM-dd") : null);

// ─── Main Component ───────────────────────────────────────────────────────────
export default function UpdateEmployeePage() {
  const { personId } = useParams();
  const navigate = useNavigate();
  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();

  const updateEmployeeMutation = useUpdateEmployee();
  const createEmployeeMutation = useCreateEmployee();

  const [submissionType, setSubmissionType] = useState(null);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [newPersonId, setNewPersonId] = useState(null);
  const [selectedOrgId, setSelectedOrgId] = useState(null);
  const [formSeeded, setFormSeeded] = useState(false);

  // ── Address initial IDs — extracted from employee data so AddressFields
  //    can unlock the cascade dropdowns and pre-load options on mount ──────────
  const [presentAddressIds, setPresentAddressIds] = useState({
    countryId: null,
    regionId: null,
    districtId: null,
  });
  const [permanentAddressIds, setPermanentAddressIds] = useState({
    countryId: null,
    regionId: null,
    districtId: null,
  });

  const isSubmitting = submissionType !== null;

  const { data: employee, isLoading, isError, error } = useEmployeeById(personId);
  const { data: personTypes = [], isLoading: personTypesLoading } = usePersonTypes();
  const { data: companies = [], isLoading: companiesLoading } = useCompanies();
  const { data: organizations = [], isLoading: organizationsLoading } = useOrganizations();
  const { data: orgPositions = [], isLoading: orgPositionsLoading } = useOrgPositions();
  const { data: grades = [], isLoading: gradesLoading } = useGrades();

  const filteredPositions = useMemo(() => {
    if (!selectedOrgId) return [];
    return orgPositions.filter(
      (pos) => String(pos.ORG_ID) === String(selectedOrgId),
    );
  }, [orgPositions, selectedOrgId]);

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

  // ── 1. Populate form + seed cascade IDs when employee data loads ───────────
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
      // positionId resolved in effect 2 once orgPositions loads
      positionId: "",
      orgPositionId: "",
      payrollId: employee.assignment?.PAYROLL_ID?.toString() || "",
      gradeId: employee.assignment?.GRADE_ID?.toString() || "",
      assignmentEffectiveStartDate: parseDate(
        employee.assignment?.EFFECTIVE_START_DATE,
      ),
      assignmentEffectiveEndDate: parseDate(
        employee.assignment?.EFFECTIVE_END_DATE,
      ),
      presentAddress: addr(employee.presentAddress),
      permanentAddress: addr(employee.permanentAddress),
    });

    // Set cascade IDs AFTER form.reset so AddressFields mounts with correct
    // initial values. formSeeded gates the render, so these IDs are passed
    // as initial props to a not-yet-mounted AddressFields component.
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
  }, [employee]);

  // ── 2. Resolve positionId + orgPositionId once orgPositions loads ──────────
  useEffect(() => {
    if (!formSeeded || !employee || orgPositions.length === 0) return;

    const assignedOrgPositionId =
      employee.assignment?.POSITION_ID?.toString() || "";
    const orgId = employee.assignment?.ORG_ID;

    if (!assignedOrgPositionId || !orgId) return;

    const match = orgPositions.find(
      (pos) =>
        String(pos.ID) === assignedOrgPositionId &&
        String(pos.ORG_ID) === String(orgId),
    );

    if (match) {
      form.setValue("positionId", String(match.POSITION_ID), {
        shouldValidate: false,
      });
      form.setValue("orgPositionId", String(match.ID), {
        shouldValidate: false,
      });
      if (match.GRADE) {
        const matchedGrade = grades.find((g) => g.GRADE === match.GRADE);
        if (matchedGrade) {
          form.setValue("gradeId", String(matchedGrade.ID), {
            shouldValidate: false,
          });
        }
      }
    }
  }, [formSeeded, employee, orgPositions, grades]);

  // ─── Payload builder ───────────────────────────────────────────────────────
  const buildPayload = (data) => ({
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
  });

  // ─── Submit handlers ───────────────────────────────────────────────────────
  const handleFormSubmit = async (data, operationType) => {
    try {
      setSubmissionType(operationType);
      setSubmitStatus(null);
      setStatusMessage("");

      const payload = buildPayload(data);

      console.log(payload);
      

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
      } else {
        const result = await createEmployeeMutation.mutateAsync(payload);
        const createdPersonId = result?.PERSON_ID || null;
        setNewPersonId(createdPersonId);
        toast.success("Employee updated (new record created) successfully!");
        setSubmitStatus("success");
        setStatusMessage("Employee updated (new record created) successfully!");
      }
    } catch (err) {
      console.error(`Error during ${operationType}:`, err);
      setSubmitStatus("error");
      setStatusMessage(
        err?.message ||
          `Failed to ${operationType} employee. Please try again.`,
      );
      toast.error(err?.message || `Failed to ${operationType} employee.`);
    } finally {
      setSubmissionType(null);
    }
  };

  const handleUpdateClick = async () => {
    const isValid = await form.trigger();
    if (!isValid) return;

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

  // ── Loading & error states ─────────────────────────────────────────────────
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
            {error?.message ||
              "Failed to load employee data. Please go back and try again."}
          </AlertDescription>
        </Alert>
      </PageContainer>
    );
  }

  // ── Page ───────────────────────────────────────────────────────────────────
  return (
    <PageContainer className="px-6">
      {/* Header */}
      <header className="mb-8 bg-card p-4 rounded-md shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-1.5 border border-primary/10 bg-primary/10 rounded-md shadow-xs">
              <UserCog className="w-6 h-6 text-primary" />
            </div>
            <div className="space-y-0.5">
              <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
                Update Employee
              </h1>
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    Core HR
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to="/core-hr/employee-management">
                        Employee Management
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="text-muted-foreground/80 font-normal">
                      Update Employee
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </div>
        </div>
      </header>

      <Form {...form}>
        <form onSubmit={(e) => e.preventDefault()}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* ── LEFT COLUMN — Personal Info + Present Address ─────────── */}
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
                                disabled={isSubmitting}
                                className="flex flex-row gap-4"
                              >
                                {["Mr.", "Mrs.", "Ms.", "Dr."].map((t) => (
                                  <div key={t} className="flex items-center space-x-1">
                                    <RadioGroupItem value={t} id={`title-${t}`} />
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
                        <FormField control={form.control} name="firstName"
                          render={({ field }) => (
                            <FormItem><FormLabel>First Name *</FormLabel>
                              <FormControl><Input placeholder="Enter first name" disabled={isSubmitting} {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField control={form.control} name="lastName"
                          render={({ field }) => (
                            <FormItem><FormLabel>Last Name *</FormLabel>
                              <FormControl><Input placeholder="Enter last name" disabled={isSubmitting} {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="fathersName"
                          render={({ field }) => (
                            <FormItem><FormLabel>Father's Name *</FormLabel>
                              <FormControl><Input placeholder="Enter father's name" disabled={isSubmitting} {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField control={form.control} name="fathersNameB"
                          render={({ field }) => (
                            <FormItem><FormLabel>Father's Name (Bangla) *</FormLabel>
                              <FormControl><Input placeholder="পিতার নাম" disabled={isSubmitting} {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="mothersName"
                          render={({ field }) => (
                            <FormItem><FormLabel>Mother's Name *</FormLabel>
                              <FormControl><Input placeholder="Enter mother's name" disabled={isSubmitting} {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField control={form.control} name="mothersNameB"
                          render={({ field }) => (
                            <FormItem><FormLabel>Mother's Name (Bangla) *</FormLabel>
                              <FormControl><Input placeholder="মাতার নাম" disabled={isSubmitting} {...field} /></FormControl>
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
                                disabled={isSubmitting}
                                className="flex flex-row gap-3"
                              >
                                {["Male", "Female", "Other"].map((g) => (
                                  <div key={g} className="flex items-center space-x-1">
                                    <RadioGroupItem value={g} id={`gender-${g}`} />
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
                        <FormField control={form.control} name="dateOfBirth"
                          render={({ field }) => (
                            <FormItem><FormLabel>Date of Birth *</FormLabel>
                              <FormControl>
                                <DatePicker value={field.value} onChange={field.onChange} placeholder="Select date of birth" disabled={isSubmitting} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField control={form.control} name="nid"
                          render={({ field }) => (
                            <FormItem><FormLabel>NID *</FormLabel>
                              <FormControl><Input placeholder="Enter NID number" disabled={isSubmitting} {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="birthRegNo"
                          render={({ field }) => (
                            <FormItem><FormLabel>Birth Registration No *</FormLabel>
                              <FormControl><Input placeholder="Enter birth reg. no" disabled={isSubmitting} {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField control={form.control} name="townOfBirth"
                          render={({ field }) => (
                            <FormItem><FormLabel>Town of Birth *</FormLabel>
                              <FormControl><Input placeholder="Enter town of birth" disabled={isSubmitting} {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="regionOfBirth"
                          render={({ field }) => (
                            <FormItem><FormLabel>Region of Birth *</FormLabel>
                              <FormControl><Input placeholder="Enter region" disabled={isSubmitting} {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField control={form.control} name="countryOfBirth"
                          render={({ field }) => (
                            <FormItem><FormLabel>Country of Birth *</FormLabel>
                              <FormControl><Input placeholder="Enter country" disabled={isSubmitting} {...field} /></FormControl>
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
                                disabled={isSubmitting}
                                className="flex flex-row gap-3 flex-wrap"
                              >
                                {MARITAL_STATUS_OPTIONS.map((option) => (
                                  <div key={option.value} className="flex items-center space-x-1">
                                    <RadioGroupItem value={option.value} id={`marital-${option.value}`} />
                                    <Label htmlFor={`marital-${option.value}`}>{option.label}</Label>
                                  </div>
                                ))}
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField control={form.control} name="nationality"
                        render={({ field }) => (
                          <FormItem><FormLabel>Nationality *</FormLabel>
                            <FormControl><Input placeholder="Enter nationality" disabled={isSubmitting} {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {/* Present Address — with initial IDs to unlock cascade on load */}
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
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            {/* ── RIGHT COLUMN — Employment Info + Permanent Address ──────── */}
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
                      <FormField control={form.control} name="empNo"
                        render={({ field }) => (
                          <FormItem><FormLabel>Employee Number *</FormLabel>
                            <FormControl><Input placeholder="Enter employee number" disabled={isSubmitting} {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="joinDate"
                          render={({ field }) => (
                            <FormItem><FormLabel>Join Date *</FormLabel>
                              <FormControl>
                                <DatePicker value={field.value} onChange={field.onChange} placeholder="Select join date" disabled={isSubmitting} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField control={form.control} name="effectiveStartDate"
                          render={({ field }) => (
                            <FormItem><FormLabel>Effective Start Date *</FormLabel>
                              <FormControl>
                                <DatePicker value={field.value} onChange={field.onChange} placeholder="Select start date" disabled={isSubmitting} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField control={form.control} name="effectiveEndDate"
                        render={({ field }) => (
                          <FormItem><FormLabel>Effective End Date *</FormLabel>
                            <FormControl>
                              <DatePicker value={field.value} onChange={field.onChange} placeholder="Select end date" disabled={isSubmitting} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="personTypeId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Person Type *</FormLabel>
                            <Select
                              key={`person-type-${field.value}-${personTypes.length}`}
                              onValueChange={field.onChange}
                              value={field.value}
                              disabled={isSubmitting || personTypesLoading}
                            >
                              <FormControl>
                                <SelectTrigger>
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
                            <FormMessage />
                          </FormItem>
                        )}
                      />

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
                                disabled={isSubmitting}
                                className="flex flex-row gap-3"
                              >
                                {REG_DISABILITY_OPTIONS.map((option) => (
                                  <div key={option.value} className="flex items-center space-x-1">
                                    <RadioGroupItem value={option.value} id={`disability-${option.value}`} />
                                    <Label htmlFor={`disability-${option.value}`}>{option.label}</Label>
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
                          <ComboboxField
                            form={form} name="companyId" label="Company"
                            items={companies} idKey="COMPANY_ID" nameKey="COMPANY_NAME"
                            placeholder={companiesLoading ? "Loading..." : "Select company"}
                            disabled={isSubmitting || companiesLoading}
                          />
                          <ComboboxField
                            form={form} name="ouId" label="Operational Unit"
                            items={organizations} idKey="ID" nameKey="NAME"
                            placeholder={organizationsLoading ? "Loading..." : "Select operational unit"}
                            disabled={isSubmitting || organizationsLoading}
                          />
                          <ComboboxField
                            form={form} name="orgId" label="Organization"
                            items={organizations} idKey="ID" nameKey="NAME"
                            placeholder={organizationsLoading ? "Loading..." : "Select organization"}
                            disabled={isSubmitting || organizationsLoading}
                            onSelect={(org) => {
                              setSelectedOrgId(org.ID);
                              form.setValue("positionId", "", { shouldValidate: false });
                              form.setValue("orgPositionId", "", { shouldValidate: false });
                              form.setValue("gradeId", "", { shouldValidate: false });
                            }}
                          />

                          <FormField
                            control={form.control}
                            name="positionId"
                            render={({ field }) => {
                              const [posOpen, setPosOpen] = useState(false);
                              const isDisabled = isSubmitting || !selectedOrgId || orgPositionsLoading;
                              const selectedPosition = filteredPositions.find(
                                (pos) => String(pos.POSITION_ID) === String(field.value),
                              );
                              const handlePositionSelect = (pos) => {
                                field.onChange(String(pos.POSITION_ID));
                                form.setValue("orgPositionId", String(pos.ID), { shouldValidate: false });
                                if (pos.GRADE) {
                                  const matchedGrade = grades.find((g) => g.GRADE === pos.GRADE);
                                  if (matchedGrade) {
                                    form.setValue("gradeId", String(matchedGrade.ID), { shouldValidate: true });
                                  }
                                }
                                setPosOpen(false);
                              };
                              return (
                                <FormItem>
                                  <FormLabel>Position *</FormLabel>
                                  <Popover modal={true} open={posOpen} onOpenChange={setPosOpen}>
                                    <PopoverTrigger asChild>
                                      <FormControl>
                                        <Button
                                          variant="outline" role="combobox" disabled={isDisabled}
                                          className={`w-full justify-between font-normal ${!field.value && "text-muted-foreground"}`}
                                        >
                                          {!selectedOrgId && !isSubmitting
                                            ? "Select an organization first"
                                            : orgPositionsLoading ? "Loading..."
                                            : selectedPosition ? selectedPosition.POSITION_TITLE
                                            : "Select position"}
                                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                      </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[300px] p-0">
                                      <Command>
                                        <CommandInput placeholder="Search positions..." className="h-9" />
                                        <CommandList>
                                          <CommandEmpty>
                                            {filteredPositions.length === 0
                                              ? "No positions found for this organization."
                                              : "No position found."}
                                          </CommandEmpty>
                                          <CommandGroup>
                                            {filteredPositions.map((pos) => {
                                              const isFull = pos.ACTUAL_COUNT >= pos.FTE;
                                              return (
                                                <CommandItem
                                                  key={pos.ID} value={pos.POSITION_TITLE}
                                                  disabled={isFull}
                                                  onSelect={() => { if (isFull) return; handlePositionSelect(pos); }}
                                                  className={isFull ? "opacity-50 cursor-not-allowed" : ""}
                                                >
                                                  <div className="flex flex-col flex-1 min-w-0">
                                                    <span className="truncate">{pos.POSITION_TITLE}</span>
                                                    {pos.GRADE && (
                                                      <span className="text-xs text-muted-foreground">
                                                        {pos.GRADE} · {pos.LEVELS}
                                                      </span>
                                                    )}
                                                  </div>
                                                  {isFull ? (
                                                    <Badge variant="secondary" className="ml-auto shrink-0 text-xs font-normal">
                                                      Full ({pos.ACTUAL_COUNT}/{pos.FTE})
                                                    </Badge>
                                                  ) : (
                                                    <Check className={`ml-auto h-4 w-4 shrink-0 ${String(field.value) === String(pos.POSITION_ID) ? "opacity-100" : "opacity-0"}`} />
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

                          <FormField control={form.control} name="gradeId"
                            render={({ field }) => {
                              const selectedGrade = grades.find((g) => String(g.ID) === String(field.value));
                              return (
                                <FormItem><FormLabel>Grade</FormLabel>
                                  <FormControl>
                                    <Input readOnly disabled value={selectedGrade ? selectedGrade.GRADE : ""}
                                      placeholder="Auto-filled from selected position"
                                      className="bg-muted/50 cursor-not-allowed" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              );
                            }}
                          />

                          <FormField control={form.control} name="payrollId"
                            render={({ field }) => (
                              <FormItem><FormLabel>Payroll ID *</FormLabel>
                                <FormControl><Input placeholder="Enter payroll ID" disabled={isSubmitting} {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="assignmentEffectiveStartDate"
                              render={({ field }) => (
                                <FormItem><FormLabel>Assignment Start Date *</FormLabel>
                                  <FormControl>
                                    <DatePicker value={field.value} onChange={field.onChange} placeholder="Select start date" disabled={isSubmitting} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField control={form.control} name="assignmentEffectiveEndDate"
                              render={({ field }) => (
                                <FormItem><FormLabel>Assignment End Date *</FormLabel>
                                  <FormControl>
                                    <DatePicker value={field.value} onChange={field.onChange} placeholder="Select end date" disabled={isSubmitting} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {/* Permanent Address — with initial IDs to unlock cascade on load */}
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
                    {formSeeded ? (
                      <AddressFields
                        form={form}
                        prefix="permanentAddress"
                        disabled={isSubmitting}
                        initialCountryId={permanentAddressIds.countryId}
                        initialRegionId={permanentAddressIds.regionId}
                        initialDistrictId={permanentAddressIds.districtId}
                      />
                    ) : (
                      <div className="flex items-center gap-2 py-4 text-muted-foreground text-sm">
                        <Spinner className="h-4 w-4" /> Loading address...
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>

          {/* ── Form Actions ─────────────────────────────────────────────── */}
          <div className="flex flex-col items-end gap-3 mt-6">
            {allErrors.length > 0 && (
              <Alert variant="destructive" className="w-full">
                <AlertDescription className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Please fix the following errors:</p>
                    <ul className="list-disc list-inside mt-1 text-sm">
                      {allErrors.map(({ key, message }) => (
                        <li key={key}>{message}</li>
                      ))}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {submitStatus === "success" && (
              <Alert className="max-w-lg" variant="success">
                <AlertDescription className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  {statusMessage}
                  <Link to="/core-hr/employees" className="ml-2 underline font-medium hover:no-underline">
                    View Employees
                  </Link>
                  <Link
                    to={`/core-hr/employee-management/employee-details/${newPersonId ?? personId}`}
                    className="underline font-medium hover:no-underline"
                  >
                    View Details
                  </Link>
                </AlertDescription>
              </Alert>
            )}

            {submitStatus === "error" && (
              <Alert variant="destructive" className="w-full">
                <AlertDescription className="flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  {statusMessage}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex items-center gap-3">
              <Button
                type="button" variant="outline"
                onClick={() => navigate("/core-hr/employee-management")}
                disabled={isSubmitting}
              >
                Cancel
              </Button>

              <Button
                type="button"
                onClick={form.handleSubmit(
                  (data) => handleFormSubmit(data, "correction"),
                  handleFormError,
                )}
                disabled={isSubmitting}
                variant="outline"
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
                {submissionType === "correction" ? (
                  <><Spinner className="mr-2 h-4 w-4" />Processing...</>
                ) : (
                  <><IconEdit />Correction</>
                )}
              </Button>

              <Button type="button" onClick={handleUpdateClick} disabled={isSubmitting}>
                {submissionType === "update" ? (
                  <><Spinner className="mr-2 h-4 w-4" />Processing...</>
                ) : (
                  <><IconCirclePlus />Update</>
                )}
              </Button>
            </div>
          </div>
        </form>
      </Form>

      <ConfirmationDialog />
    </PageContainer>
  );
}