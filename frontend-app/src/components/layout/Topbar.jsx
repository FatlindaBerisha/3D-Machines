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
    import("../../utils/auth").then(({ logout }) => {
      logout();
    });
  };


  const profilePath = user?.role === "admin" ? "/dashboard/admin/profile" : "/dashboard/user/profile";

  return (
    <header className="topbar-container">
      <nav className="topbar-nav">

        <Notifications token={token} />

        <a href={profilePath} title="Profile" className="topbar-link">
          <FaUser />
        </a>
        <button onClick={handleLogout} title="Logout" className="topbar-link logout-button">
          <FaSignOutAlt />
        </button>
      </nav>
    </header>
  );
};

export default Topbar;