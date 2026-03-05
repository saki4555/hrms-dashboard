import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const districtQueryKeys = {
  all: ["districts"],
  lists: () => [...districtQueryKeys.all, "lists"],
  detail: (id) => [...districtQueryKeys.all, "detail", id],
};

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/district`;

/**
 * =========================
 * GET ALL
 * =========================
 */
const getDistricts = async () => {
  try {
    const res = await fetch(API_BASE_URL);

    if (!res.ok) {
      throw new Error(
        `Failed to fetch districts: ${res.status} ${res.statusText}`
      );
    }

    const jsonData = await res.json();
    return jsonData.data || jsonData;
  } catch (error) {
    console.error("Error fetching districts:", error);
    throw error;
  }
};

/**
 * =========================
 * GET BY ID
 * =========================
 */
const getDistrictById = async (id) => {
  try {
    const res = await fetch(`${API_BASE_URL}/${id}`);

    if (!res.ok) {
      throw new Error(
        `Failed to fetch district: ${res.status} ${res.statusText}`
      );
    }

    const jsonData = await res.json();
    return jsonData.data || jsonData;
  } catch (error) {
    console.error("Error fetching district by ID:", error);
    throw error;
  }
};

/**
 * =========================
 * CREATE
 * =========================
 */
const createDistrict = async (data) => {
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
        errorData.message || `Failed to create district: ${res.status}`
      );
    }

    return res.json();
  } catch (error) {
    console.error("Error creating district:", error);
    throw error;
  }
};

/**
 * =========================
 * UPDATE
 * =========================
 */
const updateDistrict = async ({ id, data }) => {
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
        errorData.message || `Failed to update district: ${res.status}`
      );
    }

    return res.json();
  } catch (error) {
    console.error("Error updating district:", error);
    throw error;
  }
};

/**
 * =========================
 * DELETE
 * =========================
 */
const deleteDistrict = async (id) => {
  try {
    const res = await fetch(`${API_BASE_URL}/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Failed to delete district: ${res.status}`
      );
    }

    return res.json();
  } catch (error) {
    console.error("Error deleting district:", error);
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
export const useDistricts = () =>
  useQuery({
    queryKey: districtQueryKeys.lists(),
    queryFn: getDistricts,
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
export const useDistrictById = (id) =>
  useQuery({
    queryKey: districtQueryKeys.detail(id),
    queryFn: () => getDistrictById(id),
    enabled: !!id,
    retry: 1,
  });

/**
 * CREATE
 */
export const useCreateDistrict = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDistrict,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: districtQueryKeys.lists(),
      });
    },
    onError: (error) => {
      console.error("Create district failed:", error);
    },
  });
};

/**
 * UPDATE
 */
export const useUpdateDistrict = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateDistrict,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: districtQueryKeys.lists(),
      });
    },
    onError: (error) => {
      console.error("Update district failed:", error);
    },
  });
};

/**
 * DELETE
 */
export const useDeleteDistrict = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDistrict,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: districtQueryKeys.lists(),
      });
    },
    onError: (error) => {
      console.error("Delete district failed:", error);
    },
  });
};