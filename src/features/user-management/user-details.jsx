// src\features\user-management\user-details.jsx

import { useRef, useState } from "react";
import { useParams, Link } from "react-router";
import { format } from "date-fns";
import {
  User, Shield, Lock, AlertCircle, RefreshCw,
  Trash2, Plus, ShieldCheck, Puzzle,
  UserX, UserCheck, Pencil, Camera, Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tooltip, TooltipContent,
  TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import PageContainer from "@/components/page-container";
import { useConfirmationDialog } from "@/hooks/useConfirmationDialog";
import { cn } from "@/lib/utils";
import { getAvatarColor } from "@/lib/avatar-utils";

import {
  useUserById, useRoles, usePermissions,
  useAssignRole, useRevokeRole,
  useAssignPermission, useRevokePermission,
  useDeleteUser, useActivateUser,
} from "./queries";
import ChangePasswordDialog from "./change-password-dialog";
import UpdateUserDialog from "./update-user-dialog";

const formatDate = (d) => {
  if (!d) return "—";
  try { return format(new Date(d), "MMM dd, yyyy"); } catch { return "—"; }
};

function DataItem({ label, value }) {
  return (
    <div className="flex flex-col space-y-1">
      <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</dt>
      <dd className="text-sm font-medium">{value || "—"}</dd>
    </div>
  );
}

// ─── Smart Avatar ─────────────────────────────────────────────────────────────
// Priority: user's own uploaded image → assigned employee's image → initials
function UserAvatar({ user }) {

  console.log("avatar user", user);
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const BASE = import.meta.env.VITE_API_BASE_URL;

  // Build the ordered list of image URLs to try
  const urlsToTry = [
    `${BASE}/api/emp-images/person/${user.ID}`,
    user.EMPLOYEE_ID ? `${BASE}/api/emp-images/person/${user.EMPLOYEE_ID}` : null,
  ].filter(Boolean);

  const [srcIndex, setSrcIndex] = useState(0);  // which URL we're currently on
  const [failed, setFailed] = useState(false);   // all URLs exhausted → show initials

  const handleError = () => {
    const next = srcIndex + 1;
    if (next < urlsToTry.length) {
      console.log(`[Avatar] Trying fallback image [${next}]:`, urlsToTry[next]);
      setSrcIndex(next);
    } else {
      console.log("[Avatar] All image sources exhausted, showing initials");
      setFailed(true);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("image", file);
    setUploading(true);
    try {
      let res = await fetch(`${BASE}/api/emp-images/${user.ID}`, { method: "PUT", body: formData });
      if (res.status === 404) {
        res = await fetch(`${BASE}/api/emp-images/${user.ID}`, { method: "POST", body: formData });
      }
      if (!res.ok) throw new Error("Upload failed");
      // Reset back to user's own image with cache bust
      setSrcIndex(0);
      setFailed(false);
      // Force re-fetch by temporarily pointing at busted URL
      urlsToTry[0] = `${BASE}/api/emp-images/person/${user.ID}?t=${Date.now()}`;
      toast.success("Profile photo updated!");
    } catch {
      toast.error("Image upload failed.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const initials = (
    [user.FIRST_NAME?.[0], user.LAST_NAME?.[0]].filter(Boolean).join("").toUpperCase()
    || user.USERNAME?.[0]?.toUpperCase()
  );

  return (
    <div className="relative group">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleUpload}
      />

      {/* Use plain <Avatar> shell but raw <img> inside for reliable onError */}
      <div className={cn(
        "h-32 w-32 rounded-full border-4 border-card shadow-md overflow-hidden flex items-center justify-center",
        getAvatarColor(user.USERNAME)
      )}>
        {!failed ? (
          <img
            key={urlsToTry[srcIndex]}   // key change forces React to remount → fresh onError
            src={urlsToTry[srcIndex]}
            onError={handleError}
            alt={user.USERNAME}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-2xl font-bold text-white">{initials}</span>
        )}
      </div>

      {/* Camera overlay */}
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
        {uploading
          ? <><Loader2 className="h-6 w-6 text-white animate-spin" /><span className="text-white text-[10px] font-medium">Uploading</span></>
          : <><Camera className="h-6 w-6 text-white" /><span className="text-white text-[10px] font-medium">Change</span></>
        }
      </button>

      {/* Status dot */}
      <span className={cn(
        "absolute bottom-2 right-2 h-5 w-5 rounded-full border-4 border-card z-10",
        user.STATUS === "ACTIVE" ? "bg-green-500" : "bg-red-500"
      )} />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function UserDetailsPage() {
  const { id } = useParams();
  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();

  const [isPasswordOpen, setIsPasswordOpen]   = useState(false);
  const [isUpdateOpen,   setIsUpdateOpen]     = useState(false);
  const [selectedRoleId,       setSelectedRoleId]       = useState("");
  const [selectedPermissionId, setSelectedPermissionId] = useState("");

  const { data: user, isLoading, isError, error, refetch, isFetching } = useUserById(id);
  const { data: allRoles = [] }       = useRoles();
  const { data: allPermissions = [] } = usePermissions();

  const assignRoleMutation       = useAssignRole();
  const revokeRoleMutation       = useRevokeRole();
  const assignPermissionMutation = useAssignPermission();
  const revokePermissionMutation = useRevokePermission();
  const deactivateMutation       = useDeleteUser();
  const activateMutation         = useActivateUser();

  const assignedRoleIds       = new Set(user?.roles?.map((r) => r.ID));
  const assignedPermissionIds = new Set(user?.permissions?.map((p) => p.ID));
  const availableRoles        = allRoles.filter((r) => !assignedRoleIds.has(r.ID));
  const availablePermissions  = allPermissions.filter((p) => !assignedPermissionIds.has(p.ID));

  const handleDeactivate = async () => {
    const confirmed = await showConfirmation({
      title: "Deactivate user?",
      description: `Are you sure you want to deactivate "${user.USERNAME}"?`,
      confirmText: "Deactivate", cancelText: "Cancel", variant: "destructive",
    });
    if (!confirmed) return;
    try {
      await deactivateMutation.mutateAsync(user.ID);
      toast.success("User deactivated.");
      refetch();
    } catch (err) {
      toast.error(err?.message || "Failed to deactivate.");
    }
  };

  const handleActivate = async () => {
    const confirmed = await showConfirmation({
      title: "Activate user?",
      description: `Are you sure you want to activate "${user.USERNAME}"?`,
      confirmText: "Activate", cancelText: "Cancel",
    });
    if (!confirmed) return;
    try {
      await activateMutation.mutateAsync(user.ID);
      toast.success("User activated.");
      refetch();
    } catch (err) {
      toast.error(err?.message || "Failed to activate.");
    }
  };

  const handleAssignRole = async () => {
    if (!selectedRoleId) return toast.error("Please select a role");
    try {
      await assignRoleMutation.mutateAsync({ userId: id, roleId: parseInt(selectedRoleId) });
      toast.success("Role assigned!");
      setSelectedRoleId("");
    } catch (err) { toast.error(err?.message || "Failed to assign role."); }
  };

  const handleRevokeRole = async (roleId, roleName) => {
    const confirmed = await showConfirmation({
      title: "Revoke role?",
      description: `Remove "${roleName}" from this user?`,
      confirmText: "Revoke", cancelText: "Cancel", variant: "destructive",
    });
    if (!confirmed) return;
    try {
      await revokeRoleMutation.mutateAsync({ userId: id, roleId });
      toast.success("Role revoked!");
    } catch (err) { toast.error(err?.message || "Failed to revoke role."); }
  };

  const handleAssignPermission = async () => {
    if (!selectedPermissionId) return toast.error("Please select a permission");
    try {
      await assignPermissionMutation.mutateAsync({ userId: id, permissionId: parseInt(selectedPermissionId) });
      toast.success("Permission assigned!");
      setSelectedPermissionId("");
    } catch (err) { toast.error(err?.message || "Failed to assign permission."); }
  };

  const handleRevokePermission = async (permissionId, permissionName) => {
    const confirmed = await showConfirmation({
      title: "Revoke permission?",
      description: `Remove "${permissionName}" from this user?`,
      confirmText: "Revoke", cancelText: "Cancel", variant: "destructive",
    });
    if (!confirmed) return;
    try {
      await revokePermissionMutation.mutateAsync({ userId: id, permissionId });
      toast.success("Permission revoked!");
    } catch (err) { toast.error(err?.message || "Failed to revoke permission."); }
  };

  const groupedPermissions = user?.permissions?.reduce((acc, p) => {
    const mod = p.MODULE_NAME || "Other";
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(p);
    return acc;
  }, {}) ?? {};

  // ── Loading ──
  if (isLoading) return (
    <PageContainer>
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </PageContainer>
  );

  // ── Error ──
  if (isError) return (
    <PageContainer>
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription className="flex flex-col gap-2">
          <p>{error?.message || "Failed to load user."}</p>
          <Button variant="outline" size="sm" onClick={refetch} disabled={isFetching} className="w-fit">
            {isFetching ? <><Spinner className="mr-2 h-4 w-4" />Retrying...</> : <><RefreshCw className="mr-2 h-4 w-4" />Retry</>}
          </Button>
        </AlertDescription>
      </Alert>
    </PageContainer>
  );

  if (!user) return (
    <PageContainer>
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Not Found</AlertTitle>
        <AlertDescription>User not found.</AlertDescription>
      </Alert>
    </PageContainer>
  );

  const isActive  = user.STATUS === "ACTIVE";
  const isBusy    = deactivateMutation.isPending || activateMutation.isPending;
  const fullName  = [user.FIRST_NAME, user.LAST_NAME].filter(Boolean).join(" ");

  return (
    <PageContainer>
      {/* Breadcrumb */}
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink asChild><Link to="/">Dashboard</Link></BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink asChild><Link to="/user-management/users">Users</Link></BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>{user.USERNAME}</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="space-y-6">

        {/* ── Hero Card ── */}
        <Card className="border-border shadow-sm overflow-hidden bg-card">

          {/* Banner */}
          <div className="h-32 bg-gradient-to-r from-muted/50 to-muted border-b border-border relative">
            <div className="absolute top-4 right-6 flex items-center gap-3">

              {/* Edit User */}
              <Button
                variant="outline" size="sm"
                className="bg-background/60 backdrop-blur-md border-border hover:bg-accent"
                onClick={() => setIsUpdateOpen(true)}
              >
                <Pencil className="h-4 w-4 mr-2" /> Edit User
              </Button>

              {/* Change Password */}
              <Button
                variant="outline" size="sm"
                className="bg-background/60 backdrop-blur-md text-amber-500 border-amber-500/30 hover:bg-amber-500/10 hover:text-amber-600"
                onClick={() => setIsPasswordOpen(true)}
              >
                <Lock className="h-4 w-4 mr-2" /> Change Password
              </Button>

              {/* Deactivate / Activate */}
              {isActive ? (
                <Button
                  variant="destructive" size="sm"
                  onClick={handleDeactivate}
                  disabled={isBusy}
                >
                  {deactivateMutation.isPending
                    ? <Spinner className="mr-2 h-4 w-4" />
                    : <UserX className="h-4 w-4 mr-2" />}
                  Deactivate
                </Button>
              ) : (
                <Button
                  variant="outline" size="sm"
                  className="bg-background/60 backdrop-blur-md text-green-600 border-green-500/30 hover:bg-green-500/10 hover:text-green-700"
                  onClick={handleActivate}
                  disabled={isBusy}
                >
                  {activateMutation.isPending
                    ? <Spinner className="mr-2 h-4 w-4" />
                    : <UserCheck className="h-4 w-4 mr-2" />}
                  Activate
                </Button>
              )}

            </div>
          </div>

          {/* Body */}
          <div className="px-8 pb-8 relative">
            <div className="flex flex-col md:flex-row items-start md:items-end -mt-12 gap-6">

              {/* Smart avatar with upload */}
              <UserAvatar user={user} />

              {/* Name / meta */}
              <div className="flex-1 pt-2 md:pt-0">
                <div className="flex items-center gap-3 flex-wrap mb-1">
                  <h1 className="text-3xl font-bold tracking-tight">{user.USERNAME}</h1>
                  <Badge
                    variant="outline"
                    className={cn(
                      isActive
                        ? "border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400 px-3 py-0.5"
                        : "bg-muted text-muted-foreground px-3 py-0.5"
                    )}
                  >
                    {user.STATUS}
                  </Badge>
                </div>
                {fullName && (
                  <p className="text-base font-medium text-foreground/80">
                    {fullName}
                    {user.EMP_NO && (
                      <span className="text-muted-foreground font-normal"> · {user.EMP_NO}</span>
                    )}
                  </p>
                )}
                {user.LOCATION_NAME && (
                  <p className="text-sm text-muted-foreground mt-0.5">{user.LOCATION_NAME}</p>
                )}
              </div>

              {/* User ID chip — mirrors Employee ID chip */}
              <div className="hidden md:block bg-muted/50 p-3 rounded-lg border border-border">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  User ID
                </div>
                <div className="font-mono text-lg font-medium text-foreground">
                  #{user.ID}
                </div>
              </div>

            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8 pt-6 border-t border-border">
              <DataItem label="Location"     value={user.LOCATION_NAME} />
              <DataItem label="Created"      value={formatDate(user.CREATED_AT)} />
              <DataItem label="Last Updated" value={formatDate(user.UPDATED_AT)} />
              <DataItem label="Roles"        value={`${user.roles?.length ?? 0} assigned`} />
            </div>
          </div>
        </Card>

        {/* ── Tabs (unchanged) ── */}
        <Tabs defaultValue="roles">
          <TabsList className="bg-background border shadow-sm p-1 h-auto mb-4">
            <TabsTrigger value="roles" className="px-5 py-2 gap-2">
              <Shield className="h-4 w-4" />
              Roles
              <Badge variant="secondary" className="ml-1">{user.roles?.length ?? 0}</Badge>
            </TabsTrigger>
            <TabsTrigger value="permissions" className="px-5 py-2 gap-2">
              <ShieldCheck className="h-4 w-4" />
              Permissions
              <Badge variant="secondary" className="ml-1">{user.permissions?.length ?? 0}</Badge>
            </TabsTrigger>
          </TabsList>

          {/* Roles Tab */}
          <TabsContent value="roles">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="h-5 w-5 text-accent-foreground" />
                  Assigned Roles
                </CardTitle>
                <CardDescription>Roles determine the user's level of access in the system.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex gap-3 p-4 rounded-lg border border-dashed bg-muted/30">
                  <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder={availableRoles.length ? "Select role to assign..." : "All roles assigned"} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRoles.map((r) => (
                        <SelectItem key={r.ID} value={String(r.ID)}>{r.ROLE_NAME}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleAssignRole} disabled={!selectedRoleId || assignRoleMutation.isPending} className="gap-2">
                    {assignRoleMutation.isPending ? <Spinner className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    Assign
                  </Button>
                </div>

                {user.roles?.length ? (
                  <div className="space-y-2">
                    {user.roles.map((role) => (
                      <div key={role.ID} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 rounded-md bg-primary/10">
                            <Shield className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{role.ROLE_NAME}</p>
                            {role.DESCRIPTION && <p className="text-xs text-muted-foreground">{role.DESCRIPTION}</p>}
                          </div>
                        </div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                onClick={() => handleRevokeRole(role.ID, role.ROLE_NAME)}
                                disabled={revokeRoleMutation.isPending}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Revoke Role</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6">No roles assigned yet.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Permissions Tab */}
          <TabsContent value="permissions">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShieldCheck className="h-5 w-5 text-accent-foreground" />
                  Direct Permissions
                </CardTitle>
                <CardDescription>Individual permissions assigned directly to this user.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex gap-3 p-4 rounded-lg border border-dashed bg-muted/30">
                  <Select value={selectedPermissionId} onValueChange={setSelectedPermissionId}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder={availablePermissions.length ? "Select permission to assign..." : "All permissions assigned"} />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePermissions.map((p) => (
                        <SelectItem key={p.ID} value={String(p.ID)}>
                          <span className="font-mono text-xs text-muted-foreground mr-2">{p.PERMISSION_CODE}</span>
                          {p.PERMISSION_NAME}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleAssignPermission} disabled={!selectedPermissionId || assignPermissionMutation.isPending} className="gap-2">
                    {assignPermissionMutation.isPending ? <Spinner className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    Assign
                  </Button>
                </div>

                {Object.keys(groupedPermissions).length ? (
                  <div className="space-y-5">
                    {Object.entries(groupedPermissions).map(([moduleName, perms]) => (
                      <div key={moduleName}>
                        <div className="flex items-center gap-2 mb-2">
                          <Puzzle className="h-3.5 w-3.5 text-muted-foreground" />
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{moduleName}</p>
                        </div>
                        <div className="space-y-2">
                          {perms.map((perm) => (
                            <div key={perm.ID} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                              <div className="flex items-center gap-3">
                                <Badge variant="outline" className="font-mono text-xs">{perm.PERMISSION_CODE}</Badge>
                                <div>
                                  <p className="text-sm font-medium">{perm.PERMISSION_NAME}</p>
                                  {perm.DESCRIPTION && <p className="text-xs text-muted-foreground">{perm.DESCRIPTION}</p>}
                                </div>
                              </div>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                      onClick={() => handleRevokePermission(perm.ID, perm.PERMISSION_NAME)}
                                      disabled={revokePermissionMutation.isPending}>
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Revoke Permission</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6">No direct permissions assigned.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {isPasswordOpen && (
        <ChangePasswordDialog open={isPasswordOpen} onOpenChange={setIsPasswordOpen} user={user} />
      )}
      {isUpdateOpen && (
        <UpdateUserDialog open={isUpdateOpen} onOpenChange={setIsUpdateOpen} user={user} showConfirmation={showConfirmation} />
      )}
      <ConfirmationDialog />
    </PageContainer>
  );
}