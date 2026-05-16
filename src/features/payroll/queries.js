// src/features/payroll/queries.js
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const BASE = `${import.meta.env.VITE_API_BASE_URL}/api/payroll`;

const queryDefaults = {
  retry: 2,
  retryDelay: (i) => Math.min(1000 * 2 ** i, 30000),
  staleTime: 30 * 1000,
  gcTime: 5 * 60 * 1000,
  refetchOnWindowFocus: false,
};

const fetcher = async (url, options = {}) => {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || `Request failed: ${res.status}`);
  }
  return res.json();
};

// ── Get all payroll runs ───────────────────────────────────────────────────
export const usePayrollRuns = () =>
  useQuery({
    queryKey: ["payroll", "runs"],
    queryFn: () => fetcher(`${BASE}/run`),
    ...queryDefaults,
  });

// ── Get payslips for a run (salary sheet) ────────────────────────────────
export const usePayslipsByRun = (payrollId) =>
  useQuery({
    queryKey: ["payroll", "payslips", payrollId],
    queryFn: () => fetcher(`${BASE}/run/${payrollId}/payslips`),
    enabled: !!payrollId,
    ...queryDefaults,
  });

// ── Get employee payslip by month ────────────────────────────────────────
export const useEmployeePayslip = (employeeId, month) =>
  useQuery({
    queryKey: ["payroll", "payslip", employeeId, month],
    queryFn: () => fetcher(`${BASE}/payslip/${employeeId}?month=${month}`),
    enabled: !!employeeId && !!month,
    ...queryDefaults,
  });

// ── Create payroll run ────────────────────────────────────────────────────
export const useCreatePayrollRun = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body) =>
      fetcher(`${BASE}/run`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payroll", "runs"] }),
  });
};

// ── Process payroll run ───────────────────────────────────────────────────
export const useProcessPayrollRun = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payrollId) =>
      fetcher(`${BASE}/run/${payrollId}/process`, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payroll", "runs"] }),
  });
};

// ── Approve payroll run ───────────────────────────────────────────────────
export const useApprovePayrollRun = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payrollId) =>
      fetcher(`${BASE}/run/${payrollId}/approve`, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payroll", "runs"] }),
  });
};