import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const employeesQueryKeys = {
  all: ['employees'],
  lists: () => [...employeesQueryKeys.all, 'lists'],
  detail: (id) => [...employeesQueryKeys.all, 'detail', id],
};

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/hr-employee`;

const getEmployees = async () => {
  try {
    const res = await fetch(API_BASE_URL);
    console.log("employees data fetch response", res);
    
    if (!res.ok) {
      throw new Error(`Failed to fetch employees: ${res.status} ${res.statusText}`);
    }
    
    const jsonData = await res.json();
    console.log("Parsed JSON:", jsonData);
    return jsonData.data || jsonData;
  } catch (error) {
    console.error("Error fetching employees:", error);
    throw error;
  }
};

const getEmployeeById = async (personId) => {
  try {
    const res = await fetch(`${API_BASE_URL}/${personId}`);
    
    if (!res.ok) {
      throw new Error(`Failed to fetch employee: ${res.status} ${res.statusText}`);
    }
    
    const jsonData = await res.json();
    return jsonData.data || jsonData;
  } catch (error) {
    console.error("Error fetching employee:", error);
    throw error;
  }
};

const deleteEmployee = async (personId) => {
  try {
    const res = await fetch(`${API_BASE_URL}/${personId}`, {
      method: 'DELETE',
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to delete employee: ${res.status}`);
    }
    
    return res.json();
  } catch (error) {
    console.error("Error deleting employee:", error);
    throw error;
  }
};

const updateEmployee = async ({ personId, data }) => {
  try {
    const res = await fetch(`${API_BASE_URL}/${personId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to update employee: ${res.status}`);
    }
    
    return res.json();
  } catch (error) {
    console.error("Error updating employee:", error);
    throw error;
  }
};

const createEmployee = async (data) => {
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
      throw new Error(errorData.message || `Failed to create employee: ${res.status}`);
    }
    
    return res.json();
  } catch (error) {
    console.error("Error creating employee:", error);
    throw error;
  }
};

export const useEmployees = () => useQuery({
  queryKey: employeesQueryKeys.lists(),
  queryFn: getEmployees,
  retry: 2,
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  staleTime: 30 * 1000,
  gcTime: 5 * 60 * 1000,
  refetchOnWindowFocus: false,
  refetchOnMount: true,
  throwOnError: false,
});

export const useEmployeeById = (personId) => useQuery({
  queryKey: employeesQueryKeys.detail(personId),
  queryFn: () => getEmployeeById(personId),
  enabled: !!personId, // Only fetch if personId exists
  retry: 2,
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  staleTime: 30 * 1000,
  gcTime: 5 * 60 * 1000,
  refetchOnWindowFocus: false,
  throwOnError: false,
});

export const useDeleteEmployee = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeesQueryKeys.lists() });
    },
    onError: (error) => {
      console.error("Delete mutation failed:", error);
    },
  });
};

export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateEmployee,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: employeesQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: employeesQueryKeys.detail(variables.personId) });
    },
    onError: (error) => {
      console.error("Update mutation failed:", error);
    },
  });
};

export const useCreateEmployee = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeesQueryKeys.lists() });
    },
    onError: (error) => {
      console.error("Create mutation failed:", error);
    },
  });
};