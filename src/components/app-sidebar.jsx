import * as React from "react";



import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarFooter
} from "@/components/ui/sidebar";
import { Link } from "react-router";
import { LayoutDashboardIcon } from "lucide-react";
import { NavUser } from "./nav-user";

// This is sample data.
const data = {
  user: {
    name: "Asm Saki",
    email: "saki@example.com",
    avatar: "/avatars/user.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      items: [
        { title: "Overview", url: "/dashboard/overview", isActive: true },
        { title: "Announcements", url: "/dashboard/announcements" },
      ],
    },
    {
      title: "Employees",
      url: "/employees",
      items: [
        { title: "All Employees", url: "/employees" },
        { title: "Departments", url: "/departments" },
        { title: "Divisions", url: "/divisions" },
        { title: "Attendance", url: "/attendance" },
        { title: "Leave Requests", url: "/leaves" },
      ],
    },
    {
      title: "Payroll",
      url: "/payroll",
      items: [
        { title: "Salary Management", url: "/payroll/salaries" },
        { title: "Bonuses & Deductions", url: "/payroll/adjustments" },
        { title: "Payslips", url: "/payroll/payslips" },
      ],
    },
    {
      title: "Performance",
      url: "/performance",
      items: [
        { title: "Reviews", url: "/performance/reviews" },
        { title: "Goals", url: "/performance/goals" },
        { title: "Training", url: "/performance/training" },
      ],
    },
   
  ],
}


export function AppSidebar({ ...props }) {
  return (
    <Sidebar {...props} >
      <SidebarHeader>
       
         <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
              <div
                className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <LayoutDashboardIcon className="size-4" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-medium">HRMS Dashboard</span>
               
              </div>
              
            </SidebarMenuButton>
       
      </SidebarHeader>
      <SidebarContent>
        {/* We create a SidebarGroup for each parent. */}
        {data.navMain.map((item) => (
          <SidebarGroup key={item.title}>
            <SidebarGroupLabel>{item.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {item.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={item.isActive}>
                      <a href={item.url}>{item.title}</a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
       <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
