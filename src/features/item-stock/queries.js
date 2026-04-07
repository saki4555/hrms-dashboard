import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const BASE = import.meta.env.VITE_API_BASE_URL;

// ── Query Keys ────────────────────────────────────────────────────────────────
export const itemStockKeys = {
  all:    ["itemStocks"],
  lists:  () => [...itemStockKeys.all, "lists"],
  detail: (storeId, itemId) => [...itemStockKeys.all, "detail", storeId, itemId],
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
export const useItemStocks = ({ page = 1, limit = 50 } = {}) =>
  useQuery({
    queryKey: [...itemStockKeys.lists(), page, limit],
    queryFn:  () => fetchJSON(`${BASE}/api/item-stock?page=${page}&limit=${limit}`),
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    retry: 2,
    retryDelay: (i) => Math.min(1000 * 2 ** i, 30000),
    throwOnError: false,
  });

  export const useItemStockByItemId = (itemId) =>
  useQuery({
    queryKey: [...itemStockKeys.all, "byItem", itemId],
    queryFn: () => fetchJSON(`${BASE}/api/item-stock?itemId=${itemId}`),
    enabled: !!itemId,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

export const useItemStockById = (storeId, itemId) =>
  useQuery({
    queryKey: itemStockKeys.detail(storeId, itemId),
    queryFn:  () => fetchJSON(`${BASE}/api/item-stock/${storeId}/${itemId}`),
    enabled:  !!storeId && !!itemId,
    staleTime: 0,
    refetchOnWindowFocus: false,
    throwOnError: false,
  });

export const useCreateItemStock = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      fetchJSON(`${BASE}/api/item-stock`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: itemStockKeys.lists() }),
    onError: (err) => console.error("Create item stock failed:", err),
  });
};

export const useUpdateItemStock = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ storeId, itemId, data }) =>
      fetchJSON(`${BASE}/api/item-stock/${storeId}/${itemId}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(data),
      }),
    onSuccess: (_, { storeId, itemId }) => {
      qc.invalidateQueries({ queryKey: itemStockKeys.lists() });
      qc.invalidateQueries({ queryKey: itemStockKeys.detail(storeId, itemId) });
    },
    onError: (err) => console.error("Update item stock failed:", err),
  });
};

export const useDeleteItemStock = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ storeId, itemId }) =>
      fetchJSON(`${BASE}/api/item-stock/${storeId}/${itemId}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: itemStockKeys.lists() }),
    onError: (err) => console.error("Delete item stock failed:", err),
  });
};