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
    defaultOpen: true, 
    items: [
      { title: "Overview", url: "/", roles: ["Admin", "HR", "Supervisor", "Employee"] },
    ],
  },
  {
    title: "Core HR",
    roles: ["Admin", "HR"],
    icon: IconUserCheck,
    items: [
      { title: "Employee Requisition", url: "/core-hr/requisition", roles: ["Admin", "HR"] },
      { title: "Employee Management", url: "/core-hr/employees", roles: ["Admin", "HR"] },
      { title: "Employment Lifecycle", url: "/core-hr/lifecycle", roles: ["Admin", "HR"] },
      { title: "Digital Document Management", url: "/core-hr/documents", roles: ["Admin", "HR"] },
    ],
  },
  {
    title: "Attendance Management",
    roles: ["Admin", "HR", "Supervisor"],
    icon: IconUserCheck,
    items: [
      { title: "Setup", url: "/attendance/setup", roles: ["Admin", "HR"] },
      { title: "Employee Assignment", url: "/attendance/assignment", roles: ["Admin", "HR"] },
      { title: "Work Schedule", url: "/attendance/schedule", roles: ["Admin", "HR", "Supervisor"] },
      { title: "Attendance Data", url: "/attendance/data", roles: ["Admin", "HR"] },
      { title: "Attendance Reports", url: "/attendance/reports", roles: ["Admin", "HR", "Supervisor"] },
    ],
  },
  {
    title: "Payroll Management",
    icon: IconPaywall,
    roles: ["Admin", "HR"],
    items: [
      { title: "Configuration", url: "/payroll/configuration", roles: ["Admin"] },
      { title: "Payroll Processing", url: "/payroll/processing", roles: ["Admin", "HR"] },
      { title: "Approvals", url: "/payroll/approvals", roles: ["Admin", "HR"] },
      { title: "Output", url: "/payroll/output", roles: ["Admin", "HR"] },
    ],
  },
  {
    title: "Performance Management",
    icon: IconPerspectiveOff,
    roles: ["Admin", "HR", "Supervisor", "Employee"],
    items: [
      { title: "Setup", url: "/performance/setup", roles: ["Admin", "HR"] },
      { title: "Appraisal Process", url: "/performance/appraisal", roles: ["Admin", "HR", "Supervisor", "Employee"] },
      { title: "Reports", url: "/performance/reports", roles: ["Admin", "HR"] },
    ],
  },
  {
    title: "Self-Service Portal",
    icon: IconPerspectiveOff,
    roles: ["Admin", "HR", "Supervisor", "Employee"],
    items: [
      { title: "Employee Self-Service", url: "/self-service/ess", roles: ["Admin", "HR", "Supervisor", "Employee"] },
      { title: "Manager Self-Service", url: "/self-service/mss", roles: ["Admin", "HR", "Supervisor"] },
    ],
  },
  {
    title: "PF Management",
    icon: IconPaywall,
    roles: ["Admin", "HR", "Supervisor", "Employee"],
    items: [
      { title: "PF Overview", url: "/pf/overview", roles: ["Admin", "HR", "Supervisor", "Employee"] },
    ],
  },
  {
    title: "Gratuity Management",
    icon: IconPaywall,
    roles: ["Admin", "HR", "Employee"],
    items: [
      { title: "Gratuity Overview", url: "/gratuity/overview", roles: ["Admin", "HR", "Employee"] },
    ],
  },
  {
    title: "Loan & Advance",
    icon: IconPaywall,
    roles: ["Admin", "HR", "Supervisor", "Employee"],
    items: [
      { title: "Loan Management", url: "/loan/management", roles: ["Admin", "HR", "Supervisor", "Employee"] },
    ],
  },
  {
    title: "Document Management",
    icon: IconSettings,
    roles: ["Admin", "HR"],
    items: [
      { title: "Documents", url: "/documents/manage", roles: ["Admin", "HR"] },
    ],
  },
  {
    title: "Communication",
    icon: IconSettings,
    roles: ["Admin", "HR", "Supervisor", "Employee"],
    items: [
      { title: "Notifications", url: "/communication/notifications", roles: ["Admin", "HR", "Supervisor", "Employee"] },
      { title: "Announcements", url: "/communication/announcements", roles: ["Admin", "HR"] },
    ],
  },
  {
    title: "Reports & Analytics",
    icon: IconReport,
    roles: ["Admin", "HR"],
    items: [
      { title: "General Reports", url: "/reports/general", roles: ["Admin", "HR"] },
      { title: "Attendance Reports", url: "/reports/attendance", roles: ["Admin", "HR"] },
      { title: "Payroll Reports", url: "/reports/payroll", roles: ["Admin", "HR"] },
      { title: "HR Analytics Dashboard", url: "/reports/analytics", roles: ["Admin", "HR"] },
    ],
  },
  {
    title: "Settings",
    icon: IconSettings,
    roles: ["Admin", "HR"],
    items: [
      { title: "Work Structure", url: "/settings/work-structure", roles: ["Admin", "HR"] },
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
