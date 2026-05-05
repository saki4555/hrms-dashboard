// src\features\core-hr\employee-management\queries.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/hr-employee`;

// ── Fetchers ─────────────────────────────────────────────────────────────────

const getEmployees = async (params) => {
  // Strip out empty string / null / undefined so URL stays clean
  const cleaned = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== "" && v != null)
  );
  const qs = new URLSearchParams(cleaned).toString();
  const res = await fetch(`${API_BASE_URL}?${qs}`);
  if (!res.ok) throw new Error(`Failed to fetch employees: ${res.status}`);
  return res.json();
  // returns: { total, page, limit, totalPages, data: [...] }
};

const getEmployeeById = async (personId) => {
  const res = await fetch(`${API_BASE_URL}/${personId}`);
  if (!res.ok) throw new Error(`Failed to fetch employee: ${res.status}`);
  return res.json();
};

const deleteEmployee = async (personId) => {
  const res = await fetch(`${API_BASE_URL}/${personId}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Delete failed: ${res.status}`);
  }
  return res.json();
};

const updateEmployee = async ({ personId, data }) => {
  const res = await fetch(`${API_BASE_URL}/${personId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Update failed: ${res.status}`);
  }
  return res.json();
};

const createEmployee = async (data) => {
  const res = await fetch(API_BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Create failed: ${res.status}`);
  }
  return res.json();
};



// ── Query Keys ───────────────────────────────────────────────────────────────

export const employeeKeys = {
  all:    ["employees"],
  lists:  (params) => ["employees", "list", params],
  detail: (id)     => ["employees", "detail", id],
};

// ── Hooks ────────────────────────────────────────────────────────────────────

// Main list — params object comes from nuqs URL state
export const useEmployees = (params) =>
  useQuery({
    queryKey: employeeKeys.lists(params),
    queryFn:  () => getEmployees(params),
    placeholderData: (prev) => prev, // keeps old rows visible while loading next page
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });

export const useEmployeeById = (personId) =>
  useQuery({
    queryKey: employeeKeys.detail(personId),
    queryFn:  () => getEmployeeById(personId),
    enabled:  !!personId,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });




// ── Mutations ────────────────────────────────────────────────────────────────

export const useDeleteEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteEmployee,
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: employeeKeys.all }),
  });
};

export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateEmployee,
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: employeeKeys.all }),
  });
};

export const useCreateEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createEmployee,
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: employeeKeys.all }),
  });
};