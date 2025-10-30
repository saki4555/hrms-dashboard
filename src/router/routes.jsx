import DashboardLayout from "@/layouts/dashboard-layout"
import Login from "@/pages/login"
import Welcome from "@/pages/welcome"
import { Route, Routes } from "react-router"
import ProtectedRoute from "./protectec-route"
import CoreHRPage from "@/features/core-hr/pages/coreHRPage"
import EmployeeDetailsPage from "@/features/core-hr/pages/EmployeeDetailsPage"



const AppRoutes = () => {
  return (
    <Routes>

      <Route path="/login" element={<Login />} />

      <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<Welcome />} />
        <Route path="core-hr" element={<CoreHRPage />} />
        <Route
          path="core-hr/employee/:empNo"
          element={<ProtectedRoute><EmployeeDetailsPage /></ProtectedRoute>}
        />
      </Route>
    </Routes>
  )
}

export default AppRoutes