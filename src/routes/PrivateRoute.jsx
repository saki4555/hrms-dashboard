import { useAuth } from "@/features/authentication/hooks/useAuth";
import { Children } from "react";
import { Navigate, Outlet } from "react-router";



export function PrivateRoute({ allowedRoles, children }) {
  const { user, loading, isAuthenticated } = useAuth();
  console.log({user})

  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
