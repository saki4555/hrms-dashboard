import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API_BASE = `${import.meta.env.VITE_API_BASE_URL}/api/requisitions`;
const STORE_API = `${import.meta.env.VITE_API_BASE_URL}/api/stores`;
const ITEM_STOCK_API = `${import.meta.env.VITE_API_BASE_URL}/api/item-stock`;

const reqQueryKeys = {
  all: ["requisitions"],
  lists: () => [...reqQueryKeys.all, "list"],
  detail: (id) => [...reqQueryKeys.all, "detail", id],
  stores: ["stores"],
  itemsByStore: (storeId) => ["item-stock", "by-store", storeId],
};

const queryDefaults = {
  retry: 2,
  retryDelay: (i) => Math.min(1000 * 2 ** i, 30000),
  staleTime: 0,
  gcTime: 0,
  refetchOnWindowFocus: false,
  throwOnError: false,
};

/* ─── API Functions ──────────────────────────────────────────────────────── */

const getRequisitions = async () => {
  const res = await fetch(API_BASE);
  if (!res.ok) throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
  const json = await res.json();
  return json.data || json;
};

const getRequisitionById = async (tid) => {
  const res = await fetch(`${API_BASE}/${tid}`);
  if (!res.ok) throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
  const json = await res.json();
  return json.data || json;
};

const createRequisition = async (data) => {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to create: ${res.status}`);
  }
  return res.json();
};

const updateRequisition = async ({ tid, data }) => {
  const res = await fetch(`${API_BASE}/${tid}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to update: ${res.status}`);
  }
  return res.json();
};

const approveDetailItem = async ({ masterTid, detailTid }) => {
  const res = await fetch(`${API_BASE}/${masterTid}/details/${detailTid}/approve`, {
    method: "PATCH",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to approve: ${res.status}`);
  }
  return res.json();
};

const approveAllItems = async (masterTid) => {
  const res = await fetch(`${API_BASE}/${masterTid}/approve-all`, {
    method: "PATCH",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to approve all: ${res.status}`);
  }
  return res.json();
};

const getStores = async () => {
  const res = await fetch(STORE_API);
  if (!res.ok) throw new Error(`Failed to fetch stores: ${res.status}`);
  const json = await res.json();
  return json.data || json;
};

// Fetch items available in ITEM_STOCK for a given store
const getItemsByStore = async (storeId) => {
  const res = await fetch(`${ITEM_STOCK_API}?storeId=${storeId}`);
  if (!res.ok) throw new Error(`Failed to fetch items: ${res.status}`);
  const json = await res.json();
  return json.data || json;
};

/* ─── Hooks ──────────────────────────────────────────────────────────────── */

export const useRequisitions = () =>
  useQuery({
    queryKey: reqQueryKeys.lists(),
    queryFn: getRequisitions,
    refetchOnMount: true,
    ...queryDefaults,
  });

export const useRequisitionById = (tid) =>
  useQuery({
    queryKey: reqQueryKeys.detail(tid),
    queryFn: () => getRequisitionById(tid),
    enabled: !!tid,
    ...queryDefaults,
  });

export const useStores = () =>
  useQuery({
    queryKey: reqQueryKeys.stores,
    queryFn: getStores,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

// Fetches ITEM_STOCK rows for a store → returns ITEM_ID, ITEM_NAME, STOCK_QTY, UNIT_ID/UOM
export const useItemsByStore = (storeId) =>
  useQuery({
    queryKey: reqQueryKeys.itemsByStore(storeId),
    queryFn: () => getItemsByStore(storeId),
    enabled: !!storeId,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });

export const useCreateRequisition = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRequisition,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: reqQueryKeys.lists() }),
    onError: (err) => console.error("Create failed:", err),
  });
};

export const useUpdateRequisition = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateRequisition,
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: reqQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: reqQueryKeys.detail(vars.tid) });
    },
    onError: (err) => console.error("Update failed:", err),
  });
};

export const useApproveDetail = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: approveDetailItem,
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: reqQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: reqQueryKeys.detail(vars.masterTid) });
    },
  });
};

export const useApproveAll = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: approveAllItems,
    onSuccess: (_, masterTid) => {
      queryClient.invalidateQueries({ queryKey: reqQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: reqQueryKeys.detail(masterTid) });
    },
  });
};