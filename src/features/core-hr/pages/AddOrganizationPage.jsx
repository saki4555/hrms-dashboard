import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { Building2, Search } from "lucide-react";
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
import { DatePicker } from "@/components/DatePicker";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Validation Schema
const organizationSchema = z.object({
  orgName: z
    .string({
      required_error: "Organization name is required",
    })
    .min(1, "Organization name cannot be empty")
    .trim(),

  orgType: z
    .string({
      required_error: "Organization type is required",
    })
    .min(1, "Please select an organization type"),

  parentOrg: z.string().optional(),

  effectiveStartDate: z.date({
    required_error: "Effective start date is required",
  }),

  effectiveEndDate: z.date({
    required_error: "Effective end date is required",
  }),

  status: z
    .string({
      required_error: "Status is required",
    })
    .min(1, "Please select a status"),
});

export default function AddOrganizationPage() {
  const [organizations, setOrganizations] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Organization types - will come from API
  const orgTypes = [
    { value: "company", label: "Company" },
    { value: "department", label: "Department" },
    { value: "section", label: "Section" },
    { value: "subsection", label: "Sub-section" },
  ];

  // Status options
  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  // Mock parent organizations - will come from API
  const parentOrgs = [
    { value: "1", label: "Head Office" },
    { value: "2", label: "HR Department" },
    { value: "3", label: "Finance Department" },
    { value: "4", label: "Operations Department" },
  ];

  const form = useForm({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      orgName: "",
      orgType: "",
      parentOrg: "",
      effectiveStartDate: new Date(), // Default current date
      effectiveEndDate: new Date(
        new Date().setFullYear(new Date().getFullYear() + 100)
      ), // Default current date + 100 years
      status: "active", // Default to Active
    },
  });

  const onSubmit = (data) => {
    // Format dates
    const formattedData = {
      ...data,
      effectiveStartDate: format(data.effectiveStartDate, "yyyy-MM-dd"),
      effectiveEndDate: format(data.effectiveEndDate, "yyyy-MM-dd"),
    };

    console.log("Submitted Organization Data:", formattedData);

    // Add to table (mock)
    const newOrg = {
      id: organizations.length + 1,
      orgName: data.orgName,
      parentOrg: parentOrgs.find((p) => p.value === data.parentOrg)?.label || "N/A",
      startDate: format(data.effectiveStartDate, "yyyy-MM-dd"),
      endDate: format(data.effectiveEndDate, "yyyy-MM-dd"),
      status: data.status,
    };

    setOrganizations([...organizations, newOrg]);

    // Reset form
    form.reset({
      orgName: "",
      orgType: "",
      parentOrg: "",
      effectiveStartDate: new Date(),
      effectiveEndDate: new Date(
        new Date().setFullYear(new Date().getFullYear() + 100)
      ),
      status: "active",
    });
  };

  const handleSearch = () => {
    console.log("Searching for:", searchTerm);
    // Implement search logic here
  };

  const filteredOrgs = organizations.filter((org) =>
    org.orgName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-semibold tracking-tight text-gray-800 dark:text-gray-100 mb-8 flex items-center gap-2">
        <span className="p-2 rounded-md shadow-sm bg-primary/10 text-primary">
          <Building2 className="w-6 h-6" />
        </span>
        <span className="font-medium">Organization Management</span>
      </h1>

      {/* Form Card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Add New Organization</CardTitle>
          <CardDescription>
            Create a new organizational unit in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Org Name */}
                <FormField
                  control={form.control}
                  name="orgName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Organization Name <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter organization name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Org Type */}
                <FormField
                  control={form.control}
                  name="orgType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Organization Type <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select organization type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {orgTypes.map((type) => (
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

                {/* Parent Org */}
                <FormField
                  control={form.control}
                  name="parentOrg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parent Organization</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Search and select parent org" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {parentOrgs.map((org) => (
                            <SelectItem key={org.value} value={org.value}>
                              {org.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Status */}
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Status <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {statusOptions.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Effective Start Date */}
                <FormField
                  control={form.control}
                  name="effectiveStartDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Effective Start Date <span className="text-red-500">*</span>
                      </FormLabel>
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

                {/* Effective End Date */}
                <FormField
                  control={form.control}
                  name="effectiveEndDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Effective End Date <span className="text-red-500">*</span>
                      </FormLabel>
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

              {/* Form Actions */}
              <div className="flex justify-start gap-3">
                <Button type="submit">Save</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

     
    </div>
  );
}