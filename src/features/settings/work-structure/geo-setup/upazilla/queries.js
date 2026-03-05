import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const upazillaQueryKeys = {
  all: ["upazillas"],
  lists: () => [...upazillaQueryKeys.all, "lists"],
  detail: (id) => [...upazillaQueryKeys.all, "detail", id],
};

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/upazilla`;

/**
 * =========================
 * GET ALL
 * =========================
 */
const getUpazillas = async () => {
  try {
    const res = await fetch(API_BASE_URL);

    if (!res.ok) {
      throw new Error(
        `Failed to fetch upazillas: ${res.status} ${res.statusText}`
      );
    }

    const jsonData = await res.json();
    return jsonData.data || jsonData;
  } catch (error) {
    console.error("Error fetching upazillas:", error);
    throw error;
  }
};

/**
 * =========================
 * GET BY ID
 * =========================
 */
const getUpazillaById = async (id) => {
  try {
    const res = await fetch(`${API_BASE_URL}/${id}`);

    if (!res.ok) {
      throw new Error(
        `Failed to fetch upazilla: ${res.status} ${res.statusText}`
      );
    }

    const jsonData = await res.json();
    return jsonData.data || jsonData;
  } catch (error) {
    console.error("Error fetching upazilla by ID:", error);
    throw error;
  }
};

/**
 * =========================
 * CREATE
 * =========================
 */
const createUpazilla = async (data) => {
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
        errorData.message || `Failed to create upazilla: ${res.status}`
      );
    }

    return res.json();
  } catch (error) {
    console.error("Error creating upazilla:", error);
    throw error;
  }
};

/**
 * =========================
 * UPDATE
 * =========================
 */
const updateUpazilla = async ({ id, data }) => {
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
        errorData.message || `Failed to update upazilla: ${res.status}`
      );
    }

    return res.json();
  } catch (error) {
    console.error("Error updating upazilla:", error);
    throw error;
  }
};

/**
 * =========================
 * DELETE
 * =========================
 */
const deleteUpazilla = async (id) => {
  try {
    const res = await fetch(`${API_BASE_URL}/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Failed to delete upazilla: ${res.status}`
      );
    }

    return res.json();
  } catch (error) {
    console.error("Error deleting upazilla:", error);
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
export const useUpazillas = () =>
  useQuery({
    queryKey: upazillaQueryKeys.lists(),
    queryFn: getUpazillas,
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
export const useUpazillaById = (id) =>
  useQuery({
    queryKey: upazillaQueryKeys.detail(id),
    queryFn: () => getUpazillaById(id),
    enabled: !!id,
    retry: 1,
  });

/**
 * CREATE
 */
export const useCreateUpazilla = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUpazilla,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: upazillaQueryKeys.lists(),
      });
    },
    onError: (error) => {
      console.error("Create upazilla failed:", error);
    },
  });
};

/**
 * UPDATE
 */
export const useUpdateUpazilla = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUpazilla,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: upazillaQueryKeys.lists(),
      });
    },
    onError: (error) => {
      console.error("Update upazilla failed:", error);
    },
  });
};

/**
 * DELETE
 */
export const useDeleteUpazilla = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteUpazilla,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: upazillaQueryKeys.lists(),
      });
    },
    onError: (error) => {
      console.error("Delete upazilla failed:", error);
    },
  });
};