import React, { useEffect, useState } from "react";
import { Plus, UserPlus } from "lucide-react";
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
import axios from "axios";
import { toast } from "sonner";
import {
  MARITAL_STATUS_OPTIONS,
  REG_DISABILITY_OPTIONS,
} from "@/lib/constants/employeeOptions";
import { DatePicker } from "@/components/DatePicker";

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

export default function CreateEmployeeSheet() {
  const [open, setOpen] = useState(false);
  const [personTypes, setPersonTypes] = useState([]);

  const form = useForm({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
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
      presentAddressType: "",
      presentAddress1: "",
      presentAddress1B: "",
      presentCountry: "",
      presentRegion: "",
      presentDistrict: "",
      presentUpazilla: "",
      presentUnions: "",
      presentArea: "",
      permanentAddressType: "",
      permanentAddress1: "",
      permanentAddress1B: "",
      permanentCountry: "",
      permanentRegion: "",
      permanentDistrict: "",
      permanentUpazilla: "",
      permanentUnions: "",
      permanentArea: "",
    },
  });

  useEffect(() => {
    const fetchPersonTypes = async () => {
      try {
        const res = await axios.get("api/get_person_type.php", {
          headers: {
            Authorization: "Bearer 123456",
          },
        });
        setPersonTypes(res.data || []);
      } catch (error) {
        console.error("Error fetching person types:", error);
      }
    };
    fetchPersonTypes();
  }, []);

  const onSubmit = async (data) => {
    try {
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
        JOIN_DATE: formatDate(data.joinDate),
        PERSON_TYPE_ID: parseInt(data.personTypeId),
        LAST_UPDATE_BY: 101,
        ADDRESSES: addresses,
      };

      console.log(payload);

      const res = await axios.post("api/insert_employee.php", payload, {
        headers: {
          Authorization: "Bearer 123456",
        },
      });

      console.log("Employee Added:", res.data);
      toast.success("Employee added successfully!");
      setOpen(false);
      form.reset();
    } catch (error) {
      console.error("Error adding employee:", error.response?.data || error);
      toast.error("Failed to add employee");
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="gap-2">
          <UserPlus className="w-4 h-4" />
          Create Employee
        </Button>
      </SheetTrigger>

      <SheetContent className="md:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Create Employee</SheetTitle>
          <SheetDescription>
            Fill in the employee information below. Fields marked with * are
            required.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="mt-4 space-y-6 px-6 md:px-8"
          >
            <Accordion type="single" collapsible defaultValue="personal">
              {/* Personal Information */}
              <AccordionItem  value="personal">
                <AccordionTrigger>Personal Information</AccordionTrigger>
                
                <AccordionContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
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

                    <FormField
                      control={form.control}
                      name="firstName"
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

                    <FormField
                      control={form.control}
                      name="lastName"
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

                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gender *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
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
                            <Input placeholder="Enter NID number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

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

                    <FormField
                      control={form.control}
                      name="regionOfBirth"
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

                    <FormField
                      control={form.control}
                      name="countryOfBirth"
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

                    <FormField
                      control={form.control}
                      name="maritalStatus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Marital Status</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {MARITAL_STATUS_OPTIONS.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
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
                      name="nationality"
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
                      name="personTypeId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Person Type *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select person type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {personTypes.map((type) => (
                                <SelectItem
                                  key={type.PERSON_TYPE_ID}
                                  value={type.PERSON_TYPE_ID.toString()}
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

                    <FormField
                      control={form.control}
                      name="regDisability"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Registered Disability</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select option" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {REG_DISABILITY_OPTIONS.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
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
                </AccordionContent>
              </AccordionItem>

              {/* Address Information - Present */}
              <AccordionItem value="present">
                <AccordionTrigger>
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
                            <Input placeholder="Enter district" {...field} />
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
                            <Input placeholder="Enter upazilla" {...field} />
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

              {/* Address Information - Permanent */}
              <AccordionItem value="permanent">
                <AccordionTrigger>
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
                            <Input placeholder="Enter district" {...field} />
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
                            <Input placeholder="Enter upazilla" {...field} />
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

              {/* Form Actions */}
              <div className="flex flex-col sm:flex-row gap-3 py-4">
                <Button type="submit">Submit</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setOpen(false);
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </Accordion>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
