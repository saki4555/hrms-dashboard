


import React, { useState } from "react";
import {
  User,
  MapPin,
  Briefcase,
  ShieldCheck,
  Pencil,
  Ban,
  FileText,
  Copy,
  Check,
  Building2,
  Clock,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Link, useParams, useNavigate } from "react-router";
import PageContainer from "@/components/page-container";

import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { useEmployeeById } from "../employee-management/queries";

const EmployeeDetailsPage = () => {
  const { empNo } = useParams();
  const navigate = useNavigate();
  
  // Fetch employee data
  const {
    data: employee,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useEmployeeById(empNo);

  // --- Utilities ---
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const calculateTenure = (joinDate) => {
    if (!joinDate) return "";
    const start = new Date(joinDate);
    const now = new Date();
    const diffTime = Math.abs(now - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 30) return `${diffDays} days`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`;
    return `${(diffDays / 365).toFixed(1)} years`;
  };

  const CopyButton = ({ text, label }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 ml-2 text-muted-foreground hover:text-foreground"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{copied ? "Copied!" : `Copy ${label}`}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const DataItem = ({
    label,
    value,
    subValue,
    className = "",
    fullWidth = false,
  }) => (
    <div
      className={`flex flex-col space-y-1 ${fullWidth ? "col-span-full" : ""} ${className}`}
    >
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium text-foreground flex items-center">
        {value || "—"}
        {subValue && (
          <span className="ml-2 text-xs text-muted-foreground font-normal">
            ({subValue})
          </span>
        )}
      </dd>
    </div>
  );

  const handleRefetch = () => {
    refetch();
  };

 

 


  
  // Loading State
  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-muted/30">
        <PageContainer>
           <Breadcrumb>
            <BreadcrumbList className="py-2">
              <BreadcrumbItem>Core HR</BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/core-hr/employees">Employee Management</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Employee Details</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <main className="flex-1 space-y-6">
            {/* 1. Header Profile Prototype */}
            <Card className="border-none shadow-sm overflow-hidden bg-card">
              {/* Banner Area */}
              <div className="h-32 bg-muted/50" />
              
              <div className="px-8 pb-8 relative">
                <div className="flex flex-col md:flex-row items-start md:items-end -mt-12 gap-6">
                  {/* Avatar Shape */}
                  <Skeleton className="h-32 w-32 rounded-full border-4 border-card shadow-sm" />
                  
                  {/* Name Block */}
                  <div className="flex-1 space-y-3 pb-2">
                    <Skeleton className="h-8 w-1/3" /> {/* Title/Name */}
                    <div className="flex gap-4">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-28" />
                    </div>
                  </div>

                  {/* Action Buttons Shape */}
                  <div className="flex gap-2">
                    <Skeleton className="h-9 w-24 rounded-md" />
                  
                  </div>
                </div>

                {/* Quick Stats Grid - Structural view */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mt-10 pt-6 border-t border-border/50">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="space-y-3">
                      <Skeleton className="h-3 w-12" /> {/* Label */}
                      <Skeleton className="h-4 w-20" /> {/* Value */}
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* 2. Navigation Tabs Prototype */}
            <div className="flex gap-1 border-b pb-px">
                <Skeleton className="h-10 w-28 rounded-t-md" />
                <Skeleton className="h-10 w-28 rounded-t-md" />
                <Skeleton className="h-10 w-28 rounded-t-md" />
            </div>

            {/* 3. Content Grid Prototype */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Main Content Block */}
                <Card className="lg:col-span-2 shadow-none border-dashed border-2 bg-transparent">
                    <CardHeader className="space-y-4">
                        <Skeleton className="h-6 w-40" />
                        <Skeleton className="h-3 w-full" />
                    </CardHeader>
                    <CardContent className="space-y-8">
                        {/* Two column detail rows */}
                        <div className="grid grid-cols-2 gap-x-12 gap-y-8">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="space-y-2">
                                    <Skeleton className="h-3 w-16" />
                                    <Skeleton className={`h-4 ${i % 2 === 0 ? 'w-full' : 'w-2/3'}`} />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Side Content Block */}
                <Card className="shadow-none border-dashed border-2 bg-transparent">
                    <CardHeader>
                         <Skeleton className="h-6 w-32" />
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="space-y-2">
                                <Skeleton className="h-3 w-20" />
                                <Skeleton className="h-4 w-24" />
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
          </main>
        </PageContainer>
      </div>
    );
  }

  // Error State
  if (isError) {
    return (
      <div className="flex flex-col min-h-screen bg-muted/30">
        <PageContainer>
          <Breadcrumb>
            <BreadcrumbList className="py-2">
              <BreadcrumbItem>Core HR</BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/core-hr/employees">Employee Management</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Employee Details</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          

          <main className="flex-1 pt-0">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error Loading Employee Details</AlertTitle>
              <AlertDescription className="mt-2 flex flex-col gap-2">
                <p>
                  {error?.message ||
                    "Failed to load employee details. Please try again."}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefetch}
                    disabled={isFetching}
                    className="w-fit"
                  >
                    {isFetching ? (
                      <>
                        <Spinner className="mr-2 h-4 w-4" />
                        Retrying...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Retry
                      </>
                    )}
                  </Button>
                  
                </div>
              </AlertDescription>
            </Alert>
          </main>
        </PageContainer>
      </div>
    );
  }

  // No data found
  if (!employee) {
    return (
      <div className="flex flex-col min-h-screen bg-muted/30">
        <PageContainer>
          <Breadcrumb>
            <BreadcrumbList className="py-2">
              <BreadcrumbItem>Core HR</BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/core-hr/employees">Employee Management</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Employee Details</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

         

          <main className="flex-1 pt-0">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Employee Not Found</AlertTitle>
              <AlertDescription className="mt-2">
                <p>The employee with ID "{empNo}" could not be found.</p>
                
              </AlertDescription>
            </Alert>
          </main>
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-muted/30">
      <PageContainer>
        {/* 0. Breadcrumbs (Standard Enterprise UX) */}
        <Breadcrumb>
          <BreadcrumbList className="py-2">
            <BreadcrumbItem>Core HR</BreadcrumbItem>
            <BreadcrumbSeparator />

            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/core-hr/employees">Employee Management</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />

            <BreadcrumbItem>
              <BreadcrumbPage>Employee Details</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center gap-2 mb-4">
          
          {isFetching && (
            <Badge variant="outline" className="gap-2">
              <Spinner className="h-3 w-3" />
              Refreshing...
            </Badge>
          )}
        </div>

        <main className="flex-1 pt-0 space-y-6">
          {/* 1. Unified Hero Profile Header */}
          <Card className="border-border shadow-sm overflow-hidden bg-card">
            {/* Decorative Banner Background */}
            <div className="h-32 bg-gradient-to-r from-muted/50 to-muted border-b border-border relative">
              <div className="absolute top-4 right-6 flex gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-background/60 backdrop-blur-md border-border hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
                <Button variant="destructive" size="sm" className="shadow-sm">
                  <Ban className="h-4 w-4 mr-2" />
                  Deactivate
                </Button>
              </div>
            </div>

            <div className="px-8 pb-8 relative">
              <div className="flex flex-col md:flex-row items-start md:items-end -mt-12 gap-6">
                {/* Avatar with Status Indicator */}
                <div className="relative">
                  <Avatar className="h-32 w-32 border-4 border-card shadow-md">
                    <AvatarImage
                      src={`https://api.dicebear.com/7.x/initials/svg?seed=${employee.FIRST_NAME}`}
                    />
                    <AvatarFallback className="text-2xl bg-muted text-muted-foreground">
                      {employee.FIRST_NAME?.[0] || ""}
                      {employee.LAST_NAME?.[0] || ""}
                    </AvatarFallback>
                  </Avatar>
                  <span
                    className={`absolute bottom-2 right-2 h-5 w-5 rounded-full border-4 border-card ${employee.STATUS === 1 ? "bg-green-500" : "bg-red-500"}`}
                  />
                </div>

                {/* Name & Title */}
                <div className="flex-1 pt-2 md:pt-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">
                      {employee.TITLE} {employee.FIRST_NAME}{" "}
                      {employee.LAST_NAME}
                    </h1>
                    {employee.STATUS === 1 ? (
                      <Badge
                        variant="outline"
                        className="border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400 px-3 py-0.5"
                      >
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="destructive">Inactive</Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground mt-2">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-4 w-4" />
                      <span>Engineering Dept</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {employee.TOWN_OF_BIRTH}, {employee.COUNTRY_OF_BIRTH}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      <span>Joined {formatDate(employee.JOIN_DATE)}</span>
                      <span className="bg-muted px-2 py-0.5 rounded text-xs text-muted-foreground font-medium border border-border">
                        {calculateTenure(employee.JOIN_DATE)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick ID Card */}
                <div className="hidden md:block bg-muted/50 p-3 rounded-lg border border-border">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Employee ID
                  </div>
                  <div className="flex items-center gap-2 font-mono text-lg font-medium text-foreground">
                    {employee.EMP_NO}
                    <CopyButton text={employee.EMP_NO} label="ID" />
                  </div>
                </div>
              </div>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mt-8 pt-6 border-t border-border">
                <DataItem label="Gender" value={employee.GENDER} />
                <DataItem
                  label="Date of Birth"
                  value={formatDate(employee.DATE_OF_BIRTH)}
                />
                <DataItem label="Nationality" value={employee.NATIONALITY} />
                <DataItem
                  label="Marital Status"
                  value={employee.MARRITIAL_STATUS === 1 ? "Married" : "Single"}
                />
                <div className="flex flex-col space-y-1">
                  <dt className="text-sm font-medium text-muted-foreground">
                    NID
                  </dt>
                  <dd className="text-sm font-medium text-foreground flex items-center">
                    {employee.NID}
                    <CopyButton text={employee.NID} label="NID" />
                  </dd>
                </div>
              </div>
            </div>
          </Card>

          {/* 3. Main Content Tabs */}
          <Tabs defaultValue="personal" className="w-full">
            <div className="flex items-center justify-between mb-4">
              <TabsList className="bg-background border shadow-sm p-1 h-auto">
                <TabsTrigger value="personal" className="px-6 py-2">
                  Personal
                </TabsTrigger>
                <TabsTrigger value="identification" className="px-6 py-2">
                  Identification
                </TabsTrigger>
                <TabsTrigger value="employment" className="px-6 py-2">
                  Employment
                </TabsTrigger>
                <TabsTrigger value="system" className="px-6 py-2">
                  System Audit
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="space-y-6">
              {/* Tab: Personal Information */}
              <TabsContent value="personal" className="mt-0">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="lg:col-span-2 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <User className="h-5 w-5 text-accent-foreground" />
                        Family Background
                      </CardTitle>
                      <CardDescription>
                        Details regarding parents and disability status.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <dl className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <DataItem
                          label="Father's Name"
                          value={employee.FATHERS_NAME}
                        />
                        <DataItem
                          label="Father's Name (Local)"
                          value={employee.FATHERS_NAME_B}
                          className="font-bengali"
                        />
                        <Separator className="col-span-full" />
                        <DataItem
                          label="Mother's Name"
                          value={employee.MOTHERS_NAME}
                        />
                        <DataItem
                          label="Mother's Name (Local)"
                          value={employee.MOTHERS_NAME_B}
                          className="font-bengali"
                        />
                        <Separator className="col-span-full" />
                        <DataItem
                          label="Disability Registered"
                          value={employee.REG_DISABILITY === 0 ? "No" : "Yes"}
                          className={
                            employee.REG_DISABILITY === 1
                              ? "text-amber-600"
                              : ""
                          }
                        />
                      </dl>
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <MapPin className="h-5 w-5 text-accent-foreground" />
                        Place of Birth
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <dl className="space-y-6">
                        <DataItem
                          label="Country"
                          value={employee.COUNTRY_OF_BIRTH}
                        />
                        <DataItem
                          label="Region / Division"
                          value={employee.REGION_OF_BIRTH}
                        />
                        <DataItem
                          label="Town / City"
                          value={employee.TOWN_OF_BIRTH}
                        />
                      </dl>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Tab: Identification */}
              <TabsContent value="identification" className="mt-0">
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <FileText className="h-5 w-5 text-accent-foreground" />
                      Official Documents
                    </CardTitle>
                    <CardDescription>
                      Government issued identification details.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <dl className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="bg-muted/30 p-4 rounded-lg border">
                        <DataItem
                          label="National ID (NID)"
                          value={employee.NID}
                        />
                      </div>
                      <div className="bg-muted/30 p-4 rounded-lg border">
                        <DataItem
                          label="Birth Registration"
                          value={employee.BIRTH_REG_NO}
                        />
                      </div>
                      <div className="bg-muted/30 p-4 rounded-lg border border-dashed">
                        <DataItem label="Passport Number" value={null} />
                      </div>
                    </dl>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab: Employment */}
              <TabsContent value="employment" className="mt-0">
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Briefcase className="h-5 w-5 text-accent-foreground" />
                      Employment Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                      <DataItem
                        label="Join Date"
                        value={formatDate(employee.JOIN_DATE)}
                      />
                      <DataItem
                        label="Current Status"
                        value={employee.STATUS === 1 ? "Active" : "Inactive"}
                        className={
                          employee.STATUS === 1
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      />
                      <Separator className="col-span-full" />
                      <DataItem
                        label="Effective Start Date"
                        value={formatDate(employee.EFFECTIVE_START_DATE)}
                      />
                      <DataItem
                        label="Effective End Date"
                        value={formatDate(employee.EFFECTIVEEND_DATE)}
                      />
                    </dl>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab: System / Audit */}
              <TabsContent value="system" className="mt-0">
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <ShieldCheck className="h-5 w-5 text-accent-foreground" />
                      System Metadata
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0">
                        <div className="p-4">
                          <DataItem
                            label="Person ID"
                            value={employee.PERSON_ID}
                            className="font-mono"
                          />
                        </div>
                        <div className="p-4">
                          <DataItem
                            label="Created On"
                            value={formatDate(employee.CREATION_DATE)}
                          />
                        </div>
                        <div className="p-4">
                          <DataItem
                            label="Last Updated By"
                            value={employee.LAST_UPDATE_BY}
                          />
                        </div>
                        <div className="p-4">
                          <DataItem
                            label="Last Updated On"
                            value={formatDate(employee.LAST_UPDATE_DATE)}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </main>
      </PageContainer>
    </div>
  );
};

export default EmployeeDetailsPage;