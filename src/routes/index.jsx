




import { Routes, Route } from "react-router";

import { ROUTE_MAP } from "./route-map";
import { ALL_ROLES } from "@/config/roles";
import DashboardLayout from "@/layouts/dashboard-layout";
import Welcome from "@/pages/welcome";

import Unauthorized from "@/features/authentication-old/pages/Unauthorized";

import { PrivateRoute } from "./PrivateRoute";
import { PageLoader } from "@/components/loading-spinner";
import { NotFoundError } from "@/components/shared/not-found-error";
import Login from "@/features/authentication";
import { Forbidden } from "@/features/authentication-old/pages/forbidden";
import { PERMISSIONS } from "@/config/permissions";
import LoginV2 from "@/features/authentication-v2";

export default function AppRoutes() {
  return (
    <Routes>
      {/* ── Public ─────────────────────────────────────────────────────────── */}
      <Route path="/login"        element={<LoginV2 />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/forbidden" element={<Forbidden />} />
      

      {/* ── Protected (layout wrapper) ─────────────────────────────────────── */}
      <Route
        path="/"
        element={
          <PrivateRoute >
            <DashboardLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Welcome />} />

      
          {ROUTE_MAP.map(({ path, component: Component, permissions }) => (
            <Route
              key={path}
              path={path}
              element={
                <PrivateRoute permissions={permissions}>
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
