"use client";
import { IconChevronsRight } from "@tabler/icons-react";
import { useSidebar } from "./ui/sidebar";
import { Button } from "./ui/button";
import { ModeToggle } from "./mode-toggle";
import { CommandTrigger } from "./shared/command-trigger";
import { Separator } from "./ui/separator";
import { cn } from "@/lib/utils";
import NotificationBell from "@/features/notifications/notification-bell";
import { useAuth } from "@/features/authentication/use-auth";



const DashboardNavbar = () => {
  const { toggleSidebar, open } = useSidebar();
  const { user } = useAuth();

  const isSupervisor =
    user?.roles?.includes("Supervisor") || user?.roles?.includes("Admin");

    console.log("isSupervisor", isSupervisor);

  return (
    <>
      <nav className="flex h-14 sticky top-0 z-50 bg-gray-50/70 dark:bg-gray-950/70 backdrop-blur-lg shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" className="size-8" onClick={toggleSidebar}>
              <IconChevronsRight className={cn("size-5", open && "-rotate-180")} />
            </Button>
            <CommandTrigger placeholder="Search pages..." />
          </div>

          <div className="flex items-center gap-2">
            {user?.employee_id && (
              <NotificationBell
                userId={user.employee_id}
                isSupervisor={isSupervisor}
              />
            )}
            <ModeToggle />
          </div>
        </div>
      </nav>
      <Separator />
    </>
  );
};
export default DashboardNavbar;
