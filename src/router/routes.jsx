import DashboardLayout from "@/layouts/dashboard-layout";
import Login from "@/pages/login";
import Welcome from "@/pages/welcome";
import { Route, Routes } from "react-router";

// Core HR Pages
import EmployeeDetailsPage from "@/features/core-hr/pages/EmployeeDetailsPage";
import CoreHRPage from "@/features/core-hr/pages/CoreHRPage";
import EditEmployeePage from "@/features/core-hr/pages/EditEmployeePage";
import CreateEmployeePage from "@/features/core-hr/pages/CreateEmployeePage";

import { PrivateRoute } from "./PrivateRoute";
import Unauthorized from "@/features/authentication/pages/Unauthorized";
import AddOrganizationPage from "@/features/core-hr/pages/AddOrganizationPage";
import ManageOrganizaiton from "@/features/settings/work-structure/organization/pages/ManageOrganization";
import Positions from "@/features/settings/work-structure/position/pages/Positions";

const AppRoutes = () => {
  return (
    <Routes>
      {/* =======================================================================
       *                              PUBLIC ROUTES
       * =======================================================================
       */}
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* =======================================================================
       *                           PROTECTED ROUTES (LAYOUT WRAPPER)
       * 
       *   DashboardLayout is wrapped inside PrivateRoute to ensure only users
       *   with valid session & roles can access the dashboard area.
       * =======================================================================
       */}
      <Route
        path="/"
        element={
          <PrivateRoute allowedRoles={["Admin", "HR", "Supervisor", "Employee"]}>
            <DashboardLayout />
          </PrivateRoute>
        }
      >
        {/* ============================= DASHBOARD ============================= */}
        <Route index element={<Welcome />} />

        {/* =====================================================================
         *                              CORE HR MODULE
         * =====================================================================
         */}
        <Route
          path="core-hr/requisition"
          element={
            <PrivateRoute allowedRoles={["Admin", "HR"]}>
              <div>Employee Requisition Page</div>
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

        {/* Employee Create / Edit / Details */}
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
              <div>Employment Lifecycle Page</div>
            </PrivateRoute>
          }
        />

        <Route
          path="core-hr/documents"
          element={
            <PrivateRoute allowedRoles={["Admin", "HR"]}>
              <div>Digital Document Management Page</div>
            </PrivateRoute>
          }
        />

        {/* =====================================================================
         *                        ATTENDANCE MANAGEMENT MODULE
         * =====================================================================
         */}
        <Route
          path="attendance/setup"
          element={
            <PrivateRoute allowedRoles={["Admin", "HR"]}>
              <div>Attendance Setup Page</div>
            </PrivateRoute>
          }
        />

        <Route
          path="attendance/assignment"
          element={
            <PrivateRoute allowedRoles={["Admin", "HR"]}>
              <div>Employee Assignment Page</div>
            </PrivateRoute>
          }
        />

        <Route
          path="attendance/schedule"
          element={
            <PrivateRoute allowedRoles={["Admin", "HR", "Supervisor"]}>
              <div>Work Schedule Page</div>
            </PrivateRoute>
          }
        />

        <Route
          path="attendance/data"
          element={
            <PrivateRoute allowedRoles={["Admin", "HR"]}>
              <div>Attendance Data Page</div>
            </PrivateRoute>
          }
        />

        <Route
          path="attendance/reports"
          element={
            <PrivateRoute allowedRoles={["Admin", "HR", "Supervisor"]}>
              <div>Attendance Reports Page</div>
            </PrivateRoute>
          }
        />

        {/* =====================================================================
         *                          PAYROLL MANAGEMENT MODULE
         * =====================================================================
         */}
        <Route
          path="payroll/configuration"
          element={
            <PrivateRoute allowedRoles={["Admin"]}>
              <div>Payroll Configuration Page</div>
            </PrivateRoute>
          }
        />

        <Route
          path="payroll/processing"
          element={
            <PrivateRoute allowedRoles={["Admin", "HR"]}>
              <div>Payroll Processing Page</div>
            </PrivateRoute>
          }
        />

        <Route
          path="payroll/approvals"
          element={
            <PrivateRoute allowedRoles={["Admin", "HR"]}>
              <div>Payroll Approvals Page</div>
            </PrivateRoute>
          }
        />

        <Route
          path="payroll/output"
          element={
            <PrivateRoute allowedRoles={["Admin", "HR"]}>
              <div>Payroll Output Page</div>
            </PrivateRoute>
          }
        />

        {/* =====================================================================
         *                      PERFORMANCE MANAGEMENT MODULE
         * =====================================================================
         */}
        <Route
          path="performance/setup"
          element={
            <PrivateRoute allowedRoles={["Admin", "HR"]}>
              <div>Performance Setup Page</div>
            </PrivateRoute>
          }
        />

        <Route
          path="performance/appraisal"
          element={
            <PrivateRoute allowedRoles={["Admin", "HR", "Supervisor", "Employee"]}>
              <div>Appraisal Process Page</div>
            </PrivateRoute>
          }
        />

        <Route
          path="performance/reports"
          element={
            <PrivateRoute allowedRoles={["Admin", "HR"]}>
              <div>Performance Reports Page</div>
            </PrivateRoute>
          }
        />

        {/* =====================================================================
         *                       SELF-SERVICE PORTAL (ESS/MSS)
         * =====================================================================
         */}
        <Route
          path="self-service/ess"
          element={
            <PrivateRoute allowedRoles={["Admin", "HR", "Supervisor", "Employee"]}>
              <div>Employee Self-Service Page</div>
            </PrivateRoute>
          }
        />

        <Route
          path="self-service/mss"
          element={
            <PrivateRoute allowedRoles={["Admin", "HR", "Supervisor"]}>
              <div>Manager Self-Service Page</div>
            </PrivateRoute>
          }
        />

        {/* =====================================================================
         *                              PF MANAGEMENT
         * =====================================================================
         */}
        <Route
          path="pf/overview"
          element={
            <PrivateRoute allowedRoles={["Admin", "HR", "Supervisor", "Employee"]}>
              <div>PF Management Page</div>
            </PrivateRoute>
          }
        />

        {/* =====================================================================
         *                          GRATUITY MANAGEMENT
         * =====================================================================
         */}
        <Route
          path="gratuity/overview"
          element={
            <PrivateRoute allowedRoles={["Admin", "HR", "Employee"]}>
              <div>Gratuity Management Page</div>
            </PrivateRoute>
          }
        />

        {/* =====================================================================
         *                           LOAN & ADVANCE MODULE
         * =====================================================================
         */}
        <Route
          path="loan/management"
          element={
            <PrivateRoute allowedRoles={["Admin", "HR", "Supervisor", "Employee"]}>
              <div>Loan & Advance Management Page</div>
            </PrivateRoute>
          }
        />

        {/* =====================================================================
         *                         DOCUMENT MANAGEMENT MODULE
         * =====================================================================
         */}
        <Route
          path="documents/manage"
          element={
            <PrivateRoute allowedRoles={["Admin", "HR"]}>
              <div>Document Management Page</div>
            </PrivateRoute>
          }
        />

        {/* =====================================================================
         *                    COMMUNICATION & NOTIFICATION MODULE
         * =====================================================================
         */}
        <Route
          path="communication/notifications"
          element={
            <PrivateRoute allowedRoles={["Admin", "HR", "Supervisor", "Employee"]}>
              <div>Notifications Page</div>
            </PrivateRoute>
          }
        />

        <Route
          path="communication/announcements"
          element={
            <PrivateRoute allowedRoles={["Admin", "HR"]}>
              <div>Announcements Page</div>
            </PrivateRoute>
          }
        />

        {/* =====================================================================
         *                         REPORTS & ANALYTICS MODULE
         * =====================================================================
         */}
        <Route
          path="reports/general"
          element={
            <PrivateRoute allowedRoles={["Admin", "HR"]}>
              <div>General Reports Page</div>
            </PrivateRoute>
          }
        />

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

        <Route
          path="reports/analytics"
          element={
            <PrivateRoute allowedRoles={["Admin", "HR"]}>
              <div>HR Analytics Dashboard</div>
            </PrivateRoute>
          }
        />

        {/* =====================================================================
         *                                 SETTINGS
         * =====================================================================
         */}
        <Route
          path="settings/work-structure"
          element={
            <PrivateRoute allowedRoles={["Admin", "HR"]}>
              <AddOrganizationPage />
            </PrivateRoute>
          }
        />

        <Route
          path="settings/work-structure/organization"
          element={
            <PrivateRoute allowedRoles={["Admin", "HR"]}>
              <ManageOrganizaiton />
            </PrivateRoute>
          }
        />
        <Route
          path="settings/work-structure/positions"
          element={
            <PrivateRoute allowedRoles={["Admin", "HR"]}>
              <Positions />
            </PrivateRoute>
          }
        />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
