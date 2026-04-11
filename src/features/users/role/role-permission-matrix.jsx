// src/features/users/role/role-permission-matrix.jsx
import { useState, useCallback } from "react";
import { Link } from "react-router";
import { useQueries } from "@tanstack/react-query";
import { ShieldCheck, AlertCircle, RefreshCw, Puzzle } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import PageContainer from "@/components/page-container";

import {
  useRoles,
  usePermissions,
  useAssignPermissionToRole,
  useRevokePermissionFromRole,
} from "../../user-management/queries";

const BASE = import.meta.env.VITE_API_BASE_URL;

// ── Module color map for visual grouping ──────────────────────────────────────
const MODULE_COLORS = {
  "Dashboard":         "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  "Core HR":           "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
  "Attendance":        "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  "Payroll":           "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  "Self-Service":      "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
  "PF & Gratuity":     "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  "Loan & Advance":    "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20",
  "Document":          "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  "Communication":     "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
};

const getModuleColor = (moduleName = "") => {
  const key = Object.keys(MODULE_COLORS).find((k) =>
    moduleName.toLowerCase().includes(k.toLowerCase())
  );
  return key
    ? MODULE_COLORS[key]
    : "bg-muted text-muted-foreground border-border";
};

// ── Single checkbox cell ──────────────────────────────────────────────────────
function MatrixCell({ roleId, permissionId, checked, pending, onToggle }) {
  return (
    <td className="px-4 py-3 text-center border-b border-border/50">
      <div className="flex items-center justify-center">
        {pending ? (
          <Spinner className="h-4 w-4" />
        ) : (
          <Checkbox
            checked={checked}
            onCheckedChange={(val) => onToggle(roleId, permissionId, !!val)}
            className="h-4 w-4"
          />
        )}
      </div>
    </td>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function RolePermissionMatrix() {
  // Track pending state per cell as "roleId-permId"
  const [pendingCells, setPendingCells] = useState(new Set());

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
  const rolePermissionQueries = useQueries({
    queries: roles.map((role) => ({
      queryKey: ["roles", "permissions", String(role.ID)],
      queryFn: async () => {
        const res = await fetch(`${BASE}/api/users/roles/${role.ID}/permissions`, {
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error(`Failed to load permissions for role ${role.ROLE_NAME}`);
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
  const isRolePermsError   = rolePermissionQueries.some((q) => q.isError);

  // Build lookup: roleId → Set<permissionId>
  const rolePermMap = {};
  roles.forEach((role, i) => {
    const perms = rolePermissionQueries[i]?.data ?? [];
    rolePermMap[role.ID] = new Set(perms.map((p) => p.ID));
  });

  // Group permissions by module
  const grouped = allPermissions.reduce((acc, p) => {
    const mod = p.MODULE_NAME || "Other";
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(p);
    return acc;
  }, {});

  const assignMutation = useAssignPermissionToRole();
  const revokeMutation = useRevokePermissionFromRole();

  const handleToggle = useCallback(
    async (roleId, permissionId, isChecked) => {
      const cellKey = `${roleId}-${permissionId}`;
      setPendingCells((prev) => new Set(prev).add(cellKey));
      try {
        if (isChecked) {
          await assignMutation.mutateAsync({ roleId, permissionId });
        } else {
          await revokeMutation.mutateAsync({ roleId, permissionId });
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
    [assignMutation, revokeMutation]
  );

  const refetchAll = () => {
    refetchRoles();
    refetchPerms();
    rolePermissionQueries.forEach((q) => q.refetch());
  };

  // ── Permission count per role ──
  const permCountPerRole = (roleId) => rolePermMap[roleId]?.size ?? 0;

  // ── Loading ──
  const isLoading = rolesLoading || permsLoading || isRolePermsLoading;
  if (isLoading) return (
    <PageContainer>
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    </PageContainer>
  );

  // ── Error ──
  if (rolesError || permsError || isRolePermsError) return (
    <PageContainer>
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Matrix</AlertTitle>
        <AlertDescription className="flex flex-col gap-2">
          <p>Failed to load roles or permissions. Please try again.</p>
          <Button variant="outline" size="sm" onClick={refetchAll} className="w-fit">
            <RefreshCw className="mr-2 h-4 w-4" /> Retry
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
            <BreadcrumbPage>Permission Matrix</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="space-y-4">

        {/* Header card */}
        <div className="bg-card rounded-md shadow-sm p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-0.5">
              <h1 className="text-lg md:text-2xl font-semibold tracking-tight flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Role–Permission Matrix
              </h1>
              <p className="text-sm text-muted-foreground">
                Check or uncheck to grant or revoke permissions per role. Changes are saved immediately.
              </p>
            </div>
            <Button variant="outline" onClick={refetchAll}>
              <RefreshCw className="h-4 w-4" />
              <span className="sr-only">Refresh</span>
            </Button>
          </div>
        </div>

        {/* Matrix */}
        <Card className="shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">

                {/* ── Sticky header: role columns ── */}
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    {/* Permission column header */}
                    <th className="sticky left-0 z-20 bg-muted/50 px-4 py-3 text-left font-semibold min-w-[240px] border-r border-border">
                      Permission
                    </th>

                    {roles.map((role) => (
                      <th
                        key={role.ID}
                        className="px-4 py-3 text-center font-semibold min-w-[140px]"
                      >
                        <div className="flex flex-col items-center gap-1.5">
                          <span>{role.ROLE_NAME}</span>
                          <Badge variant="secondary" className="text-xs font-normal">
                            {permCountPerRole(role.ID)} perms
                          </Badge>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {Object.entries(grouped).map(([moduleName, perms]) => (
                    <>
                      {/* ── Module group header row ── */}
                      <tr key={`mod-${moduleName}`} className="bg-muted/30">
                        <td
                          colSpan={roles.length + 1}
                          className="sticky left-0 px-4 py-2 border-b border-border"
                        >
                          <div className="flex items-center gap-2">
                            <Puzzle className="h-3.5 w-3.5 text-muted-foreground" />
                            <span
                              className={`text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getModuleColor(moduleName)}`}
                            >
                              {moduleName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {perms.length} permission{perms.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                        </td>
                      </tr>

                      {/* ── Permission rows ── */}
                      {perms.map((perm, idx) => (
                        <tr
                          key={perm.ID}
                          className={`hover:bg-muted/20 transition-colors ${
                            idx % 2 === 0 ? "" : "bg-muted/10"
                          }`}
                        >
                          {/* Permission name — sticky left */}
                          <td className="sticky left-0 z-10 bg-card px-4 py-3 border-b border-border/50 border-r border-border">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="space-y-0.5 cursor-default">
                                    <p className="font-medium text-sm leading-tight">
                                      {perm.PERMISSION_NAME}
                                    </p>
                                    <code className="text-[10px] text-muted-foreground font-mono bg-muted px-1 py-0.5 rounded">
                                      {perm.PERMISSION_CODE}
                                    </code>
                                  </div>
                                </TooltipTrigger>
                                {perm.DESCRIPTION && (
                                  <TooltipContent side="right" className="max-w-xs">
                                    <p className="text-xs">{perm.DESCRIPTION}</p>
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            </TooltipProvider>
                          </td>

                          {/* Checkbox per role */}
                          {roles.map((role) => {
                            const cellKey = `${role.ID}-${perm.ID}`;
                            const isChecked = rolePermMap[role.ID]?.has(perm.ID) ?? false;
                            const isPending = pendingCells.has(cellKey);

                            return (
                              <MatrixCell
                                key={cellKey}
                                roleId={role.ID}
                                permissionId={perm.ID}
                                checked={isChecked}
                                pending={isPending}
                                onToggle={handleToggle}
                              />
                            );
                          })}
                        </tr>
                      ))}
                    </>
                  ))}
                </tbody>

              </table>
            </div>
          </CardContent>
        </Card>

        {/* Summary footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span>{allPermissions.length} permissions across {Object.keys(grouped).length} modules</span>
          <span>{roles.length} roles</span>
        </div>

      </div>
    </PageContainer>
  );
}