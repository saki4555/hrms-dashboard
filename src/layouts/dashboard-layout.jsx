import { AppSidebar } from "@/components/app-sidebar";
import DashboardNavbar from "@/components/dashboard-navbar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useAuth } from "@/features/authentication/hooks/useAuth";
import React, { Suspense } from "react";
import { Outlet, useLocation } from "react-router";
import { Toaster } from "sonner";


const DashboardLayout = () => {

  const {user} = useAuth();
  const location = useLocation();
  // console.log(location.pathname, "pathname")
  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar userRole={user?.role}/>
      <SidebarInset>
        <main className="">
         <DashboardNavbar />
         <Suspense fallback={<div className="text-2xl font-bold h-[50vh] flex items-center justify-center">Loading...</div>}>
          <Outlet />
          </Suspense>
        </main>
      </SidebarInset>
      <Toaster richColors position="top-right"/>
    </SidebarProvider>
  );
};

export default DashboardLayout;
