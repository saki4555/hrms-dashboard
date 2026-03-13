import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const holidayQueryKeys = {
  all: ["holidays"],
  lists: () => [...holidayQueryKeys.all, "lists"],
  detail: (id) => [...holidayQueryKeys.all, "detail", id],
};

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/holiday`;


/* ─── API functions ──────────────────────────────────────────────────────── */

const getHolidays = async () => {
  const res = await fetch(API_BASE_URL);
  if (!res.ok)
    throw new Error(
      `Failed to fetch holidays: ${res.status} ${res.statusText}`,
    );
  const json = await res.json();
  return json.data || json;
};

const getHolidayById = async (id) => {
  const res = await fetch(`${API_BASE_URL}/${id}`);
  if (!res.ok)
    throw new Error(`Failed to fetch holiday: ${res.status} ${res.statusText}`);
  const json = await res.json();
  return json.data || json;
};

const createHoliday = async (data) => {
  const res = await fetch(API_BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to create holiday: ${res.status}`);
  }
  return res.json();
};

const updateHoliday = async ({ id, data }) => {
  const res = await fetch(`${API_BASE_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to update holiday: ${res.status}`);
  }
  return res.json();
};

const deleteHoliday = async (id) => {
  const res = await fetch(`${API_BASE_URL}/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to delete holiday: ${res.status}`);
  }
  return res.json();
};

/* ─── Hooks ──────────────────────────────────────────────────────────────── */

const queryDefaults = {
  retry: 2,
  retryDelay: (i) => Math.min(1000 * 2 ** i, 30000),
  staleTime: 30 * 1000,
  gcTime: 5 * 60 * 1000,
  refetchOnWindowFocus: false,
  throwOnError: false,
};

export const useHolidays = () =>
  useQuery({
    queryKey: holidayQueryKeys.lists(),
    queryFn: getHolidays,
    refetchOnMount: true,
    ...queryDefaults,
  });

export const useHolidayById = (id) =>
  useQuery({
    queryKey: holidayQueryKeys.detail(id),
    queryFn: () => getHolidayById(id),
    enabled: !!id,
    ...queryDefaults,
  });

export const useCreateHoliday = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createHoliday,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: holidayQueryKeys.lists() }),
    onError: (error) => console.error("Create mutation failed:", error),
  });
};

export const useUpdateHoliday = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateHoliday,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: holidayQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: holidayQueryKeys.detail(variables.id),
      });
    },
    onError: (error) => console.error("Update mutation failed:", error),
  });
};

export const useDeleteHoliday = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteHoliday,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: holidayQueryKeys.lists() }),
    onError: (error) => console.error("Delete mutation failed:", error),
  });
};
