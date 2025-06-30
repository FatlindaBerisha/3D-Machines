import React from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('jwtToken');
  const role = localStorage.getItem('userRole');

  if (!token || !role) {
    return <Navigate to="/" replace />;
  }

  try {
    const { exp } = jwtDecode(token);
    if (Date.now() >= exp * 1000) {
      localStorage.clear();
      return <Navigate to="/" replace />;
    }

    if (!allowedRoles.includes(role)) {
      return <Navigate to={role === 'admin' ? "/dashboard/admin" : "/dashboard/user"} replace />;
    }

    return children;
  } catch (err) {
    localStorage.clear();
    return <Navigate to="/" replace />;
  }
};

export default ProtectedRoute;