import React, { useEffect, useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { getUser } from "../../utils/storage";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import Chatbot from "../dashboard/Chatbot";
import "../styles/Layout.css";

export default function DashboardLayout() {
  const navigate = useNavigate();
  const [role, setRole] = useState(null);

  useEffect(() => {
    const user = getUser();

    if (!user || (user.role !== "admin" && user.role !== "user")) {
      navigate("/", { replace: true });
      return;
    }

    setRole(user.role);
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
      <Chatbot />
    </div>
  );
}