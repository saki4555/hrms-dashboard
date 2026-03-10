import { useAuth } from "@/features/authentication/use-auth";
import { Navigate } from "react-router";

export function PrivateRoute({ allowedRoles, children }) {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) return <div>Loading...</div>;  // ← wait for /me to resolve
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (allowedRoles && !user.roles?.some(r => allowedRoles.includes(r))) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}