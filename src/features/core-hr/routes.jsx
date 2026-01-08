import { PrivateRoute } from "@/routes/PrivateRoute";



import { Route } from "react-router";
import { ROLES } from "@/constants/roles";
import { lazy } from "react";


const CoreHRPage = lazy(() => import("./pages"))
const CreateEmployeePage = lazy(() => import("./pages/CreateEmployeePage"))
const EditEmployeePage = lazy(() => import("./pages/EditEmployeePage"));
const EmployeeDetailsPage = lazy(() => import("./pages/EmployeeDetailsPage"))

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
          <CoreHRPage />
        </PrivateRoute>
      }
    />
    
    <Route
      path="core-hr/employee/create-employee"
      element={
        <PrivateRoute allowedRoles={[ROLES.ADMIN, ROLES.HR]}>
          <CreateEmployeePage />
        </PrivateRoute>
      }
    />
    <Route
      path="core-hr/employee/:empNo"
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
  </>
);


export default CoreHRRoutes;
