import React, { useEffect, useState } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { getUser } from "../../utils/storage";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import GlobalCallReceiver from "../GlobalCallReceiver";
import "../styles/Layout.css";

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [role, setRole] = useState(null);

  useEffect(() => {
    const user = getUser();

    if (!user || (user.role !== "admin" && user.role !== "user")) {
      navigate("/", { replace: true });
      return;
    }

    setRole(user.role);

    // Check for Welcome Toast
    const welcomeName = localStorage.getItem('welcomeName');
    if (welcomeName) {
      toast.success(t('toasts.welcomeBack', { name: welcomeName }) || `Welcome back, ${welcomeName}!`);
      localStorage.removeItem('welcomeName');
    }

  }, [navigate, t]);

  if (!role) return null;

  // Determine if content should be centered
  const isDashboard = location.pathname === "/dashboard/admin" || location.pathname === "/dashboard/user";
  const contentClass = isDashboard ? "content" : "content centered-content";

  return (
    <div className="dashboard-layout">
      <Topbar />
      <GlobalCallReceiver />
      <aside>
        <Sidebar role={role} />
      </aside>
      <main className={contentClass}>
        <Outlet />
      </main>
    </div>
  );
}