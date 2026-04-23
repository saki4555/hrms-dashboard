// src/routes/PrivateRoute.jsx
import { PageLoader } from "@/components/loading-spinner";
import { useAuthV2 as useAuth } from "@/features/authentication-v2/use-auth-v2";
import { Navigate } from "react-router";

export function PrivateRoute({ permissions = [], children }) {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (
    permissions.length > 0 &&
    !permissions.some((p) => user.permissions?.includes(p))
  ) {
    return <Navigate to="/forbidden" replace />;
  }

  return children;
}
