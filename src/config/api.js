// src/config/api.js

const BASE = import.meta.env.VITE_API_BASE_URL ?? "";
console.log(import.meta.env.VITE_API_BASE_URL)

export const API_ROUTES = {
  auth:        `${BASE}/api/v1/auth`,
  employee:    `${BASE}/api/hr-employee`,
  personType:  `${BASE}/api/hr-person-type`,
  company:     `${BASE}/api/hr-company`,
  grade:       `${BASE}/api/hr-grade`,
  position:    `${BASE}/api/hr-position`,
  orgPosition: `${BASE}/api/hr-org-position`,
  org:         `${BASE}/api/hr-org`,
  location:    `${BASE}/api/hr-location`,
  country:     `${BASE}/api/country`,
  region:      `${BASE}/api/region`,
  district:    `${BASE}/api/district`,
  upazilla:    `${BASE}/api/upazilla`,
};