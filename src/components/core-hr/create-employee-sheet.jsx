import React, { useState } from "react";
import { UserPlus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useAxiosSecure from "@/hooks/use-axios-secure";
import axios from "axios";
import { toast } from "sonner";

const employeeSchema = z.object({
  title: z.string().min(1, "Title is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  fathersName: z.string().min(1, "Father's name is required"),
  fathersNameB: z.string().optional(),
  mothersName: z.string().optional(),
  mothersNameB: z.string().optional(),
  gender: z.string().min(1, "Gender is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  nid: z.string().optional(),
  birthRegNo: z.string().optional(),
  townOfBirth: z.string().optional(),
  regionOfBirth: z.string().optional(),
  countryOfBirth: z.string().optional(),
  maritalStatus: z.string().optional(),
  nationality: z.string().optional(),
  joinDate: z.string().optional(),
  personTypeId: z.string().optional(),
  regDisability: z.string().optional(),
  effectiveStartDate: z.string().optional(),
  addressType: z.string().optional(),
  country: z.string().optional(),
  region: z.string().optional(),
  district: z.string().optional(),
  upazilla: z.string().optional(),
  areaVillage: z.string().optional(),
});

export default function CreateEmployeeSheet() {
  const [open, setOpen] = useState(false);
  const axiosSecure = useAxiosSecure();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    resolver: zodResolver(employeeSchema),
  });

  const onSubmit = async (data) => {
    console.log({ data }, "getting this data");

    try {
      const payload = {
        TITLE: data.title,
        FIRST_NAME: data.firstName,
        LAST_NAME: data.lastName,
        FATHERS_NAME: data.fathersName,
        FATHERS_NAME_B: data.fathersNameB || "",
        MOTHERS_NAME: data.mothersName || "",
        MOTHERS_NAME_B: data.mothersNameB || "",
        GENDER: data.gender,
        DATE_OF_BIRTH: data.dateOfBirth,
        NID: data.nid || "",
        BIRTH_REG_NO: data.birthRegNo || "",
        TOWN_OF_BIRTH: data.townOfBirth || "",
        REGION_OF_BIRTH: data.regionOfBirth || "",
        COUNTRY_OF_BIRTH: data.countryOfBirth || "",
        MARRITIAL_STATUS: 1,
        NATIONALITY: data.nationality || "Bangladeshi",
        JOIN_DATE: data.joinDate || "",
        PERSON_TYPE_ID: 1,
        REG_DISABILITY: 0,
        EFFECTIVE_START_DATE: data.effectiveStartDate || "",
        EFFECTIVEEND_DATE: "2099-12-31",
        LAST_UPDATE_BY: 101,
      };

      const res = await axios.post("api/insert_employee.php", payload, {
        headers: {
          Authorization: "Bearer 123456",
        },
      });

      console.log("Employee Added:", res.data);
      toast.success("Employee added successfully!");
      setOpen(false);
      // reset();
    } catch (error) {
      console.error("Error adding employee:", error.response?.data || error);
      toast.error("Failed to add employee");
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-card rounded-lg shadow-sm p-4 md:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Core HR</h1>
              <p className="text-muted-foreground mt-1">
                Manage employee information and records
              </p>
            </div>

            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button className="gap-2">
                  <UserPlus className="w-4 h-4" />
                  Create Employee
                </Button>
              </SheetTrigger>

              <SheetContent className=" md:max-w-2xl overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Create Employee</SheetTitle>
                  <SheetDescription>
                    Fill in the employee information below. Fields marked with *
                    are required.
                  </SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-6 px-4">
                  {/* Personal Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">
                      Personal Information
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Title *</Label>
                        <Select
                          onValueChange={(value) => setValue("title", value)}
                        >
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
                        {errors.title && (
                          <p className="text-sm text-destructive">
                            {errors.title.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name *</Label>
                        <Input
                          id="firstName"
                          {...register("firstName")}
                          placeholder="Enter first name"
                        />
                        {errors.firstName && (
                          <p className="text-sm text-destructive">
                            {errors.firstName.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name *</Label>
                        <Input
                          id="lastName"
                          {...register("lastName")}
                          placeholder="Enter last name"
                        />
                        {errors.lastName && (
                          <p className="text-sm text-destructive">
                            {errors.lastName.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="fathersName">Father's Name *</Label>
                        <Input
                          id="fathersName"
                          {...register("fathersName")}
                          placeholder="Enter father's name"
                        />
                        {errors.fathersName && (
                          <p className="text-sm text-destructive">
                            {errors.fathersName.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="fathersNameB">
                          Father's Name (Bangla)
                        </Label>
                        <Input
                          id="fathersNameB"
                          {...register("fathersNameB")}
                          placeholder="পিতার নাম"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="mothersName">Mother's Name</Label>
                        <Input
                          id="mothersName"
                          {...register("mothersName")}
                          placeholder="Enter mother's name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="mothersNameB">
                          Mother's Name (Bangla)
                        </Label>
                        <Input
                          id="mothersNameB"
                          {...register("mothersNameB")}
                          placeholder="মাতার নাম"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="gender">Gender *</Label>
                        <Select
                          onValueChange={(value) => setValue("gender", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.gender && (
                          <p className="text-sm text-destructive">
                            {errors.gender.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                        <Input
                          id="dateOfBirth"
                          type="date"
                          {...register("dateOfBirth")}
                        />
                        {errors.dateOfBirth && (
                          <p className="text-sm text-destructive">
                            {errors.dateOfBirth.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="nid">NID</Label>
                        <Input
                          id="nid"
                          {...register("nid")}
                          placeholder="Enter NID number"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="birthRegNo">
                          Birth Registration No
                        </Label>
                        <Input
                          id="birthRegNo"
                          {...register("birthRegNo")}
                          placeholder="Enter birth reg. no"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="townOfBirth">Town of Birth</Label>
                        <Input
                          id="townOfBirth"
                          {...register("townOfBirth")}
                          placeholder="Enter town of birth"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="regionOfBirth">Region of Birth</Label>
                        <Input
                          id="regionOfBirth"
                          {...register("regionOfBirth")}
                          placeholder="Enter region"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="countryOfBirth">Country of Birth</Label>
                        <Input
                          id="countryOfBirth"
                          {...register("countryOfBirth")}
                          placeholder="Enter country"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="maritalStatus">Marital Status</Label>
                        <Select
                          onValueChange={(value) =>
                            setValue("maritalStatus", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Single">Single</SelectItem>
                            <SelectItem value="Married">Married</SelectItem>
                            <SelectItem value="Divorced">Divorced</SelectItem>
                            <SelectItem value="Widowed">Widowed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="nationality">Nationality</Label>
                        <Input
                          id="nationality"
                          {...register("nationality")}
                          placeholder="Enter nationality"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Employment Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">
                      Employment Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="joinDate">Join Date</Label>
                        <Input
                          id="joinDate"
                          type="date"
                          {...register("joinDate")}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="personTypeId">Person Type ID</Label>
                        <Input
                          id="personTypeId"
                          {...register("personTypeId")}
                          placeholder="Enter person type ID"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="regDisability">
                          Registered Disability
                        </Label>
                        <Input
                          id="regDisability"
                          {...register("regDisability")}
                          placeholder="Enter if applicable"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="effectiveStartDate">
                          Effective Start Date
                        </Label>
                        <Input
                          id="effectiveStartDate"
                          type="date"
                          {...register("effectiveStartDate")}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Address Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">
                      Address Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="addressType">Address Type</Label>
                        <Select
                          onValueChange={(value) =>
                            setValue("addressType", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Present">Present</SelectItem>
                            <SelectItem value="Permanent">Permanent</SelectItem>
                            <SelectItem value="Office">Office</SelectItem>
                            <SelectItem value="Temporary">Temporary</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="country">Country</Label>
                        <Input
                          id="country"
                          {...register("country")}
                          placeholder="Enter country"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="region">Region</Label>
                        <Input
                          id="region"
                          {...register("region")}
                          placeholder="Enter region"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="district">District</Label>
                        <Input
                          id="district"
                          {...register("district")}
                          placeholder="Enter district"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="upazilla">Upazilla</Label>
                        <Input
                          id="upazilla"
                          {...register("upazilla")}
                          placeholder="Enter upazilla"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="areaVillage">Area/Village</Label>
                        <Input
                          id="areaVillage"
                          {...register("areaVillage")}
                          placeholder="Enter area/village"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex flex-col sm:flex-row gap-3 py-4">
                    <Button onClick={handleSubmit(onSubmit)}>Submit</Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setOpen(false);
                        reset();
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="bg-card rounded-lg shadow-sm p-4 md:p-6">
          <div className="text-center py-12">
            <UserPlus className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No employees yet</h3>
            <p className="text-muted-foreground mb-4">
              Get started by creating your first employee record.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
