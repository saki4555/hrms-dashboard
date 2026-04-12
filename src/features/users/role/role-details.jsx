// src/features/users/role/role-details.jsx
import { useMemo, useState } from "react";
import { useParams, Link } from "react-router";
import { ShieldCheck, Puzzle, Filter } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import PageContainer from "@/components/page-container";

import {
  useRoles,
  useRolePermissions,
} from "../../user-management/queries";

export default function RoleDetailsPage() {
  const { id } = useParams();
  const [activeModule, setActiveModule] = useState("All");

  const { data: roles = [], isLoading: rolesLoading } = useRoles();
  const role = roles.find((r) => String(r.ID) === String(id));

  const {
    data: rolePermissions = [],
    isLoading: permsLoading,
  } = useRolePermissions(id);

  const isLoading = rolesLoading || permsLoading;

  const grouped = useMemo(() => {
    return rolePermissions.reduce((acc, p) => {
      const mod = p.MODULE_NAME || "Other";
      if (!acc[mod]) acc[mod] = [];
      acc[mod].push(p);
      return acc;
    }, {});
  }, [rolePermissions]);

  const moduleNames = useMemo(() => Object.keys(grouped), [grouped]);

  const filtered = useMemo(() => {
    if (activeModule === "All") return grouped;
    return { [activeModule]: grouped[activeModule] || [] };
  }, [grouped, activeModule]);

  if (isLoading)
    return (
      <PageContainer>
        <Skeleton className="h-[80vh] w-full rounded-xl" />
      </PageContainer>
    );

  return (
    <PageContainer>
      <div className="space-y-5">

        {/* Header (aligned with matrix) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-xl">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                {role?.ROLE_NAME}
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
                    <BreadcrumbPage>Role Details</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </div>

          <Badge variant="secondary" className="text-sm">
            {rolePermissions.length} permissions
          </Badge>
        </div>

        {/* Module Filter */}
        <div className="flex items-center gap-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={activeModule} onValueChange={setActiveModule}>
            <SelectTrigger className="w-60 h-9">
              <SelectValue placeholder="Filter by module" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Modules</SelectItem>
              {moduleNames.map((mod) => (
                <SelectItem key={mod} value={mod}>
                  {mod}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Permissions List */}
        <Card className="border shadow-sm rounded-xl overflow-hidden">
          <CardContent className="p-0">
            <div className="divide-y">

              {Object.keys(filtered).length === 0 && (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  No permissions found
                </div>
              )}

              {Object.entries(filtered).map(([module, perms]) => (
                <div key={module}>

                  {/* Module Header */}
                  <div className="bg-muted/60 px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Puzzle className="h-4 w-4 text-primary" />
                      <span className="font-semibold">{module}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {perms.length}
                    </span>
                  </div>

                  {/* Permissions */}
                  {perms.map((perm) => (
                    <div
                      key={perm.ID}
                      className="flex flex-col px-5 py-3 text-sm hover:bg-muted/40 transition"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="font-mono text-xs">
                          {perm.PERMISSION_CODE}
                        </Badge>
                        <span className="font-medium">
                          {perm.PERMISSION_NAME}
                        </span>
                      </div>

                      {perm.DESCRIPTION && (
                        <p className="text-xs text-muted-foreground mt-1 pl-[68px] leading-relaxed">
                          {perm.DESCRIPTION}
                        </p>
                      )}
                    </div>
                  ))}

                </div>
              ))}

            </div>
          </CardContent>
        </Card>

      </div>
    </PageContainer>
  );
}
