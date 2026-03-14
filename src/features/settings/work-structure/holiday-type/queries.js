import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const holidayTypeQueryKeys = {
  all: ["holidayTypes"],
  lists: () => [...holidayTypeQueryKeys.all, "lists"],
  detail: (id) => [...holidayTypeQueryKeys.all, "detail", id],
};

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/holiday-type`;

const getHolidayTypes = async () => {
  const res = await fetch(API_BASE_URL);
  if (!res.ok)
    throw new Error(
      `Failed to fetch holiday types: ${res.status} ${res.statusText}`,
    );
    console.log(res);
  const json = await res.json();
  return json.data || json;
};

const getHolidayTypeById = async (id) => {
  const res = await fetch(`${API_BASE_URL}/${id}`);
  if (!res.ok)
    throw new Error(
      `Failed to fetch holiday type: ${res.status} ${res.statusText}`,
    );
  const json = await res.json();
  return json.data || json;
};

const createHolidayType = async (data) => {
  const res = await fetch(API_BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err.message || `Failed to create holiday type: ${res.status}`,
    );
  }
  return res.json();
};

const updateHolidayType = async ({ id, data }) => {
  const res = await fetch(`${API_BASE_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err.message || `Failed to update holiday type: ${res.status}`,
    );
  }
  return res.json();
};

const deleteHolidayType = async (id) => {
  const res = await fetch(`${API_BASE_URL}/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err.message || `Failed to delete holiday type: ${res.status}`,
    );
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

export const useHolidayTypes = () =>
  useQuery({
    queryKey: holidayTypeQueryKeys.lists(),
    queryFn: getHolidayTypes,
    refetchOnMount: true,
    ...queryDefaults,
  });

export const useHolidayTypeById = (id) =>
  useQuery({
    queryKey: holidayTypeQueryKeys.detail(id),
    queryFn: () => getHolidayTypeById(id),
    enabled: !!id,
    ...queryDefaults,
  });

export const useCreateHolidayType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createHolidayType,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: holidayTypeQueryKeys.lists() }),
    onError: (error) => console.error("Create mutation failed:", error),
  });
};

export const useUpdateHolidayType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateHolidayType,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: holidayTypeQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: holidayTypeQueryKeys.detail(variables.id),
      });
    },
    onError: (error) => console.error("Update mutation failed:", error),
  });
};

export const useDeleteHolidayType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteHolidayType,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: holidayTypeQueryKeys.lists() }),
    onError: (error) => console.error("Delete mutation failed:", error),
  });
};
