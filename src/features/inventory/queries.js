import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const BASE = import.meta.env.VITE_API_BASE_URL;

// ── Query Keys ────────────────────────────────────────────────────────────────
export const inventoryKeys = {
  all:    ["inventories"],
  lists:  () => [...inventoryKeys.all, "lists"],
  detail: (id) => [...inventoryKeys.all, "detail", id],
};

// ── Fetcher ───────────────────────────────────────────────────────────────────
const fetchJSON = async (url, options = {}) => {
  const res = await fetch(url, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `${res.status} ${res.statusText}`);
  }
  const json = await res.json();
  return json.data ?? json;
};

// ── Hooks ─────────────────────────────────────────────────────────────────────
export const useInventories = ({ page = 1, limit = 50 } = {}) =>
  useQuery({
    queryKey: [...inventoryKeys.lists(), page, limit],
    queryFn:  () => fetchJSON(`${BASE}/api/inventory?page=${page}&limit=${limit}`),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    retry: 2,
    retryDelay: (i) => Math.min(1000 * 2 ** i, 30000),
    throwOnError: false,
  });

export const useInventoryById = (tid) =>
  useQuery({
    queryKey: inventoryKeys.detail(tid),
    queryFn:  () => fetchJSON(`${BASE}/api/inventory/${tid}`),
    enabled:  !!tid,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
    throwOnError: false,
  });

export const useCreateInventory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      fetchJSON(`${BASE}/api/inventory`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: inventoryKeys.lists() }),
    onError: (err) => console.error("Create inventory failed:", err),
  });
};

export const useUpdateInventory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tid, data }) =>
      fetchJSON(`${BASE}/api/inventory/${tid}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(data),
      }),
    onSuccess: (_, { tid }) => {
      qc.invalidateQueries({ queryKey: inventoryKeys.lists() });
      qc.invalidateQueries({ queryKey: inventoryKeys.detail(tid) });
    },
    onError: (err) => console.error("Update inventory failed:", err),
  });
};

export const useDeleteInventory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tid) =>
      fetchJSON(`${BASE}/api/inventory/${tid}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: inventoryKeys.lists() }),
    onError: (err) => console.error("Delete inventory failed:", err),
  });
};