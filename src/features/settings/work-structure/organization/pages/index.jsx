import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import { IconPlus } from "@tabler/icons-react";

import AddOrganizationDialog from "../components/AddOrganizationDialog";

import OrganizationList from "../components/organization-list";

const Organizaitons = () => {
  
 
  
  return (
    <div className="min-h-screen pt-2 pb-4">
      
      
      <OrganizationList />
      
      
      
     
    </div>
  );
};

export default Organizaitons;