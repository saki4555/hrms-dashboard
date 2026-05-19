// src/features/attendance-management/attendance-correction/queries.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/attendance-correction`;

// ── Query Keys ────────────────────────────────────────────────────────────────

export const correctionQueryKeys = {
  all:      ["attendanceCorrections"],
  lists:    (params)               => ["attendanceCorrections", "list",     params],
  team:     (supervisorId, params) => ["attendanceCorrections", "team",     supervisorId, params],
  employee: (personId,     params) => ["attendanceCorrections", "employee", personId,     params],
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

const buildUrl = (base, params = {}) => {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== "" && v != null) sp.set(k, v);
  });
  const qs = sp.toString();
  return qs ? `${base}?${qs}` : base;
};

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

export const useAllCorrections = (params = {}) =>
  useQuery({
    queryKey: correctionQueryKeys.lists(params),
    queryFn:  () => fetcher(buildUrl(API_BASE_URL, params)),
    ...queryDefaults,
  });

export const useTeamCorrections = (supervisorId, params = {}) =>
  useQuery({
    queryKey: correctionQueryKeys.team(supervisorId, params),
    queryFn:  () => fetcher(buildUrl(`${API_BASE_URL}/team/${supervisorId}`, params)),
    enabled:  !!supervisorId,
    ...queryDefaults,
  });

export const useEmployeeCorrections = (personId, params = {}) =>
  useQuery({
    queryKey: correctionQueryKeys.employee(personId, params),
    queryFn:  () => fetcher(buildUrl(`${API_BASE_URL}/employee/${personId}`, params)),
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

export const useCreateCorrection = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => postJson(API_BASE_URL, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendanceCorrections"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (err) => console.error("Create correction failed:", err),
  });
};

export const useApproveCorrection = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, approverId, notificationId }) =>
      postJson(`${API_BASE_URL}/${id}/approve`, {
        approverId,
        notificationId: notificationId ?? null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendanceCorrections"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (err) => console.error("Approve correction failed:", err),
  });
};

export const useRejectCorrection = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, approverId, notificationId, reason }) =>
      postJson(`${API_BASE_URL}/${id}/reject`, {
        approverId,
        notificationId: notificationId ?? null,
        reason,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendanceCorrections"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (err) => console.error("Reject correction failed:", err),
  });
};

export const useDeleteCorrection = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteJson(`${API_BASE_URL}/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendanceCorrections"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (err) => console.error("Delete correction failed:", err),
  });
};