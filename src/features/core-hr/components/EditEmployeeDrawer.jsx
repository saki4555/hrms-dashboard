"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
  // DrawerTrigger if you have a trigger inside this file, otherwise you may open externally
} from "@/components/ui/drawer";

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FileEdit, FilePlus } from "lucide-react";
import { DatePicker } from "@/components/DatePicker";

import {
  MARITAL_STATUS_OPTIONS,
  REG_DISABILITY_OPTIONS,
} from "@/lib/constants/employeeOptions";

import { usePersonTypes } from "../hooks/usePersonTypes";

const employeeSchema = z.object({
  TITLE: z.string({ invalid_type_error: "Title must be a string" })
    .min(1, "Title is required").trim(),
  FIRST_NAME: z.string({ required_error: "First name is required", invalid_type_error: "First name must be a string" })
    .min(1, "First name cannot be empty").trim(),
  LAST_NAME: z.string({ required_error: "Last name is required", invalid_type_error: "Last name must be a string" })
    .min(1, "Last name cannot be empty").trim(),
  FATHERS_NAME: z.string({ required_error: "Father's name is required", invalid_type_error: "Father's name must be a string" })
    .min(1, "Father's name cannot be empty").trim(),
  FATHERS_NAME_B: z.string().trim().optional(),
  MOTHERS_NAME: z.string({ required_error: "Mother's name is required", invalid_type_error: "Mother's name must be a string" })
    .min(1, "Mother's name cannot be empty").trim(),
  MOTHERS_NAME_B: z.string().trim().optional(),
  GENDER: z.string({ required_error: "Gender is required", invalid_type_error: "Gender must be a string" })
    .min(1, "Gender is required").trim(),
  DATE_OF_BIRTH: z.date({ required_error: "Date of birth is required", invalid_type_error: "Invalid date format for date of birth" }),
  NID: z.string().trim().optional(),
  BIRTH_REG_NO: z.string().trim().optional(),
  TOWN_OF_BIRTH: z.string().trim().optional(),
  REGION_OF_BIRTH: z.string().trim().optional(),
  COUNTRY_OF_BIRTH: z.string().trim().optional(),
  MARITAL_STATUS: z.string().trim().optional(),
  NATIONALITY: z.string().trim().optional(),
  EMP_NO: z.string().trim().optional(),
  JOIN_DATE: z.date({ required_error: "Join date is required", invalid_type_error: "Invalid date format for join date" }),
  PERSON_TYPE_ID: z.string({ required_error: "Person type is required", invalid_type_error: "Person type must be a string" })
    .min(1, "Person type is required").trim(),
  REG_DISABILITY: z.string().trim().optional(),
  EFFECTIVE_START_DATE: z.date().optional(),
  PRESENT_ADDRESS1: z.string().trim().optional(),
  PRESENT_ADDRESS1_B: z.string().trim().optional(),
  PRESENT_COUNTRY: z.string().trim().optional(),
  PRESENT_REGION: z.string().trim().optional(),
  PRESENT_DISTRICT: z.string().trim().optional(),
  PRESENT_UPAZILLA: z.string().trim().optional(),
  PRESENT_UNIONS: z.string().trim().optional(),
  PRESENT_AREA: z.string().trim().optional(),
  PERMANENT_ADDRESS1: z.string().trim().optional(),
  PERMANENT_ADDRESS1_B: z.string().trim().optional(),
  PERMANENT_COUNTRY: z.string().trim().optional(),
  PERMANENT_REGION: z.string().trim().optional(),
  PERMANENT_DISTRICT: z.string().trim().optional(),
  PERMANENT_UPAZILLA: z.string().trim().optional(),
  PERMANENT_UNIONS: z.string().trim().optional(),
  PERMANENT_AREA: z.string().trim().optional(),
});

export default function EditEmployeeDrawer({
  open,
  onOpenChange,
  employee,
  onSave,
  showConfirmation,
}) {
  const [mode, setMode] = useState("correction");
  const { data: personTypes = [] } = usePersonTypes();
  
  const form = useForm({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      TITLE: "",
      FIRST_NAME: "",
      LAST_NAME: "",
      FATHERS_NAME: "",
      FATHERS_NAME_B: "",
      MOTHERS_NAME: "",
      MOTHERS_NAME_B: "",
      GENDER: "",
      NID: "",
      BIRTH_REG_NO: "",
      TOWN_OF_BIRTH: "",
      REGION_OF_BIRTH: "",
      COUNTRY_OF_BIRTH: "",
      MARITAL_STATUS: "",
      NATIONALITY: "",
      EMP_NO: "",
      PERSON_TYPE_ID: "",
      REG_DISABILITY: "",
      PRESENT_ADDRESS1: "",
      PRESENT_ADDRESS1_B: "",
      PRESENT_COUNTRY: "",
      PRESENT_REGION: "",
      PRESENT_DISTRICT: "",
      PRESENT_UPAZILLA: "",
      PRESENT_UNIONS: "",
      PRESENT_AREA: "",
      PERMANENT_ADDRESS1: "",
      PERMANENT_ADDRESS1_B: "",
      PERMANENT_COUNTRY: "",
      PERMANENT_REGION: "",
      PERMANENT_DISTRICT: "",
      PERMANENT_UPAZILLA: "",
      PERMANENT_UNIONS: "",
      PERMANENT_AREA: "",
    },
  });

  useEffect(() => {
    if (employee && open) {
      setMode("correction");
      const formattedEmployee = {
        ...employee,
        DATE_OF_BIRTH: employee.DATE_OF_BIRTH ? new Date(employee.DATE_OF_BIRTH) : undefined,
        JOIN_DATE: employee.JOIN_DATE ? new Date(employee.JOIN_DATE) : undefined,
        EFFECTIVE_START_DATE: employee.EFFECTIVE_START_DATE ? new Date(employee.EFFECTIVE_START_DATE) : undefined,
        PERSON_TYPE_ID: employee.PERSON_TYPE_ID?.toString() || "",
      };
      form.reset(formattedEmployee);
    }
  }, [employee, open, form]);

  const handleModeChange = async (newMode) => {
    if (newMode === mode) return;
    if (showConfirmation) {
      const confirmed = await showConfirmation({
        title: "Change mode?",
        description:
          newMode === "update"
            ? "Switching to 'Update' will create a new employee record and keep the old one unchanged. Continue?"
            : "Switching to 'Correction' will modify the existing employee record directly. Continue?",
        confirmText: "Switch Mode",
        cancelText: "Stay",
      });
      if (!confirmed) return;
    }
    setMode(newMode);
    if (newMode === "update") {
      form.setValue("EMP_NO", "");
    } else {
      form.setValue("EMP_NO", employee?.EMP_NO || "");
    }
  };

  const onSubmit = async (data) => {
    const formatDate = (date) => (date ? format(date, "yyyy-MM-dd") : "");
    const payload = {
      ...data,
      DATE_OF_BIRTH: formatDate(data.DATE_OF_BIRTH),
      JOIN_DATE: formatDate(data.JOIN_DATE),
      EFFECTIVE_START_DATE: formatDate(data.EFFECTIVE_START_DATE),
      PERSON_TYPE_ID: parseInt(data.PERSON_TYPE_ID),
      mode,
    };
    onSave(mode, payload);
    onOpenChange(false);
  };

  const handleCancel = async () => {
    if (form.formState.isDirty && showConfirmation) {
      const confirmed = await showConfirmation({
        title: "Discard changes?",
        description: "You have unsaved changes. Are you sure you want to close without saving?",
        confirmText: "Discard",
        cancelText: "Keep Editing",
        variant: "destructive",
      });
      if (!confirmed) return;
    }
    onOpenChange(false);
  };

  if (!employee) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        side="bottom"
        className="w-2xl max-w-none h-[80vh] bg-background rounded-t-lg p-0 flex flex-col"
      >
        <DrawerHeader className="px-6 pt-6 pb-4">
          <DrawerTitle>Edit Employee</DrawerTitle>
          <DrawerDescription>
            {mode === "correction"
              ? "Correct existing employee information"
              : "Create a new employee record based on existing one"}
          </DrawerDescription>
          <DrawerClose asChild>
            <Button variant="ghost" className="absolute top-6 right-6">
              <span className="sr-only">Close</span>
              ×
            </Button>
          </DrawerClose>
        </DrawerHeader>

        <div className="px-6">
          <Tabs value={mode} onValueChange={handleModeChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="correction" className="gap-2">
                <FileEdit className="h-4 w-4" />
                Correction
              </TabsTrigger>
              <TabsTrigger value="update" className="gap-2">
                <FilePlus className="h-4 w-4" />
                Update
              </TabsTrigger>
            </TabsList>
            <TabsContent value="correction" className="mt-4">
              <div className="text-sm text-muted-foreground mb-4">
                Edit the existing employee record directly
              </div>
            </TabsContent>
            <TabsContent value="update" className="mt-4">
              <div className="text-sm text-muted-foreground mb-4">
                Create a new employee record while keeping the old one
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            id="edit-employee-form"
            className="flex-1 overflow-y-auto px-6"
          >
            <div className="py-4">
              <Accordion type="single" collapsible defaultValue="personal">
                {/* Personal Information */}
                <AccordionItem value="personal">
                  <AccordionTrigger>Personal Information</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Title */}
                      <FormField
                        control={form.control}
                        name="TITLE"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select title" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Mr.">Mr.</SelectItem>
                                <SelectItem value="Mrs.">Mrs.</SelectItem>
                                <SelectItem value="Ms.">Ms.</SelectItem>
                                <SelectItem value="Dr.">Dr.</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {/* First Name */}
                      <FormField
                        control={form.control}
                        name="FIRST_NAME"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter first name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {/* Last Name */}
                      <FormField
                        control={form.control}
                        name="LAST_NAME"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter last name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {/* Father's Name */}
                      <FormField
                        control={form.control}
                        name="FATHERS_NAME"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Father's Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter father's name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {/* Father's Name Bangla */}
                      <FormField
                        control={form.control}
                        name="FATHERS_NAME_B"
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
                      {/* Mother's Name */}
                      <FormField
                        control={form.control}
                        name="MOTHERS_NAME"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mother's Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter mother's name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {/* Mother's Name Bangla */}
                      <FormField
                        control={form.control}
                        name="MOTHERS_NAME_B"
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
                      {/* Gender */}
                      <FormField
                        control={form.control}
                        name="GENDER"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gender *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Male">Male</SelectItem>
                                <SelectItem value="Female">Female</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {/* Date of Birth */}
                      <FormField
                        control={form.control}
                        name="DATE_OF_BIRTH"
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
                      {/* NID */}
                      <FormField
                        control={form.control}
                        name="NID"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>NID</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter NID number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {/* Birth Reg No */}
                      <FormField
                        control={form.control}
                        name="BIRTH_REG_NO"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Birth Registration No</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter birth reg. no" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {/* Town of Birth */}
                      <FormField
                        control={form.control}
                        name="TOWN_OF_BIRTH"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Town of Birth</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter town of birth" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {/* Region of Birth */}
                      <FormField
                        control={form.control}
                        name="REGION_OF_BIRTH"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Region of Birth</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter region" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {/* Country of Birth */}
                      <FormField
                        control={form.control}
                        name="COUNTRY_OF_BIRTH"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Country of Birth</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter country" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {/* Marital Status */}
                      <FormField
                        control={form.control}
                        name="MARITAL_STATUS"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Marital Status</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {MARITAL_STATUS_OPTIONS.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {/* Nationality */}
                      <FormField
                        control={form.control}
                        name="NATIONALITY"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nationality</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter nationality" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Employment Information */}
                <AccordionItem value="employment">
                  <AccordionTrigger>Employment Information</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="EMP_NO"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Employee No *</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                disabled={mode === "correction"}
                                placeholder={mode === "update" ? "Enter new employee number" : ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="JOIN_DATE"
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
                        name="PERSON_TYPE_ID"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Person Type *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select person type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {personTypes.map((type) => (
                                  <SelectItem key={type.PERSON_TYPE_ID} value={type.PERSON_TYPE_ID.toString()}>
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
                        name="REG_DISABILITY"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Registered Disability</FormLabel>
                            <FormControl>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectItem value="Yes">Yes</SelectItem>
                                <SelectItem value="No">No</SelectItem>
                                {/* Or use REG_DISABILITY_OPTIONS */}
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="EFFECTIVE_START_DATE"
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
                  </AccordionContent>
                </AccordionItem>

                {/* Present Address */}
                <AccordionItem value="present">
                  <AccordionTrigger>Address Information (Present)</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="PRESENT_ADDRESS1"
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
                        name="PRESENT_ADDRESS1_B"
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
                        name="PRESENT_COUNTRY"
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
                        name="PRESENT_REGION"
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
                        name="PRESENT_DISTRICT"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>District</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter district" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="PRESENT_UPAZILLA"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Upazilla</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter upazilla" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="PRESENT_UNIONS"
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
                        name="PRESENT_AREA"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Area/Village</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter area/village" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Permanent Address */}
                <AccordionItem value="permanent">
                  <AccordionTrigger>Address Information (Permanent)</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="PERMANENT_ADDRESS1"
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
                        name="PERMANENT_ADDRESS1_B"
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
                        name="PERMANENT_COUNTRY"
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
                        name="PERMANENT_REGION"
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
                        name="PERMANENT_DISTRICT"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>District</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter district" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="PERMANENT_UPAZILLA"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Upazilla</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter upazilla" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="PERMANENT_UNIONS"
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
                        name="PERMANENT_AREA"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Area/Village</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter area/village" {...field} />
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

            <DrawerFooter className="px-6 py-4 border-t flex justify-end gap-2">
              <Button variant="outline" onClick={handleCancel} type="button">
                Cancel
              </Button>
              <Button type="submit">
                Save
              </Button>
            </DrawerFooter>
          </form>
        </Form>
      </DrawerContent>
    </Drawer>
  );
}
