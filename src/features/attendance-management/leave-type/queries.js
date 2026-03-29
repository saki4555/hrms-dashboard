import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const leaveTypeQueryKeys = {
  all:    ["leave-types"],
  lists:  () => [...leaveTypeQueryKeys.all, "lists"],
  detail: (id) => [...leaveTypeQueryKeys.all, "detail", id],
};

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/leave-types`;

const getLeaveTypes = async () => {
  const res = await fetch(API_BASE_URL);
  if (!res.ok) throw new Error(`Failed to fetch leave types: ${res.status} ${res.statusText}`);
  const json = await res.json();
  return json.data || json;
};

const getLeaveTypeById = async (id) => {
  const res = await fetch(`${API_BASE_URL}/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch leave type: ${res.status} ${res.statusText}`);
  const json = await res.json();
  return json.data || json;
};

const createLeaveType = async (data) => {
  const res = await fetch(API_BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to create leave type: ${res.status}`);
  }
  return res.json();
};

const updateLeaveType = async ({ id, data }) => {
  const res = await fetch(`${API_BASE_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to update leave type: ${res.status}`);
  }
  return res.json();
};

const deleteLeaveType = async (id) => {
  const res = await fetch(`${API_BASE_URL}/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to delete leave type: ${res.status}`);
  }
  return res.json();
};

const queryDefaults = {
  retry: 2,
  retryDelay: (i) => Math.min(1000 * 2 ** i, 30000),
  staleTime: 30 * 1000,
  gcTime: 5 * 60 * 1000,
  refetchOnWindowFocus: false,
  throwOnError: false,
};

export const useLeaveTypes = () =>
  useQuery({
    queryKey: leaveTypeQueryKeys.lists(),
    queryFn: getLeaveTypes,
    refetchOnMount: true,
    ...queryDefaults,
  });

export const useLeaveTypeById = (id) =>
  useQuery({
    queryKey: leaveTypeQueryKeys.detail(id),
    queryFn: () => getLeaveTypeById(id),
    enabled: !!id,
    ...queryDefaults,
  });

export const useCreateLeaveType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createLeaveType,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: leaveTypeQueryKeys.lists() }),
    onError: (error) => console.error("Create mutation failed:", error),
  });
};

export const useUpdateLeaveType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateLeaveType,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: leaveTypeQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: leaveTypeQueryKeys.detail(variables.id) });
    },
    onError: (error) => console.error("Update mutation failed:", error),
  });
};

export const useDeleteLeaveType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteLeaveType,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: leaveTypeQueryKeys.lists() }),
    onError: (error) => console.error("Delete mutation failed:", error),
  });
};