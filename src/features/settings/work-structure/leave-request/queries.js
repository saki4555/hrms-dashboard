import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API_BASE_URL   = `${import.meta.env.VITE_API_BASE_URL}/api/leave-request`;


// ── Query Keys ────────────────────────────────────────────────────────────────

export const leaveRequestQueryKeys = {
  all:        ["leaveRequests"],
  lists:      (params) => ["leaveRequests", "list", params],
  team:       (supervisorId, status) => ["leaveRequests", "team", supervisorId, status],
  employee:   (employeeId, status)   => ["leaveRequests", "employee", employeeId, status],
  detail:     (id)                   => ["leaveRequests", "detail", id],
};



// ── Fetchers ──────────────────────────────────────────────────────────────────

const fetcher = async (url) => {
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Request failed: ${res.status}`);
  }
  return res.json();
};

// Admin/HR — paginated list with filters
const fetchAllLeaves = async (params = {}) => {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== "" && v != null) sp.set(k, v); });
  return fetcher(`${API_BASE_URL}?${sp.toString()}`);
  // returns: { success, data: [], pagination: { total, page, limit, totalPages } }
};

// Supervisor — team leaves
const fetchTeamLeaves = async (supervisorId, status) => {
  const sp = new URLSearchParams();
  if (status) sp.set("status", status);
  return fetcher(`${API_BASE_URL}/team/${supervisorId}?${sp.toString()}`);
  // returns: { success, count, data: [] }
};

// Employee — own leaves
const fetchEmployeeLeaves = async (employeeId, status) => {
  const sp = new URLSearchParams();
  if (status) sp.set("status", status);
  return fetcher(`${API_BASE_URL}/employee/${employeeId}?${sp.toString()}`);
  // returns: { success, count, data: [] }
};



const fetchLeaveById = async (id) => {
  const json = await fetcher(`${API_BASE_URL}/${id}`);
  return json.data || json;
};

// ── Query Defaults ────────────────────────────────────────────────────────────

const queryDefaults = {
  retry: 2,
  retryDelay: (i) => Math.min(1000 * 2 ** i, 30000),
  staleTime: 30 * 1000,
  gcTime: 5 * 60 * 1000,
  refetchOnWindowFocus: false,
  refetchOnMount: true,
  throwOnError: false,
};

// ── Hooks ─────────────────────────────────────────────────────────────────────

// Admin / HR — server-side paginated + filtered
export const useAllLeaves = (params = {}) =>
  useQuery({
    queryKey: leaveRequestQueryKeys.lists(params),
    queryFn:  () => fetchAllLeaves(params),
    ...queryDefaults,
  });

// Supervisor — team leaves (no pagination, dataset is bounded to team size)
export const useTeamLeaves = (supervisorId, status = "") =>
  useQuery({
    queryKey: leaveRequestQueryKeys.team(supervisorId, status),
    queryFn:  () => fetchTeamLeaves(supervisorId, status),
    enabled:  !!supervisorId,
    ...queryDefaults,
  });

// Employee — own leave history
export const useEmployeeLeaves = (employeeId, status = "") =>
  useQuery({
    queryKey: leaveRequestQueryKeys.employee(employeeId, status),
    queryFn:  () => fetchEmployeeLeaves(employeeId, status),
    enabled:  !!employeeId,
    ...queryDefaults,
  });



// Single leave
export const useLeaveRequestById = (id) =>
  useQuery({
    queryKey: leaveRequestQueryKeys.detail(id),
    queryFn:  () => fetchLeaveById(id),
    enabled:  !!id,
    ...queryDefaults,
  });

// ── Mutations ─────────────────────────────────────────────────────────────────

const createLeaveRequest = async (data) => {
  const res = await fetch(API_BASE_URL, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to create leave request: ${res.status}`);
  }
  return res.json();
};

const updateLeaveRequest = async ({ id, data }) => {
  const res = await fetch(`${API_BASE_URL}/${id}`, {
    method:  "PUT",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to update leave request: ${res.status}`);
  }
  return res.json();
};

const deleteLeaveRequest = async (id) => {
  const res = await fetch(`${API_BASE_URL}/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to delete leave request: ${res.status}`);
  }
  return res.json();
};

export const useCreateLeaveRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createLeaveRequest,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leaveRequests"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (err) => console.error("Create leave request failed:", err),
  });
};

export const useUpdateLeaveRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateLeaveRequest,
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["leaveRequests"] });
      qc.invalidateQueries({ queryKey: leaveRequestQueryKeys.detail(variables.id) });
    },
    onError: (err) => console.error("Update leave request failed:", err),
  });
};

export const useDeleteLeaveRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteLeaveRequest,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leaveRequests"] }),
    onError: (err) => console.error("Delete leave request failed:", err),
  });
};