// src\config\nav-config.js



import { PATHS } from "./paths";
import { ALL_ROLES, ADMIN_HR, ADMIN_HR_SUP, ROLES } from "./roles";
import {
  IconLayoutDashboard,
  IconUserCheck,
  IconSettings,
  IconUsersGroup,
  IconPackage
} from "@tabler/icons-react";

const { ADMIN, EMPLOYEE, SUPERVISOR } = ROLES;

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
          { title: "Employee Management",   url: PATHS.CORE_HR.EMPLOYEES,             roles: ADMIN_HR },
          { title: "Employee Types",        url: PATHS.CORE_HR.EMPLOYEE_TYPES,        roles: ADMIN_HR },
          { title: "Supervisor Assignment", url: PATHS.CORE_HR.SUPERVISOR_ASSIGNMENT, roles: ADMIN_HR },
        ],
      },
      {
        title: "Attendance Management",
        icon: IconUserCheck,
        roles: ALL_ROLES,
        subItems: [
          { title: "Attendance Data",   url: PATHS.ATTENDANCE.DATA,         roles: ADMIN_HR     },
          { title: "My Attendance",     url: PATHS.ATTENDANCE.MY,           roles: [EMPLOYEE]   },
          { title: "Team Attendance",   url: PATHS.ATTENDANCE.TEAM,         roles: [SUPERVISOR] },
          { title: "Leave Requests",    url: PATHS.ATTENDANCE.LEAVE_REQUEST, roles: ALL_ROLES   },
          { title: "Leave Types",       url: PATHS.ATTENDANCE.LEAVE_TYPES,  roles: ADMIN_HR     },
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
          { title: "Organization",       url: PATHS.SETTINGS.ORGANIZATION,  roles: ADMIN_HR  },
          { title: "Positions",          url: PATHS.SETTINGS.POSITIONS,     roles: ADMIN_HR  },
          { title: "Grades",             url: PATHS.SETTINGS.GRADES,        roles: ADMIN_HR  },
          { title: "HR Positions",       url: PATHS.SETTINGS.HR_POSITIONS,  roles: ADMIN_HR  },
          { title: "Company",            url: PATHS.SETTINGS.COMPANY,       roles: ADMIN_HR  },
          { title: "Organization Types", url: PATHS.SETTINGS.ORG_TYPES,     roles: ADMIN_HR  },
          { title: "Locations",          url: PATHS.SETTINGS.LOCATIONS,     roles: ADMIN_HR  },
          { title: "Geo Setup",          url: PATHS.SETTINGS.GEO_SETUP,     roles: ADMIN_HR  },
          { title: "Holidays",           url: PATHS.SETTINGS.HOLIDAYS,      roles: ADMIN_HR  },
          { title: "Holiday Types",      url: PATHS.SETTINGS.HOLIDAY_TYPES, roles: ADMIN_HR  },
          { title: "Shifts",             url: PATHS.SETTINGS.SHIFTS,        roles: ADMIN_HR  },
          { title: "Contracts",          url: PATHS.SETTINGS.CONTRACTS,     roles: ADMIN_HR  },
          { title: "Inventory",          url: PATHS.SETTINGS.INVENTORYS,    roles: [ADMIN]   },
          { title: "Items",              url: PATHS.SETTINGS.ITEMS,         roles: [ADMIN]   },
          { title: "Item Stocks",        url: PATHS.SETTINGS.ITEM_STOCKS,   roles: [ADMIN]   },
          { title: "Dispatch",           url: PATHS.SETTINGS.REQUISITIONS,  roles: [ADMIN]   },
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
        roles: ADMIN_HR,
        subItems: [
          { title: "User Management", url: PATHS.USERS.USER_MANAGEMENT, roles: ADMIN_HR },
          { title: "Role",            url: PATHS.USERS.ROLE,            roles: ADMIN_HR },
          { title: "Permission",      url: PATHS.USERS.PERMISSION,      roles: ADMIN_HR },
          { title: "Module",          url: PATHS.USERS.MODULE,          roles: ADMIN_HR },
        ],
      },
    ],
  },

  // {
  //   label: "Inventory",
  //   items: [
  //     {
  //       title: "Inventory",
  //       icon: IconPackage,
  //       permissions: [P.INVENTORY_VIEW],
  //       defaultOpen: true,
  //       subItems: [
  //         { title: "Inventory",   url: PATHS.SETTINGS.INVENTORYS,  permissions: [P.INVENTORY_VIEW] },
  //         { title: "Items",       url: PATHS.SETTINGS.ITEMS,        permissions: [P.INVENTORY_VIEW] },
  //         { title: "Item Stocks", url: PATHS.SETTINGS.ITEM_STOCKS,  permissions: [P.INVENTORY_VIEW] },
  //         { title: "Dispatch",    url: PATHS.SETTINGS.REQUISITIONS, permissions: [P.INVENTORY_VIEW] },
  //       ],
  //     },
  //   ],
  // },
];


 