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

  return (
    <>
      <nav className="...">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" className="size-8" onClick={toggleSidebar}>
              <IconChevronsRight className={cn("size-5", open && "-rotate-180")} />
            </Button>
            <CommandTrigger placeholder="Search pages..." />
          </div>

          <div className="flex items-center gap-2">
            {user?.id && (
              <NotificationBell
                userId={user.employee_id}
                mode="supervisor"
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
