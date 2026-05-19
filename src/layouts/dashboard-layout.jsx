// src\layouts\dashboard-layout.jsx
import { AppSidebar } from "@/components/app-sidebar";
import DashboardNavbar from "@/components/dashboard-navbar";
import { PageLoader } from "@/components/loading-spinner";
import { ContentSizeIndicator } from "@/components/shared/content-size-indicator";
import { ViewportSizeIndicator } from "@/components/shared/viewport-size-indicator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { useAuthV2 as useAuth } from "@/features/authentication-v2/use-auth-v2";
import React, { Suspense } from "react";
import { Outlet, useLocation } from "react-router";


const DashboardLayout = () => {
  const { user } = useAuth();

  console.log("user ---------->>>>>>>>>>>", user);
  const location = useLocation();
  
  // console.log(location.pathname, "pathname")
  return (
    
      <SidebarProvider defaultOpen={false} >
      <AppSidebar   collapsible="icon"  />
      <SidebarInset className="min-w-0 peer">
        <main className="@container/main peer-data-[state=collapsed]:bg-red-400">
          <DashboardNavbar />
          {navigation.state === "loading" && <PageLoader />}
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </main>
        {import.meta.env.DEV && (
          <>
            {/* <ContentSizeIndicator position="top-center" /> */}
            {/* @container — excludes sidebar */}
            {/* <ViewportSizeIndicator position="top-center" /> */}
            {/* viewport — whole page */}
          </>
        )}
      </SidebarInset>
      
      <Toaster richColors />
    </SidebarProvider>
    
  );
};

export default DashboardLayout;
