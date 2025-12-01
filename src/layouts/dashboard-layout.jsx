import { AppSidebar } from "@/components/app-sidebar";
import DashboardNavbar from "@/components/dashboard-navbar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useAuth } from "@/features/authentication/hooks/useAuth";
import React from "react";
import { Outlet } from "react-router";
import { Toaster } from "sonner";

const DashboardLayout = () => {

  const {user} = useAuth();
  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar userRole={user?.role}/>
      <SidebarInset>
        <main className="px-4">
         <DashboardNavbar />
          <Outlet />
        </main>
      </SidebarInset>
      <Toaster richColors position="top-right"/>
    </SidebarProvider>
  );
};

export default DashboardLayout;
