import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

import { getToken, getUser, removeAuth } from "../../utils/storage";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = getToken();
  const user = getUser();
  const role = user?.role || localStorage.getItem("userRole") || sessionStorage.getItem("userRole");

  useEffect(() => {
    window.addEventListener("pageshow", (e) => {
      if (e.persisted) window.location.reload();
    });
  }, []);

  if (!token || !role) {
    return <Navigate to="/" replace />;
  }

  try {
    const { exp } = jwtDecode(token);

    if (Date.now() >= exp * 1000) {
      removeAuth();
      return <Navigate to="/" replace />;
    }

    if (!allowedRoles.includes(role)) {
      return <Navigate to={role === "admin" ? "/dashboard/admin" : "/dashboard/user"} replace />;
    }

    return children;
  } catch (e) {
    removeAuth();
    return <Navigate to="/" replace />;
  }
};

export default ProtectedRoute;