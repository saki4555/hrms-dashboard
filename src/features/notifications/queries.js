import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const BASE = `${import.meta.env.VITE_API_BASE_URL}/api/notifications`;

const queryDefaults = {
  retry: 2,
  retryDelay: (i) => Math.min(1000 * 2 ** i, 30000),
  staleTime: 15 * 1000,
  gcTime: 5 * 60 * 1000,
  refetchOnWindowFocus: true,
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

export const useNotificationsForSupervisor = (supervisorId) =>
  useQuery({
    queryKey: ["notifications", "supervisor", supervisorId],
    queryFn: async () => {
      const json = await fetcher(`${BASE}/supervisor/${supervisorId}`);
      return json.data;
    },
    enabled: !!supervisorId,
    refetchInterval: 30 * 1000, // poll every 30s
    ...queryDefaults,
  });

export const useNotificationsForEmployee = (employeeId) =>
  useQuery({
    queryKey: ["notifications", "employee", employeeId],
    queryFn: async () => {
      const json = await fetcher(`${BASE}/employee/${employeeId}`);
      return json.data;
    },
    enabled: !!employeeId,
    refetchInterval: 30 * 1000,
    ...queryDefaults,
  });

export const useUnreadCount = (supervisorId) =>
  useQuery({
    queryKey: ["notifications", "unread", supervisorId],
    queryFn: async () => {
      const json = await fetcher(`${BASE}/supervisor/${supervisorId}/unread-count`);
      return json.count;
    },
    enabled: !!supervisorId,
    refetchInterval: 30 * 1000,
    ...queryDefaults,
  });

export const useMarkAsRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => fetcher(`${BASE}/${id}/read`, { method: "PATCH" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
};

export const useMarkAllAsRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (supervisorId) =>
      fetcher(`${BASE}/supervisor/${supervisorId}/read-all`, { method: "PATCH" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
};

export const useApproveLeave = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => fetcher(`${BASE}/approve`, { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["leaveRequests"] });
    },
  });
};

export const useRejectLeave = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => fetcher(`${BASE}/reject`, { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["leaveRequests"] }); 
    },
  });
};