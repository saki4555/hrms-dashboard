export const ROLES = {
  ADMIN:      "Admin",
  HR:         "HR",
  SUPERVISOR: "Supervisor",
  EMPLOYEE:   "Employee",
};

const { ADMIN, HR, SUPERVISOR, EMPLOYEE } = ROLES;

export const ALL_ROLES    = [ADMIN, HR, SUPERVISOR, EMPLOYEE];
export const ADMIN_HR     = [ADMIN, HR];
export const ADMIN_HR_SUP = [ADMIN, HR, SUPERVISOR];