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
import { useAuth } from "@/features/authentication/hooks/useAuth";
import React, { Suspense } from "react";
import { Outlet, useLocation } from "react-router";
import { Toaster } from "sonner";

const DashboardLayout = () => {
  const { user } = useAuth();
  const location = useLocation();
  // console.log(location.pathname, "pathname")
  return (
    
      <SidebarProvider defaultOpen={false} >
      <AppSidebar userRole={user?.role} />
      <SidebarInset className="min-w-0 ">
        <main>
          <DashboardNavbar />
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </main>
        {import.meta.env.DEV && (
          <>
            <ContentSizeIndicator position="bottom-right" />
            {/* @container — excludes sidebar */}
            <ViewportSizeIndicator position="bottom-left" />
            {/* viewport — whole page */}
          </>
        )}
      </SidebarInset>
      <Toaster richColors position="top-right" />
    </SidebarProvider>
    
  );
};

export default DashboardLayout;
