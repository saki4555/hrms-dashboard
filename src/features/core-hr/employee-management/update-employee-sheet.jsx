import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import {
  BriefcaseIcon,
  IdCard,
  CheckCircle,
  XCircle,
  FileEditIcon,
  Plus,
} from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
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
import { useUpdateEmployee, useCreateEmployee } from "./queries";
import { toast } from "sonner";

const employeeSchema = z.object({
  empNo: z.string().min(1, "Employee number is required").trim(),
  title: z.string().min(1, "Title is required").trim(),
  firstName: z.string().min(1, "First name is required").trim(),
  lastName: z.string().min(1, "Last name is required").trim(),
  fathersName: z.string().min(1, "Father's name is required").trim(),
  fathersNameB: z.string().min(1, "Father's name (Bangla) is required").trim(),
  mothersName: z.string().min(1, "Mother's name is required").trim(),
  mothersNameB: z.string().min(1, "Mother's name (Bangla) is required").trim(),
  gender: z.string().min(1, "Gender is required").trim(),
  dateOfBirth: z.date({
    required_error: "Date of birth is required",
  }),
  nid: z.string().min(1, "NID is required").trim(),
  birthRegNo: z.string().min(1, "Birth registration number is required").trim(),
  townOfBirth: z.string().min(1, "Town of birth is required").trim(),
  regionOfBirth: z.string().min(1, "Region of birth is required").trim(),
  countryOfBirth: z.string().min(1, "Country of birth is required").trim(),
  maritalStatus: z.string().min(1, "Marital status is required").trim(),
  nationality: z.string().min(1, "Nationality is required").trim(),
  joinDate: z.date({
    required_error: "Join date is required",
  }),
  personTypeId: z.string().min(1, "Person type is required").trim(),
  regDisability: z.string().min(1, "Registered disability is required").trim(),
  effectiveStartDate: z.date({
    required_error: "Effective start date is required",
  }),
  effectiveEndDate: z.date().optional(),
});

export default function UpdateEmployeeSheet({
  open,
  onOpenChange,
  employee,
  showConfirmation,
}) {
  const { data: personTypes = [] } = usePersonTypes();
  const updateEmployeeMutation = useUpdateEmployee();
  const createEmployeeMutation = useCreateEmployee();
  const [submissionType, setSubmissionType] = useState(null);
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

  const { formState: { isDirty } } = form;
  const isSubmitting = submissionType !== null;

  // Parse date from API response
  const parseDate = (dateString) => {
    if (!dateString) return undefined;
    return new Date(dateString);
  };

  // Populate form when employee data is loaded
  useEffect(() => {
    if (employee && open) {
      console.log("Populating form with employee data:", employee);
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
      });
    }
  }, [employee, open, form]);

  const handleFormSubmit = async (data, operationType) => {
    try {
      setSubmissionType(operationType);
      setSubmitStatus(null);
      setStatusMessage("");

      const formatDate = (date) => {
        return date ? format(date, "yyyy-MM-dd") : null;
      };

      const basePayload = {
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

      if (operationType === "update") {
        // CREATE new record (POST) - matches AddEmployeePage payload exactly
        console.log(`Creating new employee record:`, basePayload);
        await createEmployeeMutation.mutateAsync(basePayload);
      } else {
        // UPDATE existing record (PUT) - includes STATUS and LAST_UPDATE_BY
        const updatePayload = {
          ...basePayload,
          STATUS: employee.STATUS,
          LAST_UPDATE_BY: 101, // TODO: Replace with actual user ID
        };
        console.log(`Updating existing employee record:`, updatePayload);
        await updateEmployeeMutation.mutateAsync({
          personId: employee.PERSON_ID,
          data: updatePayload,
        });
      }

      toast.success(`Employee ${operationType === 'correction' ? 'corrected' : 'updated'} successfully!`);
      onOpenChange(false);
    } catch (error) {
      console.error(`Error ${operationType} employee:`, error);
      setSubmitStatus("error");
      setStatusMessage(
        error?.message || `Failed to ${operationType} employee. Please try again.`
      );
      toast.error(error?.message || `Failed to ${operationType} employee.`);
    } finally {
      setSubmissionType(null);
    }
  };

  const handleUpdateClick = async () => {
    // First check if form is valid
    const isValid = await form.trigger();

    if (!isValid) {
      return;
    }

    // Show confirmation
    const confirmed = await showConfirmation({
      title: "Update Employee?",
      description: "Updating will archive the current record and create a new one. Are you sure?",
      confirmText: "Yes, Update",
      cancelText: "Cancel",
    });

    if (!confirmed) {
      toast.info("Update cancelled.");
      return;
    }

    // If confirmed, proceed with update
    const formData = form.getValues();
    await handleFormSubmit(formData, "update");
  };

  const handleFormError = (errors) => {
    console.log("Form validation errors:", errors);
    setSubmitStatus("error");
    setStatusMessage("Please fill in all required fields correctly.");
  };

  const handleClose = async () => {
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
    setSubmitStatus(null);
    setStatusMessage("");
    setSubmissionType(null);
    onOpenChange(false);
  };

  return (
    <Sheet 
      open={open} 
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          handleClose();
        }
      }}
    >
      <SheetContent className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Update Employee</SheetTitle>
          <SheetDescription>
            Update employee information. Click save when you're done.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="mt-6 space-y-6"
          >
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
                                disabled={isSubmitting}
                                className="flex flex-row gap-4"
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

                      {/* Name Fields */}
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name *</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Enter first name" 
                                  disabled={isSubmitting}
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
                                  disabled={isSubmitting}
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Parents Names */}
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="fathersName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Father's Name *</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Enter father's name" 
                                  disabled={isSubmitting}
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
                                <Input 
                                  placeholder="পিতার নাম" 
                                  disabled={isSubmitting}
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="mothersName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mother's Name *</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Enter mother's name" 
                                  disabled={isSubmitting}
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
                                <Input 
                                  placeholder="মাতার নাম" 
                                  disabled={isSubmitting}
                                  {...field} 
                                />
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
                                disabled={isSubmitting}
                                className="flex flex-row gap-3"
                              >
                                <div className="flex items-center space-x-1">
                                  <RadioGroupItem value="Male" id="male" />
                                  <Label htmlFor="male">Male</Label>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <RadioGroupItem value="Female" id="female" />
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

                      {/* DOB and NID */}
                      <div className="grid grid-cols-2 gap-4">
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
                                  disabled={isSubmitting}
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
                                  disabled={isSubmitting}
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Birth Details */}
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="birthRegNo"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Birth Registration No *</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Enter birth reg. no" 
                                  disabled={isSubmitting}
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
                                  disabled={isSubmitting}
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="regionOfBirth"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Region of Birth *</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Enter region" 
                                  disabled={isSubmitting}
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
                                  disabled={isSubmitting}
                                  {...field} 
                                />
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
                                disabled={isSubmitting}
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
                                disabled={isSubmitting}
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
                                disabled={isSubmitting}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Dates */}
                      <div className="grid grid-cols-2 gap-4">
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
                                  disabled={isSubmitting}
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
                                  disabled={isSubmitting}
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
                                disabled={isSubmitting}
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
                                disabled={isSubmitting}
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
                                disabled={isSubmitting}
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
                                    <Label htmlFor={`disability-${option.value}`}>
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

              {/* Status Messages */}
              {submitStatus && (
                <Alert
                  variant={submitStatus === "success" ? "default" : "destructive"}
                >
                  <AlertDescription className="flex items-center gap-2">
                    {submitStatus === "success" ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    {statusMessage}
                  </AlertDescription>
                </Alert>
              )}

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={form.handleSubmit(
                    (data) => handleFormSubmit(data, "correction"),
                    handleFormError
                  )}
                  disabled={isSubmitting}
                  variant="default"
                >
                  {submissionType === "correction" ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FileEditIcon className="w-4 h-4 mr-2" />
                      Correction
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  onClick={handleUpdateClick}
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {submissionType === "update" ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Update
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
      </SheetContent>
    </Sheet>
  );
}