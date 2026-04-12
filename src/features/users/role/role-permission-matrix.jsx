




// src/features/users/role/role-permission-matrix.jsx
import React from "react";
import { Link } from "react-router";
import { useQueries } from "@tanstack/react-query";
import { ShieldCheck, Layers, Check, Minus, XIcon, Info } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import PageContainer from "@/components/page-container";

import { useRoles, usePermissions } from "../../user-management/queries";

const BASE = import.meta.env.VITE_API_BASE_URL;

function MatrixCell({ granted }) {
  return (
    <td className="px-2 py-3 text-center border-b border-border/30 group-hover:bg-muted/40 transition">
      <div className="flex items-center justify-center">
        {granted ? (
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <Check className="h-4 w-4" strokeWidth={3} />
          </div>
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-md border border-border/40 text-muted-foreground/40">
            <Minus className="h-4 w-4" />
            
          </div>
        )}
      </div>
    </td>
  );
}

export default function RolePermissionMatrix() {
  const { data: roles = [], isLoading: rolesLoading } = useRoles();
  const { data: allPermissions = [], isLoading: permsLoading } = usePermissions();

  const rolePermissionQueries = useQueries({
    queries: roles.map((role) => ({
      queryKey: ["roles", "permissions", String(role.ID)],
      queryFn: async () => {
        const res = await fetch(`${BASE}/api/users/roles/${role.ID}/permissions`, {
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });
        const json = await res.json();
        return json.data ?? [];
      },
      enabled: roles.length > 0,
    })),
  });

  const isLoading =
    rolesLoading ||
    permsLoading ||
    rolePermissionQueries.some((q) => q.isLoading);

  const { rolePermMap, grouped } = React.useMemo(() => {
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

  if (isLoading)
    return (
      <PageContainer>
        <Skeleton className="h-[80vh] w-full rounded-xl" />
      </PageContainer>
    );

  return (
    <PageContainer>
      <div className="max-w-full mx-auto space-y-2 ">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-xl">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                Role Permission Matrix
              </h1>
              <Breadcrumb>
                <BreadcrumbList className="text-xs text-muted-foreground">
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to="/">Admin</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Permissions</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              Granted
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
              Denied
            </div>
          </div>
        </div>

        {/* Table */}
        <Card className="border py-0 shadow-sm rounded-xl overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-auto max-h-[calc(100vh-150px)]">
              <table className="w-full text-sm border-separate border-spacing-0">

                {/* Head */}
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
                        <div className="font-semibold">
                          {role.ROLE_NAME}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {rolePermMap[role.ID]?.size || 0} permissions
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                {/* Body */}
                <tbody>
                  {Object.entries(grouped).map(([moduleName, perms]) => (
                    <React.Fragment key={moduleName}>

                      {/* Module Header */}
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

                      {/* Permissions */}
                      {perms.map((perm) => (
                        <tr
                          key={perm.ID}
                          className="group hover:bg-muted/40 transition"
                        >
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
                          </td>

                          {roles.map((role) => (
                            <MatrixCell
                              key={`${role.ID}-${perm.ID}`}
                              granted={
                                rolePermMap[role.ID]?.has(perm.ID) ?? false
                              }
                            />
                          ))}
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
    </PageContainer>
  );
}