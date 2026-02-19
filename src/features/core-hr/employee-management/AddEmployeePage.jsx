import React, { useState } from "react";
import {
  BriefcaseIcon,
  IdCard,
  UserPlus,
  CheckCircle,
  XCircle,
  MapPin,
  Home,
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
  MARITAL_STATUS_OPTIONS,
  REG_DISABILITY_OPTIONS,
} from "@/lib/constants/employeeOptions";
import { DatePicker } from "@/components/DatePicker";
import { usePersonTypes } from "../hooks/usePersonTypes";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Spinner } from "@/components/ui/spinner";
import { useCreateEmployee } from "./queries";
import PageContainer from "@/components/page-container";
import { Link } from "react-router";

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
    companyId: z.string().min(1, "Company ID is required").trim(),
    ouId: z.string().min(1, "OU ID is required").trim(),
    orgId: z.string().min(1, "Org ID is required").trim(),
    positionId: z.string().min(1, "Position ID is required").trim(),
    payrollId: z.string().min(1, "Payroll ID is required").trim(),
    gradeId: z.string().min(1, "Grade ID is required").trim(),
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
function AddressFields({ form, prefix }) {
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
                <Input placeholder="Enter address" {...field} />
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
                <Input placeholder="ঠিকানা লিখুন" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name={`${prefix}.country`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Country *</FormLabel>
              <FormControl>
                <Input placeholder="Enter country" {...field} />
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
                <Input placeholder="Enter region" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name={`${prefix}.district`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>District *</FormLabel>
              <FormControl>
                <Input placeholder="Enter district" {...field} />
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
                <Input placeholder="Enter upazilla" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name={`${prefix}.unions`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Union *</FormLabel>
              <FormControl>
                <Input placeholder="Enter union" {...field} />
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
                <Input placeholder="Enter area" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

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

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AddEmployeePage() {
  const { data: personTypes = [] } = usePersonTypes();
  const createEmployeeMutation = useCreateEmployee();
  const [submitStatus, setSubmitStatus] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");

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

  const fd = (date) => (date ? format(date, "yyyy-MM-dd") : null);

  const onSubmit = async (data) => {
    try {
      setSubmitStatus(null);
      setStatusMessage("");

      // ── Payload shaped exactly as the backend expects ──────────────────────
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

        // Nested under "address" with "present" and "permanent" keys
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
          POSITION_ID: parseInt(data.positionId),
          PAYROLL_ID: parseInt(data.payrollId),
          GRADE_ID: parseInt(data.gradeId),
          EFFECTIVE_START_DATE: fd(data.assignmentEffectiveStartDate),
          EFFECTIVE_END_DATE: fd(data.assignmentEffectiveEndDate),
        },
      };

      console.log("Sending to backend:", payload);
      await createEmployeeMutation.mutateAsync(payload);

      setSubmitStatus("success");
      setStatusMessage("Employee created successfully!");
      form.reset();
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

  // Flatten nested zod errors for the summary panel
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
    <PageContainer className="px-6">
      <header className="mb-8 bg-card p-4 rounded-md  shadow-xs  ">
        

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 border border-primary/10 bg-primary/10 rounded-md shadow-xs">
              <UserPlus className="w-6 h-6  text-primary" />
            </div>

            <div className="space-y-0.5">
              <h1 className="text-xl md:text-2xl font-semibold  tracking-tight">
                New Employee Onboarding
              </h1>
             <Breadcrumb>
                <BreadcrumbList className="text-[11px] uppercase tracking-widest font-medium">
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink asChild>
                      <Link to="/">Dashboard</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
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
          <div className="grid grid-cols-1  md:grid-cols-2 gap-5">
            {/* ── LEFT COLUMN ── Personal Info + Present Address ───────────── */}
            <div className="space-y-6">
              {/* Personal Information */}
              <Accordion
                type="single"
                collapsible
                defaultValue="personal"
                className="bg-card/70 px-4  rounded-md shadow-sm "
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

                      {/* First & Last Name */}
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

                      {/* Father's Name */}
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

                      {/* Mother's Name */}
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

                      {/* Gender */}
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

                      {/* Date of Birth & NID */}
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

                      {/* Birth Reg No & Town of Birth */}
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

                      {/* Region & Country of Birth */}
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

                      {/* Marital Status */}
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

                      {/* Nationality */}
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

                      {/* Person Type */}
                      <FormField
                        control={form.control}
                        name="personTypeId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Person Type *</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                value={field.value}
                                className="flex flex-row gap-x-3 flex-wrap"
                              >
                                {personTypes.map((type) => (
                                  <div
                                    key={type.PERSON_TYPE_ID}
                                    className="flex items-center space-x-2"
                                  >
                                    <RadioGroupItem
                                      value={type.PERSON_TYPE_ID.toString()}
                                      id={`person-type-${type.PERSON_TYPE_ID}`}
                                    />
                                    <Label
                                      htmlFor={`person-type-${type.PERSON_TYPE_ID}`}
                                    >
                                      {type.PERSON_TYPE}
                                    </Label>
                                  </div>
                                ))}
                              </RadioGroup>
                            </FormControl>
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
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="companyId"
                              render={({ field }) => (
                                <FormItem>
                                  {/* TODO: Replace with company Select fetched from backend */}
                                  <FormLabel>Company ID *</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Enter company ID"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="ouId"
                              render={({ field }) => (
                                <FormItem>
                                  {/* TODO: Replace with OU Select fetched from backend */}
                                  <FormLabel>OU ID *</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Enter OU ID"
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
                              name="orgId"
                              render={({ field }) => (
                                <FormItem>
                                  {/* TODO: Replace with Organization Select fetched from backend */}
                                  <FormLabel>Org ID *</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Enter org ID"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="positionId"
                              render={({ field }) => (
                                <FormItem>
                                  {/* TODO: Replace with Position Select fetched from backend */}
                                  <FormLabel>Position ID *</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Enter position ID"
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
                              name="payrollId"
                              render={({ field }) => (
                                <FormItem>
                                  {/* TODO: Replace with Payroll Select fetched from backend */}
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
                            <FormField
                              control={form.control}
                              name="gradeId"
                              render={({ field }) => (
                                <FormItem>
                                  {/* TODO: Replace with Grade Select fetched from backend */}
                                  <FormLabel>Grade ID *</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Enter grade ID"
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

            {submitStatus && (
              <Alert
                variant={submitStatus === "success" ? "default" : "destructive"}
                className="w-full md:w-auto"
              >
                <AlertDescription className="flex items-center gap-2">
                  {submitStatus === "success" ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  {statusMessage}
                  {submitStatus === "success" && (
                    <a
                      href="/core-hr/employees"
                      className="ml-2 underline font-medium hover:no-underline"
                    >
                      View Employees
                    </a>
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
