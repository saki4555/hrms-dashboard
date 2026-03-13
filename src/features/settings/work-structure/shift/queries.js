import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const shiftQueryKeys = {
  all: ["shifts"],
  lists: () => [...shiftQueryKeys.all, "lists"],
  detail: (id) => [...shiftQueryKeys.all, "detail", id],
};

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/hr-shift`;

const getShifts = async () => {
  const res = await fetch(API_BASE_URL);
  if (!res.ok)
    throw new Error(`Failed to fetch shifts: ${res.status} ${res.statusText}`);
  const json = await res.json();
  return json.data || json;
};

const getShiftById = async (id) => {
  const res = await fetch(`${API_BASE_URL}/${id}`);
  if (!res.ok)
    throw new Error(`Failed to fetch shift: ${res.status} ${res.statusText}`);
  const json = await res.json();
  return json.data || json;
};

const createShift = async (data) => {
  const res = await fetch(API_BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to create shift: ${res.status}`);
  }
  return res.json();
};

const updateShift = async ({ id, data }) => {
  const res = await fetch(`${API_BASE_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to update shift: ${res.status}`);
  }
  return res.json();
};

const deleteShift = async (id) => {
  const res = await fetch(`${API_BASE_URL}/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to delete shift: ${res.status}`);
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

export const useShifts = () =>
  useQuery({
    queryKey: shiftQueryKeys.lists(),
    queryFn: getShifts,
    refetchOnMount: true,
    ...queryDefaults,
  });

export const useShiftById = (id) =>
  useQuery({
    queryKey: shiftQueryKeys.detail(id),
    queryFn: () => getShiftById(id),
    enabled: !!id,
    ...queryDefaults,
  });

export const useCreateShift = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createShift,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: shiftQueryKeys.lists() }),
    onError: (error) => console.error("Create mutation failed:", error),
  });
};

export const useUpdateShift = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateShift,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: shiftQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: shiftQueryKeys.detail(variables.id),
      });
    },
    onError: (error) => console.error("Update mutation failed:", error),
  });
};

export const useDeleteShift = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteShift,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: shiftQueryKeys.lists() }),
    onError: (error) => console.error("Delete mutation failed:", error),
  });
};
