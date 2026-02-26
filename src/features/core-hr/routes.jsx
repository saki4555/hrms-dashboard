import { PrivateRoute } from "@/routes/PrivateRoute";

import { Route } from "react-router";
import { ROLES } from "@/constants/roles";
import { lazy } from "react";
import Employees from "./employee-management";
import EmployeeTypes from "./employee-types";
import UpdateEmployeePage from "./employee-management/update-employee-page";
import AddEmployeePageModern from "./employee-management/AddEmployeePageModern";


const CoreHRPage = lazy(() => import("./pages"));
const AddEmployeePage = lazy(
  () => import("./employee-management/AddEmployeePage"),
);
const EditEmployeePage = lazy(() => import("./pages/EditEmployeePage"));
const EmployeeDetailsPage = lazy(() => import("./pages/EmployeeDetailsPage"));

const CoreHRRoutes = (
  <>
    <Route
      path="core-hr/requisition"
      element={
        <PrivateRoute allowedRoles={[ROLES.ADMIN, ROLES.HR]}>
          <div>Employee Requisition Page</div>
        </PrivateRoute>
      }
    />
    <Route
      path="core-hr/employees"
      element={
        <PrivateRoute allowedRoles={[ROLES.ADMIN, ROLES.HR]}>
          <Employees />
        </PrivateRoute>
      }
    />

    <Route
      path="core-hr/employees/add"
      element={
        <PrivateRoute allowedRoles={[ROLES.ADMIN, ROLES.HR]}>
          <AddEmployeePage />
        </PrivateRoute>
      }
    />
    {/*//! modern one  */}
    <Route
      path="core-hr/employees/add-modern"
      element={
        <PrivateRoute allowedRoles={[ROLES.ADMIN, ROLES.HR]}>
         <AddEmployeePageModern />
        </PrivateRoute>
      }
    />
     <Route
      path="core-hr/employee-management/update/:personId"
      element={
        <PrivateRoute allowedRoles={[ROLES.ADMIN, ROLES.HR]}>
          <UpdateEmployeePage />
        </PrivateRoute>
      }
    />
    <Route
      path="core-hr/employee-management/employee-details/:empNo"
      element={
        <PrivateRoute allowedRoles={[ROLES.ADMIN, ROLES.HR]}>
          <EmployeeDetailsPage />
        </PrivateRoute>
      }
    />
    <Route
      path="core-hr/employee/edit/:empNo"
      element={
        <PrivateRoute allowedRoles={[ROLES.ADMIN, ROLES.HR]}>
          <EditEmployeePage />
        </PrivateRoute>
      }
    />
    <Route
      path="core-hr/lifecycle"
      element={
        <PrivateRoute allowedRoles={[ROLES.ADMIN, ROLES.HR]}>
          <div>Employment Lifecycle Page</div>
        </PrivateRoute>
      }
    />

    <Route
      path="core-hr/documents"
      element={
        <PrivateRoute allowedRoles={[ROLES.ADMIN, ROLES.HR]}>
          <div>Digital Document Management Page</div>
        </PrivateRoute>
      }
    />

    {/* //! others (not in doc's hrms menu) */}
    <Route
      path="core-hr/employee-types"
      element={
        <PrivateRoute allowedRoles={[ROLES.ADMIN, ROLES.HR]}>
          <EmployeeTypes />
        </PrivateRoute>
      }
    />
    
  </>
);

export default CoreHRRoutes;
