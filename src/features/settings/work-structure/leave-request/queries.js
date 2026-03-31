import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const leaveRequestQueryKeys = {
  all: ["leaveRequests"],
  lists: () => [...leaveRequestQueryKeys.all, "lists"],
  detail: (id) => [...leaveRequestQueryKeys.all, "detail", id],
};

const leaveTypeQueryKeys = {
  all: ["leaveTypes"],
  lists: () => [...leaveTypeQueryKeys.all, "lists"],
};

const API_BASE_URL    = `${import.meta.env.VITE_API_BASE_URL}/api/leave-request`;
const LEAVE_TYPE_URL  = `${import.meta.env.VITE_API_BASE_URL}/api/leave-types`;

// ── Fetchers ──────────────────────────────────────────────────────────────────

const getLeaveTypes = async () => {
  const res = await fetch(LEAVE_TYPE_URL);
  if (!res.ok) throw new Error(`Failed to fetch leave types: ${res.status} ${res.statusText}`);
  const json = await res.json();
  return json.data || json;
};

const getLeaveRequests = async () => {
  const res = await fetch(API_BASE_URL);
  if (!res.ok) throw new Error(`Failed to fetch leave requests: ${res.status} ${res.statusText}`);
  const json = await res.json();
  return json.data || json;
};

const getLeaveRequestById = async (id) => {
  const res = await fetch(`${API_BASE_URL}/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch leave request: ${res.status} ${res.statusText}`);
  const json = await res.json();
  return json.data || json;
};

const createLeaveRequest = async (data) => {
  const res = await fetch(API_BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to create leave request: ${res.status}`);
  }
  return res.json();
};

const updateLeaveRequest = async ({ id, data }) => {
  const res = await fetch(`${API_BASE_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
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

// ── Hooks ─────────────────────────────────────────────────────────────────────

// Leave Types — rarely changes, long stale time
export const useLeaveTypes = () =>
  useQuery({
    queryKey: leaveTypeQueryKeys.lists(),
    queryFn: getLeaveTypes,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    throwOnError: false,
  });

export const useLeaveRequests = () =>
  useQuery({
    queryKey: leaveRequestQueryKeys.lists(),
    queryFn: getLeaveRequests,
    retry: 2,
    retryDelay: (i) => Math.min(1000 * 2 ** i, 30000),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    throwOnError: false,
  });

export const useLeaveRequestById = (id) =>
  useQuery({
    queryKey: leaveRequestQueryKeys.detail(id),
    queryFn: () => getLeaveRequestById(id),
    enabled: !!id,
    retry: 2,
    retryDelay: (i) => Math.min(1000 * 2 ** i, 30000),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    throwOnError: false,
  });

export const useCreateLeaveRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createLeaveRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveRequestQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["notifications"] }); 
    },
    onError: (err) => console.error("Create leave request failed:", err),
  });
};

export const useUpdateLeaveRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateLeaveRequest,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: leaveRequestQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: leaveRequestQueryKeys.detail(variables.id) });
    },
    onError: (err) => console.error("Update leave request failed:", err),
  });
};

export const useDeleteLeaveRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteLeaveRequest,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: leaveRequestQueryKeys.lists() }),
    onError: (err) => console.error("Delete leave request failed:", err),
  });
};