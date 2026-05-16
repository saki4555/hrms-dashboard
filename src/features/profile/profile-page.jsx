// src/features/profile/ProfilePage.jsx
import { useRef, useState } from "react";
import { useAuthV2 } from "@/features/authentication-v2/use-auth-v2";
import { useEmployeeById } from "@/features/core-hr/employee-management/queries";
import { useChangePassword } from "@/features/user-management/queries";
import { useUserById } from "@/features/user-management/queries";
import { cn } from "@/lib/utils";
import { getAvatarColor } from "@/lib/avatar-utils";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Camera, Loader2 } from "lucide-react";

import PageContainer from "@/components/page-container";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  User, Briefcase, ShieldCheck, Lock,
  MapPin, Clock, Layers, Eye, EyeOff,
  Building2, IdCard,
} from "lucide-react";

// ── Password schema ───────────────────────────────────────────────────────────
const passwordSchema = z
  .object({
    newPassword:     z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// ── Default notification prefs ────────────────────────────────────────────────
const DEFAULT_PREFS = {
  LEAVE_STATUS_CHANGED:       true,
  PAYSLIP_AVAILABLE:          true,
  ATTENDANCE_CORRECTION:      true,
  LOAN_STATUS_CHANGED:        true,
  TEAM_LEAVE_REQUEST:         true,
  TEAM_LATE_REQUEST:          true,
  TEAM_ATTENDANCE_CORRECTION: true,
  TEAM_LOAN_REQUEST:          true,
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatDate = (d) => {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
};

const maritalLabel = (val) => {
  if (val === null || val === undefined) return null;
  return val === 1 ? "Married" : "Single";
};

const calculateTenure = (joinDate) => {
  if (!joinDate) return null;
  const days = Math.ceil(Math.abs(new Date() - new Date(joinDate)) / 86400000);
  if (days < 30)  return `${days}d`;
  if (days < 365) return `${Math.floor(days / 30)}mo`;
  return `${(days / 365).toFixed(1)}yr`;
};

// ── Compact data item (dense, for info-heavy sections) ────────────────────────
function CompactItem({ label, value, bangla = false }) {
  return (
    <div className="flex flex-col gap-0.5 py-2 border-b border-border/50 last:border-0">
      <dt className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
        {label}
      </dt>
      <dd className={cn(
        "text-sm font-medium",
        value ? "text-foreground" : "text-muted-foreground/40",
        bangla && "font-normal"
      )}>
        {value ?? "—"}
      </dd>
    </div>
  );
}

// ── Standard data item (spacious, for sparse sections) ───────────────────────
function DataItem({ label, value }) {
  return (
    <div className="flex flex-col space-y-1">
      <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </dt>
      <dd className="text-sm font-medium text-foreground">{value || "—"}</dd>
    </div>
  );
}

// ── Section heading ───────────────────────────────────────────────────────────
function SectionHeading({ children }) {
  return (
    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
      {children}
    </h3>
  );
}

// ── Info block (labelled bordered box) ───────────────────────────────────────
function InfoBlock({ icon: Icon, title, children }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 overflow-hidden">
      {title && (
        <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-border bg-muted/30">
          {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {title}
          </span>
        </div>
      )}
      <div className="px-4">{children}</div>
    </div>
  );
}

// ── Address block ─────────────────────────────────────────────────────────────
function AddressBlock({ label, address, icon: Icon }) {
  const hasAny = address && (
    address.ADDRESS1 || address.AREA || address.UPAZILLA ||
    address.DISTRICT || address.REGION || address.COUNTRY
  );
  return (
    <InfoBlock icon={Icon} title={label}>
      {hasAny ? (
        <div className="grid grid-cols-2 divide-x divide-border/50">
          <div className="pr-4">
            <CompactItem label="Address"         value={address.ADDRESS1} />
            <CompactItem label="Address (বাংলা)" value={address.ADDRESS1_B} bangla />
            <CompactItem label="Area"            value={address.AREA} />
            <CompactItem label="Unions"          value={address.UNIONS} />
          </div>
          <div className="pl-4">
            <CompactItem label="Upazilla" value={address.UPAZILLA} />
            <CompactItem label="District" value={address.DISTRICT} />
            <CompactItem label="Region"   value={address.REGION} />
            <CompactItem label="Country"  value={address.COUNTRY} />
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground py-3">No address on record.</p>
      )}
    </InfoBlock>
  );
}

// ── Profile skeleton ──────────────────────────────────────────────────────────
function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <Card className="shadow-sm overflow-hidden">
        <div className="h-32 bg-muted/50" />
        <div className="px-8 pb-8 relative">
          <div className="flex items-end -mt-12 gap-6">
            <Skeleton className="h-32 w-32 rounded-full border-4 border-card" />
            <div className="space-y-2 pb-2 flex-1">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-56" />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-6 mt-8 pt-6 border-t border-border">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
      </Card>
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

// ── Smart profile avatar with upload ─────────────────────────────────────────
/**
 * Image upload priority:
 *   1. user.employee_id (person_id) — for employees with a linked HR record
 *   2. user.id                      — for admin/system users with no employee record
 *
 * The GET endpoint is always /api/emp-images/person/{id} for display.
 * PUT/POST uses the same id for upload.
 */
function ProfileAvatar({ user, initials, avatarColor }) {
  const fileInputRef = useRef(null);
  const [uploading,  setUploading]  = useState(false);
  const BASE = import.meta.env.VITE_API_BASE_URL;

  // Which ID to use for the image endpoint
  const imageId = user?.employee_id ?? user?.id;

  const [imgSrc,    setImgSrc]    = useState(
    imageId ? `${BASE}/api/emp-images/person/${imageId}` : null,
  );
  const [imgFailed, setImgFailed] = useState(!imageId);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // employee_id (person_id) takes priority; fall back to system user id
    const uploadId = user?.employee_id ?? user?.id;

    const formData = new FormData();
    formData.append("image", file);
    setUploading(true);
    try {
      // PUT first (update existing record), 404 → POST (create new)
      let res = await fetch(`${BASE}/api/emp-images/${uploadId}`, {
        method: "PUT",
        body: formData,
      });
      if (res.status === 404) {
        res = await fetch(`${BASE}/api/emp-images/${uploadId}`, {
          method: "POST",
          body: formData,
        });
      }
      if (!res.ok) throw new Error("Upload failed");
      // Cache-bust so the img re-fetches
      setImgSrc(`${BASE}/api/emp-images/person/${uploadId}?t=${Date.now()}`);
      setImgFailed(false);
      toast.success("Profile photo updated!");
    } catch {
      toast.error("Image upload failed.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="relative group">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleUpload}
      />

      {/* Avatar circle */}
      <div
        className={cn(
          "h-32 w-32 rounded-full border-4 border-card shadow-md overflow-hidden flex items-center justify-center",
          imgFailed && avatarColor,
        )}
      >
        {!imgFailed && imgSrc ? (
          <img
            key={imgSrc}
            src={imgSrc}
            alt={user?.username}
            onError={() => setImgFailed(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-2xl font-bold text-white">{initials}</span>
        )}
      </div>

      {/* Hover camera overlay */}
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
            <span className="text-white text-[10px] font-medium">Uploading</span>
          </>
        ) : (
          <>
            <Camera className="h-6 w-6 text-white" />
            <span className="text-white text-[10px] font-medium">
              {!imgFailed ? "Change" : "Upload"}
            </span>
          </>
        )}
      </button>

      {/* Active status dot */}
      <span className="absolute bottom-2 right-2 h-5 w-5 rounded-full border-4 border-card bg-green-500 z-10" />
    </div>
  );
}

// ── Notification prefs ────────────────────────────────────────────────────────
function NotificationPrefs({ isSupervisor }) {
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [saving, setSaving] = useState(false);

  const toggle = (key) => setPrefs((p) => ({ ...p, [key]: !p[key] }));
  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    toast.success("Notification preferences saved");
  };

  const employeePrefs = [
    { key: "LEAVE_STATUS_CHANGED",  label: "Leave approved or rejected" },
    { key: "PAYSLIP_AVAILABLE",     label: "Payslip available" },
    { key: "ATTENDANCE_CORRECTION", label: "Attendance correction status" },
    { key: "LOAN_STATUS_CHANGED",   label: "Loan request status" },
  ];
  const supervisorPrefs = [
    { key: "TEAM_LEAVE_REQUEST",         label: "New leave request from team" },
    { key: "TEAM_LATE_REQUEST",          label: "New late request from team" },
    { key: "TEAM_ATTENDANCE_CORRECTION", label: "New attendance correction from team" },
    { key: "TEAM_LOAN_REQUEST",          label: "New loan request from team" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <SectionHeading>My notifications</SectionHeading>
        <div className="space-y-4">
          {employeePrefs.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between">
              <Label htmlFor={key} className="text-sm font-normal cursor-pointer">{label}</Label>
              <Switch id={key} checked={prefs[key]} onCheckedChange={() => toggle(key)} />
            </div>
          ))}
        </div>
      </div>
      {isSupervisor && (
        <>
          <Separator />
          <div>
            <SectionHeading>Team requests</SectionHeading>
            <div className="space-y-4">
              {supervisorPrefs.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between">
                  <Label htmlFor={key} className="text-sm font-normal cursor-pointer">{label}</Label>
                  <Switch id={key} checked={prefs[key]} onCheckedChange={() => toggle(key)} />
                </div>
              ))}
            </div>
          </div>
        </>
      )}
      <Button onClick={handleSave} disabled={saving} size="sm">
        {saving ? <><Spinner className="mr-2 h-4 w-4" />Saving...</> : "Save preferences"}
      </Button>
    </div>
  );
}

// ── Change password ───────────────────────────────────────────────────────────
function ChangePasswordForm({ userId }) {
  const changePasswordMutation = useChangePassword();
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const onSubmit = async (data) => {
    try {
      await changePasswordMutation.mutateAsync({ id: userId, newPassword: data.newPassword });
      toast.success("Password changed successfully");
      form.reset();
    } catch (err) {
      toast.error(err?.message || "Failed to change password");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-sm">
        <FormField control={form.control} name="newPassword" render={({ field }) => (
          <FormItem>
            <FormLabel>New password</FormLabel>
            <FormControl>
              <div className="relative">
                <Input type={showNew ? "text" : "password"} placeholder="Min. 6 characters" {...field} />
                <button type="button" onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="confirmPassword" render={({ field }) => (
          <FormItem>
            <FormLabel>Confirm password</FormLabel>
            <FormControl>
              <div className="relative">
                <Input type={showConfirm ? "text" : "password"} placeholder="Repeat new password" {...field} />
                <button type="button" onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <Button type="submit" size="sm" disabled={changePasswordMutation.isPending}>
          {changePasswordMutation.isPending
            ? <><Spinner className="mr-2 h-4 w-4" />Updating...</>
            : "Update password"}
        </Button>
      </form>
    </Form>
  );
}

// ── Permissions tab ───────────────────────────────────────────────────────────
function PermissionsTab({ roles, permissions }) {
  const grouped = permissions?.reduce((acc, p) => {
    const mod = p.MODULE_NAME ?? "General";
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <SectionHeading>Assigned roles</SectionHeading>
        <div className="flex flex-wrap gap-2">
          {roles?.length
            ? roles.map((r) => <Badge key={r} variant="secondary" className="px-3 py-1 text-sm">{r}</Badge>)
            : <p className="text-sm text-muted-foreground">No roles assigned</p>}
        </div>
      </div>
      <Separator />
      <div>
        <SectionHeading>Permissions</SectionHeading>
        {grouped && Object.keys(grouped).length > 0 ? (
          <div className="space-y-5">
            {Object.entries(grouped).map(([module, perms]) => (
              <div key={module}>
                <p className="text-xs font-medium text-muted-foreground mb-2">{module}</p>
                <div className="flex flex-wrap gap-2">
                  {perms.map((p) => (
                    <Badge key={p.PERMISSION_CODE} variant="outline" className="text-xs font-mono">
                      {p.PERMISSION_NAME ?? p.PERMISSION_CODE}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No direct permissions assigned.</p>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { user } = useAuthV2();

  const { data: userDetail, isLoading: userLoading } = useUserById(user?.id);
  const { data: employee,   isLoading: empLoading }  = useEmployeeById(user?.employee_id);

  const isLoading = userLoading || empLoading;

  const isSupervisor = user?.roles?.some((r) =>
    ["SUPERVISOR", "TEAM_LEAD", "HR", "ADMIN"].includes(r?.toUpperCase())
  );

  const avatarColor = getAvatarColor(user?.username ?? "");
  const initials    = user?.username?.slice(0, 2)?.toUpperCase() ?? "U";

  const { assignment, shift, supervisor, personType, presentAddress, permanentAddress } = employee ?? {};

  const fullName = employee
    ? `${employee.TITLE ?? ""} ${employee.FIRST_NAME ?? ""} ${employee.LAST_NAME ?? ""}`.trim()
    : null;

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-muted/30">
        <PageContainer>
          <main className="flex-1 pt-0 space-y-6"><ProfileSkeleton /></main>
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-muted/30">
      <PageContainer>
        <main className="flex-1 pt-0 space-y-6">

          {/* ══════════════════════════════════════════════════════
              HERO CARD — mirrors UserDetailsPage / EmployeeDetailsPage
          ══════════════════════════════════════════════════════ */}
          <Card className="border-border shadow-sm overflow-hidden bg-card">

            {/* Cover banner with action buttons top-right */}
            <div className="h-32 bg-gradient-to-r from-muted/50 to-muted border-b border-border relative">
              <div className="absolute top-4 right-6 flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-background/60 backdrop-blur-md border-border hover:bg-accent"
                  onClick={() => {
                    // Scroll to / switch to security tab — or wire to a dialog
                    document.querySelector('[data-value="security"]')?.click();
                  }}
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Change Password
                </Button>
              </div>
            </div>

            <div className="px-8 pb-8 relative">
              <div className="flex flex-col md:flex-row items-start md:items-end -mt-12 gap-6">

                {/* Uploadable avatar */}
                <ProfileAvatar user={user} initials={initials} avatarColor={avatarColor} />

                {/* Name / meta block */}
                <div className="flex-1 pt-2 md:pt-0">
                  {/* Name row */}
                  <div className="flex flex-wrap items-center gap-3 mb-1">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                      {fullName || user?.username}
                    </h1>
                    {/* Active badge */}
                    <Badge
                      variant="outline"
                      className="border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400 px-3 py-0.5"
                    >
                      Active
                    </Badge>
                    {/* Person type */}
                    {personType?.PERSON_TYPE && (
                      <Badge variant="secondary" className="px-3 py-0.5">
                        {personType.PERSON_TYPE}
                      </Badge>
                    )}
                  </div>

                  {/* @username · emp no */}
                  <p className="text-base font-medium text-foreground/80">
                    @{user?.username}
                    {employee?.EMP_NO && (
                      <span className="text-muted-foreground font-normal"> · {employee.EMP_NO}</span>
                    )}
                  </p>

                  {/* Position line */}
                  {assignment && (
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {assignment.POSITION_TITLE}
                      {assignment.ORG_NAME     && ` · ${assignment.ORG_NAME}`}
                      {assignment.COMPANY_NAME && ` · ${assignment.COMPANY_NAME}`}
                    </p>
                  )}

                  {/* Role pills */}
                  {user?.roles?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {user.roles.map((r) => (
                        <Badge key={r} variant="secondary" className="text-xs px-2">{r}</Badge>
                      ))}
                    </div>
                  )}

                  {/* Secondary meta row — location / join date / tenure */}
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-muted-foreground mt-2">
                    {assignment?.COMPANY_NAME && (
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5" />
                        <span>{assignment.COMPANY_NAME}</span>
                      </div>
                    )}
                    {assignment?.LOCATION_NAME && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{assignment.LOCATION_NAME}</span>
                      </div>
                    )}
                    {employee?.JOIN_DATE && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        <span>Joined {formatDate(employee.JOIN_DATE)}</span>
                        {calculateTenure(employee.JOIN_DATE) && (
                          <span className="bg-muted px-2 py-0.5 rounded text-xs font-medium border border-border">
                            {calculateTenure(employee.JOIN_DATE)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Employee ID chip */}
                {employee?.EMP_NO && (
                  <div className="hidden md:block bg-muted/50 p-3 rounded-lg border border-border shrink-0">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                      Employee ID
                    </div>
                    <div className="font-mono text-lg font-medium text-foreground">
                      {employee.EMP_NO}
                    </div>
                  </div>
                )}
              </div>

              {/* ── Quick-stats strip (4 columns, mirrors EmployeeDetailsPage) ── */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8 pt-6 border-t border-border">
                <DataItem label="Grade"        value={assignment?.GRADE_NAME ?? null} />
                <DataItem label="Organisation" value={assignment?.ORG_NAME ?? null} />
                <DataItem
                  label="Shift"
                  value={
                    shift
                      ? `${shift.SHIFT_NAME} · ${shift.START_TIME}–${shift.END_TIME}`
                      : null
                  }
                />
                <DataItem label="Supervisor"   value={supervisor?.name ?? null} />
              </div>
            </div>
          </Card>

          {/* ══════════════════════════════════════════════════════
              TABS
          ══════════════════════════════════════════════════════ */}
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="bg-background border shadow-sm p-1 h-auto mb-4">
              {[
                { value: "personal",    label: "Personal",    icon: User },
                { value: "assignment",  label: "Assignment",  icon: Briefcase },
                { value: "security",    label: "Security",    icon: ShieldCheck },
                { value: "permissions", label: "Permissions", icon: Layers },
              ].map(({ value, label, icon: Icon }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  data-value={value}
                  className="px-4 py-2 flex items-center gap-1.5"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* ════════════ PERSONAL TAB ════════════ */}
            <TabsContent value="personal" className="mt-0 space-y-4">
              {employee ? (
                <>
                  {/* Identity */}
                  <Card className="shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <User className="h-4 w-4 text-accent-foreground" />
                        Identity
                      </CardTitle>
                      <CardDescription>Core personal identifiers. Contact HR to update.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6">
                        <CompactItem label="First Name"            value={employee.FIRST_NAME} />
                        <CompactItem label="Last Name"             value={employee.LAST_NAME} />
                        <CompactItem label="Title"                 value={employee.TITLE} />
                        <CompactItem label="Gender"                value={employee.GENDER} />
                        <CompactItem label="Date of Birth"         value={formatDate(employee.DATE_OF_BIRTH)} />
                        <CompactItem label="Nationality"           value={employee.NATIONALITY} />
                        <CompactItem label="Marital Status"        value={maritalLabel(employee.MARRITIAL_STATUS)} />
                        <CompactItem label="NID"                   value={employee.NID} />
                        <CompactItem label="Birth Reg. No."        value={employee.BIRTH_REG_NO} />
                        <CompactItem label="Country of Birth"      value={employee.COUNTRY_OF_BIRTH} />
                        <CompactItem label="Region of Birth"       value={employee.REGION_OF_BIRTH} />
                        <CompactItem label="Town of Birth"         value={employee.TOWN_OF_BIRTH} />
                        <CompactItem label="Disability Registered" value={
                          employee.REG_DISABILITY === null || employee.REG_DISABILITY === undefined
                            ? null
                            : employee.REG_DISABILITY ? "Yes" : "No"
                        } />
                        <CompactItem label="Join Date"             value={formatDate(employee.JOIN_DATE)} />
                        <CompactItem label="Person Type"           value={personType?.PERSON_TYPE ?? null} />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Family */}
                  <Card className="shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <IdCard className="h-4 w-4 text-accent-foreground" />
                        Family information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <InfoBlock title="Father">
                          <CompactItem label="Name (English)" value={employee.FATHERS_NAME} />
                          <CompactItem label="Name (বাংলা)"   value={employee.FATHERS_NAME_B} bangla />
                        </InfoBlock>
                        <InfoBlock title="Mother">
                          <CompactItem label="Name (English)" value={employee.MOTHERS_NAME} />
                          <CompactItem label="Name (বাংলা)"   value={employee.MOTHERS_NAME_B} bangla />
                        </InfoBlock>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Address */}
                  <Card className="shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <MapPin className="h-4 w-4 text-accent-foreground" />
                        Address information
                      </CardTitle>
                      <CardDescription>Contact HR to update your address details.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <AddressBlock label="Present address"   address={presentAddress}  icon={MapPin} />
                      <AddressBlock label="Permanent address" address={permanentAddress} icon={MapPin} />
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card className="shadow-sm">
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">
                      No employee record linked to this account.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ════════════ ASSIGNMENT TAB ════════════ */}
            <TabsContent value="assignment" className="mt-0">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Briefcase className="h-5 w-5 text-accent-foreground" />
                    Current assignment
                  </CardTitle>
                  <CardDescription>Your active position and organisational details.</CardDescription>
                </CardHeader>
                <CardContent>
                  {assignment ? (
                    <div className="space-y-6">
                      {/* Organisation */}
                      <div>
                        <SectionHeading>Organisation</SectionHeading>
                        <dl className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-muted/30 p-4 rounded-lg border">
                            <DataItem label="Company" value={assignment.COMPANY_NAME} />
                            {assignment.COMPANY_ADDRESS && (
                              <p className="text-xs text-muted-foreground mt-1">{assignment.COMPANY_ADDRESS}</p>
                            )}
                          </div>
                          <div className="bg-muted/30 p-4 rounded-lg border">
                            <DataItem label="Organisation unit" value={assignment.ORG_NAME} />
                          </div>
                          <div className="bg-muted/30 p-4 rounded-lg border">
                            <DataItem label="Location" value={assignment.LOCATION_NAME} />
                          </div>
                        </dl>
                      </div>

                      <Separator />

                      {/* Position & grade */}
                      <div>
                        <SectionHeading>Position & grade</SectionHeading>
                        <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                          <DataItem label="Position"       value={assignment.POSITION_TITLE} />
                          <DataItem label="Level"          value={assignment.POSITION_LEVEL?.toUpperCase() ?? null} />
                          <DataItem label="Grade"          value={assignment.GRADE_NAME} />
                          <DataItem label="Effective from" value={formatDate(assignment.EFFECTIVE_START_DATE)} />
                        </dl>
                      </div>

                      {/* Shift + Supervisor */}
                      {shift && (
                        <>
                          <Separator />
                          <div>
                            <SectionHeading>Work details</SectionHeading>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <InfoBlock icon={Clock} title="Shift">
                                <CompactItem label="Name"      value={shift.SHIFT_NAME} />
                                <CompactItem label="Code"      value={shift.SHIFT_CODE} />
                                <CompactItem label="Hours"     value={
                                  shift.START_TIME && shift.END_TIME
                                    ? `${shift.START_TIME} – ${shift.END_TIME}`
                                    : null
                                } />
                                <CompactItem label="Grace in"  value={
                                  shift.GRACE_IN_MINUTES  != null ? `${shift.GRACE_IN_MINUTES} min`  : null
                                } />
                                <CompactItem label="Grace out" value={
                                  shift.GRACE_OUT_MINUTES != null ? `${shift.GRACE_OUT_MINUTES} min` : null
                                } />
                                <CompactItem label="Overnight" value={
                                  shift.OVERNIGHT_FLAG != null
                                    ? (shift.OVERNIGHT_FLAG ? "Yes" : "No")
                                    : null
                                } />
                              </InfoBlock>

                              <InfoBlock icon={User} title="Direct supervisor">
                                {supervisor?.name ? (
                                  <>
                                    <CompactItem label="Name"        value={supervisor.name} />
                                    <CompactItem label="Employee No" value={supervisor.empNo} />
                                  </>
                                ) : (
                                  <p className="text-sm text-muted-foreground py-3">No supervisor assigned.</p>
                                )}
                              </InfoBlock>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Supervisor without shift (edge case) */}
                      {!shift && supervisor?.name && (
                        <>
                          <Separator />
                          <div>
                            <SectionHeading>Direct supervisor</SectionHeading>
                            <InfoBlock icon={User} title={null}>
                              <CompactItem label="Name"        value={supervisor.name} />
                              <CompactItem label="Employee No" value={supervisor.empNo} />
                            </InfoBlock>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No active assignment found for your account.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ════════════ SECURITY TAB ════════════ */}
            <TabsContent value="security" className="mt-0">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ShieldCheck className="h-5 w-5 text-accent-foreground" />
                    Security
                  </CardTitle>
                  <CardDescription>Manage your password and account security.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <SectionHeading>Change password</SectionHeading>
                    <ChangePasswordForm userId={user?.id} />
                  </div>
                  <Separator />
                  <div>
                    <SectionHeading>Account info</SectionHeading>
                    <dl className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <DataItem label="Username"    value={user?.username} />
                      <DataItem label="User ID"     value={user?.id?.toString()} />
                      <DataItem label="Employee ID" value={user?.employee_id?.toString()} />
                    </dl>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ════════════ PERMISSIONS TAB ════════════ */}
            <TabsContent value="permissions" className="mt-0">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Layers className="h-5 w-5 text-accent-foreground" />
                    Roles & permissions
                  </CardTitle>
                  <CardDescription>Your assigned roles and what you have access to.</CardDescription>
                </CardHeader>
                <CardContent>
                  <PermissionsTab
                    roles={user?.roles}
                    permissions={userDetail?.permissions}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </PageContainer>
    </div>
  );
}