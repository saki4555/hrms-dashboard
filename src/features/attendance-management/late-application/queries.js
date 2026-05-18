// src/features/attendance-management/late-application/queries.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/late-application`;

// ── Query Keys ────────────────────────────────────────────────────────────────

export const lateApplicationQueryKeys = {
  all:      ["lateApplications"],
  lists:    (params)               => ["lateApplications", "list",     params],
  team:     (supervisorId, params) => ["lateApplications", "team",     supervisorId, params],
  employee: (personId,     params) => ["lateApplications", "employee", personId,     params],
};

// ── Fetcher ───────────────────────────────────────────────────────────────────

const fetcher = async (url) => {
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Request failed: ${res.status}`);
  }
  return res.json();
};

// Builds URL with query string — skips empty/null values
const buildUrl = (base, params = {}) => {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== "" && v != null) sp.set(k, v);
  });
  const qs = sp.toString();
  return qs ? `${base}?${qs}` : base;
};

// ── Fetchers ──────────────────────────────────────────────────────────────────

// Admin/HR — paginated + filtered
const fetchAllLateApplications = async (params = {}) =>
  fetcher(buildUrl(API_BASE_URL, params));

// Supervisor — full params (page, limit, status, sortBy, sortOrder)
const fetchTeamLateApplications = async (supervisorId, params = {}) =>
  fetcher(buildUrl(`${API_BASE_URL}/team/${supervisorId}`, params));

// Employee — full params (page, limit, status, sortBy, sortOrder)
const fetchEmployeeLateApplications = async (personId, params = {}) =>
  fetcher(buildUrl(`${API_BASE_URL}/employee/${personId}`, params));

// ── Query Defaults ────────────────────────────────────────────────────────────

const queryDefaults = {
  retry:                2,
  retryDelay:           (i) => Math.min(1000 * 2 ** i, 30000),
  staleTime:            30 * 1000,
  gcTime:               5 * 60 * 1000,
  refetchOnWindowFocus: false,
  refetchOnMount:       true,
  throwOnError:         false,
};

// ── Hooks ─────────────────────────────────────────────────────────────────────

// Admin/HR — server-side paginated + filtered
export const useAllLateApplications = (params = {}) =>
  useQuery({
    queryKey: lateApplicationQueryKeys.lists(params),
    queryFn:  () => fetchAllLateApplications(params),
    ...queryDefaults,
  });

// Supervisor — full params passed through
export const useTeamLateApplications = (supervisorId, params = {}) =>
  useQuery({
    queryKey: lateApplicationQueryKeys.team(supervisorId, params),
    queryFn:  () => fetchTeamLateApplications(supervisorId, params),
    enabled:  !!supervisorId,
    ...queryDefaults,
  });

// Employee — full params passed through
export const useEmployeeLateApplications = (personId, params = {}) =>
  useQuery({
    queryKey: lateApplicationQueryKeys.employee(personId, params),
    queryFn:  () => fetchEmployeeLateApplications(personId, params),
    enabled:  !!personId,
    ...queryDefaults,
  });

// ── Mutations ─────────────────────────────────────────────────────────────────

const postJson = async (url, body) => {
  const res = await fetch(url, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Request failed: ${res.status}`);
  }
  return res.json();
};

const deleteJson = async (url) => {
  const res = await fetch(url, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Request failed: ${res.status}`);
  }
  return res.json();
};

export const useCreateLateApplication = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => postJson(API_BASE_URL, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lateApplications"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (err) => console.error("Create late application failed:", err),
  });
};

export const useApproveLateApplication = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, approverId, notificationId }) =>
      postJson(`${API_BASE_URL}/${id}/approve`, {
        approverId,
        notificationId: notificationId ?? null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lateApplications"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (err) => console.error("Approve late application failed:", err),
  });
};

export const useRejectLateApplication = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, approverId, notificationId, reason }) =>
      postJson(`${API_BASE_URL}/${id}/reject`, {
        approverId,
        notificationId: notificationId ?? null,
        reason,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lateApplications"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (err) => console.error("Reject late application failed:", err),
  });
};

export const useDeleteLateApplication = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteJson(`${API_BASE_URL}/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lateApplications"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (err) => console.error("Delete late application failed:", err),
  });
};