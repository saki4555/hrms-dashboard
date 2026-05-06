// src\features\core-hr\employee-management\EmployeeDetailsPage.jsx
import { useRef, useState } from "react";
import { format } from "date-fns";

import { Camera, Loader2 } from "lucide-react";
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
  Home,
  Layers,
  ChevronDown,
  IdCard,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Link, useParams } from "react-router";
import PageContainer from "@/components/page-container";

import { useConfirmationDialog } from "@/hooks/useConfirmationDialog";
import { useEmployeeById } from "./queries";
import { useAuditHistory } from "./core-hr.queries";

import { EditPersonalSheet } from "./components/edit-personal-sheet";
import { EditEmploymentSheet } from "./components/edit-employment-sheet";
import { EditAssignmentSheet } from "./components/edit-assignment-sheet";
import { EditAddressSheet } from "./components/edit-address-sheet";

// ─── Small shared display helpers ─────────────────────────────────────────────

const formatDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const calculateTenure = (joinDate) => {
  if (!joinDate) return "";
  const days = Math.ceil(Math.abs(new Date() - new Date(joinDate)) / 86400000);
  if (days < 30) return `${days} days`;
  if (days < 365) return `${Math.floor(days / 30)} months`;
  return `${(days / 365).toFixed(1)} years`;
};

function CopyButton({ text, label }) {
  const [copied, setCopied] = useState(false);
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 ml-2 text-muted-foreground hover:text-foreground"
            onClick={() => {
              navigator.clipboard.writeText(text);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
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
}

function DataItem({
  label,
  value,
  subValue,
  className = "",
  fullWidth = false,
}) {
  return (
    <div
      className={`flex flex-col space-y-1 ${fullWidth ? "col-span-full" : ""} ${className}`}
    >
      <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </dt>
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
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function HeroSkeleton() {
  return (
    <Card className="border-none shadow-sm overflow-hidden bg-card">
      <div className="h-32 bg-muted/50" />
      <div className="px-8 pb-8 relative">
        <div className="flex flex-col md:flex-row items-start md:items-end -mt-12 gap-6">
          <Skeleton className="h-32 w-32 rounded-full border-4 border-card shadow-sm" />
          <div className="flex-1 space-y-3 pb-2">
            <Skeleton className="h-8 w-1/3" />
            <div className="flex gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
          <Skeleton className="h-9 w-36 rounded-md" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mt-10 pt-6 border-t border-border/50">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

// ─── Edit dropdown ────────────────────────────────────────────────────────────

function EditDropdown({ onSelect }) {
  const items = [
    {
      key: "personal",
      icon: <IdCard className="h-3.5 w-3.5 text-violet-600" />,
      bg: "bg-violet-500/10",
      label: "Personal Details",
    },
    {
      key: "employment",
      icon: <Briefcase className="h-3.5 w-3.5 text-blue-600" />,
      bg: "bg-blue-500/10",
      label: "Employment Record",
    },
    {
      key: "assignment",
      icon: <Building2 className="h-3.5 w-3.5 text-emerald-600" />,
      bg: "bg-emerald-500/10",
      label: "Assignment",
    },
    {
      key: "address",
      icon: <Home className="h-3.5 w-3.5 text-orange-600" />,
      bg: "bg-orange-500/10",
      label: "Addresses",
    },
  ];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-background/60 backdrop-blur-md border-border hover:bg-accent transition-colors"
        >
          <Pencil className="h-4 w-4 mr-2" /> Edit Profile{" "}
          <ChevronDown className="h-3.5 w-3.5 ml-2 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          Select section to edit
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.map(({ key, icon, bg, label }) => (
          <DropdownMenuItem
            key={key}
            className="gap-2.5 cursor-pointer"
            onClick={() => onSelect(key)}
          >
            <div className={`p-1 rounded ${bg}`}>{icon}</div>
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const EmployeeDetailsPage = () => {
  const { empNo } = useParams();
  const {
    data: employee,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useEmployeeById(empNo);
  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();
  const [activeSheet, setActiveSheet] = useState(null);

  const sharedSheetProps = {
    employee,
    onClose: () => setActiveSheet(null),
    showConfirmation,
  };

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-muted/30">
        <PageContainer>
          <PageBreadcrumb />
          <main className="flex-1 space-y-6">
            <HeroSkeleton />
          </main>
        </PageContainer>
      </div>
    );
  }

  // ── Error ──
  if (isError) {
    return (
      <div className="flex flex-col min-h-screen bg-muted/30">
        <PageContainer>
          <main className="flex-1 pt-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error Loading Employee Details</AlertTitle>
              <AlertDescription className="mt-2 flex flex-col gap-2">
                <p>{error?.message || "Failed to load employee details."}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  disabled={isFetching}
                  className="w-fit"
                >
                  {isFetching ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      Retrying…
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Retry
                    </>
                  )}
                </Button>
              </AlertDescription>
            </Alert>
          </main>
        </PageContainer>
      </div>
    );
  }

  // ── Not found ──
  if (!employee) {
    return (
      <div className="flex flex-col min-h-screen bg-muted/30">
        <PageContainer>
          <main className="flex-1 pt-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Employee Not Found</AlertTitle>
              <AlertDescription className="mt-2">
                The employee with ID "{empNo}" could not be found.
              </AlertDescription>
            </Alert>
          </main>
        </PageContainer>
      </div>
    );
  }

  const { assignment, presentAddress, permanentAddress, personType } = employee;

  return (
    <div className="flex flex-col min-h-screen bg-muted/30">
      <PageContainer>
        <PageBreadcrumb />

        {isFetching && (
          <div className="mb-2">
            <Badge variant="outline" className="gap-2">
              <Spinner className="h-3 w-3" />
              Refreshing…
            </Badge>
          </div>
        )}

        <main className="flex-1 pt-0 space-y-6">
          {/* ── Hero Card ── */}
          <Card className="border-border shadow-sm overflow-hidden bg-card">
            <div className="h-32 bg-gradient-to-r from-muted/50 to-muted border-b border-border relative">
              <div className="absolute top-4 right-6 flex gap-3">
                <EditDropdown onSelect={setActiveSheet} />
                <Button variant="destructive" size="sm" className="shadow-sm">
                  <Ban className="h-4 w-4 mr-2" /> Deactivate
                </Button>
              </div>
            </div>

            <div className="px-8 pb-8 relative">
              <div className="flex flex-col md:flex-row items-start md:items-end -mt-12 gap-6">
                {/* Avatar */}
                <EmployeeAvatar employee={employee} />

                {/* Name / title / meta */}
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
                    {personType && (
                      <Badge variant="secondary" className="px-3 py-0.5">
                        {personType.PERSON_TYPE}
                      </Badge>
                    )}
                  </div>
                  {assignment && (
                    <p className="text-base font-medium text-foreground/80 mb-2">
                      {assignment.POSITION_TITLE}
                      <span className="text-muted-foreground font-normal">
                        {" "}
                        · {assignment.ORG_NAME} · {assignment.COMPANY_NAME}
                      </span>
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground mt-1">
                    {assignment && (
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-4 w-4" />
                        <span>{assignment.COMPANY_NAME}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {employee.TOWN_OF_BIRTH}, {employee.COUNTRY_OF_BIRTH}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      <span>Joined {formatDate(employee.JOIN_DATE)}</span>
                      <span className="bg-muted px-2 py-0.5 rounded text-xs font-medium border border-border">
                        {calculateTenure(employee.JOIN_DATE)}
                      </span>
                    </div>
                    {assignment?.GRADE_NAME && (
                      <div className="flex items-center gap-1.5">
                        <Layers className="h-4 w-4" />
                        <span>
                          {assignment.GRADE_NAME} ·{" "}
                          {assignment.POSITION_LEVEL?.toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Employee ID chip */}
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

              {/* Quick-stats row */}
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
                  <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
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

          {/* ── Tabs ── */}
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="bg-background border shadow-sm p-1 h-auto mb-4">
              {[
                "personal",
                "address",
                "identification",
                "employment",
                "system",
                "audit",
              ].map((t) => (
                <TabsTrigger key={t} value={t} className="px-5 py-2 capitalize">
                  {t === "system"
                    ? "System Audit"
                    : t === "audit"
                      ? "Audit History"
                      : t}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Personal */}
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
                          employee.REG_DISABILITY === 1 ? "text-amber-600" : ""
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

            {/* Address */}
            <TabsContent value="address" className="mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AddressCard
                  title="Present Address"
                  address={presentAddress}
                  formatDate={formatDate}
                />
                <AddressCard
                  title="Permanent Address"
                  address={permanentAddress}
                  formatDate={formatDate}
                />
              </div>
            </TabsContent>

            {/* Identification */}
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
                  <dl className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-muted/30 p-4 rounded-lg border">
                      <DataItem
                        label="National ID (NID)"
                        value={employee.NID}
                      />
                    </div>
                    <div className="bg-muted/30 p-4 rounded-lg border">
                      <DataItem
                        label="Birth Registration No."
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

            {/* Employment */}
            <TabsContent value="employment" className="mt-0 space-y-6">
              {assignment && (
                <AssignmentCard
                  assignment={assignment}
                  formatDate={formatDate}
                />
              )}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Clock className="h-5 w-5 text-accent-foreground" />
                    Employment Record
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

            {/* System */}
            <TabsContent value="system" className="mt-0">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ShieldCheck className="h-5 w-5 text-accent-foreground" />
                    System Metadata
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="rounded-md border">
                    <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0">
                      <div className="p-4">
                        <DataItem
                          label="Person ID"
                          value={employee.PERSON_ID?.toString()}
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
                          value={employee.LAST_UPDATE_BY?.toString()}
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
                  {personType && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                          Person Classification
                        </h3>
                        <dl className="grid grid-cols-2 md:grid-cols-3 gap-6">
                          <DataItem
                            label="Person Type"
                            value={personType.PERSON_TYPE}
                          />
                          <DataItem
                            label="Person Type ID"
                            value={personType.PERSON_TYPE_ID?.toString()}
                          />
                        </dl>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            {/* Audit */}
            <TabsContent value="audit" className="mt-0">
  <AuditHistoryTab personId={employee.PERSON_ID} />
</TabsContent>
          </Tabs>
        </main>
      </PageContainer>

      {/* ── Edit Sheets ── */}
      <EditPersonalSheet
        {...sharedSheetProps}
        open={activeSheet === "personal"}
      />
      <EditEmploymentSheet
        {...sharedSheetProps}
        open={activeSheet === "employment"}
      />
      <EditAssignmentSheet
        {...sharedSheetProps}
        open={activeSheet === "assignment"}
      />
      <EditAddressSheet
        {...sharedSheetProps}
        open={activeSheet === "address"}
      />

      <ConfirmationDialog />
    </div>
  );
};

export default EmployeeDetailsPage;

// ─── Sub-components for tabs (kept inline — small enough) ─────────────────────

function PageBreadcrumb() {
  return (
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
  );
}

// function DataItem({ label, value, subValue, className = "", fullWidth = false }) {
//   return (
//     <div className={`flex flex-col space-y-1 ${fullWidth ? "col-span-full" : ""} ${className}`}>
//       <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</dt>
//       <dd className="text-sm font-medium text-foreground flex items-center">
//         {value || "—"}
//         {subValue && <span className="ml-2 text-xs text-muted-foreground font-normal">({subValue})</span>}
//       </dd>
//     </div>
//   );
// }

function AddressCard({ title, address, formatDate }) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Home className="h-5 w-5 text-accent-foreground" />
          {title}
        </CardTitle>
        <CardDescription>
          {address
            ? `Valid: ${formatDate(address.EFFECTIVE_START_DATE)} – ${formatDate(address.EFFECTIVEEND_DATE)}`
            : `No ${title.toLowerCase()} on record.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {address ? (
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DataItem label="Address Line" value={address.ADDRESS1} fullWidth />
            <DataItem
              label="Address (Local)"
              value={address.ADDRESS1_B}
              className="font-bengali"
            />
            <DataItem label="Area" value={address.AREA} />
            <DataItem label="Union" value={address.UNIONS} />
            <DataItem label="Upazilla" value={address.UPAZILLA} />
            <DataItem label="District" value={address.DISTRICT} />
            <DataItem label="Division / Region" value={address.REGION} />
            <DataItem label="Country" value={address.COUNTRY} />
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground">No address recorded.</p>
        )}
      </CardContent>
    </Card>
  );
}

function AssignmentCard({ assignment, formatDate }) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Briefcase className="h-5 w-5 text-accent-foreground" />
          Assignment Details
        </CardTitle>
        <CardDescription>
          Current position assignment · ID: {assignment.ASSIGNMENT_ID}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Organisation
          </h3>
          <dl className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-muted/30 p-4 rounded-lg border">
              <DataItem label="Company" value={assignment.COMPANY_NAME} />
              <p className="text-xs text-muted-foreground mt-1">
                {assignment.COMPANY_ADDRESS}
              </p>
            </div>
            <div className="bg-muted/30 p-4 rounded-lg border">
              <DataItem
                label="Organisation Unit"
                value={assignment.ORG_NAME}
                subValue={`ID: ${assignment.ORG_ID}`}
              />
            </div>
            <div className="bg-muted/30 p-4 rounded-lg border">
              <DataItem
                label="Payroll"
                value={`Payroll #${assignment.PAYROLL_ID}`}
              />
            </div>
          </dl>
        </div>
        <Separator />
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Position & Grade
          </h3>
          <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <DataItem
              label="Position Title"
              value={assignment.POSITION_TITLE}
            />
            <DataItem
              label="Position Level"
              value={assignment.POSITION_LEVEL?.toUpperCase()}
            />
            <DataItem label="Grade" value={assignment.GRADE_NAME} />
            <DataItem
              label="Position ID"
              value={assignment.POSITION_ID?.toString()}
            />
          </dl>
        </div>
        <Separator />
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Assignment Period
          </h3>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DataItem
              label="Effective Start Date"
              value={formatDate(assignment.EFFECTIVE_START_DATE)}
            />
            <DataItem
              label="Effective End Date"
              value={formatDate(assignment.EFFECTIVE_END_DATE)}
            />
          </dl>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Employee Avatar with Upload ──────────────────────────────────────────────
function EmployeeAvatar({ employee }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState(
    `${import.meta.env.VITE_API_BASE_URL}/api/emp-images/person/${employee.PERSON_ID}`,
  );
  console.log("imageurl", imageUrl);
  const [hasImage, setHasImage] = useState(false); // optimistic — fallback handles 404

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    setUploading(true);
    try {
      // Try PUT first (update), fall back to POST (create)
      let res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/emp-images/${employee.PERSON_ID}`,
        { method: "PUT", body: formData },
      );

      if (res.status === 404) {
        res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/emp-images/${employee.PERSON_ID}`,
          { method: "POST", body: formData },
        );
      }

      if (!res.ok) throw new Error("Upload failed");

      // Bust the cache so the img tag re-fetches
      setImageUrl(
        `${import.meta.env.VITE_API_BASE_URL}/api/emp-images/person/${employee.PERSON_ID}?t=${Date.now()}`,
      );
      setHasImage(true);
    } catch (err) {
      console.error("Image upload failed:", err);
    } finally {
      setUploading(false);
      // Reset input so the same file can be re-selected
      e.target.value = "";
    }
  };

  return (
    <div className="relative group">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleUpload}
      />

      {/* Avatar */}
      <Avatar className="h-32 w-32 border-4 border-card shadow-md">
        <AvatarImage
          src={imageUrl}
          onLoad={() => setHasImage(true)}
          onError={() => setHasImage(false)}
        />

        <AvatarFallback className="text-2xl bg-muted text-muted-foreground">
          {employee.FIRST_NAME?.[0]}
          {employee.LAST_NAME?.[0]}
        </AvatarFallback>
      </Avatar>

      {/* Camera overlay — visible on hover or while uploading */}
      <button
        type="button"
        disabled={uploading}
        onClick={() => fileInputRef.current?.click()}
        className="
          absolute inset-0 rounded-full
          flex flex-col items-center justify-center gap-1
          bg-black/50 backdrop-blur-[2px]
          opacity-0 group-hover:opacity-100
          transition-opacity duration-200
          cursor-pointer border-4 border-card
          disabled:cursor-not-allowed
        "
      >
        {uploading ? (
          <>
            <Loader2 className="h-6 w-6 text-white animate-spin" />
            <span className="text-white text-[10px] font-medium">
              Uploading
            </span>
          </>
        ) : (
          <>
            <Camera className="h-6 w-6 text-white" />
            <span className="text-white text-[10px] font-medium">
              {hasImage ? "Change" : "Upload"}
            </span>
          </>
        )}
      </button>

      {/* Status dot */}
      <span
        className={`
          absolute bottom-2 right-2 h-5 w-5 rounded-full 
          border-4 border-card z-10
          ${employee.STATUS === 1 ? "bg-green-500" : "bg-red-500"}
        `}
      />
    </div>
  );
}



function AuditHistoryTab({ personId }) {
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading, isError } = useAuditHistory(personId, { page, limit });

  const logs    = data?.data       ?? [];
  const total   = data?.pagination?.total      ?? 0;
  const totalPages = data?.pagination?.totalPages ?? 1;

  const formatDateTime = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleString("en-GB", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  // Badge color per operation
  const operationVariant = (op) => {
    if (["TERMINATION", "END_EMPLOYMENT"].includes(op)) return "destructive";
    if (op === "REINSTATE")   return "outline";
    if (op === "TRANSFER")    return "secondary";
    if (["INCREMENT", "PROMOTION"].includes(op)) return "outline";
    return "secondary";
  };

  if (isLoading) return (
    <Card className="shadow-sm">
      <CardContent className="flex justify-center py-12">
        <Spinner className="h-6 w-6" />
      </CardContent>
    </Card>
  );

  if (isError) return (
    <Card className="shadow-sm">
      <CardContent className="py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Failed to load audit history</AlertTitle>
        </Alert>
      </CardContent>
    </Card>
  );

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ShieldCheck className="h-5 w-5 text-accent-foreground" />
          Audit History
        </CardTitle>
        <CardDescription>
          All HR actions performed on this employee — {total} record{total !== 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No audit records found.
          </p>
        ) : (
          <div className="space-y-4">
            {/* Timeline */}
            <div className="relative space-y-0">
              {logs.map((log, idx) => (
                <div key={log.auditId} className="flex gap-4 pb-6 relative">
                  {/* Line */}
                  {idx !== logs.length - 1 && (
                    <div className="absolute left-[15px] top-8 bottom-0 w-px bg-border" />
                  )}

                  {/* Dot */}
                  <div className="relative z-10 flex-shrink-0 w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 bg-muted/30 rounded-lg border border-border p-4 space-y-3">
                    {/* Header row */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={operationVariant(log.operation)}>
                        {log.operation}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        on <strong className="text-foreground">{log.table}</strong>
                      </span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {formatDateTime(log.changedOn)}
                      </span>
                    </div>

                    {/* Changed by */}
                    <p className="text-xs text-muted-foreground">
                      By <span className="font-medium text-foreground">{log.changedBy}</span>
                    </p>

                    {/* Old → New values */}
                    {(log.oldValues || log.newValues) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                        {log.oldValues && Object.keys(log.oldValues).length > 0 && (
                          <div className="bg-red-500/5 border border-red-500/20 rounded-md p-3">
                            <p className="text-[10px] font-semibold text-red-500 uppercase tracking-wider mb-2">Before</p>
                            <dl className="space-y-1">
                              {Object.entries(log.oldValues).map(([k, v]) => (
                                <div key={k} className="flex gap-2 text-xs">
                                  <dt className="text-muted-foreground shrink-0">{k}:</dt>
                                  <dd className="font-medium truncate">{String(v ?? "—")}</dd>
                                </div>
                              ))}
                            </dl>
                          </div>
                        )}
                        {log.newValues && Object.keys(log.newValues).length > 0 && (
                          <div className="bg-green-500/5 border border-green-500/20 rounded-md p-3">
                            <p className="text-[10px] font-semibold text-green-600 uppercase tracking-wider mb-2">After</p>
                            <dl className="space-y-1">
                              {Object.entries(log.newValues).map(([k, v]) => (
                                <div key={k} className="flex gap-2 text-xs">
                                  <dt className="text-muted-foreground shrink-0">{k}:</dt>
                                  <dd className="font-medium truncate">{String(v ?? "—")}</dd>
                                </div>
                              ))}
                            </dl>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline" size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline" size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}