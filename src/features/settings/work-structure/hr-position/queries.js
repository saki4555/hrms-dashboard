import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const positionsQueryKeys = {
  all: ['positions'],
  lists: () => [...positionsQueryKeys.all, 'lists'],
  detail: (id) => [...positionsQueryKeys.all, 'detail', id],
};

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/hr-position`;

const getPositions = async () => {
  try {
    const res = await fetch(API_BASE_URL);
    console.log("positions data fetch response", res);

    if (!res.ok) {
      throw new Error(`Failed to fetch positions: ${res.status} ${res.statusText}`);
    }

    const jsonData = await res.json();
    console.log("Parsed JSON:", jsonData);
    return jsonData.data || jsonData;
  } catch (error) {
    console.error("Error fetching positions:", error);
    throw error;
  }
};

const getPositionById = async (id) => {
  try {
    const res = await fetch(`${API_BASE_URL}/${id}`);

    if (!res.ok) {
      throw new Error(`Failed to fetch position: ${res.status} ${res.statusText}`);
    }

    const jsonData = await res.json();
    return jsonData.data || jsonData;
  } catch (error) {
    console.error("Error fetching position:", error);
    throw error;
  }
};

const deletePosition = async (id) => {
  try {
    const res = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to delete position: ${res.status}`);
    }

    return res.json();
  } catch (error) {
    console.error("Error deleting position:", error);
    throw error;
  }
};

const updatePosition = async ({ id, data }) => {
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
      throw new Error(errorData.message || `Failed to update position: ${res.status}`);
    }

    return res.json();
  } catch (error) {
    console.error("Error updating position:", error);
    throw error;
  }
};

const createPosition = async (data) => {
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
      throw new Error(errorData.message || `Failed to create position: ${res.status}`);
    }

    return res.json();
  } catch (error) {
    console.error("Error creating position:", error);
    throw error;
  }
};

export const usePositions = () => useQuery({
  queryKey: positionsQueryKeys.lists(),
  queryFn: getPositions,
  retry: 2,
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  staleTime: 30 * 1000,
  gcTime: 5 * 60 * 1000,
  refetchOnWindowFocus: false,
  refetchOnMount: true,
  throwOnError: false,
});

export const usePositionById = (id) => useQuery({
  queryKey: positionsQueryKeys.detail(id),
  queryFn: () => getPositionById(id),
  enabled: !!id,
  retry: 2,
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  staleTime: 30 * 1000,
  gcTime: 5 * 60 * 1000,
  refetchOnWindowFocus: false,
  throwOnError: false,
});

export const useDeletePosition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePosition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: positionsQueryKeys.lists() });
    },
    onError: (error) => {
      console.error("Delete mutation failed:", error);
    },
  });
};

export const useUpdatePosition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePosition,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: positionsQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: positionsQueryKeys.detail(variables.id) });
    },
    onError: (error) => {
      console.error("Update mutation failed:", error);
    },
  });
};

export const useCreatePosition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPosition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: positionsQueryKeys.lists() });
    },
    onError: (error) => {
      console.error("Create mutation failed:", error);
    },
  });
};