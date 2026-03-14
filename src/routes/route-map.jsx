import { lazy } from "react";

import { ALL_ROLES, ADMIN_HR, ADMIN_HR_SUP, ROLES } from "@/config/roles";
import { PATHS } from "@/config/paths";

const { ADMIN, HR, EMPLOYEE } = ROLES;

// ─── Placeholder ──────────────────────────────────────────────────────────────
// Swap these out as real pages are built
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

// ─── Route Map ────────────────────────────────────────────────────────────────
export const ROUTE_MAP = [
  // ── Core HR ────────────────────────────────────────────────────────────────
  {
    path: PATHS.CORE_HR.REQUISITION,
    component: p("Employee Requisition"),
    roles: ADMIN_HR,
  },
  { path: PATHS.CORE_HR.EMPLOYEES, component: Employees, roles: ADMIN_HR },
  { path: PATHS.CORE_HR.EMPLOYEE_ADD, component: AddEmployee, roles: ADMIN_HR },
  // ! modern one
  {
    path: PATHS.CORE_HR.EMPLOYEE_ADD_MODERN,
    component: AddEmployeeModern,
    roles: ADMIN_HR,
  },
  {
    path: PATHS.CORE_HR.EMPLOYEE_UPDATE,
    component: UpdateEmployee,
    roles: ADMIN_HR,
  },
  // ! modern one
  {
    path: PATHS.CORE_HR.EMPLOYEE_UPDATE_MODERN,
    component: UpdateEmployeeModern,
    roles: ADMIN_HR,
  },

  {
    path: PATHS.CORE_HR.EMPLOYEE_DETAIL,
    component: EmployeeDetails,
    roles: ADMIN_HR,
  },
  {
    path: PATHS.CORE_HR.LIFECYCLE,
    component: p("Employment Lifecycle"),
    roles: ADMIN_HR,
  },
  {
    path: PATHS.CORE_HR.DOCUMENTS,
    component: p("Digital Document Management"),
    roles: ADMIN_HR,
  },
  {
    path: PATHS.CORE_HR.EMPLOYEE_TYPES,
    component: EmployeeTypes,
    roles: ADMIN_HR,
  },

  // ── Attendance ─────────────────────────────────────────────────────────────
  {
    path: PATHS.ATTENDANCE.SETUP,
    component: p("Attendance Setup"),
    roles: ADMIN_HR,
  },
  {
    path: PATHS.ATTENDANCE.ASSIGNMENT,
    component: p("Employee Assignment"),
    roles: ADMIN_HR,
  },
  {
    path: PATHS.ATTENDANCE.SCHEDULE,
    component: p("Work Schedule"),
    roles: ADMIN_HR_SUP,
  },
  {
    path: PATHS.ATTENDANCE.DATA,
    component: p("Attendance Data"),
    roles: ADMIN_HR,
  },
  {
    path: PATHS.ATTENDANCE.REPORTS,
    component: p("Attendance Reports"),
    roles: ADMIN_HR_SUP,
  },

  // ── Payroll ────────────────────────────────────────────────────────────────
  {
    path: PATHS.PAYROLL.CONFIGURATION,
    component: p("Payroll Configuration"),
    roles: [ADMIN],
  },
  {
    path: PATHS.PAYROLL.PROCESSING,
    component: p("Payroll Processing"),
    roles: ADMIN_HR,
  },
  {
    path: PATHS.PAYROLL.APPROVALS,
    component: p("Payroll Approvals"),
    roles: ADMIN_HR,
  },
  {
    path: PATHS.PAYROLL.OUTPUT,
    component: p("Payroll Output"),
    roles: ADMIN_HR,
  },

  // ── Performance ────────────────────────────────────────────────────────────
  {
    path: PATHS.PERFORMANCE.SETUP,
    component: p("Performance Setup"),
    roles: ADMIN_HR,
  },
  {
    path: PATHS.PERFORMANCE.APPRAISAL,
    component: p("Appraisal Process"),
    roles: ALL_ROLES,
  },
  {
    path: PATHS.PERFORMANCE.REPORTS,
    component: p("Performance Reports"),
    roles: ADMIN_HR,
  },

  // ── Self Service ───────────────────────────────────────────────────────────
  {
    path: PATHS.SELF_SERVICE.ESS,
    component: p("Employee Self-Service"),
    roles: ALL_ROLES,
  },
  {
    path: PATHS.SELF_SERVICE.MSS,
    component: p("Manager Self-Service"),
    roles: ADMIN_HR_SUP,
  },

  // ── PF / Gratuity / Loan ───────────────────────────────────────────────────
  { path: PATHS.PF.OVERVIEW, component: p("PF Management"), roles: ALL_ROLES },
  {
    path: PATHS.GRATUITY.OVERVIEW,
    component: p("Gratuity Management"),
    roles: [ADMIN, HR, EMPLOYEE],
  },
  {
    path: PATHS.LOAN.MANAGEMENT,
    component: p("Loan & Advance Management"),
    roles: ALL_ROLES,
  },

  // ── Communication ──────────────────────────────────────────────────────────
  {
    path: PATHS.COMMUNICATION.NOTIFICATIONS,
    component: p("Notifications"),
    roles: ALL_ROLES,
  },
  {
    path: PATHS.COMMUNICATION.ANNOUNCEMENTS,
    component: p("Announcements"),
    roles: ADMIN_HR,
  },

  // ── Settings ───────────────────────────────────────────────────────────────
  {
    path: PATHS.SETTINGS.ORGANIZATION,
    component: Organizations,
    roles: ADMIN_HR,
  },

  { path: PATHS.SETTINGS.POSITIONS, component: Positions, roles: ADMIN_HR },
  {
    path: PATHS.SETTINGS.HR_POSITIONS,
    component: HRPositions,
    roles: ADMIN_HR,
  },
  { path: PATHS.SETTINGS.GRADES, component: Grades, roles: ADMIN_HR },
  { path: PATHS.SETTINGS.COMPANY, component: Companies, roles: ADMIN_HR },
  { path: PATHS.SETTINGS.ORG_TYPES, component: OrgTypes, roles: ADMIN_HR },
  { path: PATHS.SETTINGS.LOCATIONS, component: Locations, roles: ADMIN_HR },
  { path: PATHS.SETTINGS.GEO_SETUP, component: GeoSetup, roles: ADMIN_HR },
  { path: PATHS.SETTINGS.HOLIDAYS, component: Holidays, roles: ADMIN_HR },
  {
    path: PATHS.SETTINGS.HOLIDAY_TYPES,
    component: HolidayTypes,
    roles: ADMIN_HR,
  },
  { path: PATHS.SETTINGS.SHIFTS, component: Shifts, roles: ADMIN_HR },
  { path: PATHS.SETTINGS.CONTRACTS, component: Contracts, roles: ADMIN_HR },

  // ── Reports ────────────────────────────────────────────────────────────────
  {
    path: PATHS.REPORTS.GENERAL,
    component: p("General Reports"),
    roles: ADMIN_HR,
  },
  {
    path: PATHS.REPORTS.ATTENDANCE,
    component: p("Attendance Reports"),
    roles: ADMIN_HR,
  },
  {
    path: PATHS.REPORTS.PAYROLL,
    component: p("Payroll Reports"),
    roles: ADMIN_HR,
  },
  {
    path: PATHS.REPORTS.ANALYTICS,
    component: p("HR Analytics Dashboard"),
    roles: ADMIN_HR,
  },
];
