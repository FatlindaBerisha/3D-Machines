import React, { useContext } from "react";
import { NavLink } from "react-router-dom";
import { FaTachometerAlt, FaPrint, FaFlask, FaHistory, FaUser, FaUsers } from "react-icons/fa";
import logo from "../../assets/logo.png";
import { UserContext } from "../../UserContext";

const Sidebar = ({ role }) => {
  const { user } = useContext(UserContext);

  const capitalize = (str) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1) : "";

  const fullName = user?.fullName || "";
  const profession = user?.profession || "";

  const userSections = [
    {
      title: "",
      links: [
        { name: "Dashboard", to: "/dashboard/user", icon: <FaTachometerAlt /> },
      ],
    },
    {
      title: "Printing",
      links: [
        { name: "New Print", to: "/dashboard/user/new-print", icon: <FaPrint /> },
        { name: "Print Log", to: "/dashboard/user/print-log", icon: <FaHistory /> },
      ],
    },
    {
      title: "Materials",
      links: [
        { name: "Filament", to: "/dashboard/user/filament", icon: <FaFlask /> },
      ],
    },
    {
      title: "User",
      links: [
        { name: "Profile", to: "/dashboard/user/profile", icon: <FaUser /> },
      ],
    },
  ];

  const adminSections = [
    {
      title: "",
      links: [
        { name: "Admin Dashboard", to: "/dashboard/admin", icon: <FaTachometerAlt /> },
      ],
    },
    {
      title: "Team",
      links: [
        { name: "Manage Users", to: "/dashboard/admin/users", icon: <FaUsers /> },
      ],
    },
    {
      title: "Printing Overview",
      links: [
        { name: "Print Logs", to: "/dashboard/admin/print-logs", icon: <FaPrint /> },
        { name: "Filament Manager", to: "/dashboard/admin/filaments", icon: <FaFlask /> },
      ],
    },
    {
      title: "Admin",
      links: [
        { name: "Profile", to: "/dashboard/admin/profile", icon: <FaUser /> },
      ],
    },
  ];

  const sections = role === "admin" ? adminSections : userSections;

  return (
    <div className="sidebar">
      <img src={logo} alt="3D Machines Logo" className="logo-img" />

      <div className="sidebar-user-info">
        <div className="user-fullname">{fullName}</div>
        <span className={`profession-${profession || 'default'}`}>
          {capitalize(profession)}
        </span>
      </div>

      <nav>
        {sections.map((section, index) => (
          <div key={index} className="sidebar-section">
            {section.title && (
              <div className="sidebar-section-title">{section.title}</div>
            )}
            {section.links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === "/dashboard/admin" || link.to === "/dashboard/user"}
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                {link.icon}
                <span className="link-text">{link.name}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;