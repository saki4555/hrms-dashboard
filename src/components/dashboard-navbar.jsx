"use client";
import { Menu } from "lucide-react";

import { useSidebar } from "./ui/sidebar";
import { Button } from "./ui/button";
import { ModeToggle } from "./mode-toggle";

import { IconChevronsRight } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { CommandTrigger } from "./shared/command-trigger";
import { Separator } from "./ui/separator";

const DashboardNavbar = () => {
  const { toggleSidebar, open } = useSidebar();

  return (
    <>
      <nav className="flex h-14 px-1  sticky top-0 z-50  backdrop-blur-lg shrink-0   items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex w-full items-center justify-between ">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              className="size-8"
              onClick={toggleSidebar}
            >
              <IconChevronsRight
                className={cn("size-5", open && "-rotate-180")}
              />
            </Button>
           
            <CommandTrigger placeholder="Search pages..." />
          </div>

          <ModeToggle />
        </div>
      </nav>
      <Separator />
    </>
  );
};

export default DashboardNavbar;
