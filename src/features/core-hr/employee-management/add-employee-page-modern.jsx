import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  BriefcaseIcon,
  IdCard,
  UserPlus,
  CheckCircle,
  XCircle,
  MapPin,
  Home,
  ChevronRight,
  ChevronLeft,
  Copy,
  Sparkles,
  User,
  Building2,
  FileText,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/DatePicker";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Link } from "react-router";
import { cn } from "@/lib/utils";
import {
  MARITAL_STATUS_OPTIONS,
  REG_DISABILITY_OPTIONS,
} from "@/lib/constants/employeeOptions";
import PageContainer from "@/components/page-container";

import { useCompanies } from "@/features/settings/work-structure/company/queries";
import { useOrganizations } from "@/features/settings/work-structure/organization/queries";
import { useOrgPositions } from "@/features/settings/work-structure/position/queries";
import { useGrades } from "@/features/settings/work-structure/hr-grade/queries";
import { usePersonTypes } from "../employee-types/queries";
import { useCreateEmployee } from "./queries";
import { useShifts } from "@/features/settings/work-structure/shift/queries";

import { useHrLocations } from "@/features/settings/work-structure/locations/queries";
import { useSupervisorLiteSearch, useDebounce } from "@/hooks/use-lite-search";
import { Check, ChevronsUpDown } from "lucide-react";
import { IconX } from "@tabler/icons-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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

// Shared
import { STEPS, fd } from "./components/steps";
import { ProgressBar } from "./components/progress-bar";
import { SectionCard } from "./components/section-card";
import { FieldWithCounter } from "./components/field-with-counter";
import { SmartRadioGroup } from "./components/smart-radio-group";
import { ComboboxField } from "./components/combobox-field";
import { AddressFields } from "./components/address-fields";
import { PositionComboboxField } from "./components/position-combobox-field";
import { ErrorSummary } from "./components/error-summary";
import { ReviewStep } from "./components/review-step";
import { employeeSchema } from "./employee-schema";
import { getAvatarColor } from "@/lib/avatar-utils";

export default function AddEmployeePageModern() {
  const createEmployeeMutation = useCreateEmployee();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [submitStatus, setSubmitStatus] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [newPersonId, setNewPersonId] = useState(null);
  const [sameAsPresent, setSameAsPresent] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState(null);

  const { data: personTypes = [], isLoading: personTypesLoading } =
    usePersonTypes();
  const { data: companies = [], isLoading: companiesLoading } = useCompanies();
  const { data: organizations = [], isLoading: organizationsLoading } =
    useOrganizations();
  const { data: orgPositions = [], isLoading: orgPositionsLoading } =
    useOrgPositions();
  const { data: grades = [], isLoading: gradesLoading } = useGrades();
  const { data: shifts = [], isLoading: shiftsLoading } = useShifts();

  const { data: locations = [], isLoading: locationsLoading } =
    useHrLocations();

  // Supervisor search
  const [supOpen, setSupOpen] = useState(false);
  const [supSearch, setSupSearch] = useState("");
  const [selectedSupervisor, setSelectedSupervisor] = useState(null);
  const { data: supervisors = [], isFetching: supFetching } =
    useSupervisorLiteSearch(supSearch);

  const filteredPositions = useMemo(() => {
    if (!selectedOrgId) return [];
    return orgPositions.filter(
      (pos) => String(pos.ORG_ID) === String(selectedOrgId),
    );
  }, [orgPositions, selectedOrgId]);

  const todayRef = React.useRef(new Date());
  const fiveYearsLaterRef = React.useRef(addYears(todayRef.current, 5));
  const today = todayRef.current;
  const fiveYearsLater = fiveYearsLaterRef.current;

  const form = useForm({
    resolver: zodResolver(employeeSchema),
    // mode: "onChange",
    mode: "onBlur",
    reValidateMode: "onChange",
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
      locationId: "",
      supervisorId: undefined,
      payrollId: "",
      gradeId: "",
      effectiveStartDate: today,
      effectiveEndDate: fiveYearsLater,
      assignmentEffectiveStartDate: today,
      assignmentEffectiveEndDate: fiveYearsLater,
      shiftId: "",
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

  // Auto-advance end dates when start date changes
  const effectiveStart = form.watch("effectiveStartDate");
  const assignmentStart = form.watch("assignmentEffectiveStartDate");
  const presentStart = form.watch("presentAddress.effectiveStartDate");
  const permanentStart = form.watch("permanentAddress.effectiveStartDate");

  useEffect(() => {
    if (effectiveStart)
      form.setValue("effectiveEndDate", addYears(effectiveStart, 5), {
        shouldDirty: true,
      });
  }, [effectiveStart]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (assignmentStart)
      form.setValue(
        "assignmentEffectiveEndDate",
        addYears(assignmentStart, 5),
        { shouldDirty: true },
      );
  }, [assignmentStart]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (presentStart)
      form.setValue(
        "presentAddress.effectiveEndDate",
        addYears(presentStart, 5),
        { shouldDirty: true },
      );
  }, [presentStart]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (permanentStart)
      form.setValue(
        "permanentAddress.effectiveEndDate",
        addYears(permanentStart, 5),
        { shouldDirty: true },
      );
  }, [permanentStart]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSameAsPresent = useCallback(
    (checked) => {
      setSameAsPresent(checked);
      if (checked) {
        const present = form.getValues("presentAddress");
        Object.keys(present).forEach((key) => {
          form.setValue(`permanentAddress.${key}`, present[key], {
            shouldDirty: true,
          });
        });
      }
    },
    [form],
  );

  const allStepProgress = useMemo(() => {
    const values = form.getValues();
    return STEPS.map((step) => {
      if (!step || step.fields.length === 0) return { filled: 0, total: 0 };
      let filled = 0;
      let total = 0;
      step.fields.forEach((f) => {
        if (f === "presentAddress" || f === "permanentAddress") {
          const addr = values[f] || {};
          const keys = [
            "address1",
            "address1B",
            "country",
            "region",
            "district",
            "upazilla",
            "unions",
            "area",
          ];
          total += keys.length;
          filled += keys.filter(
            (k) => addr[k] && String(addr[k]).trim(),
          ).length;
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
    form.watch("title"),
    form.watch("firstName"),
    form.watch("lastName"),
    form.watch("fathersName"),
    form.watch("fathersNameB"),
    form.watch("mothersName"),
    form.watch("mothersNameB"),
    form.watch("gender"),
    form.watch("dateOfBirth"),
    form.watch("nid"),
    form.watch("birthRegNo"),
    form.watch("townOfBirth"),
    form.watch("regionOfBirth"),
    form.watch("countryOfBirth"),
    form.watch("maritalStatus"),
    form.watch("nationality"),
    form.watch("empNo"),
    form.watch("joinDate"),
    form.watch("personTypeId"),
    form.watch("regDisability"),
    form.watch("companyId"),
    form.watch("ouId"),
    form.watch("orgId"),
    form.watch("positionId"),
    form.watch("payrollId"),
    form.watch("gradeId"),
  ]);

  const handleNext = async () => {
    const step = STEPS[currentStep];
    const fieldsToValidate = step.fields.flatMap((f) =>
      f === "presentAddress" || f === "permanentAddress"
        ? [
            `${f}.address1`,
            `${f}.address1B`,
            `${f}.country`,
            `${f}.region`,
            `${f}.district`,
            `${f}.upazilla`,
            `${f}.unions`,
            `${f}.area`,
            `${f}.effectiveStartDate`,
            `${f}.effectiveEndDate`,
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

  const onSubmit = async (data) => {
    try {
      setSubmitStatus(null);
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
        assignment: {
          COMPANY_ID: parseInt(data.companyId),
          OU_ID: parseInt(data.ouId),
          ORG_ID: parseInt(data.orgId),
          POSITION_ID: parseInt(data.orgPositionId),
          PAYROLL_ID: parseInt(data.payrollId),
          GRADE_ID: parseInt(data.gradeId),
          LOCATION_ID: data.locationId ? parseInt(data.locationId) : null,
          EFFECTIVE_START_DATE: fd(data.assignmentEffectiveStartDate),
          EFFECTIVE_END_DATE: fd(data.assignmentEffectiveEndDate),
        },
        shift: data.shiftId
          ? {
              SHIFT_ID: parseInt(data.shiftId),
              EFFECTIVE_START_DATE: fd(data.assignmentEffectiveStartDate),
              EFFECTIVE_END_DATE: fd(data.assignmentEffectiveEndDate),
            }
          : null,
        supervisor: data.supervisorId
          ? { SUPERVISOR_ID: data.supervisorId }
          : null,
      };
      const result = await createEmployeeMutation.mutateAsync(payload);
      setNewPersonId(result?.PERSON_ID);
      setSubmitStatus("success");
      setStatusMessage("Employee created successfully!");
      setCompletedSteps(new Set([0, 1, 2, 3, 4]));
    } catch (error) {
      setSubmitStatus("error");
      setStatusMessage(
        error?.message || "Failed to create employee. Please try again.",
      );
    }
  };

  const handleFormError = () => {
    setSubmitStatus("error");
    setStatusMessage("Please fill in all required fields correctly.");
  };

  return (
    <PageContainer className="px-0 pb-0">
      {/* Header */}
      <header className="px-6 mb-6 pt-2">
        <div className="flex items-center gap-4">
          <div className="p-2 border border-primary/15 bg-gradient-to-br from-violet-500/10 to-purple-600/10 rounded-xl shadow-sm">
            <UserPlus className="w-6 h-6 text-primary" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">
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
                    <Link to="/core-hr/employees">Employee Management</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-muted-foreground/70 font-normal">
                    Add Employee
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>
      </header>

      <ProgressBar
        currentStep={currentStep}
        completedSteps={completedSteps}
        onStepClick={setCurrentStep}
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit, handleFormError)}>
          <div className="px-6 mt-6">
            <div className="flex-1 min-w-0 space-y-0">
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
                    <SmartRadioGroup
                      form={form}
                      name="title"
                      label="Title"
                      options={["Mr.", "Mrs.", "Ms.", "Dr."]}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FieldWithCounter
                        form={form}
                        name="firstName"
                        label="First Name"
                        placeholder="Enter first name"
                        maxLength={50}
                      />
                      <FieldWithCounter
                        form={form}
                        name="lastName"
                        label="Last Name"
                        placeholder="Enter last name"
                        maxLength={50}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FieldWithCounter
                        form={form}
                        name="fathersName"
                        label="Father's Name"
                        placeholder="Enter father's name"
                        maxLength={100}
                      />
                      <FieldWithCounter
                        form={form}
                        name="fathersNameB"
                        label="Father's Name (Bangla)"
                        placeholder="পিতার নাম"
                        maxLength={100}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FieldWithCounter
                        form={form}
                        name="mothersName"
                        label="Mother's Name"
                        placeholder="Enter mother's name"
                        maxLength={100}
                      />
                      <FieldWithCounter
                        form={form}
                        name="mothersNameB"
                        label="Mother's Name (Bangla)"
                        placeholder="মাতার নাম"
                        maxLength={100}
                      />
                    </div>
                    <SmartRadioGroup
                      form={form}
                      name="gender"
                      label="Gender"
                      options={["Male", "Female", "Other"]}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                placeholder="Select date of birth"
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                      <FieldWithCounter
                        form={form}
                        name="nid"
                        label="NID"
                        placeholder="Enter NID number"
                        maxLength={30}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FieldWithCounter
                        form={form}
                        name="birthRegNo"
                        label="Birth Registration No"
                        placeholder="Enter birth reg. no"
                        maxLength={30}
                      />
                      <FieldWithCounter
                        form={form}
                        name="townOfBirth"
                        label="Town of Birth"
                        placeholder="Enter town of birth"
                        maxLength={30}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FieldWithCounter
                        form={form}
                        name="regionOfBirth"
                        label="Region of Birth"
                        placeholder="Enter region"
                        maxLength={30}
                      />
                      <FieldWithCounter
                        form={form}
                        name="countryOfBirth"
                        label="Country of Birth"
                        placeholder="Enter country"
                        maxLength={30}
                      />
                    </div>
                    <SmartRadioGroup
                      form={form}
                      name="maritalStatus"
                      label="Marital Status"
                      options={MARITAL_STATUS_OPTIONS}
                    />
                    <FieldWithCounter
                      form={form}
                      name="nationality"
                      label="Nationality"
                      placeholder="Enter nationality"
                      maxLength={30}
                    />
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
                    <FieldWithCounter
                      form={form}
                      name="empNo"
                      label="Employee Number"
                      placeholder="Enter employee number"
                      maxLength={20}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="effectiveStartDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">
                              Effective Start Date *
                            </FormLabel>
                            <FormControl>
                              <DatePicker
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="Select start date"
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="effectiveEndDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            Effective End Date *
                          </FormLabel>
                          <FormControl>
                            <DatePicker
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Select end date"
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
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={personTypesLoading}
                          >
                            <FormControl>
                              <SelectTrigger
                                className={cn(
                                  field.value && "border-emerald-500/50",
                                )}
                              >
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
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                    <SmartRadioGroup
                      form={form}
                      name="regDisability"
                      label="Registered Disability"
                      options={REG_DISABILITY_OPTIONS}
                    />
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
                        form.setValue("gradeId", "", { shouldValidate: false });
                      }}
                    />
                    <PositionComboboxField
                      form={form}
                      filteredPositions={filteredPositions}
                      selectedOrgId={selectedOrgId}
                      orgPositionsLoading={orgPositionsLoading}
                      grades={grades}
                    />
                    <FormField
                      control={form.control}
                      name="gradeId"
                      render={({ field }) => {
                        const selectedGrade = grades.find(
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
                                  value={
                                    selectedGrade ? selectedGrade.GRADE : ""
                                  }
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
                    <FieldWithCounter
                      form={form}
                      name="payrollId"
                      label="Payroll ID"
                      placeholder="Enter payroll ID"
                      maxLength={30}
                    />
                    <ComboboxField
                      form={form}
                      name="shiftId"
                      label="Shift"
                      items={shifts}
                      idKey="SHIFT_ID"
                      nameKey="NAME"
                      placeholder={
                        shiftsLoading ? "Loading..." : "Select shift"
                      }
                      disabled={shiftsLoading}
                      renderItem={(shift) => (
                        <div className="flex flex-col">
                          <span className="font-medium">{shift.NAME}</span>
                          <span className="text-xs text-muted-foreground">
                            {shift.CODE} · {shift.START_TIME} – {shift.END_TIME}
                          </span>
                        </div>
                      )}
                    />
                    {/* Location */}
                    <ComboboxField
                      form={form}
                      name="locationId"
                      label="Location"
                      items={locations}
                      idKey="ID"
                      nameKey="LOCATION_NAME"
                      placeholder={
                        locationsLoading ? "Loading..." : "Select location"
                      }
                      disabled={locationsLoading}
                    />

                    {/* Supervisor */}
                    <FormField
                      control={form.control}
                      name="supervisorId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            Supervisor
                          </FormLabel>
                          <Popover open={supOpen} onOpenChange={setSupOpen}>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  type="button"
                                  variant="outline"
                                  role="combobox"
                                  className={cn(
                                    "w-full justify-between font-normal px-2",
                                    !selectedSupervisor &&
                                      "text-muted-foreground",
                                  )}
                                >
                                  {selectedSupervisor ? (
                                    <div className="flex items-center gap-2 min-w-0">
                                      <Avatar className="h-5 w-5 shrink-0">
                                        <AvatarImage
                                          src={`${import.meta.env.VITE_API_BASE_URL}/api/emp-images/person/${selectedSupervisor.employeeId}`}
                                        />
                                        <AvatarFallback
                                          className={cn(
                                            "text-[10px] font-semibold text-white",
                                            getAvatarColor(
                                              selectedSupervisor.name,
                                            ),
                                          )}
                                        >
                                          {selectedSupervisor.name
                                            ?.split(" ")
                                            .map((n) => n[0])
                                            .join("")
                                            .slice(0, 2)
                                            .toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="truncate text-sm text-foreground">
                                        {selectedSupervisor.name}
                                      </span>
                                      <span className="text-xs text-muted-foreground shrink-0">
                                        ({selectedSupervisor.empNo})
                                      </span>
                                      {selectedSupervisor.role && (
                                        <Badge
                                          variant="outline"
                                          className="text-[10px] shrink-0"
                                        >
                                          {selectedSupervisor.role}
                                        </Badge>
                                      )}
                                    </div>
                                  ) : (
                                    <span>Search by name or emp no...</span>
                                  )}
                                  <div className="flex items-center gap-0.5 ml-1 shrink-0">
                                    {selectedSupervisor && (
                                      <span
                                        role="button"
                                        className="rounded p-0.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedSupervisor(null);
                                          setSupSearch("");
                                          field.onChange(undefined);
                                        }}
                                      >
                                        <IconX className="h-3.5 w-3.5" />
                                      </span>
                                    )}
                                    <ChevronsUpDown className="h-4 w-4 opacity-50" />
                                  </div>
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-[420px] p-0"
                              align="start"
                            >
                              <Command shouldFilter={false}>
                                <CommandInput
                                  placeholder="Type 2+ characters..."
                                  value={supSearch}
                                  onValueChange={setSupSearch}
                                />
                                <CommandList>
                                  {supFetching && (
                                    <div className="flex items-center justify-center py-4">
                                      <Spinner className="h-4 w-4" />
                                    </div>
                                  )}
                                  {!supFetching && supSearch.length < 2 && (
                                    <CommandEmpty>
                                      Type at least 2 characters to search.
                                    </CommandEmpty>
                                  )}
                                  {!supFetching &&
                                    supSearch.length >= 2 &&
                                    supervisors.length === 0 && (
                                      <CommandEmpty>
                                        No supervisors found.
                                      </CommandEmpty>
                                    )}
                                  {!supFetching && supervisors.length > 0 && (
                                    <CommandGroup>
                                      {supervisors.map((sup) => (
                                        <CommandItem
                                          key={sup.id}
                                          value={String(sup.id)}
                                          onSelect={() => {
                                            setSelectedSupervisor(sup);
                                            field.onChange(sup.employeeId);
                                            setSupOpen(false);
                                            setSupSearch("");
                                          }}
                                        >
                                          <Avatar className="h-6 w-6 shrink-0 mr-2">
                                            <AvatarImage
                                              src={`${import.meta.env.VITE_API_BASE_URL}/api/emp-images/person/${sup.employeeId}`}
                                            />
                                            <AvatarFallback
                                              className={cn(
                                                "text-[10px] font-semibold text-white",
                                                getAvatarColor(sup.name),
                                              )}
                                            >
                                              {sup.name
                                                ?.split(" ")
                                                .map((n) => n[0])
                                                .join("")
                                                .slice(0, 2)
                                                .toUpperCase()}
                                            </AvatarFallback>
                                          </Avatar>
                                          <span className="truncate">
                                            {sup.name}
                                          </span>
                                          {sup.role && (
                                            <Badge
                                              variant="outline"
                                              className="ml-2 text-xs shrink-0"
                                            >
                                              {sup.role}
                                            </Badge>
                                          )}
                                          <span className="ml-auto text-xs text-muted-foreground shrink-0 pl-2">
                                            {sup.empNo}
                                          </span>
                                          <Check
                                            className={cn(
                                              "ml-2 h-4 w-4 shrink-0",
                                              selectedSupervisor?.id === sup.id
                                                ? "opacity-100"
                                                : "opacity-0",
                                            )}
                                          />
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  )}
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="assignmentEffectiveStartDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">
                              Assignment Start Date *
                            </FormLabel>
                            <FormControl>
                              <DatePicker
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="Select start date"
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
                              Assignment End Date *
                            </FormLabel>
                            <FormControl>
                              <DatePicker
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="Select end date"
                              />
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
                    <AddressFields form={form} prefix="presentAddress" />
                  </SectionCard>
                  <div className="flex items-center gap-3 p-4 rounded-xl border border-border/60 bg-card">
                    <Switch
                      id="same-address"
                      checked={sameAsPresent}
                      onCheckedChange={handleSameAsPresent}
                    />
                    <div>
                      <Label
                        htmlFor="same-address"
                        className="text-sm font-medium cursor-pointer flex items-center gap-2"
                      >
                        <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                        Permanent address same as present address
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Toggle to copy all present address fields
                      </p>
                    </div>
                  </div>
                  <SectionCard
                    title="Permanent Address"
                    icon={Home}
                    gradient="from-rose-500/80 to-pink-600/80"
                    fieldCount={8}
                    filledCount={0}
                  >
                    <AddressFields
                      form={form}
                      prefix="permanentAddress"
                      disabled={sameAsPresent}
                    />
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
                    mode="add"
                  />
                </SectionCard>
              </div>
            </div>
          </div>

          {/* Validation errors */}
          {Object.keys(form.formState.errors).length > 0 &&
            currentStep === STEPS.length - 1 && (
              <div className="px-6 mt-4 mb-6">
                <ErrorSummary errors={form.formState.errors} />
              </div>
            )}

          {/* Sticky Bottom Bar */}
          <div className="sticky bottom-0 left-0 right-0 z-10 border-t border-border/60 bg-background/95 backdrop-blur-md shadow-2xl">
            <div className="max-w-screen-xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                {submitStatus === "error" && (
                  <div className="flex items-center gap-2 text-destructive text-sm">
                    <XCircle className="w-4 h-4 shrink-0" />
                    <span className="truncate">{statusMessage}</span>
                  </div>
                )}
                {submitStatus === "success" && newPersonId && (
                  <div className="flex items-center gap-2 text-emerald-600 text-sm">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span>{statusMessage}</span>
                    <Link
                      to="/core-hr/employees"
                      className="underline font-medium"
                    >
                      View Employees
                    </Link>
                    <Link
                      to={`/core-hr/employee-management/employee-details/${newPersonId}`}
                      className="underline font-medium"
                    >
                      View Details
                    </Link>
                  </div>
                )}
                {!submitStatus && (
                  <p className="text-xs text-muted-foreground">
                    Step {currentStep + 1} of {STEPS.length} —{" "}
                    {STEPS[currentStep].label}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2.5 shrink-0">
                {currentStep > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    className="gap-1.5"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </Button>
                )}
                {currentStep < STEPS.length - 1 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="gap-1.5 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 border-0 shadow-lg shadow-violet-500/25"
                  >
                    Continue
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={form.handleSubmit(onSubmit, handleFormError)}
                    disabled={createEmployeeMutation.isPending}
                    className="gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border-0 shadow-lg shadow-emerald-500/25"
                  >
                    {createEmployeeMutation.isPending ? (
                      <>
                        <Spinner className="h-4 w-4" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Create Employee
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </form>
      </Form>
    </PageContainer>
  );
}
