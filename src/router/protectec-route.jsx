import { useAuth } from "@/context/auth-context";
import { Navigate } from "react-router";


export default function ProtectedRoute({ children }) {
  const { loggedIn } = useAuth();
  return loggedIn ? children : <Navigate to="/login" replace />;
}
