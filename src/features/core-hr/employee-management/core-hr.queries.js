// src/features/core-hr/employee-management/core-hr.queries.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { employeeKeys } from "./queries";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/core-hr`;

// ── Fetchers ──────────────────────────────────────────────────────────────────

const transferEmployee = async ({ personId, data }) => {
  const res = await fetch(`${API_BASE_URL}/transfer/${personId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Transfer failed: ${res.status}`);
  }
  return res.json();
};

const processIncrement = async ({ personId, data }) => {
  const res = await fetch(`${API_BASE_URL}/increment/${personId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Increment failed: ${res.status}`);
  }
  return res.json();
};

const endEmployment = async ({ personId, data }) => {
  const res = await fetch(`${API_BASE_URL}/end-employment/${personId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `End employment failed: ${res.status}`);
  }
  return res.json();
};

const reinstateEmployee = async ({ personId, data }) => {
  const res = await fetch(`${API_BASE_URL}/reinstate/${personId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Reinstate failed: ${res.status}`);
  }
  return res.json();
};

const getAuditHistory = async ({ personId, page = 1, limit = 10 }) => {
  const qs = new URLSearchParams({ page, limit }).toString();
  const res = await fetch(`${API_BASE_URL}/audit-history/${personId}?${qs}`);
  if (!res.ok) throw new Error(`Failed to fetch audit history: ${res.status}`);
  return res.json();
  // returns: { data: [...], pagination: { total, page, limit, totalPages } }
};

// ── Query Keys ────────────────────────────────────────────────────────────────

export const coreHrKeys = {
  auditHistory: (personId, params) => ["core-hr", "audit-history", personId, params],
};

// ── Hooks ─────────────────────────────────────────────────────────────────────

export const useAuditHistory = (personId, { page = 1, limit = 10 } = {}) =>
  useQuery({
    queryKey: coreHrKeys.auditHistory(personId, { page, limit }),
    queryFn:  () => getAuditHistory({ personId, page, limit }),
    enabled:  !!personId,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,
  });

// ── Mutations ─────────────────────────────────────────────────────────────────

// After any action, invalidate both the employee list and the specific employee
// detail so the UI reflects the new state (status change, assignment change, etc.)
const invalidateEmployee = (queryClient, personId) => {
  queryClient.invalidateQueries({ queryKey: employeeKeys.all });
  queryClient.invalidateQueries({ queryKey: employeeKeys.detail(personId) });
  queryClient.invalidateQueries({ queryKey: ["core-hr", "audit-history", personId] });
};

export const useTransferEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: transferEmployee,
    onSuccess: (_, { personId }) => invalidateEmployee(queryClient, personId),
  });
};

export const useProcessIncrement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: processIncrement,
    onSuccess: (_, { personId }) => invalidateEmployee(queryClient, personId),
  });
};

export const useEndEmployment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: endEmployment,
    onSuccess: (_, { personId }) => invalidateEmployee(queryClient, personId),
  });
};

export const useReinstateEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reinstateEmployee,
    onSuccess: (_, { personId }) => invalidateEmployee(queryClient, personId),
  });
};