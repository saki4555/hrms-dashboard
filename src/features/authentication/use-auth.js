// src\features\authentication\use-auth.js

import { useCurrentUser, useLogin, useLogout } from "./queries";

export function useAuth() {
  const { data: user, isLoading, isError } = useCurrentUser();
  const loginMutation  = useLogin();
  const logoutMutation = useLogout();

  return {
    user,                           
    isLoading,
    isAuthenticated: !!user && !isError,
    login:           loginMutation.mutateAsync,   // ({ username, password })
    logout:          logoutMutation.mutate,
    loginError:      loginMutation.error,
    loginPending:    loginMutation.isPending,
  };
}