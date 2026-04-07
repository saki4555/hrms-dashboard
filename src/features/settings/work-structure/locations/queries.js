//src\features\settings\work-structure\locations\queries.js

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const hrLocationQueryKeys = {
  all: ["hr-locations"],
  lists: () => [...hrLocationQueryKeys.all, "lists"],
  detail: (id) => [...hrLocationQueryKeys.all, "detail", id],
};

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/hr-location`;

/**
 * =========================
 * GET ALL
 * =========================
 */
const getHrLocations = async () => {
  try {
    const res = await fetch(API_BASE_URL);

    if (!res.ok) {
      throw new Error(
        `Failed to fetch HR locations: ${res.status} ${res.statusText}`
      );
    }

    const jsonData = await res.json();
    return jsonData.data || jsonData;
  } catch (error) {
    console.error("Error fetching HR locations:", error);
    throw error;
  }
};

/**
 * =========================
 * GET BY ID
 * =========================
 */
const getHrLocationById = async (id) => {
  try {
    const res = await fetch(`${API_BASE_URL}/${id}`);

    if (!res.ok) {
      throw new Error(
        `Failed to fetch HR location: ${res.status} ${res.statusText}`
      );
    }

    const jsonData = await res.json();
    return jsonData.data || jsonData;
  } catch (error) {
    console.error("Error fetching HR location by ID:", error);
    throw error;
  }
};

/**
 * =========================
 * CREATE
 * =========================
 */
const createHrLocation = async (data) => {
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
        errorData.message || `Failed to create HR location: ${res.status}`
      );
    }

    return res.json();
  } catch (error) {
    console.error("Error creating HR location:", error);
    throw error;
  }
};

/**
 * =========================
 * UPDATE
 * =========================
 */
const updateHrLocation = async ({ id, data }) => {
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
        errorData.message || `Failed to update HR location: ${res.status}`
      );
    }

    return res.json();
  } catch (error) {
    console.error("Error updating HR location:", error);
    throw error;
  }
};

/**
 * =========================
 * DELETE
 * =========================
 */
const deleteHrLocation = async (id) => {
  try {
    const res = await fetch(`${API_BASE_URL}/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Failed to delete HR location: ${res.status}`
      );
    }

    return res.json();
  } catch (error) {
    console.error("Error deleting HR location:", error);
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
export const useHrLocations = () =>
  useQuery({
    queryKey: hrLocationQueryKeys.lists(),
    queryFn: getHrLocations,
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
export const useHrLocationById = (id) =>
  useQuery({
    queryKey: hrLocationQueryKeys.detail(id),
    queryFn: () => getHrLocationById(id),
    enabled: !!id, // prevents request if id is undefined/null
    retry: 1,
  });

/**
 * CREATE
 */
export const useCreateHrLocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createHrLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: hrLocationQueryKeys.lists(),
      });
    },
    onError: (error) => {
      console.error("Create HR location failed:", error);
    },
  });
};

/**
 * UPDATE
 */
export const useUpdateHrLocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateHrLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: hrLocationQueryKeys.lists(),
      });
    },
    onError: (error) => {
      console.error("Update HR location failed:", error);
    },
  });
};

/**
 * DELETE
 */
export const useDeleteHrLocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteHrLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: hrLocationQueryKeys.lists(),
      });
    },
    onError: (error) => {
      console.error("Delete HR location failed:", error);
    },
  });
};
