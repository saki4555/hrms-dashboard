import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const contractQueryKeys = {
  all: ["contracts"],
  lists: () => [...contractQueryKeys.all, "lists"],
  detail: (id) => [...contractQueryKeys.all, "detail", id],
};

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/hr-contract`;

/* ─── API functions ──────────────────────────────────────────────────────── */

const getContracts = async () => {
  const res = await fetch(API_BASE_URL);
  if (!res.ok) throw new Error(`Failed to fetch contracts: ${res.status} ${res.statusText}`);
  const json = await res.json();
  return json.data || json;
};

const getContractById = async (id) => {
  const res = await fetch(`${API_BASE_URL}/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch contract: ${res.status} ${res.statusText}`);
  const json = await res.json();
  return json.data || json;
};

const createContract = async (data) => {
  const res = await fetch(API_BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to create contract: ${res.status}`);
  }
  return res.json();
};

const updateContract = async ({ id, data }) => {
  const res = await fetch(`${API_BASE_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to update contract: ${res.status}`);
  }
  return res.json();
};

const deleteContract = async (id) => {
  const res = await fetch(`${API_BASE_URL}/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to delete contract: ${res.status}`);
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

export const useContracts = () =>
  useQuery({
    queryKey: contractQueryKeys.lists(),
    queryFn: getContracts,
    refetchOnMount: true,
    ...queryDefaults,
  });

export const useContractById = (id) =>
  useQuery({
    queryKey: contractQueryKeys.detail(id),
    queryFn: () => getContractById(id),
    enabled: !!id,
    ...queryDefaults,
  });

export const useCreateContract = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createContract,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: contractQueryKeys.lists() }),
    onError: (error) => console.error("Create mutation failed:", error),
  });
};

export const useUpdateContract = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateContract,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: contractQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: contractQueryKeys.detail(variables.id) });
    },
    onError: (error) => console.error("Update mutation failed:", error),
  });
};

export const useDeleteContract = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteContract,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: contractQueryKeys.lists() }),
    onError: (error) => console.error("Delete mutation failed:", error),
  });
};