import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const regionQueryKeys = {
  all: ["regions"],
  lists: () => [...regionQueryKeys.all, "lists"],
  detail: (id) => [...regionQueryKeys.all, "detail", id],
};

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/region`;

/**
 * =========================
 * GET ALL
 * =========================
 */
const getRegions = async () => {
  try {
    const res = await fetch(API_BASE_URL);

    if (!res.ok) {
      throw new Error(
        `Failed to fetch regions: ${res.status} ${res.statusText}`
      );
    }

    const jsonData = await res.json();
    return jsonData.data || jsonData;
  } catch (error) {
    console.error("Error fetching regions:", error);
    throw error;
  }
};

/**
 * =========================
 * GET BY ID
 * =========================
 */
const getRegionById = async (id) => {
  try {
    const res = await fetch(`${API_BASE_URL}/${id}`);

    if (!res.ok) {
      throw new Error(
        `Failed to fetch region: ${res.status} ${res.statusText}`
      );
    }

    const jsonData = await res.json();
    return jsonData.data || jsonData;
  } catch (error) {
    console.error("Error fetching region by ID:", error);
    throw error;
  }
};

/**
 * =========================
 * CREATE
 * =========================
 */
const createRegion = async (data) => {
  try {
    const res = await fetch(API_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Failed to create region: ${res.status}`
      );
    }

    return res.json();
  } catch (error) {
    console.error("Error creating region:", error);
    throw error;
  }
};

/**
 * =========================
 * UPDATE
 * =========================
 */
const updateRegion = async ({ id, data }) => {
  try {
    const res = await fetch(`${API_BASE_URL}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Failed to update region: ${res.status}`
      );
    }

    return res.json();
  } catch (error) {
    console.error("Error updating region:", error);
    throw error;
  }
};

/**
 * =========================
 * DELETE
 * =========================
 */
const deleteRegion = async (id) => {
  try {
    const res = await fetch(`${API_BASE_URL}/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Failed to delete region: ${res.status}`
      );
    }

    return res.json();
  } catch (error) {
    console.error("Error deleting region:", error);
    throw error;
  }
};

/**
 * =========================
 * HOOKS
 * =========================
 */

/**
 * GET ALL
 */
export const useRegions = () =>
  useQuery({
    queryKey: regionQueryKeys.lists(),
    queryFn: getRegions,
    retry: 2,
    retryDelay: (attemptIndex) =>
      Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    throwOnError: false,
  });

/**
 * GET BY ID
 */
export const useRegionById = (id) =>
  useQuery({
    queryKey: regionQueryKeys.detail(id),
    queryFn: () => getRegionById(id),
    enabled: !!id,
    retry: 1,
  });

/**
 * CREATE
 */
export const useCreateRegion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createRegion,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: regionQueryKeys.lists(),
      });
    },
    onError: (error) => {
      console.error("Create region failed:", error);
    },
  });
};

/**
 * UPDATE
 */
export const useUpdateRegion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateRegion,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: regionQueryKeys.lists(),
      });
    },
    onError: (error) => {
      console.error("Update region failed:", error);
    },
  });
};

/**
 * DELETE
 */
export const useDeleteRegion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteRegion,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: regionQueryKeys.lists(),
      });
    },
    onError: (error) => {
      console.error("Delete region failed:", error);
    },
  });
};