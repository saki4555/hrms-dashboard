import { lazy } from "react";
import { PrivateRoute } from "@/routes/PrivateRoute";
import { Route } from "react-router";


import { ROLES } from "@/constants/roles";
import HRPositions from "./work-structure/hr-position";


const AddOrganizationPage = lazy(() => import('../core-hr/pages/AddOrganizationPage'));

const Organizations = lazy(() => import('./work-structure/organization/pages'))
const Positions  = lazy(() => import('./work-structure/position/pages'))


const SettingsRoutes = (
  <>
    <Route
      path="settings/work-structure"
      element={
        <PrivateRoute allowedRoles={[ROLES.ADMIN, ROLES.HR]}>
          <AddOrganizationPage />
        </PrivateRoute>
      }
    />

    <Route
      path="settings/work-structure/organization"
      element={
        <PrivateRoute allowedRoles={[ROLES.ADMIN, ROLES.HR]}>
          <Organizations />
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

    <Route
      path="settings/work-structure/hr-positions"
      element={
        <PrivateRoute allowedRoles={[ROLES.ADMIN, ROLES.HR]}>
          <HRPositions />
        </PrivateRoute>
      }
    />
  </>
);

export default SettingsRoutes;
