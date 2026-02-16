import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const orgTypeQueryKeys = {
  all: ['org-types'],
  lists: () => [...orgTypeQueryKeys.all, 'lists'],
  detail: (id) => [...orgTypeQueryKeys.all, 'detail', id],
};

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/hr-org-type`;

const getOrgTypes = async () => {
  try {
    const res = await fetch(API_BASE_URL);
    console.log("org types data fetch response", res);

    if (!res.ok) {
      throw new Error(`Failed to fetch org types: ${res.status} ${res.statusText}`);
    }

    const jsonData = await res.json();
    console.log("Parsed JSON:", jsonData);

    // Add 3-second delay to simulate network latency
    await new Promise((resolve) => setTimeout(resolve, 4000));

    return jsonData.data || jsonData;
  } catch (error) {
    console.error("Error fetching org types:", error);
    throw error;
  }
};

const getOrgTypeById = async (id) => {
  try {
    const res = await fetch(`${API_BASE_URL}/${id}`);

    if (!res.ok) {
      throw new Error(
        `Failed to fetch org type: ${res.status} ${res.statusText}`
      );
    }

    const jsonData = await res.json();
    return jsonData.data || jsonData;
  } catch (error) {
    console.error("Error fetching org type by ID:", error);
    throw error;
  }
};

const deleteOrgType = async (id) => {
  try {
    const res = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to delete org type: ${res.status}`);
    }

    return res.json();
  } catch (error) {
    console.error("Error deleting org type:", error);
    throw error;
  }
};

const updateOrgType = async ({ id, data }) => {
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
      throw new Error(errorData.message || `Failed to update org type: ${res.status}`);
    }

    return res.json();
  } catch (error) {
    console.error("Error updating org type:", error);
    throw error;
  }
};

const createOrgType = async (data) => {
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
      throw new Error(errorData.message || `Failed to create org type: ${res.status}`);
    }

    return res.json();
  } catch (error) {
    console.error("Error creating org type:", error);
    throw error;
  }
};

export const useOrgTypes = () =>
  useQuery({
    queryKey: orgTypeQueryKeys.lists(),
    queryFn: getOrgTypes,
    retry: 2,
    retryDelay: (attemptIndex) =>
      Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    throwOnError: false,
  });

  export const useOrgTypeById = (id) =>
  useQuery({
    queryKey: orgTypeQueryKeys.detail(id),
    queryFn: () => getOrgTypeById(id),
    enabled: !!id, // prevents request if id is undefined/null
    retry: 1,
  });


export const useDeleteOrgType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteOrgType,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: orgTypeQueryKeys.lists(),
      });
    },
    onError: (error) => {
      console.error("Delete mutation failed:", error);
    },
  });
};

export const useUpdateOrgType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateOrgType,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: orgTypeQueryKeys.lists(),
      });
    },
    onError: (error) => {
      console.error("Update mutation failed:", error);
    },
  });
};

export const useCreateOrgType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createOrgType,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: orgTypeQueryKeys.lists(),
      });
    },
    onError: (error) => {
      console.error("Create mutation failed:", error);
    },
  });
};
