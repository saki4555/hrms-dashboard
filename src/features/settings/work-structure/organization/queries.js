// src\features\settings\work-structure\organization\queries.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const organizationsQueryKeys = {
  all: ['organizations'],
  lists: () => [...organizationsQueryKeys.all, 'lists'],
  detail: (id) => [...organizationsQueryKeys.all, 'detail', id],
};

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/hr-org`;

const getOrganizations = async () => {
  try {
    const res = await fetch(API_BASE_URL);
    console.log("organizations data fetch response", res);

    if (!res.ok) {
      throw new Error(`Failed to fetch organizations: ${res.status} ${res.statusText}`);
    }

    const jsonData = await res.json();
    console.log("Parsed JSON:", jsonData);
    return jsonData.data || jsonData;
  } catch (error) {
    console.error("Error fetching organizations:", error);
    throw error;
  }
};

const getOrganizationById = async (id) => {
  try {
    const res = await fetch(`${API_BASE_URL}/${id}`);

    if (!res.ok) {
      throw new Error(`Failed to fetch organization: ${res.status} ${res.statusText}`);
    }

    const jsonData = await res.json();
    return jsonData.data || jsonData;
  } catch (error) {
    console.error("Error fetching organization:", error);
    throw error;
  }
};

const deleteOrganization = async (id) => {
  try {
    const res = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to delete organization: ${res.status}`);
    }

    return res.json();
  } catch (error) {
    console.error("Error deleting organization:", error);
    throw error;
  }
};

const updateOrganization = async ({ id, data }) => {
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
      throw new Error(errorData.message || `Failed to update organization: ${res.status}`);
    }

    return res.json();
  } catch (error) {
    console.error("Error updating organization:", error);
    throw error;
  }
};

const createOrganization = async (data) => {
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
      throw new Error(errorData.message || `Failed to create organization: ${res.status}`);
    }

    return res.json();
  } catch (error) {
    console.error("Error creating organization:", error);
    throw error;
  }
};

export const useOrganizations = () => useQuery({
  queryKey: organizationsQueryKeys.lists(),
  queryFn: getOrganizations,
  retry: 2,
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  staleTime: 30 * 1000,
  gcTime: 5 * 60 * 1000,
  refetchOnWindowFocus: false,
  refetchOnMount: true,
  throwOnError: false,
});

export const useOrganizationById = (id) => useQuery({
  queryKey: organizationsQueryKeys.detail(id),
  queryFn: () => getOrganizationById(id),
  enabled: !!id,
  retry: 2,
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  staleTime: 30 * 1000,
  gcTime: 5 * 60 * 1000,
  refetchOnWindowFocus: false,
  throwOnError: false,
});

export const useDeleteOrganization = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteOrganization,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationsQueryKeys.lists() });
    },
    onError: (error) => {
      console.error("Delete mutation failed:", error);
    },
  });
};

export const useUpdateOrganization = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateOrganization,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: organizationsQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: organizationsQueryKeys.detail(variables.id) });
    },
    onError: (error) => {
      console.error("Update mutation failed:", error);
    },
  });
};

export const useCreateOrganization = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createOrganization,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationsQueryKeys.lists() });
    },
    onError: (error) => {
      console.error("Create mutation failed:", error);
    },
  });
};