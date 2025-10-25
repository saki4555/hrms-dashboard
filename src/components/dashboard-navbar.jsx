"use client";
import { Menu } from "lucide-react";

import { useSidebar } from "./ui/sidebar";
import { Button } from "./ui/button";
import { ModeToggle } from "./mode-toggle";

const DashboardNavbar = () => {
  const { toggleSidebar } = useSidebar();
  return (
    <nav className="flex h-16  sticky top-0 z-50 bg-gray-50/70 dark:bg-gray-950/70 backdrop-blur-lg shrink-0   items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex w-full items-center justify-between ">
        <Button variant="ghost"  onClick={toggleSidebar}>
          <Menu className="w-full" />
        </Button>
       
        <ModeToggle />
      </div>
    </nav>
  );
};

export default DashboardNavbar;
