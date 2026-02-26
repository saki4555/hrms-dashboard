import { lazy } from "react";
import { PrivateRoute } from "@/routes/PrivateRoute";
import { Route } from "react-router";


import { ROLES } from "@/constants/roles";
import HRPositions from "./work-structure/hr-position";
import Grades from "./work-structure/hr-grade";
import Companies from "./work-structure/company";
import OrgTypes from "./work-structure/organization-types";
import Locations from "./work-structure/locations";
import Countrys from "./work-structure/country";
import Regions from "./work-structure/region";
import Districts from "./work-structure/district";
import Upazilla from "./work-structure/upazilla";



// const AddOrganizationPage = lazy(() => import('../core-hr/pages/AddOrganizationPage'));

const Organizations  = lazy(() => import('./work-structure/organization'))
const Positions  = lazy(() => import('./work-structure/position/pages'))


const SettingsRoutes = (
  <>
    {/* <Route
      path="settings/work-structure"
      element={
        <PrivateRoute allowedRoles={[ROLES.ADMIN, ROLES.HR]}>
          <AddOrganizationPage />
        </PrivateRoute>
      }
    /> */}

    <Route
      path="settings/work-structure/organization"
      element={
        <PrivateRoute allowedRoles={[ROLES.ADMIN, ROLES.HR]}>
          <Organizations />
        </PrivateRoute>
      }
    />
    <Route
      path="settings/work-structure/country"
      element={
        <PrivateRoute allowedRoles={[ROLES.ADMIN, ROLES.HR]}>
          <Countrys />
        </PrivateRoute>
      }
    />
     <Route
      path="settings/work-structure/region"
      element={
        <PrivateRoute allowedRoles={[ROLES.ADMIN, ROLES.HR]}>
          <Regions />
        </PrivateRoute>
      }
    />
     <Route
      path="settings/work-structure/district"
      element={
        <PrivateRoute allowedRoles={[ROLES.ADMIN, ROLES.HR]}>
          <Districts />
        </PrivateRoute>
      }
    />
     <Route
      path="settings/work-structure/upazilla"
      element={
        <PrivateRoute allowedRoles={[ROLES.ADMIN, ROLES.HR]}>
          <Upazilla />
        </PrivateRoute>
      }
    />
    <Route
      path="settings/work-structure/positions"
      element={
        <PrivateRoute allowedRoles={[ROLES.ADMIN, ROLES.HR]}>
          <Positions />
        </PrivateRoute>
      }
    />
{/* //! others (not in doc's hrms menu) */}
    <Route
      path="settings/work-structure/hr-positions"
      element={
        <PrivateRoute allowedRoles={[ROLES.ADMIN, ROLES.HR]}>
          <HRPositions />
        </PrivateRoute>
      }
    />
     <Route
      path="settings/work-structure/grades"
      element={
        <PrivateRoute allowedRoles={[ROLES.ADMIN, ROLES.HR]}>
          <Grades />
        </PrivateRoute>
      }
    />
     <Route
      path="settings/work-structure/company"
      element={
        <PrivateRoute allowedRoles={[ROLES.ADMIN, ROLES.HR]}>
          <Companies />
        </PrivateRoute>
      }
    />
     <Route
      path="settings/work-structure/org-types"
      element={
        <PrivateRoute allowedRoles={[ROLES.ADMIN, ROLES.HR]}>
          <OrgTypes />
        </PrivateRoute>
      }
    />
     <Route
      path="settings/work-structure/locations"
      element={
        <PrivateRoute allowedRoles={[ROLES.ADMIN, ROLES.HR]}>
          <Locations />
        </PrivateRoute>
      }
    />
  </>
);

export default SettingsRoutes;
