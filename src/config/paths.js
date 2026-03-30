export const PATHS = {
  // ─── Dashboard ────────────────────────────────────────────────────────────
  DASHBOARD: "/",

  // ─── Core HR ─────────────────────────────────────────────────────────────
  CORE_HR: {
    REQUISITION: "core-hr/requisition",
    EMPLOYEES: "core-hr/employees",
    EMPLOYEE_ADD: "core-hr/employees/add",
    EMPLOYEE_ADD_MODERN: "core-hr/employees/add-modern",
    EMPLOYEE_UPDATE: "core-hr/employee-management/update/:personId", // matches actual route
    EMPLOYEE_UPDATE_MODERN:
      "core-hr/employee-management/update-modern/:personId",
    EMPLOYEE_DETAIL: "core-hr/employee-management/employee-details/:empNo",
    LIFECYCLE: "core-hr/lifecycle",
    DOCUMENTS: "core-hr/documents",
    EMPLOYEE_TYPES: "core-hr/employee-types",
  },

  // ─── Attendance ───────────────────────────────────────────────────────────
  ATTENDANCE: {
    SETUP: "attendance/setup",
    ASSIGNMENT: "attendance/assignment",
    SCHEDULE: "attendance/schedule",
    DATA: "attendance/data",
    REPORTS: "attendance/reports",
    LEAVE_REQUEST: "attendance/leave-requests",
    LEAVE_TYPES: "attendance/leave-types",
  },

  // ─── Payroll ──────────────────────────────────────────────────────────────
  PAYROLL: {
    CONFIGURATION: "payroll/configuration",
    PROCESSING: "payroll/processing",
    APPROVALS: "payroll/approvals",
    OUTPUT: "payroll/output",
  },

  // ─── Performance ──────────────────────────────────────────────────────────
  PERFORMANCE: {
    SETUP: "performance/setup",
    APPRAISAL: "performance/appraisal",
    REPORTS: "performance/reports",
  },

  // ─── Self Service ─────────────────────────────────────────────────────────
  SELF_SERVICE: {
    ESS: "self-service/ess",
    MSS: "self-service/mss",
  },

  // ─── PF & Gratuity ────────────────────────────────────────────────────────
  PF: { OVERVIEW: "pf/overview" },
  GRATUITY: { OVERVIEW: "gratuity/overview" },
  LOAN: { MANAGEMENT: "loan/management" },

  // ─── Communication ────────────────────────────────────────────────────────
  COMMUNICATION: {
    NOTIFICATIONS: "communication/notifications",
    ANNOUNCEMENTS: "communication/announcements",
  },

  // ─── Settings / Work Structure ────────────────────────────────────────────
  SETTINGS: {
    ORGANIZATION: "settings/work-structure/organization",
    GEO_SETUP: "settings/work-structure/geo-setup",

    POSITIONS: "settings/work-structure/positions",
    HR_POSITIONS: "settings/work-structure/hr-positions",
    GRADES: "settings/work-structure/grades",
    COMPANY: "settings/work-structure/company",
    ORG_TYPES: "settings/work-structure/org-types",
    LOCATIONS: "settings/work-structure/locations",
    HOLIDAYS: "settings/work-structure/holidays",
    HOLIDAY_TYPES: "settings/work-structure/holiday-types",
    SHIFTS: "settings/work-structure/shifts",
    CONTRACTS: "settings/work-structure/contracts",
  },

  // ─── Reports ──────────────────────────────────────────────────────────────
  REPORTS: {
    GENERAL: "reports/general",
    ATTENDANCE: "reports/attendance",
    PAYROLL: "reports/payroll",
    ANALYTICS: "reports/analytics",
  },
  USERS: {
    USER_MANAGEMENT: "user-management/users",
    USER: "user-management/users/:id",
  },
};
