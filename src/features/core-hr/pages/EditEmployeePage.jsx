// features/core-hr/components/EditEmployeePage.jsx
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { useParams, useNavigate } from "react-router";

import { useConfirmationDialog } from "../hooks/useConfirmationDialog";
import { usePersonTypes } from "../hooks/usePersonTypes";

import {
    Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DatePicker } from "@/components/DatePicker";
import { FileEdit, FilePlus } from "lucide-react";

import { MARITAL_STATUS_OPTIONS, REG_DISABILITY_OPTIONS } from "@/lib/constants/employeeOptions";
import { useEmployee } from "../hooks/useEmployee";




const employeeSchema = z.object({
  // Basic Information
  title: z.string({ required_error: "Title is required" }).min(1).trim(),
  firstName: z.string({ required_error: "First name is required" }).min(1).trim(),
  lastName: z.string({ required_error: "Last name is required" }).min(1).trim(),
  fathersName: z.string({ required_error: "Father's name is required" }).min(1).trim(),
  fathersNameB: z.string().trim().optional(),
  mothersName: z.string({ required_error: "Mother's name is required" }).min(1).trim(),
  mothersNameB: z.string().trim().optional(),
  gender: z.string({ required_error: "Gender is required" }).min(1).trim(),

  // Dates
  dateOfBirth: z.date({ required_error: "Date of birth is required" }),
  joinDate: z.date({ required_error: "Join date is required" }),
  effectiveStartDate: z.date().optional(),

  // Personal Information
  nid: z.string().trim().optional(),
  birthRegNo: z.string().trim().optional(),
  townOfBirth: z.string().trim().optional(),
  regionOfBirth: z.string().trim().optional(),
  countryOfBirth: z.string().trim().optional(),
  maritalStatus: z.string().trim().optional(),
  nationality: z.string().trim().optional(),

  // Employment Information
  personTypeId: z.string({ required_error: "Person type is required" }).min(1).trim(),
  regDisability: z.string().trim().optional(),

  // Present Address
  presentAddressType: z.string().trim().optional(),
  presentAddress1: z.string({ required_error: "Present address is required" }).min(1).trim(),
  presentAddress1B: z.string().trim().optional(),
  presentCountry: z.string().trim().optional(),
  presentRegion: z.string().trim().optional(),
  presentDistrict: z.string().trim().optional(),
  presentUpazilla: z.string().trim().optional(),
  presentUnions: z.string().trim().optional(),
  presentArea: z.string().trim().optional(),

  // Permanent Address
  permanentAddressType: z.string().trim().optional(),
  permanentAddress1: z.string({ required_error: "Permanent address is required" }).min(1).trim(),
  permanentAddress1B: z.string().trim().optional(),
  permanentCountry: z.string().trim().optional(),
  permanentRegion: z.string().trim().optional(),
  permanentDistrict: z.string().trim().optional(),
  permanentUpazilla: z.string().trim().optional(),
  permanentUnions: z.string().trim().optional(),
  permanentArea: z.string().trim().optional(),
});



export default function EditEmployeePage() {
    const { empNo } = useParams();
    const navigate = useNavigate();
    const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();
    const { data: personTypes = [] } = usePersonTypes();


    const [mode, setMode] = useState("correction");

    const { data: employee, isLoading, error } = useEmployee(empNo)

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
            DATE_OF_BIRTH: null,
            NID: "",
            BIRTH_REG_NO: "",
            TOWN_OF_BIRTH: "",
            REGION_OF_BIRTH: "",
            COUNTRY_OF_BIRTH: "",
            MARITAL_STATUS: "",
            NATIONALITY: "",
            EMP_NO: "",
            JOIN_DATE: null,
            PERSON_TYPE_ID: "",
            REG_DISABILITY: "",
            EFFECTIVE_START_DATE: null,
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
        if (employee) form.reset(employee);
    }, [employee, form]);

    const handleModeChange = async (newMode) => {
        if (newMode === mode) return;
        const confirmed = await showConfirmation({
            title: "Change mode?",
            description:
                newMode === "update"
                    ? "Switching to 'Update' will create a new employee record. Continue?"
                    : "Switching to 'Correction' will modify the existing employee record. Continue?",
            confirmText: "Switch",
            cancelText: "Stay",
        });
        if (!confirmed) return;

        setMode(newMode);
        form.setValue("EMP_NO", newMode === "update" ? "" : employee?.EMP_NO || "");
    };

    const onSubmit = async (data) => {
        const confirmed = await showConfirmation({
            title: "Save changes?",
            description:
                mode === "update"
                    ? "This will create a new employee record. Continue?"
                    : "This will update the current employee record. Continue?",
            confirmText: "Yes, save",
            cancelText: "Cancel",
        });
        if (!confirmed) return;

        const payload = {
            ...data,
            DATE_OF_BIRTH: data.DATE_OF_BIRTH ? format(data.DATE_OF_BIRTH, "yyyy-MM-dd") : null,
            JOIN_DATE: data.JOIN_DATE ? format(data.JOIN_DATE, "yyyy-MM-dd") : null,
            EFFECTIVE_START_DATE: data.EFFECTIVE_START_DATE ? format(data.EFFECTIVE_START_DATE, "yyyy-MM-dd") : null,
            PERSON_TYPE_ID: parseInt(data.PERSON_TYPE_ID),
            mode,
        };

        console.log("Saving employee:", payload);
        // TODO: call your API to save employee
        navigate(-1);
    };

    if (isLoading) return <div className="text-center py-10">Loading…</div>;

  

    return (
        <div className="container mx-auto py-8 px-4">
            <h1 className="text-2xl font-semibold mb-6">Edit Employee</h1>

            <div className=" shadow-sm rounded-lg p-6">
                {/* Mode Tabs */}
                <Tabs value={mode} onValueChange={handleModeChange} className="mb-6">
                    <TabsList className="grid grid-cols-2">
                        <TabsTrigger value="correction" className="flex items-center gap-2">
                            <FileEdit className="h-4 w-4" /> Correction
                        </TabsTrigger>
                        <TabsTrigger value="update" className="flex items-center gap-2">
                            <FilePlus className="h-4 w-4" /> Update
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="correction">
                        <p className="text-sm text-muted-foreground mb-4">
                            Edit the existing employee record directly.
                        </p>
                    </TabsContent>
                    <TabsContent value="update">
                        <p className="text-sm text-muted-foreground mb-4">
                            Create a new employee record while keeping the old one.
                        </p>
                    </TabsContent>
                </Tabs>




                {/* upated verseion */}
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* LEFT COLUMN */}
                            <div className="space-y-6">
                                {/* Personal Information */}
                                <Accordion type="single" collapsible defaultValue="personal">
                                    <AccordionItem value="personal">
                                        <AccordionTrigger className="text-lg font-medium">
                                            Personal Information
                                        </AccordionTrigger>
                                        <AccordionContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">

                                            {/* Title */}
                                            <FormField
                                                control={form.control}
                                                name="TITLE"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Title *</FormLabel>
                                                        <Select onValueChange={field.onChange} value={field.value}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select title" />
                                                            </SelectTrigger>
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

                                            {/* Father's Name (Bangla) */}
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

                                            {/* Mother's Name (Bangla) */}
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
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select gender" />
                                                            </SelectTrigger>
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
                                                                placeholder="Select date"
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

                                            {/* Birth Registration No */}
                                            <FormField
                                                control={form.control}
                                                name="BIRTH_REG_NO"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Birth Registration No</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Enter birth registration no" {...field} />
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
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select status" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {MARITAL_STATUS_OPTIONS.map(opt => (
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
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>

                                {/* Present Address */}
                                <Accordion type="single" collapsible defaultValue="present">
                                    <AccordionItem value="present">
                                        <AccordionTrigger className="text-lg font-medium">
                                            Present Address
                                        </AccordionTrigger>
                                        <AccordionContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">

                                            {/* Address Line 1 */}
                                            <FormField
                                                control={form.control}
                                                name="PRESENT_ADDRESS1"
                                                render={({ field }) => (
                                                    <FormItem className="md:col-span-2">
                                                        <FormLabel>Address Line 1</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Enter address line 1" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />


                                            {/* Address Line 1 (Bangla) */}
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


                                            {/* Rest of present address fields */}
                                            {[
                                                { name: "PRESENT_COUNTRY", label: "Country" },
                                                { name: "PRESENT_REGION", label: "Region" },
                                                { name: "PRESENT_DISTRICT", label: "District" },
                                                { name: "PRESENT_UPAZILLA", label: "Upazilla" },
                                                { name: "PRESENT_UNIONS", label: "Unions" },
                                                { name: "PRESENT_AREA", label: "Area/Village" },
                                            ].map((fieldData) => (
                                                <FormField
                                                    key={fieldData.name}
                                                    control={form.control}
                                                    name={fieldData.name}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>{fieldData.label}</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder={`Enter ${fieldData.label.toLowerCase()}`} {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            ))}
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                            </div>

                            {/* RIGHT COLUMN */}
                            <div className="space-y-6">
                                {/* Employment Information */}
                                <Accordion type="single" collapsible defaultValue="employment">
                                    <AccordionItem value="employment">
                                        <AccordionTrigger className="text-lg font-medium">
                                            Employment Information
                                        </AccordionTrigger>
                                        <AccordionContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Employee No */}
                                            <FormField
                                                control={form.control}
                                                name="EMP_NO"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Employee No *</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Enter employee number" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            {/* Join Date */}
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

                                            {/* Person Type */}
                                            <FormField
                                                control={form.control}
                                                name="PERSON_TYPE_ID"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Person Type *</FormLabel>
                                                        <Select onValueChange={field.onChange} value={field.value}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select person type" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {personTypes.map((type) => (
                                                                    <SelectItem key={type.value} value={type.value}>
                                                                        {type.label}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            {/* Disability */}
                                            <FormField
                                                control={form.control}
                                                name="REG_DISABILITY"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Registered Disability</FormLabel>
                                                        <Select onValueChange={field.onChange} value={field.value}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select option" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="Y">Yes</SelectItem>
                                                                <SelectItem value="N">No</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            {/* Effective Start Date */}
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
                                                                placeholder="Select start date"
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>

                                {/* Permanent Address */}
                                <Accordion type="single" collapsible defaultValue="permanent">
                                    <AccordionItem value="permanent">
                                        <AccordionTrigger className="text-lg font-medium">
                                            Permanent Address
                                        </AccordionTrigger>
                                        <AccordionContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">

                                            {/* Address Line 1 */}
                                            <FormField
                                                control={form.control}
                                                name="PERMANENT_ADDRESS1"
                                                render={({ field }) => (
                                                    <FormItem className="md:col-span-2">
                                                        <FormLabel>Address Line 1</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Enter address line 1" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            {/* Address Line 1 (Bangla) */}
                                            {/* Address Line 1 (Bangla) */}
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


                                            {/* Rest of permanent address fields */}
                                            {[
                                                { name: "PERMANENT_COUNTRY", label: "Country" },
                                                { name: "PERMANENT_REGION", label: "Region" },
                                                { name: "PERMANENT_DISTRICT", label: "District" },
                                                { name: "PERMANENT_UPAZILLA", label: "Upazilla" },
                                                { name: "PERMANENT_UNIONS", label: "Unions" },
                                                { name: "PERMANENT_AREA", label: "Area/Village" },
                                            ].map((fieldData) => (
                                                <FormField
                                                    key={fieldData.name}
                                                    control={form.control}
                                                    name={fieldData.name}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>{fieldData.label}</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder={`Enter ${fieldData.label.toLowerCase()}`} {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            ))}
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                            </div>
                        </div>

                        {/* Form Actions */}
                        <div className="flex justify-end gap-3 mt-6">
                            <Button variant="outline" type="button" onClick={() => navigate(-1)}>
                                Cancel
                            </Button>
                            <Button type="submit">Save</Button>
                        </div>
                    </form>
                </Form>




            </div>

            <ConfirmationDialog />
        </div>
    );
}
