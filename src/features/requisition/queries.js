import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const BASE = import.meta.env.VITE_API_BASE_URL;

// ── Query Keys ────────────────────────────────────────────────────────────────
export const requisitionKeys = {
  all:        ["requisitions"],
  lists:      () => [...requisitionKeys.all, "list"],
  detail:     (tid) => [...requisitionKeys.all, "detail", tid],
  details:    ["reqdetails"],
  detailList: (tid) => ["reqdetails", "list", tid],
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

// ── REQMASTER Hooks ───────────────────────────────────────────────────────────

export const useRequisitions = () =>
  useQuery({
    queryKey: requisitionKeys.lists(),
    queryFn: () => fetchJSON(`${BASE}/api/reqmaster`),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    retry: 2,
    retryDelay: (i) => Math.min(1000 * 2 ** i, 30000),
    throwOnError: false,
  });

export const useRequisitionById = (tid) =>
  useQuery({
    queryKey: requisitionKeys.detail(tid),
    queryFn: () => fetchJSON(`${BASE}/api/reqmaster/${tid}`),
    enabled: !!tid,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
    throwOnError: false,
  });

export const useCreateRequisition = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      fetchJSON(`${BASE}/api/reqmaster`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: requisitionKeys.lists() }),
    onError: (err) => console.error("Create requisition failed:", err),
  });
};

export const useUpdateRequisition = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tid, data }) =>
      fetchJSON(`${BASE}/api/reqmaster/${tid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { tid }) => {
      qc.invalidateQueries({ queryKey: requisitionKeys.lists() });
      qc.invalidateQueries({ queryKey: requisitionKeys.detail(tid) });
    },
    onError: (err) => console.error("Update requisition failed:", err),
  });
};

export const useDeleteRequisition = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tid) =>
      fetchJSON(`${BASE}/api/reqmaster/${tid}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: requisitionKeys.lists() }),
    onError: (err) => console.error("Delete requisition failed:", err),
  });
};

// ── REQDETAIL Hooks ───────────────────────────────────────────────────────────

export const useReqDetails = (tid) =>
  useQuery({
    queryKey: requisitionKeys.detailList(tid),
    queryFn: () => fetchJSON(`${BASE}/api/reqdetail?tid=${tid}`),
    enabled: !!tid,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
    throwOnError: false,
  });

export const useCreateReqDetailBulk = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tid, items }) =>
      fetchJSON(`${BASE}/api/reqdetail/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tid, items }),
      }),
    onSuccess: (_, { tid }) => {
      qc.invalidateQueries({ queryKey: requisitionKeys.detailList(tid) });
    },
    onError: (err) => console.error("Bulk create detail failed:", err),
  });
};

export const useUpdateReqDetail = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tid, data }) =>
      fetchJSON(`${BASE}/api/reqdetail/${tid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reqdetails"] });
    },
    onError: (err) => console.error("Update detail failed:", err),
  });
};

// ── Shared Data Hooks (Stores, Items) ─────────────────────────────────────────

export const useStores = () =>
  useQuery({
    queryKey: ["stores"],
    queryFn: () => fetchJSON(`${BASE}/api/stores`),
    staleTime: 5 * 60 * 1000,
  });

export const useItemSearch = (query) =>
  useQuery({
    queryKey: ["items", "search", query],
    queryFn: () =>
      fetchJSON(`${BASE}/api/item?q=${encodeURIComponent(query)}&limit=20`),
    enabled: typeof query === "string" && query.trim().length >= 2,
    staleTime: 60 * 1000,
  });
