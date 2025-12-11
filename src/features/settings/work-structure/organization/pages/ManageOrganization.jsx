import { Button } from "@/components/ui/button";
import { IconPlus } from "@tabler/icons-react";

import React, { useState } from "react";
import AddOrganizationDialog from "../components/AddOrganizationDialog";
import { useConfirmationDialog } from "@/hooks/useConfirmationDialog";

const ManageOrganizaiton = () => {
    const [addOrganizationDialogOpen, setAddOrganizationDialogOpenn] = useState(false);
    const {showConfirmation, ConfirmationDialog} = useConfirmationDialog();
  return (
    <div className="min-h-screen pt-2 pb-4">
      <div className="px-1">
        {/* Header */}
        <div className="bg-card rounded-sm  shadow-sm p-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-2xl font-bold">Organization</h1>
              <p className="text-muted-foreground mt-1">
                Manage organization information and records
              </p>
            </div>
            <Button
              onClick={() => setAddOrganizationDialogOpenn(true)}
            >
                <IconPlus size={50}/>
                
              Add Organization 
            </Button>
            
          </div>
        </div>

      
      </div>
      <AddOrganizationDialog open={addOrganizationDialogOpen} onOpenChange={setAddOrganizationDialogOpenn} showConfirmation={showConfirmation}/>
      <ConfirmationDialog />
    </div>
  );
};

export default ManageOrganizaiton;
