import DashboardLayout from "@/layouts/dashboard-layout";
import Login from "@/pages/login";
import Welcome from "@/pages/welcome";
import { Route, Routes } from "react-router";

// Only import pages that actually exist
import EmployeeDetailsPage from "@/features/core-hr/pages/EmployeeDetailsPage";
import CoreHRPage from "@/features/core-hr/pages/CoreHRPage";
import EditEmployeePage from "@/features/core-hr/pages/EditEmployeePage";
import CreateEmployeePage from "@/features/core-hr/pages/CreateEmployeePage";

import { PrivateRoute } from "./PrivateRoute";
import Unauthorized from "@/features/authentication/pages/Unauthorized";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Protected Layout */}
      <Route
        path="/"
        element={
          <PrivateRoute
            allowedRoles={["Admin", "HR", "Supervisor", "Employee"]}
          >
            <DashboardLayout />
          </PrivateRoute>
        }
      >
        {/* Dashboard (All roles) */}
        <Route index element={<Welcome />} />

        {/* core-hr routes */}
        <Route
          path="core-hr/requisition"
          element={
            <PrivateRoute allowedRoles={["Admin", "HR"]}>
              <div>Requisition page</div>
            </PrivateRoute>
          }
        />
        <Route
          path="core-hr/employees"
          element={
            <PrivateRoute allowedRoles={["Admin", "HR"]}>
              <CoreHRPage />
            </PrivateRoute>
          }
        />

         <Route
          path="core-hr/employee/create-employee"
          element={
            <PrivateRoute allowedRoles={["Admin", "HR"]}>
              <CreateEmployeePage />
            </PrivateRoute>
          }
        />

        <Route
          path="core-hr/employee/:empNo"
          element={
            <PrivateRoute allowedRoles={["Admin", "HR"]}>
              <EmployeeDetailsPage />
            </PrivateRoute>
          }
        />

        <Route
          path="core-hr/employee/edit/:empNo"
          element={
            <PrivateRoute allowedRoles={["Admin", "HR"]}>
              <EditEmployeePage />
            </PrivateRoute>
          }
        />
        <Route
          path="core-hr/lifecycle"
          element={
            <PrivateRoute allowedRoles={["Admin", "HR"]}>
              <div>Lifecyles page</div>
            </PrivateRoute>
          }
        />
        <Route
          path="core-hr/documents"
          element={
            <PrivateRoute allowedRoles={["Admin", "HR"]}>
              <div>Documents page</div>
            </PrivateRoute>
          }
        />

       
        {/* Team Management (PLACEHOLDER PAGES) */}
        <Route
          path="team-attendance"
          element={
            <PrivateRoute allowedRoles={["Admin", "HR", "Supervisor"]}>
              <div>Team Attendance Page</div>
            </PrivateRoute>
          }
        />

        <Route
          path="approvals"
          element={
            <PrivateRoute allowedRoles={["Admin", "HR", "Supervisor"]}>
              <div>Approvals Page</div>
            </PrivateRoute>
          }
        />

        {/* Payroll (PLACEHOLDER PAGES) */}
        <Route
          path="payroll/config"
          element={
            <PrivateRoute allowedRoles={["Admin"]}>
              <div>Payroll Configuration Page</div>
            </PrivateRoute>
          }
        />

        <Route
          path="payroll/run"
          element={
            <PrivateRoute allowedRoles={["Admin", "HR"]}>
              <div>Run Payroll Page</div>
            </PrivateRoute>
          }
        />

        {/* Self Service (PLACEHOLDERS) */}
        <Route
          path="self-service/leave"
          element={
            <PrivateRoute
              allowedRoles={["Admin", "HR", "Supervisor", "Employee"]}
            >
              <div>Leave Request Page</div>
            </PrivateRoute>
          }
        />

        <Route
          path="self-service/payslips"
          element={
            <PrivateRoute
              allowedRoles={["Admin", "HR", "Supervisor", "Employee"]}
            >
              <div>Payslip Page</div>
            </PrivateRoute>
          }
        />

        <Route
          path="self-service/profile"
          element={
            <PrivateRoute
              allowedRoles={["Admin", "HR", "Supervisor", "Employee"]}
            >
              <div>Profile Page</div>
            </PrivateRoute>
          }
        />

        {/* Reports (PLACEHOLDERS) */}
        <Route
          path="reports/attendance"
          element={
            <PrivateRoute allowedRoles={["Admin", "HR"]}>
              <div>Attendance Reports Page</div>
            </PrivateRoute>
          }
        />

        <Route
          path="reports/payroll"
          element={
            <PrivateRoute allowedRoles={["Admin", "HR"]}>
              <div>Payroll Reports Page</div>
            </PrivateRoute>
          }
        />

        {/* Settings (Admin Only, PLACEHOLDER) */}
        <Route
          path="settings/system"
          element={
            <PrivateRoute allowedRoles={["Admin"]}>
              <div>System Settings Page</div>
            </PrivateRoute>
          }
        />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
