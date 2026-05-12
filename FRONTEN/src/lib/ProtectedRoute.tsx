import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";
import Spinner from "../components/Spinner";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "host" | "guest" | "admin";
}

export function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps) {
  const { user, loading } = useAuthStore();

  if (loading) return <Spinner />;

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    if (requiredRole === "host" || requiredRole === "admin") {
      return <Navigate to="/" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
}
