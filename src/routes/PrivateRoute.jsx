import { PageLoader } from "@/components/loading-spinner";
import { useAuth } from "@/features/authentication/use-auth";
import { Navigate } from "react-router";

export function PrivateRoute({ allowedRoles, children }) {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) return <PageLoader />
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (allowedRoles && !user.roles?.some(r => allowedRoles.includes(r))) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}




// ! Permission based
// import { PageLoader } from "@/components/loading-spinner";
// import { useAuth } from "@/features/authentication/use-auth";
// import { Navigate } from "react-router";

// export function PrivateRoute({ allowedRoles, requiredPermission, children }) {
//   const { user, isLoading, isAuthenticated } = useAuth();

//   if (isLoading) return <PageLoader />;
//   if (!isAuthenticated) return <Navigate to="/login" replace />;

//   // Role check — for route-level access (whole page)
//   if (allowedRoles && !user.roles?.some((r) => allowedRoles.includes(r))) {
//     return <Navigate to="/unauthorized" replace />;
//   }

//   // Permission check — for route-level access (granular)
//   if (requiredPermission && !user.permissions?.includes(requiredPermission)) {
//     return <Navigate to="/unauthorized" replace />;
//   }

//   return children;
// }