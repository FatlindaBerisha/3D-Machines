import React from "react";
import { Navigate } from "react-router-dom";

import { getToken, getUser } from "../../utils/storage";

const PublicRoute = ({ children }) => {
  const token = getToken();
  const user = getUser();
  const role = user?.role || localStorage.getItem("userRole") || sessionStorage.getItem("userRole");

  if (token && role) {
    return <Navigate to={role === "admin" ? "/dashboard/admin" : "/dashboard/user"} replace />;
  }

  return children;
};

export default PublicRoute;