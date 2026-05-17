// src/features/payroll/pay-structure/queries.js
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const BASE = `${import.meta.env.VITE_API_BASE_URL}/api/pay-structure`;

const queryDefaults = {
  retry: 2,
  retryDelay: (i) => Math.min(1000 * 2 ** i, 30000),
  staleTime: 30 * 1000,
  gcTime: 5 * 60 * 1000,
  refetchOnWindowFocus: false,
};

const fetcher = async (url, options = {}) => {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || `Request failed: ${res.status}`);
  }
  return res.json();
};

// ── Pay Components ────────────────────────────────────────────────────────────
export const usePayComponents = () =>
  useQuery({
    queryKey: ["pay-components"],
    queryFn:  () => fetcher(`${BASE}/components`),
    ...queryDefaults,
  });

export const useCreatePayComponent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => fetcher(`${BASE}/components`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["pay-components"] }),
  });
};

export const useUpdatePayComponent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }) => fetcher(`${BASE}/components/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["pay-components"] }),
  });
};

export const useDeletePayComponent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => fetcher(`${BASE}/components/${id}`, { method: "DELETE" }),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["pay-components"] }),
  });
};

// ── Pay Structures ────────────────────────────────────────────────────────────
export const usePayStructures = () =>
  useQuery({
    queryKey: ["pay-structures"],
    queryFn:  () => fetcher(`${BASE}`),
    ...queryDefaults,
  });

export const usePayStructureDetail = (id) =>
  useQuery({
    queryKey: ["pay-structures", id],
    queryFn:  () => fetcher(`${BASE}/${id}`),
    enabled:  !!id,
    ...queryDefaults,
  });

export const useCreatePayStructure = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => fetcher(`${BASE}`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["pay-structures"] }),
  });
};

export const useUpdatePayStructure = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }) => fetcher(`${BASE}/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["pay-structures"] }),
  });
};

export const useDeletePayStructure = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => fetcher(`${BASE}/${id}`, { method: "DELETE" }),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["pay-structures"] }),
  });
};

// ── Structure Components ──────────────────────────────────────────────────────
export const useAddComponentToStructure = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ structureId, ...body }) =>
      fetcher(`${BASE}/${structureId}/components`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: (_, { structureId }) => {
      qc.invalidateQueries({ queryKey: ["pay-structures", String(structureId)] });
      qc.invalidateQueries({ queryKey: ["pay-structures"] });
    },
  });
};

export const useUpdateComponentInStructure = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ structureId, componentId, ...body }) =>
      fetcher(`${BASE}/${structureId}/components/${componentId}`, { method: "PUT", body: JSON.stringify(body) }),
    onSuccess: (_, { structureId }) =>
      qc.invalidateQueries({ queryKey: ["pay-structures", String(structureId)] }),
  });
};

export const useRemoveComponentFromStructure = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ structureId, componentId }) =>
      fetcher(`${BASE}/${structureId}/components/${componentId}`, { method: "DELETE" }),
    onSuccess: (_, { structureId }) => {
      qc.invalidateQueries({ queryKey: ["pay-structures", String(structureId)] });
      qc.invalidateQueries({ queryKey: ["pay-structures"] });
    },
  });
};