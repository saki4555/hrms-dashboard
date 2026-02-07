import {
  IconLayoutDashboard,
  IconUserCheck,
  IconPaywall,
  IconPerspectiveOff,
  IconReport,
  IconSettings,
  IconFileText,
  IconUsers,
  IconLifebuoy,
  IconFiles,
  IconClipboardList,
  IconUserPlus,
  IconCalendar,
  IconDatabase,
  IconChartBar,
  IconSettingsAutomation,
  IconBuildingBank,
  IconCheck,
  IconFileExport,
  IconTrophy,
  IconBuilding,
  IconBriefcase,
  IconSitemap,
} from "@tabler/icons-react";

export const NAV_ITEMS = [
  {
    label: "Application",
    items: [
      {
        title: "Dashboard",
        icon: IconLayoutDashboard,
        roles: ["Admin", "HR", "Supervisor", "Employee"],
        subItems: [
          {
            title: "Overview",
            url: "/",
            roles: ["Admin", "HR", "Supervisor", "Employee"],
          },
        ],
        defaultOpen: true,
      },
      {
        title: "Core HR",
        roles: ["Admin", "HR"],
        icon: IconUserCheck,
        subItems: [
          {
            title: "Employee Requisition",
            url: "/core-hr/requisition",
            roles: ["Admin", "HR"],
          },
          {
            title: "Employee Management",
            url: "/core-hr/employees",
            roles: ["Admin", "HR"],
          },
          {
            title: "Employment Lifecycle",
            url: "/core-hr/lifecycle",
            roles: ["Admin", "HR"],
          },
          {
            title: "Digital Document Management",
            url: "/core-hr/documents",
            roles: ["Admin", "HR"],
          },
        ],
      },
      {
        title: "Attendance Management",
        roles: ["Admin", "HR", "Supervisor"],
        icon: IconUserCheck,
        subItems: [
          {
            title: "Setup",
            url: "/attendance/setup",
            roles: ["Admin", "HR"],
          },
          {
            title: "Employee Assignment",
            url: "/attendance/assignment",
            roles: ["Admin", "HR"],
          },
          {
            title: "Work Schedule",
            url: "/attendance/schedule",
            roles: ["Admin", "HR", "Supervisor"],
          },
          {
            title: "Attendance Data",
            url: "/attendance/data",
            roles: ["Admin", "HR"],
          },
          {
            title: "Attendance Reports",
            url: "/attendance/reports",
            roles: ["Admin", "HR", "Supervisor"],
          },
        ],
      },
    ],
  },

  {
    label: "Payroll",
    items: [
      {
        title: "Payroll Management",
        roles: ["Admin", "HR"],
        icon: IconPaywall,
        subItems: [
          {
            title: "Configuration",
            url: "/payroll/configuration",
            roles: ["Admin"],
          },
          {
            title: "Payroll Processing",
            url: "/payroll/processing",
            roles: ["Admin", "HR"],
          },
          {
            title: "Approvals",
            url: "/payroll/approvals",
            roles: ["Admin", "HR"],
          },
          {
            title: "Output",
            url: "/payroll/output",
            roles: ["Admin", "HR"],
          },
        ],
      },
    ],
  },

  {
    label: "Performance",
    items: [
      {
        title: "Performance Management",
        roles: ["Admin", "HR", "Supervisor", "Employee"],
        icon: IconPerspectiveOff,
        subItems: [
          {
            title: "Setup",
            url: "/performance/setup",
            roles: ["Admin", "HR"],
          },
          {
            title: "Appraisal Process",
            url: "/performance/appraisal",
            roles: ["Admin", "HR", "Supervisor", "Employee"],
          },
          {
            title: "Reports",
            url: "/performance/reports",
            roles: ["Admin", "HR"],
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
        roles: ["Admin", "HR"],
        subItems: [
          {
            title: "Organization",
            url: "/settings/work-structure/organization",
            roles: ["Admin", "HR"],
          },
          {
            title: "Positions",
            url: "/settings/work-structure/positions",
            roles: ["Admin", "HR"],
          },
          {
            title: "Units",
            url: "/settings/work-structure/units",
            roles: ["Admin", "HR"],
          },
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
        roles: ["Admin", "HR"],
        subItems: [
          {
            title: "General Reports",
            url: "/reports/general",
            roles: ["Admin", "HR"],
          },
          {
            title: "Attendance Reports",
            url: "/reports/attendance",
            roles: ["Admin", "HR"],
          },
          {
            title: "Payroll Reports",
            url: "/reports/payroll",
            roles: ["Admin", "HR"],
          },
          {
            title: "HR Analytics Dashboard",
            url: "/reports/analytics",
            roles: ["Admin", "HR"],
          },
        ],
      },
    ],
  },
];
