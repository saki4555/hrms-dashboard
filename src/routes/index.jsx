




import { Routes, Route } from "react-router";

import { ROUTE_MAP } from "./route-map";
import { ALL_ROLES } from "@/config/roles";
import DashboardLayout from "@/layouts/dashboard-layout";
import Welcome from "@/pages/welcome";
import Login from "@/pages/login";
import Unauthorized from "@/features/authentication/pages/Unauthorized";

import { PrivateRoute } from "./PrivateRoute";
import { PageLoader } from "@/components/loading-spinner";
import { NotFoundError } from "@/components/shared/not-found-error";

export default function AppRoutes() {
  return (
    <Routes>
      {/* ── Public ─────────────────────────────────────────────────────────── */}
      <Route path="/login"        element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* ── Protected (layout wrapper) ─────────────────────────────────────── */}
      <Route
        path="/"
        element={
          <PrivateRoute allowedRoles={ALL_ROLES}>
            <DashboardLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Welcome />} />

      
          {ROUTE_MAP.map(({ path, component: Component, roles }) => (
            <Route
              key={path}
              path={path}
              element={
                <PrivateRoute allowedRoles={roles}>
                  <Component />
                </PrivateRoute>
              }
            />
          ))}
        
      </Route>
      <Route path="*" element={<NotFoundError />} />
    </Routes>
  );
}
