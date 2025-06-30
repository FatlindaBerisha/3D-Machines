import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function User() {
  const navigate = useNavigate();

  useEffect(() => {
    const loggedIn = localStorage.getItem("loggedIn") === "true";
    const role = localStorage.getItem("userRole");

    if (!loggedIn || role === "admin") {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  return (
    <div>
      <h1>Welcome User</h1>
    </div>
  );
}