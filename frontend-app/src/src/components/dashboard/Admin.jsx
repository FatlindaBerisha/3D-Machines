import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    const loggedIn = localStorage.getItem("loggedIn") === "true";
    const role = localStorage.getItem("userRole");

    if (!loggedIn || role !== "admin") {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  return (
    <div>
      <h1>Welcome Admin to Dashboard</h1>
    </div>
  );
}