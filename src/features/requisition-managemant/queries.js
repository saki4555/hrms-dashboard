import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ─── Query Keys ────────────────────────────────────────────────────────────
const requisitionQueryKeys = {
  all:    ["requisitions"],
  lists:  () => [...requisitionQueryKeys.all, "lists"],
  detail: (id) => [...requisitionQueryKeys.all, "detail", id],
};

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/requisitions`;

// ─── Fetcher Functions ─────────────────────────────────────────────────────

const getRequisitions = async () => {
  const res = await fetch(API_BASE_URL);
  if (!res.ok) throw new Error(`Failed to fetch requisitions: ${res.status} ${res.statusText}`);
  const json = await res.json();
  return json.data || json;
};

const getRequisitionById = async (id) => {
  const res = await fetch(`${API_BASE_URL}/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch requisition: ${res.status} ${res.statusText}`);
  const json = await res.json();
  return json.data || json;
};

const createRequisition = async ({ master, items }) => {
  // Step 1: Save REQMASTER
  const masterRes = await fetch(API_BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(master),
  });
  if (!masterRes.ok) {
    const err = await masterRes.json().catch(() => ({}));
    throw new Error(err.message || `Failed to create requisition: ${masterRes.status}`);
  }
  const masterJson = await masterRes.json();
  const reqid = masterJson.data?.tid;

  // Step 2: Save REQDETAIL items
  if (items?.length && reqid) {
    const detailRes = await fetch(`${API_BASE_URL}/${reqid}/details`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    if (!detailRes.ok) {
      const err = await detailRes.json().catch(() => ({}));
      throw new Error(err.message || `Failed to save detail items: ${detailRes.status}`);
    }
  }

  return masterJson;
};

const updateRequisition = async ({ id, data }) => {
  const res = await fetch(`${API_BASE_URL}/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to update requisition: ${res.status}`);
  }
  return res.json();
};

const deleteRequisition = async (id) => {
  const res = await fetch(`${API_BASE_URL}/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to delete requisition: ${res.status}`);
  }
  return res.json();
};

const approveDetail = async (tid) => {
  const res = await fetch(`${API_BASE_URL}/detail/${tid}/approve`, { method: "PATCH" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to approve: ${res.status}`);
  }
  return res.json();
};

const dispatchDetail = async (tid) => {
  // STATUS 1 → 2 : Oracle trigger fires automatically, stock transfers
  const res = await fetch(`${API_BASE_URL}/detail/${tid}/dispatch`, { method: "PATCH" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to dispatch: ${res.status}`);
  }
  return res.json();
};

// ─── Query Defaults ────────────────────────────────────────────────────────
const queryDefaults = {
  retry: 2,
  retryDelay: (i) => Math.min(1000 * 2 ** i, 30000),
  staleTime: 30 * 1000,
  gcTime: 5 * 60 * 1000,
  refetchOnWindowFocus: false,
  throwOnError: false,
};

// ─── Hooks ─────────────────────────────────────────────────────────────────

export const useRequisitions = () =>
  useQuery({
    queryKey: requisitionQueryKeys.lists(),
    queryFn: getRequisitions,
    refetchOnMount: true,
    ...queryDefaults,
  });

export const useRequisitionById = (id) =>
  useQuery({
    queryKey: requisitionQueryKeys.detail(id),
    queryFn: () => getRequisitionById(id),
    enabled: !!id,
    ...queryDefaults,
  });

export const useCreateRequisition = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRequisition,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: requisitionQueryKeys.lists() }),
    onError: (error) => console.error("Create requisition failed:", error),
  });
};

export const useUpdateRequisition = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateRequisition,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: requisitionQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: requisitionQueryKeys.detail(variables.id) });
    },
    onError: (error) => console.error("Update requisition failed:", error),
  });
};

export const useDeleteRequisition = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteRequisition,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: requisitionQueryKeys.lists() }),
    onError: (error) => console.error("Delete requisition failed:", error),
  });
};

export const useApproveDetail = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: approveDetail,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: requisitionQueryKeys.lists() }),
    onError: (error) => console.error("Approve detail failed:", error),
  });
};

export const useDispatchDetail = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dispatchDetail,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: requisitionQueryKeys.lists() }),
    onError: (error) => console.error("Dispatch detail failed:", error),
  });
};