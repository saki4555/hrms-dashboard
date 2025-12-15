import React from "react";

import { Button } from "@/components/ui/button";
import { IconPlus } from "@tabler/icons-react";


import { useConfirmationDialog } from "@/hooks/useConfirmationDialog";
import useDialogState from "@/hooks/useDialogState";
import AddPositionDialog from "../components/AddPositionDialog";


const Positions = () => {
    
    const [open, setOpen] = useDialogState();
    const {showConfirmation, ConfirmationDialog} = useConfirmationDialog();
  return (
    <div className="min-h-screen pt-2 pb-4">
      <div className="px-3">
        {/* Header */}
        <div className="bg-card rounded-sm  shadow-sm p-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-2xl font-bold">Positions</h1>
              <p className="text-muted-foreground mt-1">
                Manage positions information and records
              </p>
            </div>
            <Button
              onClick={() => setOpen("open")}
            >
                <IconPlus size={50}/>
                
              Add Position
            </Button>
            
          </div>
        </div>

      
      </div>
      <AddPositionDialog open={open === "open"} onOpenChange={setOpen} showConfirmation={showConfirmation}/>
      <ConfirmationDialog />





     
    </div>
  );
};

export default Positions;
