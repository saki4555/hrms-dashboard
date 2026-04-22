import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const BASE = `${import.meta.env.VITE_API_BASE_URL}/api/supervisors`;

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

// ── Queries ───────────────────────────────────────────────────────────────────

export const useSupervisorAssignments = (params = {}) => {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== "" && v != null) sp.set(k, v); });

  return useQuery({
    queryKey: ["supervisorAssignments", params],
    queryFn:  () => fetcher(`${BASE}?${sp.toString()}`),
    refetchOnMount: true,
    throwOnError: false,
    ...queryDefaults,
  });
};

export const useSupervisorByEmployee = (personId) =>
  useQuery({
    queryKey: ["supervisors", "employee", personId],
    queryFn: async () => {
      const json = await fetcher(`${BASE}/employee/${personId}`);
      return json.data;
    },
    enabled: !!personId,
    ...queryDefaults,
  });

export const useTeamBySupervisor = (supervisorId) =>
  useQuery({
    queryKey: ["supervisors", "team", supervisorId],
    queryFn: async () => {
      const json = await fetcher(`${BASE}/supervisor/${supervisorId}/team`);
      return json.data;
    },
    enabled: !!supervisorId,
    ...queryDefaults,
  });

// ── Mutations ─────────────────────────────────────────────────────────────────

const invalidateAll = (qc) => {
  qc.invalidateQueries({ queryKey: ["supervisorAssignments"] });
  qc.invalidateQueries({ queryKey: ["supervisors"] });
};

export const useAssignSupervisor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => fetcher(BASE, { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => invalidateAll(qc),
  });
};

export const useUpdateSupervisor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) =>
      fetcher(`${BASE}/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => invalidateAll(qc),
  });
};

export const useRemoveSupervisor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => fetcher(`${BASE}/${id}`, { method: "DELETE" }),
    onSuccess: () => invalidateAll(qc),
  });
};