"use client";
import { Menu } from "lucide-react";

import { useSidebar } from "./ui/sidebar";
import { Button } from "./ui/button";
import { ModeToggle } from "./mode-toggle";
import { Separator } from "./ui/separator";
import { IconChevronsRight} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

const DashboardNavbar = () => {
  const { toggleSidebar, open} = useSidebar();

  return (
    <>
    <nav className="flex h-14 px-1  sticky top-0 z-50  backdrop-blur-lg shrink-0   items-center gap-2 transition-[width,height] ease-linear ">
      <div className="flex w-full items-center justify-between ">
        <Button variant="outline" className="size-10"  onClick={toggleSidebar}>
          
          <IconChevronsRight className={cn("size-5", open && "-rotate-180")}/>
        </Button>
       
        <ModeToggle />
      </div>
    </nav>
    <Separator />
    </>
  );
};

export default DashboardNavbar;
