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
        { title: "Overview", url: "/", isActive: false },
        { title: "Announcements", url: "/" },
      ],
    },
    {
      title: "Employees",
      url: "/employees",
      items: [
      
        {
          title: "Core HR", url: "/core-hr", isActive: true
        },
        
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
                      <Link to={item.url}>{item.title}</Link>
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
