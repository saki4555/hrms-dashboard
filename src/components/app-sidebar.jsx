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

import { ChevronRight, LayoutDashboardIcon } from "lucide-react";
import { Link } from "react-router";
import { NavUser } from "./nav-user";
import { IconBrandTeams, IconLayout, IconLayoutDashboard, IconPaywall, IconPerspectiveOff, IconReport, IconSettings, IconUserCheck } from "@tabler/icons-react";

const navConfig = [
  {
    title: "Dashboard",
    roles: ["Admin", "HR", "Supervisor", "Employee"],
    icon: IconLayoutDashboard,
    defaultOpen: true, // 👈 Dashboard open
    items: [
      { title: "Overview", url: "/", roles: ["Admin", "HR", "Supervisor", "Employee"] },
    ],
  },
  {
    title: "Core HR",

    roles: ["Admin", "HR"],
    icon: IconUserCheck,
    items: [
      { title: "Employee Requisition", url: "/requisition", roles: ["Admin", "HR"] },
      { title: "Employee Management", url: "/employees", roles: ["Admin", "HR"] },
      { title: "Employment Lifecycle", url: "/lifecycle", roles: ["Admin", "HR"] },
      { title: "Documents", url: "/documents", roles: ["Admin", "HR"] },
    ],
  },
  {
    title: "Team Management",

    roles: ["Admin", "HR", "Supervisor"],
    icon: IconBrandTeams,
    items: [
      { title: "Team Attendance", url: "/team-attendance", roles: ["Admin", "HR", "Supervisor"] },
      { title: "Approve Requests", url: "/approvals", roles: ["Admin", "HR", "Supervisor"] },
    ],
  },
  {
    title: "Payroll",
    icon: IconPaywall,
    roles: ["Admin", "HR"],
    items: [
      { title: "Payroll Configuration", url: "/payroll/config", roles: ["Admin"] },
      { title: "Run Payroll", url: "/payroll/run", roles: ["Admin", "HR"] },
    ],
  },
  {
    title: "Self Service",
    icon: IconPerspectiveOff,
    roles: ["Admin", "HR", "Supervisor", "Employee"],
    items: [
      { title: "Leave Request", url: "/self-service/leave", roles: ["Admin", "HR", "Supervisor", "Employee"] },
      { title: "Payslips", url: "/self-service/payslips", roles: ["Admin", "HR", "Supervisor", "Employee"] },
      { title: "My Profile", url: "/self-service/profile", roles: ["Admin", "HR", "Supervisor", "Employee"] },
    ],
  },
  {
    title: "Reports & Analytics",
    icon: IconReport,
    roles: ["Admin", "HR"],
    items: [
      { title: "Attendance Reports", url: "/reports/attendance", roles: ["Admin", "HR"] },
      { title: "Payroll Reports", url: "/reports/payroll", roles: ["Admin", "HR"] },
    ],
  },
  {
    title: "Settings",
    icon: IconSettings,
    roles: ["Admin"],
    items: [
      { title: "System Settings", url: "/settings/system", roles: ["Admin"] },
    ],
  },
];

const user = {
  name: "Asm Saki",
  email: "saki@example.com",
  avatar: "/avatars/user.jpg",
};

export function AppSidebar({ userRole, ...props }) {
  return (
    <Sidebar {...props}>
      {/* HEADER */}
      <SidebarHeader>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
            <LayoutDashboardIcon className="size-4" />
          </div>
          <div className="flex flex-col gap-0.5 leading-none">
            <span className="font-medium">HRMS Dashboard</span>
          </div>
        </SidebarMenuButton>
      </SidebarHeader>

      {/* SIDEBAR CONTENT */}
      <SidebarContent>
        {navConfig
          .filter((group) => group.roles.includes(userRole))
          .map((group) => (
            <SidebarGroup key={group.title}>
              <SidebarMenu>
                <Collapsible
                  asChild
                  defaultOpen={group.defaultOpen ?? false} // 👈 Dashboard open, others closed
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    {/* TRIGGER */}
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton tooltip={group.title}>
                         {group.icon && <group.icon />}
                        <span>{group.title}</span>

                        {/* Chevron rotation */}
                        <ChevronRight
                          className="ml-auto size-4 transition-transform duration-200 
                            group-data-[state=open]/collapsible:rotate-90"
                        />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>

                    {/* CONTENT */}
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {group.items
                          .filter((item) => item.roles.includes(userRole))
                          .map((item) => (
                            <SidebarMenuSubItem key={item.title}>
                              <SidebarMenuSubButton asChild>
                                <Link to={item.url}>
                                  <span>{item.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              </SidebarMenu>
            </SidebarGroup>
          ))}
      </SidebarContent>

      {/* FOOTER */}
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
