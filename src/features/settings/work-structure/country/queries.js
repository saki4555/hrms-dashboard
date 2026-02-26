import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const countryQueryKeys = {
  all: ["countries"],
  lists: () => [...countryQueryKeys.all, "lists"],
  detail: (id) => [...countryQueryKeys.all, "detail", id],
};

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/country`;

/**
 * =========================
 * GET ALL
 * =========================
 */
const getCountries = async () => {
  try {
    const res = await fetch(API_BASE_URL);

    if (!res.ok) {
      throw new Error(
        `Failed to fetch countries: ${res.status} ${res.statusText}`
      );
    }

    const jsonData = await res.json();
    return jsonData.data || jsonData;
  } catch (error) {
    console.error("Error fetching countries:", error);
    throw error;
  }
};

/**
 * =========================
 * GET BY ID
 * =========================
 */
const getCountryById = async (id) => {
  try {
    const res = await fetch(`${API_BASE_URL}/${id}`);

    if (!res.ok) {
      throw new Error(
        `Failed to fetch country: ${res.status} ${res.statusText}`
      );
    }

    const jsonData = await res.json();
    return jsonData.data || jsonData;
  } catch (error) {
    console.error("Error fetching country by ID:", error);
    throw error;
  }
};

/**
 * =========================
 * CREATE
 * =========================
 */
const createCountry = async (data) => {
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
        errorData.message || `Failed to create country: ${res.status}`
      );
    }

    return res.json();
  } catch (error) {
    console.error("Error creating country:", error);
    throw error;
  }
};

/**
 * =========================
 * UPDATE
 * =========================
 */
const updateCountry = async ({ id, data }) => {
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
        errorData.message || `Failed to update country: ${res.status}`
      );
    }

    return res.json();
  } catch (error) {
    console.error("Error updating country:", error);
    throw error;
  }
};

/**
 * =========================
 * DELETE
 * =========================
 */
const deleteCountry = async (id) => {
  try {
    const res = await fetch(`${API_BASE_URL}/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Failed to delete country: ${res.status}`
      );
    }

    return res.json();
  } catch (error) {
    console.error("Error deleting country:", error);
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
export const useCountries = () =>
  useQuery({
    queryKey: countryQueryKeys.lists(),
    queryFn: getCountries,
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
export const useCountryById = (id) =>
  useQuery({
    queryKey: countryQueryKeys.detail(id),
    queryFn: () => getCountryById(id),
    enabled: !!id,
    retry: 1,
  });

/**
 * CREATE
 */
export const useCreateCountry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCountry,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: countryQueryKeys.lists(),
      });
    },
    onError: (error) => {
      console.error("Create country failed:", error);
    },
  });
};

/**
 * UPDATE
 */
export const useUpdateCountry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateCountry,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: countryQueryKeys.lists(),
      });
    },
    onError: (error) => {
      console.error("Update country failed:", error);
    },
  });
};

/**
 * DELETE
 */
export const useDeleteCountry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCountry,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: countryQueryKeys.lists(),
      });
    },
    onError: (error) => {
      console.error("Delete country failed:", error);
    },
  });
};