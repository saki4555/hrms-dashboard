// src\routes\route-map.jsx

import { lazy } from "react";

import { PERMISSIONS } from "@/config/permissions";
import { PATHS } from "@/config/paths";
// import InventoriesPage from "@/features/inventory";
// import ItemsPage from "@/features/item";
// import ItemStockPage from "@/features/item-stock";
// import RequisitionList from "@/features/requisition-managemant/requisition-list";
// import Requisition from "@/features/requisition-managemant";
// import Requisitions from "@/features/requisition-master";

const P = PERMISSIONS; // shorthand

// ─── Placeholder ──────────────────────────────────────────────────────────────
const Placeholder = ({ title }) => <div>{title}</div>;
const p = (title) => () => <Placeholder title={title} />;

// ─── Core HR ──────────────────────────────────────────────────────────────────
const Employees = lazy(() => import("@/features/core-hr/employee-management"));
const AddEmployee = lazy(
  () => import("@/features/core-hr/employee-management/AddEmployeePage"),
);
const UpdateEmployee = lazy(
  () => import("@/features/core-hr/employee-management/update-employee-page"),
);
const UpdateEmployeeModern = lazy(
  () =>
    import("@/features/core-hr/employee-management/update-employee-page-modern"),
);
const AddEmployeeModern = lazy(
  () =>
    import("@/features/core-hr/employee-management/add-employee-page-modern"),
);
const EmployeeDetails = lazy(
  () => import("@/features/core-hr/employee-management/EmployeeDetailsPage"),
);
const EmployeeTypes = lazy(() => import("@/features/core-hr/employee-types"));

// ─── Payroll ─────────────────────────────────────────────────────────────────
const PayrollRuns = lazy(() => import("@/features/payroll"));
const SalarySheet = lazy(() => import("@/features/payroll/salary-sheet"));
const PayStructure = lazy(() => import("@/features/payroll/pay-structure"));

// ─── Settings ─────────────────────────────────────────────────────────────────
const Organizations = lazy(
  () => import("@/features/settings/work-structure/organization"),
);
const Positions = lazy(
  () => import("@/features/settings/work-structure/position/pages"),
);
const HRPositions = lazy(
  () => import("@/features/settings/work-structure/hr-position"),
);
const Grades = lazy(
  () => import("@/features/settings/work-structure/hr-grade"),
);
const Companies = lazy(
  () => import("@/features/settings/work-structure/company"),
);
const OrgTypes = lazy(
  () => import("@/features/settings/work-structure/organization-types"),
);
const Locations = lazy(
  () => import("@/features/settings/work-structure/locations"),
);
const GeoSetup = lazy(
  () => import("@/features/settings/work-structure/geo-setup"),
);
const Holidays = lazy(
  () => import("@/features/settings/work-structure/holiday"),
);
const HolidayTypes = lazy(
  () => import("@/features/settings/work-structure/holiday-type"),
);
const Shifts = lazy(() => import("@/features/settings/work-structure/shift"));
const Contracts = lazy(
  () => import("@/features/settings/work-structure/contract"),
);
const LeaveRequests = lazy(
  () => import("@/features/settings/work-structure/leave-request"),
);
const LeaveTypes = lazy(
  () => import("@/features/attendance-management/leave-type"),
);
const Supervisors = lazy(() => import("@/features/employee-supervisor"));

// ─── User Management ──────────────────────────────────────────────────────────
const UserManagement = lazy(() => import("@/features/user-management"));
const User = lazy(() => import("@/features/user-management/user-details"));
const RoleManagement = lazy(() => import("@/features/users/role"));
const RoleDetails = lazy(() => import("@/features/users/role/role-details"));
const RolePermissionMatrix = lazy(
  () => import("@/features/users/role/role-permission-matrix"),
);
const PermissionManagement = lazy(() => import("@/features/users/permission"));
const ModuleManagement = lazy(() => import("@/features/users/module"));

// ─── Attendance ───────────────────────────────────────────────────────────────
const Attendance = lazy(() => import("@/features/attendance"));
const AttendanceTeam = lazy(
  () => import("@/features/attendance/attendance-team.jsx"),
);
const AttendanceMy = lazy(
  () => import("@/features/attendance/attendance-my.jsx"),
);

// Profile
const Profile = lazy(() => import("@/features/profile/profile-page"));

// ─── Route Map ────────────────────────────────────────────────────────────────
// permissions: [] — user must have AT LEAST ONE of these to access the route
export const ROUTE_MAP = [
  // ── Core HR ──────────────────────────────────────────────────────────────────
  {
    path: PATHS.CORE_HR.EMPLOYEES,
    component: Employees,
    permissions: [P.EMP_MANAGE],
  },
  {
    path: PATHS.CORE_HR.EMPLOYEE_ADD,
    component: AddEmployee,
    permissions: [P.EMP_MANAGE],
  },
  {
    path: PATHS.CORE_HR.EMPLOYEE_ADD_MODERN,
    component: AddEmployeeModern,
    permissions: [P.EMP_MANAGE],
  },
  {
    path: PATHS.CORE_HR.EMPLOYEE_UPDATE,
    component: UpdateEmployee,
    permissions: [P.EMP_MANAGE],
  },
  {
    path: PATHS.CORE_HR.EMPLOYEE_UPDATE_MODERN,
    component: UpdateEmployeeModern,
    permissions: [P.EMP_MANAGE],
  },
  {
    path: PATHS.CORE_HR.EMPLOYEE_DETAIL,
    component: EmployeeDetails,
    permissions: [P.EMP_MANAGE, P.ORG_CHART_VIEW],
  },
  {
    path: PATHS.CORE_HR.EMPLOYEE_TYPES,
    component: EmployeeTypes,
    permissions: [P.HR_SETUP],
  },
  {
    path: PATHS.CORE_HR.SUPERVISOR_ASSIGNMENT,
    component: Supervisors,
    permissions: [P.HR_SETUP],
  },

  // ─── Payroll ─────────────────────────────────────────────────────────────────
  {
    path: PATHS.PAYROLL.RUNS,
    component: PayrollRuns,
    permissions: [P.PAY_PROCESS, P.PAY_VIEW_ALL],
  },
  {
    path: PATHS.PAYROLL.SALARY_SHEET,
    component: SalarySheet,
    permissions: [P.PAY_PROCESS, P.PAY_VIEW_ALL],
  },
  { path: PATHS.PAYROLL.PAY_STRUCTURE, component: PayStructure, permissions: [P.PAY_CONFIG] },
  // {
  //   path: PATHS.PAYROLL.SALARY_SHEET,
  //   component: SalarySheet,
  //   permissions: [P.PAY_PROCESS, P.PAY_VIEW_ALL],
  // },

  // ── Attendance ────────────────────────────────────────────────────────────────
  {
    path: PATHS.ATTENDANCE.DATA,
    component: Attendance,
    permissions: [P.ATT_VIEW_TEAM, P.ATT_REPORT_ALL],
  },
  {
    path: PATHS.ATTENDANCE.TEAM,
    component: AttendanceTeam,
    permissions: [P.MSS_TEAM_VIEW],
  }, // ← new
  {
    path: PATHS.ATTENDANCE.MY,
    component: AttendanceMy,
    permissions: [P.ESS_ATT_VIEW],
  }, // ← new
  {
    path: PATHS.ATTENDANCE.LEAVE_REQUEST,
    component: LeaveRequests,
    permissions: [P.ATT_LEAVE_APPROVE, P.MSS_APPROVE_TEAM, P.ATT_LEAVE_APPLY],
  },
  {
    path: PATHS.ATTENDANCE.LEAVE_TYPES,
    component: LeaveTypes,
    permissions: [P.SHIFT_SETUP, P.HR_SETUP],
  },

  // ── Settings ──────────────────────────────────────────────────────────────────
  {
    path: PATHS.SETTINGS.ORGANIZATION,
    component: Organizations,
    permissions: [P.HR_SETUP],
  },
  {
    path: PATHS.SETTINGS.POSITIONS,
    component: Positions,
    permissions: [P.HR_SETUP],
  },
  {
    path: PATHS.SETTINGS.HR_POSITIONS,
    component: HRPositions,
    permissions: [P.HR_SETUP],
  },
  { path: PATHS.SETTINGS.GRADES, component: Grades, permissions: [P.HR_SETUP] },
  {
    path: PATHS.SETTINGS.COMPANY,
    component: Companies,
    permissions: [P.HR_SETUP],
  },
  {
    path: PATHS.SETTINGS.ORG_TYPES,
    component: OrgTypes,
    permissions: [P.HR_SETUP],
  },
  {
    path: PATHS.SETTINGS.LOCATIONS,
    component: Locations,
    permissions: [P.HR_SETUP],
  },
  {
    path: PATHS.SETTINGS.GEO_SETUP,
    component: GeoSetup,
    permissions: [P.HR_SETUP],
  },
  {
    path: PATHS.SETTINGS.HOLIDAYS,
    component: Holidays,
    permissions: [P.HR_SETUP],
  },
  {
    path: PATHS.SETTINGS.HOLIDAY_TYPES,
    component: HolidayTypes,
    permissions: [P.HR_SETUP],
  },
  {
    path: PATHS.SETTINGS.SHIFTS,
    component: Shifts,
    permissions: [P.SHIFT_SETUP],
  },
  {
    path: PATHS.SETTINGS.CONTRACTS,
    component: Contracts,
    permissions: [P.HR_SETUP],
  },
  // Admin-only settings — PAY_CONFIG is Admin-only per seed
  // { path: PATHS.SETTINGS.INVENTORYS,    component: InventoriesPage, permissions: [P.PAY_CONFIG] },
  // { path: PATHS.SETTINGS.ITEMS,         component: ItemsPage,       permissions: [P.PAY_CONFIG] },
  // { path: PATHS.SETTINGS.ITEM_STOCKS,   component: ItemStockPage,   permissions: [P.PAY_CONFIG] },
  // { path: PATHS.SETTINGS.REQUISITIONS,  component: Requisitions,    permissions: [P.PAY_CONFIG] },

  // ── User Management ───────────────────────────────────────────────────────────
  {
    path: PATHS.USERS.USER_MANAGEMENT,
    component: UserManagement,
    permissions: [P.HR_SETUP],
  },
  { path: PATHS.USERS.USER, component: User, permissions: [P.HR_SETUP] },
  {
    path: PATHS.USERS.ROLE,
    component: RoleManagement,
    permissions: [P.HR_SETUP],
  },
  {
    path: PATHS.USERS.ROLE_DETAIL,
    component: RoleDetails,
    permissions: [P.HR_SETUP],
  },
  {
    path: PATHS.USERS.ROLE_PERMISSION_MATRIX,
    component: RolePermissionMatrix,
    permissions: [P.HR_SETUP],
  },
  {
    path: PATHS.USERS.PERMISSION,
    component: PermissionManagement,
    permissions: [P.HR_SETUP],
  },
  {
    path: PATHS.USERS.MODULE,
    component: ModuleManagement,
    permissions: [P.HR_SETUP],
  },
  { path: PATHS.PROFILE, component: Profile, permissions: [] },
];
