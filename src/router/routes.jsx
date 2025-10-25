import DashboardLayout from "@/layouts/dashboard-layout"
import Login from "@/pages/login"
import Welcome from "@/pages/welcome"
import { Route, Routes } from "react-router"
import ProtectedRoute from "./protectec-route"


const AppRoutes = () => {
  return (
    <Routes>
       
        <Route path="/login" element={<Login />} />

       <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route index  element={<Welcome />} />
       </Route>
    </Routes> 
  )
}

export default AppRoutes