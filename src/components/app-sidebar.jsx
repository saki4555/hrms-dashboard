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

import {
  IconLayoutDashboard,
  IconUserCheck,
  IconPaywall,
  IconPerspectiveOff,
  IconReport,
  IconSettings,
} from "@tabler/icons-react";

/* -------------------------------------------------------------------------- */
/*                           UPDATED NAV CONFIG (WITH LABELS)                 */
/* -------------------------------------------------------------------------- */

const navConfig = [
  {
    label: "Application",
    items: [
      {
        title: "Dashboard",
        icon: IconLayoutDashboard,
        roles: ["Admin", "HR", "Supervisor", "Employee"],
        subItems: [
          { title: "Overview", url: "/", roles: ["Admin", "HR", "Supervisor", "Employee"] },
        ],
        defaultOpen: true,
      },
      {
        title: "Core HR",
        roles: ["Admin", "HR"],
        icon: IconUserCheck,
        subItems: [
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
        subItems: [
          { title: "Setup", url: "/attendance/setup", roles: ["Admin", "HR"] },
          { title: "Employee Assignment", url: "/attendance/assignment", roles: ["Admin", "HR"] },
          { title: "Work Schedule", url: "/attendance/schedule", roles: ["Admin", "HR", "Supervisor"] },
          { title: "Attendance Data", url: "/attendance/data", roles: ["Admin", "HR"] },
          { title: "Attendance Reports", url: "/attendance/reports", roles: ["Admin", "HR", "Supervisor"] },
        ],
      },
    ],
  },

  {
    label: "Payroll",
    items: [
      {
        title: "Payroll Management",
        roles: ["Admin", "HR"],
        icon: IconPaywall,
        subItems: [
          { title: "Configuration", url: "/payroll/configuration", roles: ["Admin"] },
          { title: "Payroll Processing", url: "/payroll/processing", roles: ["Admin", "HR"] },
          { title: "Approvals", url: "/payroll/approvals", roles: ["Admin", "HR"] },
          { title: "Output", url: "/payroll/output", roles: ["Admin", "HR"] },
        ],
      },
    ],
  },

  {
    label: "Performance",
    items: [
      {
        title: "Performance Management",
        roles: ["Admin", "HR", "Supervisor", "Employee"],
        icon: IconPerspectiveOff,
        subItems: [
          { title: "Setup", url: "/performance/setup", roles: ["Admin", "HR"] },
          { title: "Appraisal Process", url: "/performance/appraisal", roles: ["Admin", "HR", "Supervisor", "Employee"] },
          { title: "Reports", url: "/performance/reports", roles: ["Admin", "HR"] },
        ],
      },
    ],
  },

  {
    label: "Settings",
    items: [
      {
        title: "Work Structure",
        icon: IconSettings,
        roles: ["Admin", "HR"],
        subItems: [
          { title: "Organization", url: "/settings/work-structure/organization", roles: ["Admin", "HR"] },
          { title: "Positions", url: "/settings/work-structure/positions", roles: ["Admin", "HR"] },
          { title: "Units", url: "/settings/work-structure/units", roles: ["Admin", "HR"] },
        ],
      },
    ],
  },

  {
    label: "Reports & Analytics",
    items: [
      {
        title: "Reports",
        icon: IconReport,
        roles: ["Admin", "HR"],
        subItems: [
          { title: "General Reports", url: "/reports/general", roles: ["Admin", "HR"] },
          { title: "Attendance Reports", url: "/reports/attendance", roles: ["Admin", "HR"] },
          { title: "Payroll Reports", url: "/reports/payroll", roles: ["Admin", "HR"] },
          { title: "HR Analytics Dashboard", url: "/reports/analytics", roles: ["Admin", "HR"] },
        ],
      },
    ],
  },
];

const user = {
  name: "Asm Saki",
  email: "saki@example.com",
  avatar: "/avatars/user.jpg",
};

/* -------------------------------------------------------------------------- */
/*                               APP SIDEBAR                                  */
/* -------------------------------------------------------------------------- */

export function AppSidebar({ userRole, ...props }) {
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
        {navConfig.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel>{section.label}</SidebarGroupLabel>

            {section.items
              .filter((item) => item.roles.includes(userRole))
              .map((item) => (
                <SidebarMenu key={item.title}>
                  <Collapsible
                    asChild
                    defaultOpen={item.defaultOpen ?? false}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem >
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton tooltip={item.title} className="truncate">
                          {item.icon && <item.icon className="text-foreground/90"/>}
                          <span>{item.title}</span>
                          <ChevronRight size={10} className="ml-auto  text-foreground/90 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.subItems
                            ?.filter((sub) => sub.roles.includes(userRole))
                            .map((sub) => (
                              <SidebarMenuSubItem key={sub.title}>
                                <SidebarMenuSubButton asChild>
                                  <Link to={sub.url}>
                                    <span>{sub.title}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                </SidebarMenu>
              ))}
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
