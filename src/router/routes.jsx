import DashboardLayout from "@/layouts/dashboard-layout"
import Login from "@/pages/login"
import Welcome from "@/pages/welcome"
import { Route, Routes } from "react-router"
import ProtectedRoute from "./protectec-route"

import EmployeeDetailsPage from "@/features/core-hr/pages/EmployeeDetailsPage"
import CoreHRPage from "@/features/core-hr/pages/CoreHRPage"
import EditEmployeePage from "@/features/core-hr/pages/EditEmployeePage"
import CreateEmployeePage from "@/features/core-hr/pages/CreateEmployeePage"



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
         <Route path="/core-hr/create-employee" element={<CreateEmployeePage />} />
        <Route path="/core-hr/employee/edit/:empNo" element={<EditEmployeePage />} />

      </Route>
    </Routes>
  )
}

export default AppRoutes