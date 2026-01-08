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
            subItemIcon: IconChartBar,
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
            subItemIcon: IconUserPlus,
            roles: ["Admin", "HR"],
          },
          {
            title: "Employee Management",
            url: "/core-hr/employees",
            subItemIcon: IconUsers,
            roles: ["Admin", "HR"],
          },
          {
            title: "Employment Lifecycle",
            url: "/core-hr/lifecycle",
            subItemIcon: IconLifebuoy,
            roles: ["Admin", "HR"],
          },
          {
            title: "Digital Document Management",
            url: "/core-hr/documents",
            subItemIcon: IconFiles,
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
            subItemIcon: IconSettingsAutomation,
            roles: ["Admin", "HR"],
          },
          {
            title: "Employee Assignment",
            url: "/attendance/assignment",
            subItemIcon: IconClipboardList,
            roles: ["Admin", "HR"],
          },
          {
            title: "Work Schedule",
            url: "/attendance/schedule",
            subItemIcon: IconCalendar,
            roles: ["Admin", "HR", "Supervisor"],
          },
          {
            title: "Attendance Data",
            url: "/attendance/data",
            subItemIcon: IconDatabase,
            roles: ["Admin", "HR"],
          },
          {
            title: "Attendance Reports",
            url: "/attendance/reports",
            subItemIcon: IconReport,
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
            subItemIcon: IconSettings,
            roles: ["Admin"],
          },
          {
            title: "Payroll Processing",
            url: "/payroll/processing",
            subItemIcon: IconBuildingBank,
            roles: ["Admin", "HR"],
          },
          {
            title: "Approvals",
            url: "/payroll/approvals",
            subItemIcon: IconCheck,
            roles: ["Admin", "HR"],
          },
          {
            title: "Output",
            url: "/payroll/output",
            subItemIcon: IconFileExport,
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
            subItemIcon: IconSettings,
            roles: ["Admin", "HR"],
          },
          {
            title: "Appraisal Process",
            url: "/performance/appraisal",
            subItemIcon: IconTrophy,
            roles: ["Admin", "HR", "Supervisor", "Employee"],
          },
          {
            title: "Reports",
            url: "/performance/reports",
            subItemIcon: IconReport,
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
            subItemIcon: IconBuilding,
            roles: ["Admin", "HR"],
          },
          {
            title: "Positions",
            url: "/settings/work-structure/positions",
            subItemIcon: IconBriefcase,
            roles: ["Admin", "HR"],
          },
          {
            title: "Units",
            url: "/settings/work-structure/units",
            subItemIcon: IconSitemap,
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
            subItemIcon: IconFileText,
            roles: ["Admin", "HR"],
          },
          {
            title: "Attendance Reports",
            url: "/reports/attendance",
            subItemIcon: IconCalendar,
            roles: ["Admin", "HR"],
          },
          {
            title: "Payroll Reports",
            url: "/reports/payroll",
            subItemIcon: IconBuildingBank,
            roles: ["Admin", "HR"],
          },
          {
            title: "HR Analytics Dashboard",
            url: "/reports/analytics",
            subItemIcon: IconChartBar,
            roles: ["Admin", "HR"],
          },
        ],
      },
    ],
  },
];
