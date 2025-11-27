import React, { useEffect, useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import "../styles/Layout.css";

export default function DashboardLayout() {
  const navigate = useNavigate();
  const [role, setRole] = useState(null);

  useEffect(() => {
    const loggedIn = localStorage.getItem("loggedIn") === "true";
    const userRole = localStorage.getItem("userRole");

    if (!loggedIn || (userRole !== "admin" && userRole !== "user")) {
      navigate("/", { replace: true });
      return;
    }

    setRole(userRole);
  }, [navigate]);

  if (!role) return null;

  return (
    <div className="dashboard-layout">
      <Topbar />
      <aside>
        <Sidebar role={role} />
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}