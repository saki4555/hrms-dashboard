// src/features/users/role/role-details.jsx
import { useState } from "react";
import { useParams, Link } from "react-router";
import { Shield, ShieldCheck, Plus, Trash2, AlertCircle, RefreshCw, Puzzle } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tooltip, TooltipContent,
  TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import PageContainer from "@/components/page-container";
import { useConfirmationDialog } from "@/hooks/useConfirmationDialog";

import {
  useRoles,
  usePermissions,
  useRolePermissions,
  useAssignPermissionToRole,
  useRevokePermissionFromRole,
} from "../../user-management/queries";

export default function RoleDetailsPage() {
  const { id } = useParams();
  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();
  const [selectedPermissionId, setSelectedPermissionId] = useState("");

  // Get role info from the roles list (no separate getRoleById endpoint needed)
  const { data: allRoles = [], isLoading: isLoadingRole, isError: isRoleError } = useRoles();
  const role = allRoles.find((r) => String(r.ID) === String(id));

  // Permissions already assigned to this role
  const {
    data: rolePermissions = [],
    isLoading: isLoadingPerms,
    isError: isPermsError,
    error: permsError,
    refetch: refetchPerms,
    isFetching: isFetchingPerms,
  } = useRolePermissions(id);

  // All permissions in system (for the assign dropdown)
  const { data: allPermissions = [] } = usePermissions();

  const assignMutation = useAssignPermissionToRole();
  const revokeMutation = useRevokePermissionFromRole();

  // Filter out already-assigned permissions from the dropdown
  const assignedPermissionIds = new Set(rolePermissions.map((p) => p.ID));
  const availablePermissions  = allPermissions.filter((p) => !assignedPermissionIds.has(p.ID));

  // Group assigned permissions by module for display
  const groupedPermissions = rolePermissions.reduce((acc, p) => {
    const mod = p.MODULE_NAME || "Other";
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(p);
    return acc;
  }, {});

  const handleAssign = async () => {
    if (!selectedPermissionId) return toast.error("Please select a permission");
    try {
      await assignMutation.mutateAsync({
        roleId: parseInt(id),
        permissionId: parseInt(selectedPermissionId),
      });
      toast.success("Permission assigned to role!");
      setSelectedPermissionId("");
    } catch (err) {
      toast.error(err?.message || "Failed to assign permission.");
    }
  };

  const handleRevoke = async (permissionId, permissionName) => {
    const confirmed = await showConfirmation({
      title: "Revoke permission?",
      description: `Remove "${permissionName}" from role "${role?.ROLE_NAME}"?`,
      confirmText: "Revoke",
      cancelText: "Cancel",
      variant: "destructive",
    });
    if (!confirmed) return;
    try {
      await revokeMutation.mutateAsync({
        roleId: parseInt(id),
        permissionId,
      });
      toast.success("Permission revoked!");
    } catch (err) {
      toast.error(err?.message || "Failed to revoke permission.");
    }
  };

  // ── Loading ──
  if (isLoadingRole || isLoadingPerms) return (
    <PageContainer>
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </PageContainer>
  );

  // ── Role not found ──
  if (!isLoadingRole && !role) return (
    <PageContainer>
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Not Found</AlertTitle>
        <AlertDescription>Role not found.</AlertDescription>
      </Alert>
    </PageContainer>
  );

  // ── Permissions load error ──
  if (isPermsError) return (
    <PageContainer>
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Permissions</AlertTitle>
        <AlertDescription className="flex flex-col gap-2">
          <p>{permsError?.message || "Failed to load role permissions."}</p>
          <Button variant="outline" size="sm" onClick={refetchPerms} disabled={isFetchingPerms} className="w-fit">
            {isFetchingPerms
              ? <><Spinner className="mr-2 h-4 w-4" />Retrying...</>
              : <><RefreshCw className="mr-2 h-4 w-4" />Retry</>}
          </Button>
        </AlertDescription>
      </Alert>
    </PageContainer>
  );

  return (
    <PageContainer>
      {/* Breadcrumb */}
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild><Link to="/">Dashboard</Link></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>User Management</BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild><Link to="/user-management/roles">Roles</Link></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{role?.ROLE_NAME}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="space-y-6">

        {/* ── Role Info Card ── */}
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Shield className="h-7 w-7 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold tracking-tight">{role?.ROLE_NAME}</h1>
                  <Badge variant="secondary">
                    {rolePermissions.length} permission{rolePermissions.length !== 1 ? "s" : ""}
                  </Badge>
                </div>
                {role?.DESCRIPTION && (
                  <p className="text-sm text-muted-foreground mt-1">{role.DESCRIPTION}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Permissions Card ── */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="h-5 w-5 text-accent-foreground" />
              Permissions
            </CardTitle>
            <CardDescription>
              All permissions granted to users who have the <strong>{role?.ROLE_NAME}</strong> role.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">

            {/* Assign row */}
            <div className="flex gap-3 p-4 rounded-lg border border-dashed bg-muted/30">
              <Select value={selectedPermissionId} onValueChange={setSelectedPermissionId}>
                <SelectTrigger className="flex-1">
                  <SelectValue
                    placeholder={
                      availablePermissions.length
                        ? "Select permission to assign..."
                        : "All permissions assigned"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {availablePermissions.map((p) => (
                    <SelectItem key={p.ID} value={String(p.ID)}>
                      <span className="font-mono text-xs text-muted-foreground mr-2">
                        {p.PERMISSION_CODE}
                      </span>
                      {p.PERMISSION_NAME}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleAssign}
                disabled={!selectedPermissionId || assignMutation.isPending}
                className="gap-2"
              >
                {assignMutation.isPending
                  ? <Spinner className="h-4 w-4" />
                  : <Plus className="h-4 w-4" />}
                Assign
              </Button>
            </div>

            {/* Permissions list grouped by module */}
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
                        <div
                          key={perm.ID}
                          className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                        >
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
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                  onClick={() => handleRevoke(perm.ID, perm.PERMISSION_NAME)}
                                  disabled={revokeMutation.isPending}
                                >
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
              <p className="text-sm text-muted-foreground text-center py-6">
                No permissions assigned to this role yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmationDialog />
    </PageContainer>
  );
}