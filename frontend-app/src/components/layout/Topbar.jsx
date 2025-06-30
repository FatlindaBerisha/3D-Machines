import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaSignOutAlt } from "react-icons/fa";
import { UserContext } from "../../UserContext";
import "../styles/Layout.css";

const Topbar = () => {
  const navigate = useNavigate();
  const { user, setUser } = useContext(UserContext);

  const handleLogout = () => {
    setUser(null);

    ['jwtToken', 'loggedIn', 'userRole', 'fullName', 'phone', 'email', 'password', 'confirmpassword', 'profession', 'gender'].forEach(key => localStorage.removeItem(key));
    
    navigate("/", { replace: true });
  };

  const profilePath = user?.role === "admin" ? "/dashboard/admin/profile" : "/dashboard/user/profile";

  return (
    <header className="topbar-container">
      <nav className="topbar-nav">
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