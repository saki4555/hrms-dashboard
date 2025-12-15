"use client";
import { Menu } from "lucide-react";

import { useSidebar } from "./ui/sidebar";
import { Button } from "./ui/button";
import { ModeToggle } from "./mode-toggle";
import { Separator } from "./ui/separator";

const DashboardNavbar = () => {
  const { toggleSidebar} = useSidebar();
  return (
    <>
    <nav className="flex h-14  sticky top-0 z-50  backdrop-blur-lg shrink-0   items-center gap-2 transition-[width,height] ease-linear ">
      <div className="flex w-full items-center justify-between ">
        <Button variant="ghost"  onClick={toggleSidebar}>
          <Menu className="w-full" />
        </Button>
       
        <ModeToggle />
      </div>
    </nav>
    <Separator />
    </>
  );
};

export default DashboardNavbar;
