// src/config/permissions.js
// Mirrors HCM.PERMISSIONS table — permission codes seeded in seedRbac.js
// Total: 55 permissions across 12 modules
// Usage: import { PERMISSIONS } from "@/config/permissions";
//        const canRunPayroll = useCan(PERMISSIONS.PAY_PROCESS);

export const PERMISSIONS = {

  // ── 1. Dashboard (3) ────────────────────────────────────────────────────────
  DASH_VIEW_ADMIN: "DASH_VIEW_ADMIN", // Admin-level dashboard — KPIs, headcount, analytics
  DASH_VIEW_TEAM:  "DASH_VIEW_TEAM",  // Manager dashboard — team attendance, pending approvals
  DASH_VIEW_SELF:  "DASH_VIEW_SELF",  // Employee dashboard — own attendance, leave balances

  // ── 2. Core HR (5) ──────────────────────────────────────────────────────────
  REQUISITION_MANAGE: "REQUISITION_MANAGE", // Create & approve employee requisitions
  HR_SETUP:           "HR_SETUP",           // Configure grades, positions, departments, org structure
  EMP_MANAGE:         "EMP_MANAGE",         // Create & update employee records
  EMP_LIFECYCLE:      "EMP_LIFECYCLE",      // Transfer, increment, promotion, end employment
  ORG_CHART_VIEW:     "ORG_CHART_VIEW",     // View employee details & org chart (scoped by role)

  // ── 3. Attendance (8) ───────────────────────────────────────────────────────
  SHIFT_SETUP:            "SHIFT_SETUP",            // Create shifts, rotation plans, sync devices
  ATT_SCHEDULE_MANAGE:    "ATT_SCHEDULE_MANAGE",    // Create, approve, modify work schedules
  ATT_REALTIME_AI:        "ATT_REALTIME_AI",        // AI face detection attendance — Supervisor only
  ATT_CORRECTION_APPROVE: "ATT_CORRECTION_APPROVE", // Manual attendance edit — Admin & HR restricted
  ATT_VIEW_TEAM:          "ATT_VIEW_TEAM",          // View team attendance records
  ATT_REPORT_ALL:         "ATT_REPORT_ALL",         // Generate attendance reports
  ATT_LEAVE_APPLY:        "ATT_LEAVE_APPLY",        // Apply for leave / late — all roles
  ATT_LEAVE_APPROVE:      "ATT_LEAVE_APPROVE",      // Approve team leave & late requests

  // ── 4. Payroll (7) ──────────────────────────────────────────────────────────
  PAY_CONFIG:       "PAY_CONFIG",       // Configure pay & deduction elements — Admin only
  PAY_TAX_SLABS:    "PAY_TAX_SLABS",   // Setup income tax slabs — Admin only
  PAY_PROCESS:      "PAY_PROCESS",      // Run & approve monthly payroll
  PAY_BONUS_MANAGE: "PAY_BONUS_MANAGE", // Manage bonus & allowances
  PAY_ADVICE_GEN:   "PAY_ADVICE_GEN",  // Generate payslip & bank advice
  PAY_VIEW_ALL:     "PAY_VIEW_ALL",     // View all salary sheets — Admin & HR only
  PAY_PAYSLIP_SELF: "PAY_PAYSLIP_SELF",// View own payslip — all roles

  // ── 5. Performance (3) ──────────────────────────────────────────────────────
  PERF_KPI_SETUP:     "PERF_KPI_SETUP",     // Setup appraisal templates & cycles — Admin & HR
  PERF_REVIEW_SUBMIT: "PERF_REVIEW_SUBMIT", // Self-appraisal, supervisor evaluation, recommendations
  PERF_VIEW_REPORT:   "PERF_VIEW_REPORT",   // View appraisal results (scoped by role)

  // ── 6. Self-Service (8) ─────────────────────────────────────────────────────
  ESS_PROFILE_UPDATE: "ESS_PROFILE_UPDATE", // Update personal information — self only
  ESS_LEAVE_APPLY:    "ESS_LEAVE_APPLY",    // Apply for leave — self, all roles
  ESS_LATE_APPLY:     "ESS_LATE_APPLY",     // Late entry request — self, all roles
  ESS_ATT_CORRECT:    "ESS_ATT_CORRECT",    // Attendance correction request — self, all roles
  ESS_LOAN_APPLY:     "ESS_LOAN_APPLY",     // Apply for loan / advance — self, all roles
  ESS_ATT_VIEW:       "ESS_ATT_VIEW",       // View own attendance — self, all roles
  MSS_APPROVE_TEAM:   "MSS_APPROVE_TEAM",   // Approve team leave, late, loan requests
  MSS_TEAM_VIEW:      "MSS_TEAM_VIEW",      // View team profile & attendance

  // ── 7. PF Management (4) ────────────────────────────────────────────────────
  PF_RULES_CONFIG:    "PF_RULES_CONFIG",    // Configure PF rules — Admin only
  PF_CONTRIB_PROCESS: "PF_CONTRIB_PROCESS", // Process PF contributions — Admin & HR
  PF_LOAN_APPROVE:    "PF_LOAN_APPROVE",    // Approve PF loan / withdrawal
  PF_STATEMENT_VIEW:  "PF_STATEMENT_VIEW",  // View PF statement (scoped by role)

  // ── 8. Gratuity (4) ─────────────────────────────────────────────────────────
  GRAT_FORMULA_CONFIG: "GRAT_FORMULA_CONFIG", // Configure gratuity formula — Admin only
  GRAT_PROVISION:      "GRAT_PROVISION",      // Monthly gratuity provisioning
  GRAT_SETTLE:         "GRAT_SETTLE",         // Final gratuity settlement
  GRAT_STATEMENT_VIEW: "GRAT_STATEMENT_VIEW", // View gratuity statement — NOT Supervisor

  // ── 9. Loan & Advance (3) ───────────────────────────────────────────────────
  LOAN_CAT_CREATE:  "LOAN_CAT_CREATE",  // Create loan categories — Admin only
  LOAN_APPROVE:     "LOAN_APPROVE",     // Approve loan requests (team for Supervisor)
  LOAN_LEDGER_VIEW: "LOAN_LEDGER_VIEW", // View loan ledger (scoped by role)

  // ── 10. Document Management (4) ─────────────────────────────────────────────
  DOC_ORG_UPLOAD: "DOC_ORG_UPLOAD", // Upload organization documents — Admin & HR
  DOC_EMP_UPLOAD: "DOC_EMP_UPLOAD", // Upload employee documents — Admin & HR
  DOC_TEAM_VIEW:  "DOC_TEAM_VIEW",  // View team documents — Admin, HR, Supervisor
  DOC_SELF_VIEW:  "DOC_SELF_VIEW",  // View own documents — all roles

  // ── 11. Communication (3) ───────────────────────────────────────────────────
  COMM_ANNOUNCE: "COMM_ANNOUNCE", // Create global announcements — Admin & HR
  COMM_TEAM_MSG: "COMM_TEAM_MSG", // Send team messages — Admin, HR, Supervisor
  COMM_RECEIVE:  "COMM_RECEIVE",  // Receive notifications — all roles

  // ── 12. Reports (3) ─────────────────────────────────────────────────────────
  REP_ANALYTICS: "REP_ANALYTICS", // Full analytics dashboard — Admin & HR only
  REP_GENERATE:  "REP_GENERATE",  // Standard reports — scoped by role
  REP_PAYROLL:   "REP_PAYROLL",   // Payroll reports — Admin & HR only
};