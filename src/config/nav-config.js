

import {
  IconLayoutDashboard,
  IconUserCheck,
  IconPaywall,
  IconPerspectiveOff,
  IconReport,
  IconSettings,
  IconUsersGroup,
  IconPackage
} from "@tabler/icons-react";

import { PATHS } from "./paths";
import { PERMISSIONS } from "./permissions";

const P = PERMISSIONS; // shorthand for readability

export const NAV_ITEMS = [
  {
    label: "Application",
    items: [
      {
        title: "Dashboard",
        icon: IconLayoutDashboard,
        // DASH_VIEW_SELF — every role has this, so everyone sees Dashboard
        permissions: [P.DASH_VIEW_ADMIN, P.DASH_VIEW_TEAM, P.DASH_VIEW_SELF],
        defaultOpen: true,
        subItems: [
          {
            title: "Overview",
            url: PATHS.DASHBOARD,
            permissions: [P.DASH_VIEW_ADMIN, P.DASH_VIEW_TEAM, P.DASH_VIEW_SELF],
          },
        ],
      },
      {
        title: "Core HR",
        icon: IconUserCheck,
        permissions: [P.EMP_MANAGE, P.HR_SETUP, P.EMP_LIFECYCLE],
        subItems: [
          {
            title: "Employee Management",
            url: PATHS.CORE_HR.EMPLOYEES,
            permissions: [P.EMP_MANAGE],
          },
          {
            title: "Employee Types",
            url: PATHS.CORE_HR.EMPLOYEE_TYPES,
            permissions: [P.HR_SETUP],
          },
          {
            title: "Supervisor Assignment",
            url: PATHS.CORE_HR.SUPERVISOR_ASSIGNMENT,
            permissions: [P.HR_SETUP],
          },
        ],
      },
      {
        title: "Attendance Management",
        icon: IconUserCheck,
        permissions: [P.ATT_VIEW_TEAM, P.ATT_LEAVE_APPROVE, P.SHIFT_SETUP, P.ATT_LEAVE_APPLY],
        subItems: [
          {
            title: "Attendance Data",
            url: PATHS.ATTENDANCE.DATA,
            permissions: [P.ATT_VIEW_TEAM, P.ATT_REPORT_ALL],
          },
          {
            title: "Leave Requests",
            url: PATHS.ATTENDANCE.LEAVE_REQUEST,
            permissions: [P.ATT_LEAVE_APPROVE, P.MSS_APPROVE_TEAM, P.ATT_LEAVE_APPLY],
          },
          {
            title: "Leave Types",
            url: PATHS.ATTENDANCE.LEAVE_TYPES,
            permissions: [P.SHIFT_SETUP, P.HR_SETUP],
          },
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
        permissions: [P.HR_SETUP],
        subItems: [
          { title: "Organization",       url: PATHS.SETTINGS.ORGANIZATION,  permissions: [P.HR_SETUP] },
          { title: "Positions",          url: PATHS.SETTINGS.POSITIONS,     permissions: [P.HR_SETUP] },
          { title: "Grades",             url: PATHS.SETTINGS.GRADES,        permissions: [P.HR_SETUP] },
          { title: "HR Positions",       url: PATHS.SETTINGS.HR_POSITIONS,  permissions: [P.HR_SETUP] },
          { title: "Company",            url: PATHS.SETTINGS.COMPANY,       permissions: [P.HR_SETUP] },
          { title: "Organization Types", url: PATHS.SETTINGS.ORG_TYPES,     permissions: [P.HR_SETUP] },
          { title: "Locations",          url: PATHS.SETTINGS.LOCATIONS,     permissions: [P.HR_SETUP] },
          { title: "Geo Setup",          url: PATHS.SETTINGS.GEO_SETUP,     permissions: [P.HR_SETUP] },
          { title: "Holidays",           url: PATHS.SETTINGS.HOLIDAYS,      permissions: [P.HR_SETUP] },
          { title: "Holiday Types",      url: PATHS.SETTINGS.HOLIDAY_TYPES, permissions: [P.HR_SETUP] },
          { title: "Shifts",             url: PATHS.SETTINGS.SHIFTS,        permissions: [P.SHIFT_SETUP] },
          { title: "Contracts",          url: PATHS.SETTINGS.CONTRACTS,     permissions: [P.HR_SETUP] },
          // Admin-only — using PAY_CONFIG as the Admin-only gate
          // { title: "Inventory",          url: PATHS.SETTINGS.INVENTORYS,    permissions: [P.PAY_CONFIG] },
          // { title: "Items",              url: PATHS.SETTINGS.ITEMS,         permissions: [P.PAY_CONFIG] },
          // { title: "Item Stocks",        url: PATHS.SETTINGS.ITEM_STOCKS,   permissions: [P.PAY_CONFIG] },
          // { title: "Dispatch",           url: PATHS.SETTINGS.REQUISITIONS,  permissions: [P.PAY_CONFIG] },
        ],
      },
    ],
  },

  {
    label: "Users",
    items: [
      {
        title: "User Management",
        icon: IconUsersGroup,
        // HR_SETUP is Admin+HR — same access level as before
        permissions: [P.HR_SETUP],
        subItems: [
          { title: "User Management",  url: PATHS.USERS.USER_MANAGEMENT, permissions: [P.HR_SETUP] },
          { title: "Role",             url: PATHS.USERS.ROLE,            permissions: [P.HR_SETUP] },
          { title: "Permission",       url: PATHS.USERS.PERMISSION,      permissions: [P.HR_SETUP] },
          { title: "Module",           url: PATHS.USERS.MODULE,          permissions: [P.HR_SETUP] },
        ],
      },
    ],
  },

  {
    label: "Inventory",
    items: [
      {
        title: "Inventory",
        icon: IconPackage,
        permissions: [P.INVENTORY_VIEW],
        defaultOpen: true,
        subItems: [
          { title: "Inventory",   url: PATHS.SETTINGS.INVENTORYS,  permissions: [P.INVENTORY_VIEW] },
          { title: "Items",       url: PATHS.SETTINGS.ITEMS,        permissions: [P.INVENTORY_VIEW] },
          { title: "Item Stocks", url: PATHS.SETTINGS.ITEM_STOCKS,  permissions: [P.INVENTORY_VIEW] },
          { title: "Dispatch",    url: PATHS.SETTINGS.REQUISITIONS, permissions: [P.INVENTORY_VIEW] },
        ],
      },
    ],
  },
];


 