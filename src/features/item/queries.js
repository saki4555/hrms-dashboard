import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const BASE = import.meta.env.VITE_API_BASE_URL;

// ── Query Keys ────────────────────────────────────────────────────────────────
export const itemKeys = {
  all:    ["items"],
  lists:  () => [...itemKeys.all, "lists"],
  detail: (id) => [...itemKeys.all, "detail", id],
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
export const useItems = ({ page = 1, limit = 200 } = {}) =>
  useQuery({
    queryKey: [...itemKeys.lists(), page, limit],
    queryFn:  () => fetchJSON(`${BASE}/api/item?page=${page}&limit=${limit}`),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    retry: 2,
    retryDelay: (i) => Math.min(1000 * 2 ** i, 30000),
    throwOnError: false,
  });

export const useItemById = (itemId) =>
  useQuery({
    queryKey: itemKeys.detail(itemId),
    queryFn:  () => fetchJSON(`${BASE}/api/item/${itemId}`),
    enabled:  !!itemId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    throwOnError: false,
  });

export const useCreateItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      fetchJSON(`${BASE}/api/item`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: itemKeys.lists() }),
    onError: (err) => console.error("Create item failed:", err),
  });
};

export const useUpdateItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, data }) =>
      fetchJSON(`${BASE}/api/item/${itemId}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(data),
      }),
    onSuccess: (_, { itemId }) => {
      qc.invalidateQueries({ queryKey: itemKeys.lists() });
      qc.invalidateQueries({ queryKey: itemKeys.detail(itemId) });
    },
    onError: (err) => console.error("Update item failed:", err),
  });
};

export const useDeleteItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId) =>
      fetchJSON(`${BASE}/api/item/${itemId}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: itemKeys.lists() }),
    onError: (err) => console.error("Delete item failed:", err),
  });
};