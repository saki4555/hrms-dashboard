import { queryOptions, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const organizationsQueryKeys = {
  all: ['organizations'],
  lists: () => [...organizationsQueryKeys.all, 'lists'],
  detail: (id) => [...organizationsQueryKeys.all, 'detail', id],
};

const getOrganizations = async () => {
  const res = await fetch('https://7b97fwsp-4000.inc1.devtunnels.ms/api/hr-org');
  console.log("organizations data fetch response", res);
  
  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }
  
  const jsonData = await res.json();
  console.log("Parsed JSON:", jsonData);
  return jsonData.data || jsonData;
};

const deleteOrganization = async (id) => {
  const res = await fetch(`https://7b97fwsp-4000.inc1.devtunnels.ms/api/hr-org/${id}`, {
    method: 'DELETE',
  });
  
  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }
  
  return res.json();
};

const updateOrganization = async ({ id, data }) => {
  const res = await fetch(`https://7b97fwsp-4000.inc1.devtunnels.ms/api/hr-org/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
  }
  
  return res.json();
};

export const useOrganizations = () => useQuery({
  queryKey: organizationsQueryKeys.lists(),
  queryFn: getOrganizations,
});

export const useDeleteOrganization = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteOrganization,
    onSuccess: () => {
      // Invalidate and refetch the organizations list
      queryClient.invalidateQueries({ queryKey: organizationsQueryKeys.lists() });
    },
  });
};

export const useUpdateOrganization = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateOrganization,
    onSuccess: () => {
      // Invalidate and refetch the organizations list
      queryClient.invalidateQueries({ queryKey: organizationsQueryKeys.lists() });
    },
  });
};