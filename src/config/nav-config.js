import {
  IconLayoutDashboard,
  IconUserCheck,
  IconPaywall,
  IconPerspectiveOff,
  IconReport,
  IconSettings,
} from "@tabler/icons-react";

import { PATHS } from "./paths";
import { ALL_ROLES, ADMIN_HR, ADMIN_HR_SUP, ROLES } from "./roles";

const { ADMIN } = ROLES;

export const NAV_ITEMS = [
  {
    label: "Application",
    items: [
      {
        title: "Dashboard",
        icon: IconLayoutDashboard,
        roles: ALL_ROLES,
        defaultOpen: true,
        subItems: [
          { title: "Overview", url: PATHS.DASHBOARD, roles: ALL_ROLES },
        ],
      },
      {
        title: "Core HR",
        icon: IconUserCheck,
        roles: ADMIN_HR,
        subItems: [
          { title: "Employee Requisition",        url: PATHS.CORE_HR.REQUISITION,   roles: ADMIN_HR },
          { title: "Employee Management",         url: PATHS.CORE_HR.EMPLOYEES,      roles: ADMIN_HR },
          { title: "Employment Lifecycle",        url: PATHS.CORE_HR.LIFECYCLE,      roles: ADMIN_HR },
          { title: "Digital Document Management", url: PATHS.CORE_HR.DOCUMENTS,      roles: ADMIN_HR },
          { title: "Employee Types",              url: PATHS.CORE_HR.EMPLOYEE_TYPES, roles: ADMIN_HR },
        ],
      },
      {
        title: "Attendance Management",
        icon: IconUserCheck,
        roles: ADMIN_HR_SUP,
        subItems: [
          { title: "Setup",               url: PATHS.ATTENDANCE.SETUP,      roles: ADMIN_HR     },
          { title: "Employee Assignment", url: PATHS.ATTENDANCE.ASSIGNMENT, roles: ADMIN_HR     },
          { title: "Work Schedule",       url: PATHS.ATTENDANCE.SCHEDULE,   roles: ADMIN_HR_SUP },
          { title: "Attendance Data",     url: PATHS.ATTENDANCE.DATA,       roles: ADMIN_HR     },
          { title: "Attendance Reports",  url: PATHS.ATTENDANCE.REPORTS,    roles: ADMIN_HR_SUP },
        ],
      },
    ],
  },

  {
    label: "Payroll",
    items: [
      {
        title: "Payroll Management",
        icon: IconPaywall,
        roles: ADMIN_HR,
        subItems: [
          { title: "Configuration",      url: PATHS.PAYROLL.CONFIGURATION, roles: [ADMIN]  },
          { title: "Payroll Processing", url: PATHS.PAYROLL.PROCESSING,    roles: ADMIN_HR },
          { title: "Approvals",          url: PATHS.PAYROLL.APPROVALS,     roles: ADMIN_HR },
          { title: "Output",             url: PATHS.PAYROLL.OUTPUT,        roles: ADMIN_HR },
        ],
      },
    ],
  },

  {
    label: "Performance",
    items: [
      {
        title: "Performance Management",
        icon: IconPerspectiveOff,
        roles: ALL_ROLES,
        subItems: [
          { title: "Setup",             url: PATHS.PERFORMANCE.SETUP,     roles: ADMIN_HR  },
          { title: "Appraisal Process", url: PATHS.PERFORMANCE.APPRAISAL, roles: ALL_ROLES },
          { title: "Reports",           url: PATHS.PERFORMANCE.REPORTS,   roles: ADMIN_HR  },
        ],
      },
    ],
  },

  {
    label: "Settings",
    items: [
      {
        title: "Work Structure",
        icon: IconSettings,
        roles: ADMIN_HR,
        subItems: [
          { title: "Organization",       url: PATHS.SETTINGS.ORGANIZATION, roles: ADMIN_HR },
         
          { title: "Positions",          url: PATHS.SETTINGS.POSITIONS,    roles: ADMIN_HR },
          { title: "Grades",             url: PATHS.SETTINGS.GRADES,       roles: ADMIN_HR },
          { title: "HR Positions",       url: PATHS.SETTINGS.HR_POSITIONS, roles: ADMIN_HR },
          { title: "Company",            url: PATHS.SETTINGS.COMPANY,      roles: ADMIN_HR },
          { title: "Organization Types", url: PATHS.SETTINGS.ORG_TYPES,    roles: ADMIN_HR },
          { title: "Locations",          url: PATHS.SETTINGS.LOCATIONS,    roles: ADMIN_HR },
          { title: "Geo Setup",    url: PATHS.SETTINGS.GEO_SETUP,    roles: ADMIN_HR },
          { title: "Holidays",    url: PATHS.SETTINGS.HOLIDAYS,    roles: ADMIN_HR },
          { title: "Holiday Types",    url: PATHS.SETTINGS.HOLIDAY_TYPES,    roles: ADMIN_HR },
          { title: "Shifts",    url: PATHS.SETTINGS.SHIFTS,    roles: ADMIN_HR },
          { title: "Contracts",    url: PATHS.SETTINGS.CONTRACTS,    roles: ADMIN_HR },
        ],
      },
    ],
  },

  {
    label: "Reports & Analytics",
    items: [
      {
        title: "Reports",
        icon: IconReport,
        roles: ADMIN_HR,
        subItems: [
          { title: "General Reports",        url: PATHS.REPORTS.GENERAL,    roles: ADMIN_HR },
          { title: "Attendance Reports",     url: PATHS.REPORTS.ATTENDANCE, roles: ADMIN_HR },
          { title: "Payroll Reports",        url: PATHS.REPORTS.PAYROLL,    roles: ADMIN_HR },
          { title: "HR Analytics Dashboard", url: PATHS.REPORTS.ANALYTICS,  roles: ADMIN_HR },
        ],
      },
    ],
  },
];