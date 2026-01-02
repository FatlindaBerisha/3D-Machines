import React from "react";
import { Navigate } from "react-router-dom";

const PublicRoute = ({ children }) => {
  const token = localStorage.getItem("jwtToken");
  const role = localStorage.getItem("userRole");

  // Nëse user-i është i loguar → mos e lejo me hy te login/register
  if (token && role) {
    return <Navigate to={role === "admin" ? "/dashboard/admin" : "/dashboard/user"} replace />;
  }

  return children;
};

export default PublicRoute;