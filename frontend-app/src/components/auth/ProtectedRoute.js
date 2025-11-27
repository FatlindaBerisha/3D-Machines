import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem("jwtToken");
  const role = localStorage.getItem("userRole");

  // Fix for BACK button cache
  useEffect(() => {
    window.addEventListener("pageshow", (e) => {
      if (e.persisted) window.location.reload();
    });
  }, []);

  // Not logged in → redirect
  if (!token || !role) return <Navigate to="/" replace />;

  try {
    const { exp } = jwtDecode(token);

    if (Date.now() >= exp * 1000) {
      localStorage.clear();
      return <Navigate to="/" replace />;
    }

    if (!allowedRoles.includes(role)) {
      return <Navigate to={role === "admin" ? "/dashboard/admin" : "/dashboard/user"} replace />;
    }

    return children;
  } catch {
    localStorage.clear();
    return <Navigate to="/" replace />;
  }
};

export default ProtectedRoute;