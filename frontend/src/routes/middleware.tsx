import { Navigate, Outlet } from "react-router-dom";
import { useEffect } from "react";
import { useUserStore } from "../store/useUserStore";

const ProtectedRoute = () => {
  const { token, user, fetchProfile, loading } = useUserStore();

  useEffect(() => {
    if (token && !user) {
      fetchProfile(); // Rehydrate user on refresh
    }
  }, [token, user, fetchProfile]);

  // No token → go to login
  if (!token) {
    return <Navigate to="/landing" replace />;
  }

  // Token exists but profile not loaded yet
  if (loading || !user) {
    return <div className="p-6">Loading...</div>;
  }

  return <Outlet />;
};


const PublicRoute = () => {
  const { token } = useUserStore();

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export { PublicRoute, ProtectedRoute };
