import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../auth/use-auth";

export function ProtectedRoute() {
  const {
    state: { accessToken },
  } = useAuth();
  const location = useLocation();

  if (!accessToken) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
