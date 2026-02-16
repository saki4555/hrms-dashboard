import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const personTypesQueryKeys = {
  all: ['personTypes'],
  lists: () => [...personTypesQueryKeys.all, 'lists'],
  detail: (id) => [...personTypesQueryKeys.all, 'detail', id],
};

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/hr-person-type`;

const getPersonTypes = async () => {
  try {
    const res = await fetch(API_BASE_URL);
    console.log("person types data fetch response", res);
    
    if (!res.ok) {
      throw new Error(`Failed to fetch person types: ${res.status} ${res.statusText}`);
    }
    
    const jsonData = await res.json();
    console.log("Parsed JSON:", jsonData);
    return jsonData.data || jsonData;
  } catch (error) {
    console.error("Error fetching person types:", error);
    throw error;
  }
};

const getPersonTypeById = async (id) => {
  try {
    const res = await fetch(`${API_BASE_URL}/${id}`);
    
    if (!res.ok) {
      throw new Error(`Failed to fetch person type: ${res.status} ${res.statusText}`);
    }
    
    const jsonData = await res.json();
    return jsonData.data || jsonData;
  } catch (error) {
    console.error("Error fetching person type:", error);
    throw error;
  }
};

const deletePersonType = async (id) => {
  try {
    const res = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to delete person type: ${res.status}`);
    }
    
    return res.json();
  } catch (error) {
    console.error("Error deleting person type:", error);
    throw error;
  }
};

const updatePersonType = async ({ id, data }) => {
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
      throw new Error(errorData.message || `Failed to update person type: ${res.status}`);
    }
    
    return res.json();
  } catch (error) {
    console.error("Error updating person type:", error);
    throw error;
  }
};

const createPersonType = async (data) => {
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
      throw new Error(errorData.message || `Failed to create person type: ${res.status}`);
    }
    
    return res.json();
  } catch (error) {
    console.error("Error creating person type:", error);
    throw error;
  }
};

export const usePersonTypes = () => useQuery({
  queryKey: personTypesQueryKeys.lists(),
  queryFn: getPersonTypes,
  retry: 2,
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  staleTime: 30 * 1000,
  gcTime: 5 * 60 * 1000,
  refetchOnWindowFocus: false,
  refetchOnMount: true,
  throwOnError: false,
});

export const usePersonTypeById = (id) => useQuery({
  queryKey: personTypesQueryKeys.detail(id),
  queryFn: () => getPersonTypeById(id),
  enabled: !!id, // Only fetch if id exists
  retry: 2,
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  staleTime: 30 * 1000,
  gcTime: 5 * 60 * 1000,
  refetchOnWindowFocus: false,
  throwOnError: false,
});

export const useDeletePersonType = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deletePersonType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: personTypesQueryKeys.lists() });
    },
    onError: (error) => {
      console.error("Delete mutation failed:", error);
    },
  });
};

export const useUpdatePersonType = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updatePersonType,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: personTypesQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: personTypesQueryKeys.detail(variables.id) });
    },
    onError: (error) => {
      console.error("Update mutation failed:", error);
    },
  });
};

export const useCreatePersonType = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createPersonType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: personTypesQueryKeys.lists() });
    },
    onError: (error) => {
      console.error("Create mutation failed:", error);
    },
  });
};