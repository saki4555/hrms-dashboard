import { useQuery, useQueryClient } from "@tanstack/react-query";
import { clearUser, fetchCurrentUser, saveUser } from "../api/authApi";


export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading: loading, isError } = useQuery({
    queryKey: ["authUser"],
    queryFn: fetchCurrentUser,
    staleTime: Infinity, // don't auto-refetch unless login change
    retry: false,
  });

  function login(role = "Admin") {
    const userData = { name: "Logged User", role };
    saveUser(userData);
    queryClient.setQueryData(["authUser"], userData);
  }

  function logout() {
    clearUser();
    queryClient.invalidateQueries(["authUser"]);
  }

  const isAuthenticated = !!user && !isError;

  return {
    user,
    loading,
    isError,
    isAuthenticated,
    login,
    logout,
  };
}
