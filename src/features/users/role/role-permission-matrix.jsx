// src/features/users/role/role-permission-matrix.jsx
import React, { useState, useCallback, useMemo } from "react";
import { Link } from "react-router";
import { useQueries } from "@tanstack/react-query";
import { ShieldCheck, Layers, Info, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import PageContainer from "@/components/page-container";
import { useConfirmationDialog } from "@/hooks/useConfirmationDialog";

import {
  useRoles,
  usePermissions,
  useAssignPermissionToRole,
  useRevokePermissionFromRole,
} from "../../user-management/queries";

const BASE = import.meta.env.VITE_API_BASE_URL;

// ── Single matrix cell ────────────────────────────────────────────────────────
function MatrixCell({ roleId, permissionId, granted, pending, onToggle }) {
  return (
    <td className="px-2 py-3 text-center border-b border-border/30 group-hover:bg-muted/40 transition">
      <div className="flex items-center justify-center">
        {pending ? (
          <Spinner className="h-4 w-4" />
        ) : (
          <Checkbox
            checked={granted}
            onCheckedChange={(val) => onToggle(roleId, permissionId, !!val)}
            className="h-4 w-4 border-2 border-muted-foreground/40 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 dark:data-[state=checked]:bg-emerald-600"
          />
        )}
      </div>
    </td>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function RolePermissionMatrix() {
  const [pendingCells, setPendingCells] = useState(new Set());
  const { showConfirmation, ConfirmationDialog } = useConfirmationDialog();

  const {
    data: roles = [],
    isLoading: rolesLoading,
    isError: rolesError,
    refetch: refetchRoles,
  } = useRoles();

  const {
    data: allPermissions = [],
    isLoading: permsLoading,
    isError: permsError,
    refetch: refetchPerms,
  } = usePermissions();

  // Fetch permissions for every role in parallel
  // Fully dynamic — new roles auto-appear as new columns
  const rolePermissionQueries = useQueries({
    queries: roles.map((role) => ({
      queryKey: ["roles", "permissions", String(role.ID)],
      queryFn: async () => {
        const res = await fetch(
          `${BASE}/api/users/roles/${role.ID}/permissions`,
          {
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          },
        );
        if (!res.ok)
          throw new Error(`Failed to load permissions for ${role.ROLE_NAME}`);
        const json = await res.json();
        return json.data ?? [];
      },
      enabled: roles.length > 0,
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    })),
  });

  const isRolePermsLoading = rolePermissionQueries.some((q) => q.isLoading);
  const isRolePermsError = rolePermissionQueries.some((q) => q.isError);

  // Build lookup: roleId → Set<permissionId>
  const { rolePermMap, grouped } = useMemo(() => {
    const map = {};
    roles.forEach((role, i) => {
      const perms = rolePermissionQueries[i]?.data ?? [];
      map[role.ID] = new Set(perms.map((p) => p.ID));
    });

    const groups = allPermissions.reduce((acc, p) => {
      const mod = p.MODULE_NAME || "Other";
      if (!acc[mod]) acc[mod] = [];
      acc[mod].push(p);
      return acc;
    }, {});

    return { rolePermMap: map, grouped: groups };
  }, [roles, rolePermissionQueries, allPermissions]);

  const assignMutation = useAssignPermissionToRole();
  const revokeMutation = useRevokePermissionFromRole();

  const handleToggle = useCallback(
    async (roleId, permissionId, isChecked) => {
      const roleName =
        roles.find((r) => r.ID === roleId)?.ROLE_NAME ?? "this role";
      const permName =
        allPermissions.find((p) => p.ID === permissionId)?.PERMISSION_NAME ??
        "this permission";

      const confirmed = await showConfirmation({
        title: isChecked ? "Grant Permission?" : "Revoke Permission?",
        description: isChecked
          ? `Grant "${permName}" to the ${roleName} role? All users with this role will gain this permission immediately.`
          : `Revoke "${permName}" from the ${roleName} role? All users with this role will lose this permission immediately.`,
        confirmText: isChecked ? "Grant" : "Revoke",
        cancelText: "Cancel",
        variant: isChecked ? "default" : "destructive",
      });

      if (!confirmed) return;

      const cellKey = `${roleId}-${permissionId}`;
      setPendingCells((prev) => new Set(prev).add(cellKey));

      try {
        if (isChecked) {
          await assignMutation.mutateAsync({ roleId, permissionId });
          toast.success(`"${permName}" granted to ${roleName}`);
        } else {
          await revokeMutation.mutateAsync({ roleId, permissionId });
          toast.success(`"${permName}" revoked from ${roleName}`);
        }
      } catch (err) {
        toast.error(err?.message || "Failed to update permission.");
      } finally {
        setPendingCells((prev) => {
          const next = new Set(prev);
          next.delete(cellKey);
          return next;
        });
      }
    },
    [roles, allPermissions, showConfirmation, assignMutation, revokeMutation],
  );

  const refetchAll = () => {
    refetchRoles();
    refetchPerms();
    rolePermissionQueries.forEach((q) => q.refetch());
  };

  // ── Loading ──
  const isLoading = rolesLoading || permsLoading || isRolePermsLoading;
  if (isLoading)
    return (
      <PageContainer>
        <Skeleton className="h-[80vh] w-full rounded-xl" />
      </PageContainer>
    );

  // ── Error ──
  if (rolesError || permsError || isRolePermsError)
    return (
      <PageContainer>
        <Alert variant="destructive">
          <AlertTitle>Error Loading Matrix</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <p>Failed to load roles or permissions. Please try again.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={refetchAll}
              className="w-fit"
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Retry
            </Button>
          </AlertDescription>
        </Alert>
      </PageContainer>
    );

  return (
    <PageContainer>
      <div className="max-w-full mx-auto space-y-2">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-4">
            <div>
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to="/">Dashboard</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>User Management</BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Permission Matrix</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Legend */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="h-4 w-4 rounded-sm border-2 bg-emerald-600 border-emerald-600 flex items-center justify-center">
                  <svg
                    className="h-3 w-3 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                Granted
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="h-4 w-4 rounded-sm border-2 border-muted-foreground/40" />
                Not granted
              </div>
            </div>

            <Button variant="outline" size="icon" onClick={refetchAll}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Summary */}
        <p className="text-xs text-muted-foreground px-1">
          {allPermissions.length} permissions · {roles.length} roles · Changes
          take effect immediately for all users with the affected role
        </p>

        {/* Matrix Table */}
        <Card className="border py-0 shadow-sm rounded-xl overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-auto max-h-[calc(100vh-160px)]">
              <table className="w-full text-sm border-separate border-spacing-0">
                {/* Sticky header — role columns */}
                <thead className="sticky top-0 z-30 bg-background border-b">
                  <tr>
                    <th className="sticky left-0 z-40 bg-background px-5 py-4 text-left border-r min-w-[260px]">
                      <span className="font-medium text-muted-foreground">
                        Module / Permission
                      </span>
                    </th>
                    {roles.map((role) => (
                      <th
                        key={role.ID}
                        className="px-4 py-4 text-center min-w-[130px]"
                      >
                        <div className="font-semibold">{role.ROLE_NAME}</div>
                        <div className="text-xs text-muted-foreground">
                          {rolePermMap[role.ID]?.size ?? 0} permissions
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {Object.entries(grouped).map(([moduleName, perms]) => (
                    <React.Fragment key={moduleName}>
                      {/* Module group header */}
                      <tr>
                        <td
                          colSpan={roles.length + 1}
                          className="bg-muted/60 px-5 py-3 border-b"
                        >
                          <div className="flex items-center gap-2">
                            <Layers className="h-4 w-4 text-primary" />
                            <span className="font-semibold tracking-tight">
                              {moduleName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ({perms.length})
                            </span>
                          </div>
                        </td>
                      </tr>

                      {/* Permission rows */}
                      {perms.map((perm) => (
                        <tr
                          key={perm.ID}
                          className="group hover:bg-muted/40 transition"
                        >
                          {/* Permission name — sticky left */}
                          <td className="sticky left-0 z-10 bg-background px-5 py-3 border-b border-r">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground">
                                {perm.PERMISSION_NAME}
                              </span>
                              {perm.DESCRIPTION && (
                                <TooltipProvider delayDuration={0}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button>
                                        <Info className="h-4 w-4 text-muted-foreground hover:text-primary transition" />
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs text-xs">
                                      {perm.DESCRIPTION}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                            <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                              {perm.PERMISSION_CODE}
                            </div>
                          </td>

                          {/* Checkbox per role — new roles auto-appear here */}
                          {roles.map((role) => {
                            const cellKey = `${role.ID}-${perm.ID}`;
                            return (
                              <MatrixCell
                                key={cellKey}
                                roleId={role.ID}
                                permissionId={perm.ID}
                                granted={
                                  rolePermMap[role.ID]?.has(perm.ID) ?? false
                                }
                                pending={pendingCells.has(cellKey)}
                                onToggle={handleToggle}
                              />
                            );
                          })}
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <ConfirmationDialog />
    </PageContainer>
  );
}
