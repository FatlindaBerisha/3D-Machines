import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaSignOutAlt } from "react-icons/fa";
import Notifications from "../Notifications";
import { UserContext } from "../../UserContext";
import "../styles/Layout.css";

const Topbar = () => {
  const navigate = useNavigate();
  const { user, setUser, token, setToken } = useContext(UserContext);

  const handleLogout = () => {
  // Clear React state
    setUser(null);
    setToken(null);

    // Clear browser storage
    localStorage.clear();
    sessionStorage.clear();

    // Remove history so BACK won’t return
    navigate("/", { replace: true });

    // Hard refresh to avoid bfcache UI showing
    setTimeout(() => {
      window.location.reload();
    }, 50);
  };


  const profilePath = user?.role === "admin" ? "/dashboard/admin/profile" : "/dashboard/user/profile";

  return (
    <header className="topbar-container">
      <nav className="topbar-nav">

        {/* Ikona e njoftimeve */}
        <Notifications token={token} />

        {/* Linku për profilin */}
        <a href={profilePath} title="Profile" className="topbar-link">
          <FaUser />
        </a>

        {/* Butoni Logout */}
        <button onClick={handleLogout} title="Logout" className="topbar-link logout-button">
          <FaSignOutAlt />
        </button>
      </nav>
    </header>
  );
};

export default Topbar;