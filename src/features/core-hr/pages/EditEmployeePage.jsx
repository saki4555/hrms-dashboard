import React, { useRef, useState } from "react";
import {
  BriefcaseIcon,
  FileEditIcon,
  HomeIcon,
  IdCard,
  MapPinIcon,
  Plus,
  UserPlus,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
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

import { toast } from "sonner";
import {
  MARITAL_STATUS_OPTIONS,
  REG_DISABILITY_OPTIONS,
} from "@/lib/constants/employeeOptions";
import { DatePicker } from "@/components/DatePicker";
import { usePersonTypes } from "../hooks/usePersonTypes";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useNavigate, useParams } from "react-router";
import { useEmployee } from "../hooks/useEmployee";
import { useConfirmationPopover } from "../hooks/useConfirmationPopover";

const employeeSchema = z.object({
  // Basic Information
  title: z
    .string({
      invalid_type_error: "Title must be a string",
    })
    .min(1, "Title is required")
    .trim(),

  firstName: z
    .string({
      required_error: "First name is required",
      invalid_type_error: "First name must be a string",
    })
    .min(1, "First name cannot be empty")
    .trim(),

  lastName: z
    .string({
      required_error: "Last name is required",
      invalid_type_error: "Last name must be a string",
    })
    .min(1, "Last name cannot be empty")
    .trim(),

  fathersName: z
    .string({
      required_error: "Father's name is required",
      invalid_type_error: "Father's name must be a string",
    })
    .min(1, "Father's name cannot be empty")
    .trim(),

  fathersNameB: z.string().trim().optional(),

  mothersName: z
    .string({
      required_error: "Mother's name is required",
      invalid_type_error: "Mother's name must be a string",
    })
    .min(1, "Mother's name cannot be empty")
    .trim(),

  mothersNameB: z.string().trim().optional(),

  gender: z
    .string({
      required_error: "Gender is required",
      invalid_type_error: "Gender must be a string",
    })
    .min(1, "Gender is Required")
    .trim(),

  dateOfBirth: z.date({
    required_error: "Date of birth is required",
    invalid_type_error: "Invalid date format for date of birth",
  }),

  // Optional Personal Information
  nid: z.string().trim().optional(),
  birthRegNo: z.string().trim().optional(),
  townOfBirth: z.string().trim().optional(),
  regionOfBirth: z.string().trim().optional(),
  countryOfBirth: z.string().trim().optional(),
  maritalStatus: z.string().trim().optional(),
  nationality: z.string().trim().optional(),

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

  regDisability: z.string().trim().optional(),
  effectiveStartDate: z.date().optional(),

  // Present Address
  presentAddressType: z.string().trim().optional(),

  presentAddress1: z
    .string({
      required_error: "Present address is required",
      invalid_type_error: "Present address must be a string",
    })
    .min(1, "Present address cannot be empty")
    .trim(),

  presentAddress1B: z.string().trim().optional(),
  presentCountry: z.string().trim().optional(),
  presentRegion: z.string().trim().optional(),
  presentDistrict: z.string().trim().optional(),
  presentUpazilla: z.string().trim().optional(),
  presentUnions: z.string().trim().optional(),
  presentArea: z.string().trim().optional(),

  // Permanent Address
  permanentAddressType: z.string().trim().optional(),

  permanentAddress1: z
    .string({
      required_error: "Permanent address is required",
      invalid_type_error: "Permanent address must be a string",
    })
    .min(1, "Permanent address cannot be empty")
    .trim(),

  permanentAddress1B: z.string().trim().optional(),
  permanentCountry: z.string().trim().optional(),
  permanentRegion: z.string().trim().optional(),
  permanentDistrict: z.string().trim().optional(),
  permanentUpazilla: z.string().trim().optional(),
  permanentUnions: z.string().trim().optional(),
  permanentArea: z.string().trim().optional(),
});

export default function EditEmployeePage() {
  const [submissionType, setSubmissionType] = useState(null);
  const { empNo } = useParams();
  const navigate = useNavigate();
  const { showConfirmation, PopoverWrapper } = useConfirmationPopover();
  const updateButtonRef = useRef(null);

  const { data: personTypes = [] } = usePersonTypes();
  const { data: employee, isLoading, error } = useEmployee(empNo);

  console.log("employee no", employee);

  //! remove all default test_value
  const form = useForm({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      title: employee?.TITLE || "test_value",
      firstName: employee?.FIRST_NAME || "test_value",
      lastName: employee?.LAST_NAME || "test_value",
      fathersName: employee?.FATHERS_NAME || "test_value",
      fathersNameB: employee?.FATHERS_NAME_B || "test_value",
      mothersName: employee?.MOTHERS_NAME || "test_value",
      mothersNameB: employee?.MOTHERS_NAME_B || "test_value",
      gender: employee?.GENDER || "test_value",
      nid: employee?.NID || "test_value",
      dateOfBirth: employee?.DATE_OF_BIRTH || "",
      birthRegNo: employee?.BIRTH_REG_NO || "test_value",
      townOfBirth: employee?.TOWN_OF_BIRTH || "test_value",
      regionOfBirth: employee?.REGION_OF_BIRTH || "test_value",
      countryOfBirth: employee?.COUNTRY_OF_BIRTH || "test_value",
      maritalStatus: employee?.MARRITIAL_STATUS || "test_value",
      nationality: employee?.NATIONALITY || "test_value",
      personTypeId: employee?.PERSON_TYPE_ID || "test_value",
      regDisability: employee?.REG_DISABILITY || "test_value",
      joinDate: employee?.JOIN_DATE || "",
      effectiveStartDate: employee?.EFFECTIVE_START_DATE || "",

      // ! present address
      presentAddressType:
        employee?.ADDRESSES?.[0]?.ADDRESS_TYPE_ID || "DATE_OF_BIRTH",
      presentAddress1: employee?.ADDRESSES?.[0]?.ADDRESS1 || "DATE_OF_BIRTH",
      presentAddress1B: employee?.ADDRESSES?.[0]?.ADDRESS1_B || "DATE_OF_BIRTH",
      presentCountry: employee?.ADDRESSES?.[0]?.COUNTRY || "DATE_OF_BIRTH",
      presentRegion: employee?.ADDRESSES?.[0]?.REGION || "DATE_OF_BIRTH",
      presentDistrict: employee?.ADDRESSES?.[0]?.DISTRICT || "DATE_OF_BIRTH",
      presentUpazilla: employee?.ADDRESSES?.[0]?.UPAZILLA || "DATE_OF_BIRTH",
      presentUnions: employee?.ADDRESSES?.[0]?.UNIONS || "DATE_OF_BIRTH",
      presentArea: employee?.ADDRESSES?.[0]?.AREA || "DATE_OF_BIRTH",
      //! permanent address
      permanentAddressType:
        employee?.ADDRESSES?.[1]?.ADDRESS_TYPE_ID || "DATE_OF_BIRTH",
      permanentAddress1: employee?.ADDRESSES?.[1]?.ADDRESS1 || "DATE_OF_BIRTH",
      permanentAddress1B:
        employee?.ADDRESSES?.[1]?.ADDRESS1_B || "DATE_OF_BIRTH",
      permanentCountry: employee?.ADDRESSES?.[1]?.COUNTRY || "DATE_OF_BIRTH",
      permanentRegion: employee?.ADDRESSES?.[1]?.REGION || "DATE_OF_BIRTH",
      permanentDistrict: employee?.ADDRESSES?.[1]?.DISTRICT || "DATE_OF_BIRTH",
      permanentUpazilla: employee?.ADDRESSES?.[1]?.UPAZILLA || "DATE_OF_BIRTH",
      permanentUnions: employee?.ADDRESSES?.[1]?.UNIONS || "DATE_OF_BIRTH",
      permanentArea: employee?.ADDRESSES?.[1]?.AREA || "DATE_OF_BIRTH",
    },
  });

  const handleFormSubmit = async (data, operationType) => {
    try {
      setSubmissionType(operationType);

      // Format dates using date-fns to avoid timezone issues
      const formatDate = (date) => {
        return date ? format(date, "yyyy-MM-dd") : "";
      };

      // Build addresses array
      const addresses = [];

      // Add present address if any field is filled
      if (
        data.presentAddress1 ||
        data.presentCountry ||
        data.presentRegion ||
        data.presentDistrict ||
        data.presentUpazilla ||
        data.presentArea
      ) {
        addresses.push({
          ADDRESS_TYPE_ID: 1, // Present address type
          ADDRESS1: data.presentAddress1 || "",
          ADDRESS1_B: data.presentAddress1B || "",
          COUNTRY: data.presentCountry || "",
          REGION: data.presentRegion || "",
          DISTRICT: data.presentDistrict || "",
          UPAZILLA: data.presentUpazilla || "",
          UNIONS: data.presentUnions || "",
          AREA: data.presentArea || "",
          LAST_UPDATE_BY: 101,
        });
      }

      // Add permanent address if any field is filled
      if (
        data.permanentAddress1 ||
        data.permanentCountry ||
        data.permanentRegion ||
        data.permanentDistrict ||
        data.permanentUpazilla ||
        data.permanentArea
      ) {
        addresses.push({
          ADDRESS_TYPE_ID: 2, // Permanent address type
          ADDRESS1: data.permanentAddress1 || "",
          ADDRESS1_B: data.permanentAddress1B || "",
          COUNTRY: data.permanentCountry || "",
          REGION: data.permanentRegion || "",
          DISTRICT: data.permanentDistrict || "",
          UPAZILLA: data.permanentUpazilla || "",
          UNIONS: data.permanentUnions || "",
          AREA: data.permanentArea || "",
          LAST_UPDATE_BY: 101,
        });
      }

      const payload = {
        TITLE: data.title,
        FIRST_NAME: data.firstName,
        LAST_NAME: data.lastName,
        FATHERS_NAME: data.fathersName,
        FATHERS_NAME_B: data.fathersNameB || "",
        MOTHERS_NAME: data.mothersName || "",
        MOTHERS_NAME_B: data.mothersNameB || "",
        GENDER: data.gender,
        DATE_OF_BIRTH: formatDate(data.dateOfBirth),

        NID: data.nid || "",
        BIRTH_REG_NO: data.birthRegNo || "",
        TOWN_OF_BIRTH: data.townOfBirth || "",
        REGION_OF_BIRTH: data.regionOfBirth || "",
        COUNTRY_OF_BIRTH: data.countryOfBirth || "",

        MARRITIAL_STATUS: data.maritalStatus,
        NATIONALITY: data.nationality || "",
        REG_DISABILITY: data.regDisability || "",
        EFFECTIVE_START_DATE: formatDate(data.effectiveStartDate) || "",

        JOIN_DATE: formatDate(data.joinDate),
        PERSON_TYPE_ID: parseInt(data.personTypeId),
        LAST_UPDATE_BY: 101,
        ADDRESSES: addresses,
        OPERATION_TYPE: operationType, // Add this
      };

      // Console log based on operation type
      if (operationType === "correction") {
        console.log("payload from correction", payload);
      } else {
        console.log("payload from update", payload);
      }

      return;
    } catch (error) {
      console.error(
        "Error processing employee:",
        error.response?.data || error
      );
      toast.error(`Failed to ${operationType} employee`);
    } finally {
      setSubmissionType(null);
    }
  };

  const handleUpdateClick = async (e) => {
    e.preventDefault();

    // First check if form is valid
    const isValid = await form.trigger();

    if (!isValid) {
      return;
    }

    // Show the popover and await user confirmation
    const isConfirmed = await showConfirmation({
      message:
        "Updating will archive the current record and create a new one. Are you sure?",
      confirmText: "Yes, Update",
      cancelText: "No, Cancel",
    });

    // If confirmed, proceed with the original submit logic
    if (isConfirmed) {
      const formData = form.getValues();
      await handleFormSubmit(formData, "update");
    } else {
      toast.info("Update cancelled.");
    }
  };

  return (
    <>
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-semibold tracking-tight text-gray-800 dark:text-gray-100 mb-8 flex items-center gap-2">
          <span className="p-2 rounded-md shadow-sm bg-primary/10 text-primary">
            <FileEditIcon className="w-6 h-6" />
          </span>
          <span className="font-medium">Edit Employee</span>
        </h1>
        <Form {...form}>
          <form className="">
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
                                <FormLabel>Father's Name (Bangla)</FormLabel>
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
                                <FormLabel>Mother's Name</FormLabel>
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
                                <FormLabel>Mother's Name (Bangla)</FormLabel>
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
                                <FormLabel>NID</FormLabel>
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
                                <FormLabel>Birth Registration No</FormLabel>
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
                                <FormLabel>Town of Birth</FormLabel>
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
                                <FormLabel>Region of Birth</FormLabel>
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
                                <FormLabel>Country of Birth</FormLabel>
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
                              <FormLabel>Marital Status</FormLabel>
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
                              <FormLabel>Nationality</FormLabel>
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
                {/* Address Information - Present */}
                <Accordion
                  type="single"
                  collapsible
                  className="bg-card/70 p-4 rounded-md shadow-md border"
                >
                  <AccordionItem value="present">
                    <AccordionTrigger className="text-lg font-medium flex items-center gap-2">
                      <span className="p-1 rounded-sm shadow-sm bg-primary/10 text-primary">
                        <MapPinIcon className="w-5 h-5 text-primary" />
                      </span>
                      Address Information (Present)
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="presentAddress1"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Address Line 1</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter address" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="presentAddress1B"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Address Line 1 (Bangla)</FormLabel>
                              <FormControl>
                                <Input placeholder="ঠিকানা" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="presentCountry"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Country</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter country" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="presentRegion"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Region</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter region" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="presentDistrict"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>District</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter district"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="presentUpazilla"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Upazilla</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter upazilla"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="presentUnions"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Unions</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter unions" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="presentArea"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Area/Village</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter area/village"
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
                                <FormLabel>Effective Start Date</FormLabel>
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
                              <FormLabel>Registered Disability</FormLabel>
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
                {/* Address Information - Permanent */}
                <Accordion
                  type="single"
                  collapsible
                  className="bg-card/70 p-4 rounded-md shadow-sm border"
                >
                  <AccordionItem value="permanent">
                    <AccordionTrigger className="text-lg font-medium flex items-center gap-2">
                      <span className="p-1 rounded-sm shadow-sm bg-primary/10 text-primary">
                        <HomeIcon className="w-5 h-5 text-primary" />
                      </span>
                      Address Information (Permanent)
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="permanentAddress1"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Address Line 1</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter address" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="permanentAddress1B"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Address Line 1 (Bangla)</FormLabel>
                              <FormControl>
                                <Input placeholder="ঠিকানা" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="permanentCountry"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Country</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter country" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="permanentRegion"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Region</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter region" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="permanentDistrict"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>District</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter district"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="permanentUpazilla"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Upazilla</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter upazilla"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="permanentUnions"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Unions</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter unions" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="permanentArea"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Area/Village</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter area/village"
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
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 mt-6">
              <Button
                type="button"
                onClick={form.handleSubmit((data) =>
                  // Directly call the handler for correction after form validation
                  handleFormSubmit(data, "correction")
                )}
                // Disable the button if any submission is currently in progress
                disabled={submissionType !== null}
                variant="default" // Standard, non-destructive appearance
              >
                {/* Conditional content for loading state */}
                {submissionType === "correction" ? (
                  <>Processing...</> // Show loading when correction is submitting
                ) : (
                  <>
                    <FileEditIcon className="w-4 h-4 mr-2" />
                    Correction
                  </>
                )}
              </Button>

              <PopoverWrapper>
                <Button
                  type="button"
                  onClick={handleUpdateClick}
                  disabled={submissionType !== null}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {submissionType === "update" ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Update
                    </>
                  )}
                </Button>
              </PopoverWrapper>
            </div>
          </form>
        </Form>
      </div>
    </>
  );
}
