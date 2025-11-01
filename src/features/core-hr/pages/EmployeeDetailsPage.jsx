

import React from "react";
import { useParams } from "react-router";


import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Briefcase,
  Home,
  MapPin,
  Calendar,
  Mail,
  Phone,
  IdCard,
  Users,
  Building2,
  Globe,
  Heart,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useEmployee } from "../hooks/useEmployee";




export default function EmployeeDetailsPage() {
  const { empNo } = useParams();
  
  const { data: employee, isLoading, error } = useEmployee(empNo)

  console.log({employee}, "coming from employee details page");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading employee details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-3">
            <XCircle className="w-12 h-12 text-destructive mx-auto" />
            <p className="text-destructive font-medium">Error loading employee</p>
            <p className="text-sm text-muted-foreground">{error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-3">
            <User className="w-12 h-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">No employee found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const fullName = `${employee.TITLE || ""} ${employee.FIRST_NAME} ${employee.LAST_NAME}`.trim();
  const initials = (employee.FIRST_NAME?.[0] || "") + (employee.LAST_NAME?.[0] || "");

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-background via-background to-muted border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
            {/* Avatar Section */}
            <div className="relative">
              <Avatar className="h-24 w-24 sm:h-32 sm:w-32 ring-4 ring-background shadow-xl">
                <AvatarImage src={employee.PHOTO_URL || ""} alt={fullName} />
                <AvatarFallback className="text-2xl sm:text-3xl font-semibold bg-gradient-to-br from-primary/20 to-primary/5">
                  {initials.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {employee.STATUS === "1" && (
                <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1.5 ring-4 ring-background">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
              )}
            </div>

            {/* Info Section */}
            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
                  {fullName}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <IdCard className="w-4 h-4" />
                    <span className="text-sm font-medium">EMP-{employee.EMP_NO}</span>
                  </div>
                  {employee.PERSON_TYPE_NAME && (
                    <>
                      <Separator orientation="vertical" className="h-4" />
                      <div className="flex items-center gap-1.5">
                        <Briefcase className="w-4 h-4" />
                        <span className="text-sm">{employee.PERSON_TYPE_NAME}</span>
                      </div>
                    </>
                  )}
                  {employee.JOIN_DATE && (
                    <>
                      <Separator orientation="vertical" className="h-4" />
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">Joined {employee.JOIN_DATE}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={employee.STATUS === "1" ? "success" : "destructive"}
                  className="px-3 py-1"
                >
                  {employee.STATUS === "1" ? "Active" : "Inactive"}
                </Badge>
                {employee.GENDER && (
                  <Badge variant="outline" className="px-3 py-1">
                    {employee.GENDER}
                  </Badge>
                )}
                {employee.NATIONALITY && (
                  <Badge variant="outline" className="px-3 py-1">
                    <Globe className="w-3 h-3 mr-1" />
                    {employee.NATIONALITY}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Personal Information */}
        <Card>
          <CardContent className="p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/10 rounded-lg">
                <User className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold">Personal Information</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <InfoField icon={Users} label="Father's Name" value={employee.FATHERS_NAME} />
              <InfoField icon={Users} label="Father's Name (Bangla)" value={employee.FATHERS_NAME_B} />
              <InfoField icon={Heart} label="Mother's Name" value={employee.MOTHERS_NAME} />
              <InfoField icon={Heart} label="Mother's Name (Bangla)" value={employee.MOTHERS_NAME_B} />
              <InfoField icon={Calendar} label="Date of Birth" value={employee.DATE_OF_BIRTH} />
              <InfoField icon={IdCard} label="NID" value={employee.NID} />
              <InfoField icon={IdCard} label="Birth Registration No" value={employee.BIRTH_REG_NO} />
              <InfoField icon={MapPin} label="Town of Birth" value={employee.TOWN_OF_BIRTH} />
              <InfoField icon={Globe} label="Region of Birth" value={employee.REGION_OF_BIRTH} />
              <InfoField icon={Globe} label="Country of Birth" value={employee.COUNTRY_OF_BIRTH} />
              <InfoField icon={User} label="Marital Status" value={employee.MARITAL_STATUS} />
              <InfoField icon={Globe} label="Nationality" value={employee.NATIONALITY} />
            </div>
          </CardContent>
        </Card>

        {/* Employment Information */}
        <Card>
          <CardContent className="p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Briefcase className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold">Employment Information</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <InfoField icon={Calendar} label="Join Date" value={employee.JOIN_DATE} />
              <InfoField icon={Building2} label="Person Type" value={employee.PERSON_TYPE_NAME} />
              <InfoField icon={User} label="Registered Disability" value={employee.REG_DISABILITY === 1 ? "Yes" : "No"} />
              <InfoField icon={Calendar} label="Effective Start Date" value={employee.EFFECTIVE_START_DATE} />
            </div>
          </CardContent>
        </Card>

        {/* Addresses Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Present Address */}
          <Card>
            <CardContent className="p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Home className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl sm:text-2xl font-semibold">Present Address</h2>
              </div>
              <div className="space-y-5">
                <InfoField label="Address" value={employee.PRESENT_ADDRESS1} />
                <InfoField label="Address (Bangla)" value={employee.PRESENT_ADDRESS1_B} />
                <Separator />
                <div className="grid gap-4">
                  <InfoField icon={Globe} label="Country" value={employee.PRESENT_COUNTRY} />
                  <InfoField icon={MapPin} label="Region" value={employee.PRESENT_REGION} />
                  <InfoField icon={MapPin} label="District" value={employee.PRESENT_DISTRICT} />
                  <InfoField icon={MapPin} label="Upazilla" value={employee.PRESENT_UPAZILLA} />
                  <InfoField icon={MapPin} label="Unions" value={employee.PRESENT_UNIONS} />
                  <InfoField icon={MapPin} label="Area/Village" value={employee.PRESENT_AREA} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Permanent Address */}
          <Card>
            <CardContent className="p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl sm:text-2xl font-semibold">Permanent Address</h2>
              </div>
              <div className="space-y-5">
                <InfoField label="Address" value={employee.PERMANENT_ADDRESS1} />
                <InfoField label="Address (Bangla)" value={employee.PERMANENT_ADDRESS1_B} />
                <Separator />
                <div className="grid gap-4">
                  <InfoField icon={Globe} label="Country" value={employee.PERMANENT_COUNTRY} />
                  <InfoField icon={MapPin} label="Region" value={employee.PERMANENT_REGION} />
                  <InfoField icon={MapPin} label="District" value={employee.PERMANENT_DISTRICT} />
                  <InfoField icon={MapPin} label="Upazilla" value={employee.PERMANENT_UPAZILLA} />
                  <InfoField icon={MapPin} label="Unions" value={employee.PERMANENT_UNIONS} />
                  <InfoField icon={MapPin} label="Area/Village" value={employee.PERMANENT_AREA} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoField({ icon: Icon, label, value }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
        {Icon && <Icon className="w-3.5 h-3.5" />}
        {label}
      </label>
      <div className="text-sm sm:text-base font-medium text-foreground">
        {value || <span className="text-muted-foreground italic">Not provided</span>}
      </div>
    </div>
  );
}