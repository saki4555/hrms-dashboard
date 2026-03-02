import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  BriefcaseIcon, IdCard, UserCog, CheckCircle, XCircle,
  MapPin, Home, ChevronRight, ChevronLeft, Copy, Sparkles, User, Building2, FileText,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addYears, format } from "date-fns";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/DatePicker";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { MARITAL_STATUS_OPTIONS, REG_DISABILITY_OPTIONS } from "@/lib/constants/employeeOptions";
import PageContainer from "@/components/page-container";
import { IconCirclePlus, IconEdit } from "@tabler/icons-react";

import { useCompanies } from "@/features/settings/work-structure/company/queries";
import { useOrganizations } from "@/features/settings/work-structure/organization/queries";
import { useOrgPositions } from "@/features/settings/work-structure/position/queries";
import { useGrades } from "@/features/settings/work-structure/hr-grade/queries";
import { usePersonTypes } from "../employee-types/queries";
import { useUpdateEmployee, useCreateEmployee, useEmployeeById } from "./queries";
import { useConfirmationDialog } from "@/hooks/useConfirmationDialog";

// Shared
import { employeeSchema } from "./employee-schema";
import { STEPS, fd, parseDate } from "./components/steps";
import { ProgressBar } from "./components/progress-bar";
import { SectionCard } from "./components/section-card";
import { FieldWithCounter } from "./components/field-with-counter";
import { SmartRadioGroup } from "./components/smart-radio-group";
import { ComboboxField } from "./components/combobox-field";
import { AddressFields } from "./components/address-fields";
import { PositionComboboxField } from "./components/position-combobox-field";
import { ErrorSummary } from "./components/error-summary";
import { ReviewStep } from "./components/review-step";

export default function UpdateEmployeePageModern() {
  console.log("UpdateEmployeePageModern");
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
  const [presentAddressIds, setPresentAddressIds] = useState({ countryId: null, regionId: null, districtId: null });
  const [permanentAddressIds, setPermanentAddressIds] = useState({ countryId: null, regionId: null, districtId: null });

  const isSubmitting = submissionType !== null;

  const { data: employee, isLoading, isError, error } = useEmployeeById(personId);
  const { data: personTypes = [], isLoading: personTypesLoading } = usePersonTypes();
  const { data: companies = [], isLoading: companiesLoading } = useCompanies();
  const { data: organizations = [], isLoading: organizationsLoading } = useOrganizations();
  const { data: orgPositions = [], isLoading: orgPositionsLoading } = useOrgPositions();
  const { data: grades = [] } = useGrades();

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
      presentAddress: { address1: "", address1B: "", country: "", region: "", district: "", upazilla: "", unions: "", area: "" },
      permanentAddress: { address1: "", address1B: "", country: "", region: "", district: "", upazilla: "", unions: "", area: "" },
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

    if (employee.assignment?.ORG_ID) setSelectedOrgId(employee.assignment.ORG_ID);

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
      positionId: "",
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

  // ── 2. Resolve positionId once orgPositions loads ─────────────────────────
  useEffect(() => {
    if (!formSeeded || !employee || orgPositions.length === 0) return;
    const assignedOrgPositionId = employee.assignment?.POSITION_ID?.toString() || "";
    const orgId = employee.assignment?.ORG_ID;
    if (!assignedOrgPositionId || !orgId) return;

    const match = orgPositions.find(
      (pos) => String(pos.ID) === assignedOrgPositionId && String(pos.ORG_ID) === String(orgId),
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

  const handleSameAsPresent = useCallback((checked) => {
    setSameAsPresent(checked);
    if (checked) {
      const present = form.getValues("presentAddress");
      Object.keys(present).forEach((key) => {
        form.setValue(`permanentAddress.${key}`, present[key], { shouldDirty: true });
      });
    }
  }, [form]);

  const allStepProgress = useMemo(() => {
    const values = form.getValues();
    return STEPS.map((step) => {
      if (!step || step.fields.length === 0) return { filled: 0, total: 0 };
      let filled = 0; let total = 0;
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

  const handleNext = async () => {
    const step = STEPS[currentStep];
    const fieldsToValidate = step.fields.flatMap((f) =>
      f === "presentAddress" || f === "permanentAddress"
        ? [`${f}.address1`, `${f}.address1B`, `${f}.country`, `${f}.region`, `${f}.district`, `${f}.upazilla`, `${f}.unions`, `${f}.area`, `${f}.effectiveStartDate`, `${f}.effectiveEndDate`]
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

  const handleFormSubmit = async (data, operationType) => {
    try {
      setSubmissionType(operationType);
      setSubmitStatus(null);
      setStatusMessage("");
      const payload = buildPayload(data);

      if (operationType === "correction") {
        await updateEmployeeMutation.mutateAsync({
          personId: employee.PERSON_ID,
          data: { ...payload, employee: { ...payload.employee, LAST_UPDATE_BY: 101 }, STATUS: employee.STATUS },
        });
        toast.success("Employee corrected successfully!");
        setSubmitStatus("success");
        setStatusMessage("Employee corrected successfully!");
      } else {
        const result = await createEmployeeMutation.mutateAsync(payload);
        setNewPersonId(result?.PERSON_ID || null);
        toast.success("Employee updated (new record created) successfully!");
        setSubmitStatus("success");
        setStatusMessage("Employee updated — new record created.");
      }
      setCompletedSteps(new Set([0, 1, 2, 3, 4]));
    } catch (err) {
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
      () => { setSubmitStatus("error"); setStatusMessage("Please fill in all required fields correctly."); },
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
      description: "This will archive the current record and create a new one. Are you sure you want to proceed?",
      confirmText: "Yes, Update",
      cancelText: "Cancel",
    });
    if (!confirmed) { toast.info("Update cancelled."); return; }
    await handleFormSubmit(form.getValues(), "update");
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
          <AlertDescription>{error?.message || "Failed to load employee data."}</AlertDescription>
        </Alert>
      </PageContainer>
    );
  }

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
                  <BreadcrumbLink asChild><Link to="/core-hr/employee-management">Employee Management</Link></BreadcrumbLink>
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

      <ProgressBar currentStep={currentStep} completedSteps={completedSteps} onStepClick={setCurrentStep} />

      <Form {...form}>
        <form onSubmit={(e) => e.preventDefault()}>
          <div className="px-6 mt-6">
            <div className="flex-1 min-w-0">

              {/* STEP 0: Personal */}
              <div className={cn(currentStep !== 0 && "hidden")}>
                <SectionCard title="Personal Information" icon={IdCard} gradient="from-violet-500/80 to-purple-600/80" fieldCount={STEPS[0].fields.length} filledCount={allStepProgress[0].filled}>
                  <div className="space-y-5">
                    <SmartRadioGroup form={form} name="title" label="Title" options={["Mr.", "Mrs.", "Ms.", "Dr."]} disabled={isSubmitting} />
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
                    <SmartRadioGroup form={form} name="gender" label="Gender" options={["Male", "Female", "Other"]} disabled={isSubmitting} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="dateOfBirth" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Date of Birth *</FormLabel>
                          <FormControl><DatePicker value={field.value} onChange={field.onChange} placeholder="Select date of birth" disabled={isSubmitting} /></FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )} />
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
                    <SmartRadioGroup form={form} name="maritalStatus" label="Marital Status" options={MARITAL_STATUS_OPTIONS} disabled={isSubmitting} />
                    <FieldWithCounter form={form} name="nationality" label="Nationality" placeholder="Enter nationality" maxLength={30} disabled={isSubmitting} />
                  </div>
                </SectionCard>
              </div>

              {/* STEP 1: Employment */}
              <div className={cn(currentStep !== 1 && "hidden")}>
                <SectionCard title="Employment Information" icon={BriefcaseIcon} gradient="from-blue-500/80 to-cyan-600/80" fieldCount={STEPS[1].fields.length} filledCount={allStepProgress[1].filled}>
                  <div className="space-y-5">
                    <FieldWithCounter form={form} name="empNo" label="Employee Number" placeholder="Enter employee number" maxLength={20} disabled={isSubmitting} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="joinDate" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Join Date *</FormLabel>
                          <FormControl><DatePicker value={field.value} onChange={field.onChange} placeholder="Select join date" disabled={isSubmitting} /></FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="effectiveStartDate" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Effective Start Date *</FormLabel>
                          <FormControl><DatePicker value={field.value} onChange={field.onChange} placeholder="Select start date" disabled={isSubmitting} /></FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )} />
                    </div>
                    <FormField control={form.control} name="effectiveEndDate" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Effective End Date *</FormLabel>
                        <FormControl><DatePicker value={field.value} onChange={field.onChange} placeholder="Select end date" disabled={isSubmitting} /></FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="personTypeId" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Person Type *</FormLabel>
                        <Select key={`person-type-${field.value}-${personTypes.length}`} onValueChange={field.onChange} value={field.value} disabled={isSubmitting || personTypesLoading}>
                          <FormControl>
                            <SelectTrigger className={cn(field.value && "border-emerald-500/50")}>
                              <SelectValue placeholder={personTypesLoading ? "Loading..." : "Select person type"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {personTypes.map((type) => (
                              <SelectItem key={type.PERSON_TYPE_ID} value={String(type.PERSON_TYPE_ID)}>{type.PERSON_TYPE}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )} />
                    <SmartRadioGroup form={form} name="regDisability" label="Registered Disability" options={REG_DISABILITY_OPTIONS} disabled={isSubmitting} />
                  </div>
                </SectionCard>
              </div>

              {/* STEP 2: Assignment */}
              <div className={cn(currentStep !== 2 && "hidden")}>
                <SectionCard title="Assignment" icon={Building2} gradient="from-emerald-500/80 to-teal-600/80" fieldCount={STEPS[2].fields.length} filledCount={allStepProgress[2].filled}>
                  <div className="space-y-5">
                    <ComboboxField form={form} name="companyId" label="Company" items={companies} idKey="COMPANY_ID" nameKey="COMPANY_NAME" placeholder={companiesLoading ? "Loading..." : "Select company"} disabled={isSubmitting || companiesLoading} />
                    <ComboboxField form={form} name="ouId" label="Operational Unit" items={organizations} idKey="ID" nameKey="NAME" placeholder={organizationsLoading ? "Loading..." : "Select operational unit"} disabled={isSubmitting || organizationsLoading} />
                    <ComboboxField form={form} name="orgId" label="Organization" items={organizations} idKey="ID" nameKey="NAME" placeholder={organizationsLoading ? "Loading..." : "Select organization"} disabled={isSubmitting || organizationsLoading}
                      onSelect={(org) => {
                        setSelectedOrgId(org.ID);
                        form.setValue("positionId", "", { shouldValidate: false });
                        form.setValue("orgPositionId", "", { shouldValidate: false });
                        form.setValue("gradeId", "", { shouldValidate: false });
                      }}
                    />
                    <PositionComboboxField form={form} filteredPositions={filteredPositions} selectedOrgId={selectedOrgId} orgPositionsLoading={orgPositionsLoading} grades={grades} disabled={isSubmitting} />
                    <FormField control={form.control} name="gradeId" render={({ field }) => {
                      const selectedGrade = grades.find((g) => String(g.ID) === String(field.value));
                      return (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Grade <span className="text-muted-foreground text-xs">(auto-filled)</span></FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input readOnly disabled value={selectedGrade ? selectedGrade.GRADE : ""} placeholder="Auto-filled from selected position" className="bg-muted/40 cursor-not-allowed pl-9" />
                              <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                            </div>
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      );
                    }} />
                    <FieldWithCounter form={form} name="payrollId" label="Payroll ID" placeholder="Enter payroll ID" maxLength={30} disabled={isSubmitting} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="assignmentEffectiveStartDate" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Assignment Start Date *</FormLabel>
                          <FormControl><DatePicker value={field.value} onChange={field.onChange} placeholder="Select start date" disabled={isSubmitting} /></FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="assignmentEffectiveEndDate" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Assignment End Date *</FormLabel>
                          <FormControl><DatePicker value={field.value} onChange={field.onChange} placeholder="Select end date" disabled={isSubmitting} /></FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )} />
                    </div>
                  </div>
                </SectionCard>
              </div>

              {/* STEP 3: Address */}
              <div className={cn(currentStep !== 3 && "hidden")}>
                <div className="space-y-5">
                  <SectionCard title="Present Address" icon={MapPin} gradient="from-orange-500/80 to-amber-600/80" fieldCount={8} filledCount={allStepProgress[3].filled}>
                    {formSeeded ? (
                      <AddressFields form={form} prefix="presentAddress" disabled={isSubmitting} initialCountryId={presentAddressIds.countryId} initialRegionId={presentAddressIds.regionId} initialDistrictId={presentAddressIds.districtId} />
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

                  <SectionCard title="Permanent Address" icon={Home} gradient="from-rose-500/80 to-pink-600/80" fieldCount={8} filledCount={0}>
                    {formSeeded ? (
                      <AddressFields form={form} prefix="permanentAddress" disabled={isSubmitting || sameAsPresent} initialCountryId={permanentAddressIds.countryId} initialRegionId={permanentAddressIds.regionId} initialDistrictId={permanentAddressIds.districtId} />
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
                <SectionCard title="Review & Submit" icon={FileText} gradient="from-rose-500/80 to-pink-600/80" fieldCount={0} filledCount={0}>
                  <ReviewStep form={form} personTypes={personTypes} companies={companies} organizations={organizations} grades={grades} mode="edit" />
                </SectionCard>
              </div>

            </div>
          </div>

          {/* Validation errors */}
          {Object.keys(form.formState.errors).length > 0 && currentStep === STEPS.length - 1 && (
            <div className="px-6 mt-4 mb-6">
              <ErrorSummary errors={form.formState.errors} />
            </div>
          )}

          {/* Sticky Bottom Bar */}
          <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/60 bg-background/95 backdrop-blur-md shadow-2xl">
            <div className="max-w-screen-xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                {submitStatus === "error" && (
                  <div className="flex items-center gap-2 text-destructive text-sm">
                    <XCircle className="w-4 h-4 shrink-0" /><span className="truncate">{statusMessage}</span>
                  </div>
                )}
                {submitStatus === "success" && (
                  <div className="flex items-center gap-2 text-emerald-600 text-sm flex-wrap">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span>{statusMessage}</span>
                    <Link to="/core-hr/employees" className="underline font-medium">View Employees</Link>
                    <Link to={`/core-hr/employee-management/employee-details/${newPersonId ?? personId}`} className="underline font-medium">View Details</Link>
                  </div>
                )}
                {!submitStatus && (
                  <p className="text-xs text-muted-foreground">Step {currentStep + 1} of {STEPS.length} — {STEPS[currentStep].label}</p>
                )}
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <Button type="button" variant="outline" onClick={() => navigate("/core-hr/employee-management")} disabled={isSubmitting}>Cancel</Button>
                {currentStep > 0 && (
                  <Button type="button" variant="outline" onClick={handleBack} disabled={isSubmitting} className="gap-1.5">
                    <ChevronLeft className="w-4 h-4" />Back
                  </Button>
                )}
                {currentStep < STEPS.length - 1 ? (
                  <Button type="button" onClick={handleNext} disabled={isSubmitting} className="gap-1.5 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 border-0 shadow-lg shadow-blue-500/25">
                    Continue<ChevronRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" onClick={handleCorrectionClick} disabled={isSubmitting} className="gap-1.5 border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                      {submissionType === "correction" ? <><Spinner className="h-4 w-4" />Processing...</> : <><IconEdit className="w-4 h-4" />Correction</>}
                    </Button>
                    <Button type="button" onClick={handleUpdateClick} disabled={isSubmitting} className="gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border-0 shadow-lg shadow-emerald-500/25">
                      {submissionType === "update" ? <><Spinner className="h-4 w-4" />Processing...</> : <><IconCirclePlus className="w-4 h-4" />Update</>}
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