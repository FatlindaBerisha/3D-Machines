import React, { useContext } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  FaTachometerAlt,
  FaPrint,
  FaCut,
  FaCog,
  FaUsers,
} from "react-icons/fa";
import { FiChevronRight } from "react-icons/fi";
import logo from "../../assets/logo.png";
import { UserContext } from "../../UserContext";

const Sidebar = ({ role }) => {
  const { user } = useContext(UserContext);
  const location = useLocation();
  const [open, setOpen] = React.useState(null);

  const toggle = (title) => setOpen(open === title ? null : title);

  const capitalize = (str) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1) : "";

  const fullName = user?.fullName || "";
  const profession = user?.profession || "";

  // USER SECTIONS
  const userSections = [
    {
      title: "",
      links: [
        {
          name: "Dashboard",
          to: "/dashboard/user",
          icon: <FaTachometerAlt />,
        },
      ],
    },
    {
      title: "Printing",
      icon: <FaPrint />,
      dropdown: true,
      links: [
        { name: "New Print", to: "/dashboard/user/new-print" },
        { name: "Print Log", to: "/dashboard/user/print-log" },
        { name: "Project Files", to: "/dashboard/user/user-projects" },
      ],
    },
    {
      title: "Cutting",
      icon: <FaCut />,
      dropdown: true,
      links: [
        { name: "New Cut", to: "/dashboard/user/new-cut" },
        { name: "Cut Log", to: "/dashboard/user/cut-log" },
        { name: "Cut Projects", to: "/dashboard/user/cut-projects" },
      ],
    },
    {
      title: "Settings",
      icon: <FaCog />,
      dropdown: true,
      links: [
        { name: "Profile", to: "/dashboard/user/profile" },
        { name: "Security", to: "/dashboard/user/security" },
        { name: "Preferences", to: "/dashboard/user/preferences" },
        { name: "Notifications", to: "/dashboard/user/notifications" },
      ],
    },
  ];

  // ADMIN SECTIONS
  const adminSections = [
    {
      title: "",
      links: [
        {
          name: "Admin Dashboard",
          to: "/dashboard/admin",
          icon: <FaTachometerAlt />,
        },
      ],
    },
    {
      title: "Team",
      icon: <FaUsers />,
      dropdown: true,
      links: [{ name: "Manage Users", to: "/dashboard/admin/users" }],
    },
    {
      title: "Printing Overview",
      icon: <FaPrint />,
      dropdown: true,
      links: [
        { name: "Print Logs", to: "/dashboard/admin/print-logs" },
        { name: "Filament Manager", to: "/dashboard/admin/filaments" },
        { name: "Project Files", to: "/dashboard/admin/project-files" },
      ],
    },
    {
      title: "Cutting Overview",
      icon: <FaCut />,
      dropdown: true,
      links: [
        { name: "Cut Logs", to: "/dashboard/admin/cut-logs" },
        { name: "Material Manager", to: "/dashboard/admin/materials" },
        { name: "Cut Files", to: "/dashboard/admin/cut-projects" },
      ],
    },
    {
      title: "Settings",
      icon: <FaCog />,
      dropdown: true,
      links: [
        { name: "Profile", to: "/dashboard/admin/profile" },
        { name: "Security", to: "/dashboard/admin/security" },
        { name: "Preferences", to: "/dashboard/admin/preferences" },
        { name: "Notifications", to: "/dashboard/admin/notifications" },
      ],
    },
  ];

  const sections = role === "admin" ? adminSections : userSections;

  return (
    <div className="sidebar">
      <img src={logo} alt="3D Machines Logo" className="logo-img" />

      <div className="sidebar-user-info">
        <div className="user-fullname">{fullName}</div>
        <span className={`profession-${profession || "default"}`}>
          {capitalize(profession)}
        </span>
      </div>

      <nav>
        {sections.map((section, i) => (
          <div key={i} className="sidebar-section">
            {/* DASHBOARD LINK */}
            {!section.dropdown &&
              section.links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end
                  className={({ isActive }) =>
                    isActive ? "top-link active" : "top-link"
                  }
                >
                  {link.icon}
                  <span>{link.name}</span>
                </NavLink>
              ))}

            {/* DROPDOWN PARENT */}
            {section.dropdown && (
              <div
                className={
                  section.links.some((l) => location.pathname === l.to)
                    ? "dropdown-parent parent-active"
                    : "dropdown-parent"
                }
                onClick={() => toggle(section.title)}
              >
                <div className="dropdown-left">
                  {section.icon}
                  <span>{section.title}</span>
                </div>
                <FiChevronRight
                  className={`dropdown-arrow ${
                    open === section.title ? "open" : ""
                  }`}
                />
              </div>
            )}

            {/* DROPDOWN CONTENT */}
            {section.dropdown && open === section.title && (
              <div className="dropdown-content">
                {section.links.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={({ isActive }) =>
                      isActive ? "dropdown-item active" : "dropdown-item"
                    }
                  >
                    {link.name}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
