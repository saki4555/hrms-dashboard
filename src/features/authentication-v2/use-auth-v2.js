// src/features/authentication-v2/use-auth-v2.js

import { useCurrentUserV2, useLoginV2, useLogoutV2 } from "./queries";

export function useAuthV2() {
  const { data: user, isLoading, isError } = useCurrentUserV2();
  const loginMutation  = useLoginV2();
  const logoutMutation = useLogoutV2();

  return {
    user,
    isLoading,
    isAuthenticated: !!user && !isError,
    login:           loginMutation.mutateAsync,  // ({ username, password })
    logout:          logoutMutation.mutate,
    loginError:      loginMutation.error,
    loginPending:    loginMutation.isPending,
  };
}