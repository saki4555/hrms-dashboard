// src\features\settings\work-structure\company\queries.js

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const companiesQueryKeys = {
  all: ['companies'],
  lists: () => [...companiesQueryKeys.all, 'lists'],
  detail: (id) => [...companiesQueryKeys.all, 'detail', id],
};

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/hr-company`;

const getCompanies = async () => {
  try {
    const res = await fetch(API_BASE_URL);

    if (!res.ok) {
      throw new Error(`Failed to fetch companies: ${res.status} ${res.statusText}`);
    }

    const jsonData = await res.json();
    return jsonData.data || jsonData;
  } catch (error) {
    console.error("Error fetching companies:", error);
    throw error;
  }
};

const getCompanyById = async (id) => {
  try {
    const res = await fetch(`${API_BASE_URL}/${id}`);

    if (!res.ok) {
      throw new Error(`Failed to fetch company: ${res.status} ${res.statusText}`);
    }

    const jsonData = await res.json();
    return jsonData.data || jsonData;
  } catch (error) {
    console.error("Error fetching company:", error);
    throw error;
  }
};

const deleteCompany = async (id) => {
  try {
    const res = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to delete company: ${res.status}`);
    }

    return res.json();
  } catch (error) {
    console.error("Error deleting company:", error);
    throw error;
  }
};

const updateCompany = async ({ id, data }) => {
  try {
    const res = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to update company: ${res.status}`);
    }

    return res.json();
  } catch (error) {
    console.error("Error updating company:", error);
    throw error;
  }
};

const createCompany = async (data) => {
  try {
    const res = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to create company: ${res.status}`);
    }

    return res.json();
  } catch (error) {
    console.error("Error creating company:", error);
    throw error;
  }
};

export const useCompanies = () => useQuery({
  queryKey: companiesQueryKeys.lists(),
  queryFn: getCompanies,
  retry: 2,
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  staleTime: 30 * 1000,
  gcTime: 5 * 60 * 1000,
  refetchOnWindowFocus: false,
  refetchOnMount: true,
  throwOnError: false,
});

export const useCompanyById = (id) => useQuery({
  queryKey: companiesQueryKeys.detail(id),
  queryFn: () => getCompanyById(id),
  enabled: !!id,
  retry: 2,
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  staleTime: 30 * 1000,
  gcTime: 5 * 60 * 1000,
  refetchOnWindowFocus: false,
  throwOnError: false,
});

export const useDeleteCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companiesQueryKeys.lists() });
    },
    onError: (error) => {
      console.error("Delete mutation failed:", error);
    },
  });
};

export const useUpdateCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateCompany,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: companiesQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: companiesQueryKeys.detail(variables.id) });
    },
    onError: (error) => {
      console.error("Update mutation failed:", error);
    },
  });
};

export const useCreateCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companiesQueryKeys.lists() });
    },
    onError: (error) => {
      console.error("Create mutation failed:", error);
    },
  });
};