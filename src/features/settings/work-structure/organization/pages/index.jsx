import React from "react";

import { Button } from "@/components/ui/button";
import { IconPlus } from "@tabler/icons-react";


import AddOrganizationDialog from "../components/AddOrganizationDialog";
import { useConfirmationDialog } from "@/hooks/useConfirmationDialog";
import useDialogState from "@/hooks/useDialogState";
import SalarySlipPdf from "@/components/salary-slip-pdf";
import OrganizationList from "../components/organization-list";


const Organizaitons = () => {
    // const [addOrganizationDialogOpen, setAddOrganizationDialogOpen] = useState(false);
    const [open, setOpen] = useDialogState();
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
              onClick={() => setOpen("open")}
            >
                <IconPlus size={50}/>
                
              Add Organization 
            </Button>
            
          </div>
        </div>

      
      </div>
      <OrganizationList />
      <AddOrganizationDialog open={open === "open"} onOpenChange={setOpen} showConfirmation={showConfirmation}/>
      <ConfirmationDialog />
      <SalarySlipPdf />
     
    </div>
  );
};

export default Organizaitons;
