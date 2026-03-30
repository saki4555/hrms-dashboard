import { useState } from "react";
import { useParams, Link } from "react-router";
import { format } from "date-fns";
import {
  User, Shield, Lock, AlertCircle, RefreshCw,
  Trash2, Plus, ShieldCheck, Puzzle,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
} from "./queries";
import ChangePasswordDialog from "./change-password-dialog";

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

export default function UserDetailsPage() {
  const { id } = useParams();
  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [selectedPermissionId, setSelectedPermissionId] = useState("");

  const { data: user, isLoading, isError, error, refetch, isFetching } = useUserById(id);
  const { data: allRoles = [] }       = useRoles();
  const { data: allPermissions = [] } = usePermissions();

  const assignRoleMutation      = useAssignRole();
  const revokeRoleMutation      = useRevokeRole();
  const assignPermissionMutation = useAssignPermission();
  const revokePermissionMutation = useRevokePermission();

  // Roles/permissions not yet assigned
  const assignedRoleIds       = new Set(user?.roles?.map((r) => r.ID));
  const assignedPermissionIds = new Set(user?.permissions?.map((p) => p.ID));
  const availableRoles        = allRoles.filter((r) => !assignedRoleIds.has(r.ID));
  const availablePermissions  = allPermissions.filter((p) => !assignedPermissionIds.has(p.ID));

  const handleAssignRole = async () => {
    if (!selectedRoleId) return toast.error("Please select a role");
    try {
      await assignRoleMutation.mutateAsync({ userId: id, roleId: parseInt(selectedRoleId) });
      toast.success("Role assigned successfully!");
      setSelectedRoleId("");
    } catch (err) {
      toast.error(err?.message || "Failed to assign role.");
    }
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
      toast.success("Role revoked successfully!");
    } catch (err) {
      toast.error(err?.message || "Failed to revoke role.");
    }
  };

  const handleAssignPermission = async () => {
    if (!selectedPermissionId) return toast.error("Please select a permission");
    try {
      await assignPermissionMutation.mutateAsync({ userId: id, permissionId: parseInt(selectedPermissionId) });
      toast.success("Permission assigned successfully!");
      setSelectedPermissionId("");
    } catch (err) {
      toast.error(err?.message || "Failed to assign permission.");
    }
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
      toast.success("Permission revoked successfully!");
    } catch (err) {
      toast.error(err?.message || "Failed to revoke permission.");
    }
  };

  // Group permissions by module
  const groupedPermissions = user?.permissions?.reduce((acc, p) => {
    const mod = p.MODULE_NAME || "Other";
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(p);
    return acc;
  }, {}) ?? {};

  if (isLoading) return (
    <PageContainer>
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </PageContainer>
  );

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

  const fullName  = [user.FIRST_NAME, user.LAST_NAME].filter(Boolean).join(" ");
  const initials  = [user.FIRST_NAME?.[0], user.LAST_NAME?.[0]].filter(Boolean).join("").toUpperCase() || user.USERNAME?.[0]?.toUpperCase();
  const avatarColor = getAvatarColor(user.USERNAME);

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
        <Card className="shadow-sm">
          <div className="h-24 bg-gradient-to-r from-muted/50 to-muted rounded-t-lg border-b" />
          <CardContent className="pt-0 px-6 pb-6">
            <div className="flex flex-col md:flex-row items-start md:items-end -mt-10 gap-4">
              <Avatar className="h-20 w-20 border-4 border-card shadow-md">
                <AvatarFallback className={cn("text-xl font-bold text-white", avatarColor)}>
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold">{user.USERNAME}</h1>
                  <Badge variant={user.STATUS === "ACTIVE" ? "default" : "secondary"}
                    className={cn(
                      user.STATUS === "ACTIVE"
                        ? "bg-green-500/10 text-green-600 border-green-500/20"
                        : "bg-muted text-muted-foreground"
                    )}>
                    {user.STATUS}
                  </Badge>
                </div>
                {fullName && <p className="text-muted-foreground mt-0.5">{fullName} · {user.EMP_NO}</p>}
              </div>

              <Button variant="outline" size="sm" onClick={() => setIsPasswordOpen(true)}
                className="gap-2 text-amber-600 border-amber-500/30 hover:bg-amber-500/10">
                <Lock className="h-4 w-4" /> Change Password
              </Button>
            </div>

            <Separator className="my-5" />

            <dl className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <DataItem label="User ID"      value={`#${user.ID}`} />
              <DataItem label="Location"     value={user.LOCATION_NAME} />
              <DataItem label="Created"      value={formatDate(user.CREATED_AT)} />
              <DataItem label="Last Updated" value={formatDate(user.UPDATED_AT)} />
            </dl>
          </CardContent>
        </Card>

        {/* ── Tabs ── */}
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

          {/* ── Roles Tab ── */}
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
                {/* Assign Role */}
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
                  <Button onClick={handleAssignRole}
                    disabled={!selectedRoleId || assignRoleMutation.isPending}
                    className="gap-2">
                    {assignRoleMutation.isPending
                      ? <Spinner className="h-4 w-4" />
                      : <Plus className="h-4 w-4" />}
                    Assign
                  </Button>
                </div>

                {/* Role List */}
                {user.roles?.length ? (
                  <div className="space-y-2">
                    {user.roles.map((role) => (
                      <div key={role.ID}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 rounded-md bg-primary/10">
                            <Shield className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{role.ROLE_NAME}</p>
                            {role.DESCRIPTION && (
                              <p className="text-xs text-muted-foreground">{role.DESCRIPTION}</p>
                            )}
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

          {/* ── Permissions Tab ── */}
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
                {/* Assign Permission */}
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
                  <Button onClick={handleAssignPermission}
                    disabled={!selectedPermissionId || assignPermissionMutation.isPending}
                    className="gap-2">
                    {assignPermissionMutation.isPending
                      ? <Spinner className="h-4 w-4" />
                      : <Plus className="h-4 w-4" />}
                    Assign
                  </Button>
                </div>

                {/* Grouped by module */}
                {Object.keys(groupedPermissions).length ? (
                  <div className="space-y-5">
                    {Object.entries(groupedPermissions).map(([moduleName, perms]) => (
                      <div key={moduleName}>
                        <div className="flex items-center gap-2 mb-2">
                          <Puzzle className="h-3.5 w-3.5 text-muted-foreground" />
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            {moduleName}
                          </p>
                        </div>
                        <div className="space-y-2">
                          {perms.map((perm) => (
                            <div key={perm.ID}
                              className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                              <div className="flex items-center gap-3">
                                <Badge variant="outline" className="font-mono text-xs">
                                  {perm.PERMISSION_CODE}
                                </Badge>
                                <div>
                                  <p className="text-sm font-medium">{perm.PERMISSION_NAME}</p>
                                  {perm.DESCRIPTION && (
                                    <p className="text-xs text-muted-foreground">{perm.DESCRIPTION}</p>
                                  )}
                                </div>
                              </div>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon"
                                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
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
      <ConfirmationDialog />
    </PageContainer>
  );
}
