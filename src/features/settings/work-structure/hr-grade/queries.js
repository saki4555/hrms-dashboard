import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const gradesQueryKeys = {
  all: ['grades'],
  lists: () => [...gradesQueryKeys.all, 'lists'],
  detail: (id) => [...gradesQueryKeys.all, 'detail', id],
};

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/hr-grade`;

const getGrades = async () => {
  try {
    const res = await fetch(API_BASE_URL);

    if (!res.ok) {
      throw new Error(`Failed to fetch grades: ${res.status} ${res.statusText}`);
    }

    const jsonData = await res.json();
    return jsonData.data || jsonData;
  } catch (error) {
    console.error("Error fetching grades:", error);
    throw error;
  }
};

const getGradeById = async (id) => {
  try {
    const res = await fetch(`${API_BASE_URL}/${id}`);

    if (!res.ok) {
      throw new Error(`Failed to fetch grade: ${res.status} ${res.statusText}`);
    }

    const jsonData = await res.json();
    return jsonData.data || jsonData;
  } catch (error) {
    console.error("Error fetching grade:", error);
    throw error;
  }
};

const deleteGrade = async (id) => {
  try {
    const res = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to delete grade: ${res.status}`);
    }

    return res.json();
  } catch (error) {
    console.error("Error deleting grade:", error);
    throw error;
  }
};

const updateGrade = async ({ id, data }) => {
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
      throw new Error(errorData.message || `Failed to update grade: ${res.status}`);
    }

    return res.json();
  } catch (error) {
    console.error("Error updating grade:", error);
    throw error;
  }
};

const createGrade = async (data) => {
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
      throw new Error(errorData.message || `Failed to create grade: ${res.status}`);
    }

    return res.json();
  } catch (error) {
    console.error("Error creating grade:", error);
    throw error;
  }
};

export const useGrades = () => useQuery({
  queryKey: gradesQueryKeys.lists(),
  queryFn: getGrades,
  retry: 2,
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  staleTime: 30 * 1000,
  gcTime: 5 * 60 * 1000,
  refetchOnWindowFocus: false,
  refetchOnMount: true,
  throwOnError: false,
});

export const useGradeById = (id) => useQuery({
  queryKey: gradesQueryKeys.detail(id),
  queryFn: () => getGradeById(id),
  enabled: !!id,
  retry: 2,
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  staleTime: 30 * 1000,
  gcTime: 5 * 60 * 1000,
  refetchOnWindowFocus: false,
  throwOnError: false,
});

export const useDeleteGrade = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteGrade,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradesQueryKeys.lists() });
    },
    onError: (error) => {
      console.error("Delete mutation failed:", error);
    },
  });
};

export const useUpdateGrade = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateGrade,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: gradesQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: gradesQueryKeys.detail(variables.id) });
    },
    onError: (error) => {
      console.error("Update mutation failed:", error);
    },
  });
};

export const useCreateGrade = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createGrade,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradesQueryKeys.lists() });
    },
    onError: (error) => {
      console.error("Create mutation failed:", error);
    },
  });
};