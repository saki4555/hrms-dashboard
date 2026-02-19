import React, { useState } from "react";
import {
  BriefcaseIcon,
  IdCard,
  UserPlus,
  CheckCircle,
  XCircle,
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

const employeeSchema = z.object({
  // Employee Number
  empNo: z
    .string({
      required_error: "Employee number is required",
      invalid_type_error: "Employee number must be a string",
    })
    .min(1, "Employee number is required")
    .trim(),

  // Basic Information
  title: z
    .string({
      required_error: "Title is required",
      invalid_type_error: "Title must be a string",
    })
    .min(1, "Title is required")
    .trim(),

  firstName: z
    .string({
      required_error: "First name is required",
      invalid_type_error: "First name must be a string",
    })
    .min(1, "First name is required")
    .trim(),

  lastName: z
    .string({
      required_error: "Last name is required",
      invalid_type_error: "Last name must be a string",
    })
    .min(1, "Last name is required")
    .trim(),

  fathersName: z
    .string({
      required_error: "Father's name is required",
      invalid_type_error: "Father's name must be a string",
    })
    .min(1, "Father's name is required")
    .trim(),

  fathersNameB: z
    .string({
      required_error: "Father's name (Bangla) is required",
      invalid_type_error: "Father's name (Bangla) must be a string",
    })
    .min(1, "Father's name (Bangla) is required")
    .trim(),

  mothersName: z
    .string({
      required_error: "Mother's name is required",
      invalid_type_error: "Mother's name must be a string",
    })
    .min(1, "Mother's name is required")
    .trim(),

  mothersNameB: z
    .string({
      required_error: "Mother's name (Bangla) is required",
      invalid_type_error: "Mother's name (Bangla) must be a string",
    })
    .min(1, "Mother's name (Bangla) is required")
    .trim(),

  gender: z
    .string({
      required_error: "Gender is required",
      invalid_type_error: "Gender must be a string",
    })
    .min(1, "Gender is required")
    .trim(),

  dateOfBirth: z.date({
    required_error: "Date of birth is required",
    invalid_type_error: "Invalid date format for date of birth",
  }),

  // Personal Information
  nid: z
    .string({
      required_error: "NID is required",
      invalid_type_error: "NID must be a string",
    })
    .min(1, "NID is required")
    .trim(),

  birthRegNo: z
    .string({
      required_error: "Birth registration number is required",
      invalid_type_error: "Birth registration number must be a string",
    })
    .min(1, "Birth registration number is required")
    .trim(),

  townOfBirth: z
    .string({
      required_error: "Town of birth is required",
      invalid_type_error: "Town of birth must be a string",
    })
    .min(1, "Town of birth is required")
    .trim(),

  regionOfBirth: z
    .string({
      required_error: "Region of birth is required",
      invalid_type_error: "Region of birth must be a string",
    })
    .min(1, "Region of birth is required")
    .trim(),

  countryOfBirth: z
    .string({
      required_error: "Country of birth is required",
      invalid_type_error: "Country of birth must be a string",
    })
    .min(1, "Country of birth is required")
    .trim(),

  maritalStatus: z
    .string({
      required_error: "Marital status is required",
      invalid_type_error: "Marital status must be a string",
    })
    .min(1, "Marital status is required")
    .trim(),

  nationality: z
    .string({
      required_error: "Nationality is required",
      invalid_type_error: "Nationality must be a string",
    })
    .min(1, "Nationality is required")
    .trim(),

  // Employment Information
  joinDate: z.date({
    required_error: "Join date is required",
    invalid_type_error: "Invalid date format for join date",
  }),

  personTypeId: z
    .string({
      required_error: "Person type is required",
      invalid_type_error: "Person type must be a string",
    })
    .min(1, "Person type is required")
    .trim(),

  regDisability: z
    .string({
      required_error: "Registered disability is required",
      invalid_type_error: "Registered disability must be a string",
    })
    .min(1, "Registered disability is required")
    .trim(),

  effectiveStartDate: z.date({
    required_error: "Effective start date is required",
    invalid_type_error: "Invalid date format for effective start date",
  }),

  effectiveEndDate: z.date().optional(),
});

export default function AddEmployeePageOld() {
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
    },
  });

  const onSubmit = async (data) => {
    console.log("Form submitted!", data);

    try {
      // Reset status
      setSubmitStatus(null);
      setStatusMessage("");

      // Format dates using date-fns
      const formatDate = (date) => {
        return date ? format(date, "yyyy-MM-dd") : null;
      };

      const payload = {
        EMP_NO: data.empNo,
        TITLE: data.title,
        FIRST_NAME: data.firstName,
        LAST_NAME: data.lastName,
        FATHERS_NAME: data.fathersName,
        FATHERS_NAME_B: data.fathersNameB,
        MOTHERS_NAME: data.mothersName,
        MOTHERS_NAME_B: data.mothersNameB,
        GENDER: data.gender,
        DATE_OF_BIRTH: formatDate(data.dateOfBirth),
        NID: data.nid,
        BIRTH_REG_NO: data.birthRegNo,
        TOWN_OF_BIRTH: data.townOfBirth,
        REGION_OF_BIRTH: data.regionOfBirth,
        COUNTRY_OF_BIRTH: data.countryOfBirth,
        MARRITIAL_STATUS: parseInt(data.maritalStatus),
        NATIONALITY: data.nationality,
        JOIN_DATE: formatDate(data.joinDate),
        PERSON_TYPE_ID: parseInt(data.personTypeId),
        REG_DISABILITY: parseInt(data.regDisability),
        EFFECTIVE_START_DATE: formatDate(data.effectiveStartDate),
        EFFECTIVEEND_DATE: data.effectiveEndDate ? formatDate(data.effectiveEndDate) : null,
      };

      console.log("Sending to backend:", payload);

      await createEmployeeMutation.mutateAsync(payload);

      // Show success message
      setSubmitStatus("success");
      setStatusMessage("Employee created successfully!");

      // Reset form
      form.reset();
    } catch (error) {
      console.error("Error creating employee:", error);
      setSubmitStatus("error");
      setStatusMessage(
        error?.message || "Failed to create employee. Please try again.",
      );
    }
  };

  // Add this to check form errors
  const handleFormError = (errors) => {
    console.log("Form validation errors:", errors);
    setSubmitStatus("error");
    setStatusMessage("Please fill in all required fields correctly.");
  };

  return (
    <>
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-semibold tracking-tight text-gray-800 dark:text-gray-100 mb-8 flex items-center gap-2">
          <span className="p-2 rounded-md shadow-sm bg-primary/10 text-primary">
            <UserPlus className="w-6 h-6" />
          </span>
          <span className="font-medium">Create Employee</span>
        </h1>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit, handleFormError)}
            className=""
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* left column */}
              <div className="space-y-6">
                {/* Personal Information */}
                <Accordion
                  type="single"
                  collapsible
                  defaultValue="personal"
                  className="bg-card/70 p-4 rounded-md shadow-sm border"
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
                        {/* Title - Radio Group */}
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
                                  className="flex flex-row gap-4 "
                                >
                                  <div className="flex items-center space-x-1">
                                    <RadioGroupItem value="Mr." id="mr" />
                                    <Label htmlFor="mr">Mr.</Label>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <RadioGroupItem value="Mrs." id="mrs" />
                                    <Label htmlFor="mrs">Mrs.</Label>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <RadioGroupItem value="Ms." id="ms" />
                                    <Label htmlFor="ms">Ms.</Label>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <RadioGroupItem value="Dr." id="dr" />
                                    <Label htmlFor="dr">Dr.</Label>
                                  </div>
                                </RadioGroup>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* First Name & Last Name */}
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

                        {/* Father's Name & Father's Name Bangla */}
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

                        {/* Mother's Name & Mother's Name Bangla */}
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

                        {/* Gender - Radio Group */}
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
                                  <div className="flex items-center space-x-1">
                                    <RadioGroupItem value="Male" id="male" />
                                    <Label htmlFor="male">Male</Label>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <RadioGroupItem
                                      value="Female"
                                      id="female"
                                    />
                                    <Label htmlFor="female">Female</Label>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <RadioGroupItem value="Other" id="other" />
                                    <Label htmlFor="other">Other</Label>
                                  </div>
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

                        {/* Birth Registration No & Town of Birth */}
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

                        {/* Region of Birth & Country of Birth */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="regionOfBirth"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Region of Birth *</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Enter region"
                                    {...field}
                                  />
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
                                  <Input
                                    placeholder="Enter country"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Marital Status - Radio Group */}
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
                                  className="flex flex-row gap-3"
                                >
                                  {MARITAL_STATUS_OPTIONS.map((option) => (
                                    <div
                                      key={option.value}
                                      className="flex items-center flex-wrap space-x-1"
                                    >
                                      <RadioGroupItem
                                        value={option.value}
                                        id={`marital-${option.value}`}
                                      />
                                      <Label
                                        htmlFor={`marital-${option.value}`}
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
              </div>

              {/* right column */}
              <div className="space-y-6">
                {/* Employment Information */}
                <Accordion
                  type="single"
                  collapsible
                  defaultValue="employment"
                  className="bg-card/70 p-4 rounded-md shadow-sm border"
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
                              <FormLabel>Effective End Date</FormLabel>
                              <FormControl>
                                <DatePicker
                                  value={field.value}
                                  onChange={field.onChange}
                                  placeholder="Select effective end date (optional)"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Person Type - Radio Group */}
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
                                  className="flex flex-row gap-x-3  flex-wrap"
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

                        {/* Registered Disability - Radio Group */}
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
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col items-end gap-3 mt-6">
              {/* Show validation errors summary */}
              {Object.keys(form.formState.errors).length > 0 && (
                <Alert variant="destructive" className="w-full">
                  <AlertDescription className="flex items-center gap-2">
                    <XCircle className="h-4 w-4" />
                    <div>
                      <p className="font-medium">
                        Please fix the following errors:
                      </p>
                      <ul className="list-disc list-inside mt-1 text-sm">
                        {Object.entries(form.formState.errors).map(
                          ([key, error]) => (
                            <li key={key}>{error.message}</li>
                          ),
                        )}
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {submitStatus && (
                <Alert
                  variant={
                    submitStatus === "success" ? "default" : "destructive"
                  }
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
                        href="http://localhost:5173/core-hr/employees"
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
      </div>
    </>
  );
}