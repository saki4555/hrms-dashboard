

import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarRail,
  SidebarFooter,
} from "@/components/ui/sidebar";

import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";

import { LayoutDashboardIcon } from "lucide-react";
import { Link, matchPath, useLocation } from "react-router";
import { NavUser } from "./nav-user";

import { IconCaretRightFilled } from "@tabler/icons-react";
import { NAV_ITEMS } from "@/config/nav-config";
import { useAuth } from "@/features/authentication/use-auth";

// Returns true if user has at least ONE of the required permissions
const hasAnyPermission = (userPermissions = [], requiredPermissions = []) =>
  requiredPermissions.some((p) => userPermissions.includes(p));

export function AppSidebar({ ...props }) {
  const location = useLocation();
  const { user } = useAuth();
  const userPermissions = user?.permissions ?? [];

  return (
    <Sidebar {...props}>
      {/* HEADER */}
      <SidebarHeader>
        <SidebarMenuButton size="lg">
          <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
            <LayoutDashboardIcon className="size-4" />
          </div>
          <div className="flex flex-col gap-0.5 leading-none">
            <span className="font-medium">HRMS Dashboard</span>
          </div>
        </SidebarMenuButton>
      </SidebarHeader>

      {/* CONTENT */}
      <SidebarContent>
        {NAV_ITEMS.map((section) => {
          // Filter section items by permission
          const visibleItems = section.items.filter((item) =>
            hasAnyPermission(userPermissions, item.permissions)
          );

          // Don't render the section group at all if no items are visible
          if (visibleItems.length === 0) return null;

          return (
            <SidebarGroup key={section.label}>
              <SidebarGroupLabel>{section.label}</SidebarGroupLabel>

              {visibleItems.map((item) => {
                // Filter sub-items by permission
                const filteredSubItems = item.subItems?.filter((sub) =>
                  hasAnyPermission(userPermissions, sub.permissions)
                );

                return (
                  <SidebarMenu key={item.title}>
                    <Collapsible
                      asChild
                      defaultOpen={item.defaultOpen ?? false}
                      className="group/collapsible"
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger
                          asChild
                          className="data-[state=open]:bg-sidebar-accent/50"
                        >
                          <SidebarMenuButton
                            tooltip={item.title}
                            className="truncate"
                          >
                            {item.icon && (
                              <item.icon className="text-foreground/90" />
                            )}
                            <span>{item.title}</span>
                            <IconCaretRightFilled className="ml-auto text-foreground/80 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>

                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {filteredSubItems?.map((sub) => {
                              const isSubActive = matchPath(
                                { path: sub.url, end: true },
                                location.pathname,
                              );

                              return (
                                <SidebarMenuSubItem key={sub.title}>
                                  <SidebarMenuSubButton
                                    asChild
                                    isActive={!!isSubActive}
                                  >
                                    <Link to={sub.url}>
                                      <span>{sub.title}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              );
                            })}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  </SidebarMenu>
                );
              })}
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      {/* FOOTER */}
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}