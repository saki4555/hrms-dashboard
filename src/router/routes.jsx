import DashboardLayout from "@/layouts/dashboard-layout"
import Login from "@/pages/login"
import Welcome from "@/pages/welcome"
import { Route, Routes } from "react-router"
import ProtectedRoute from "./protectec-route"
import CoreHR from "@/pages/core-hr"


const AppRoutes = () => {
  return (
    <Routes>
       
        <Route path="/login" element={<Login />} />

       <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<Welcome />} />
        <Route path="core-hr" element={<CoreHR />} /> {/* Remove leading slash */}
       </Route>
    </Routes> 
  )
}

export default AppRoutes