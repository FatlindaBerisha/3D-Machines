import React, { useContext } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const location = useLocation();
  const [open, setOpen] = React.useState(null);

  const toggle = (title) => setOpen(open === title ? null : title);

  const capitalize = (str) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1) : "";

  // Translate profession based on selected language
  const translateProfession = (prof) => {
    if (!prof) return "";
    const profLower = prof.toLowerCase();
    if (profLower === "student") return t('common.student');
    if (profLower === "engineer") return t('common.engineer');
    if (profLower === "designer") return t('common.designer');
    return capitalize(prof);
  };

  const fullName = user?.fullName || "";
  const profession = user?.profession || "";

  // USER SECTIONS
  const userSections = [
    {
      title: "",
      links: [
        {
          name: t('sidebar.dashboard'),
          to: "/dashboard/user",
          icon: <FaTachometerAlt />,
        },
      ],
    },
    {
      title: t('sidebar.printing'),
      icon: <FaPrint />,
      dropdown: true,
      links: [
        { name: t('sidebar.newPrint'), to: "/dashboard/user/new-print" },
        { name: t('sidebar.printLog'), to: "/dashboard/user/print-log" },
        { name: t('sidebar.projectFiles'), to: "/dashboard/user/user-projects" },
      ],
    },
    {
      title: t('sidebar.cutting'),
      icon: <FaCut />,
      dropdown: true,
      links: [
        { name: t('sidebar.newCut'), to: "/dashboard/user/new-cut" },
        { name: t('sidebar.cutLog'), to: "/dashboard/user/cut-log" },
        { name: t('sidebar.cutProjects'), to: "/dashboard/user/cut-projects" },
      ],
    },
    {
      title: t('sidebar.settings'),
      icon: <FaCog />,
      dropdown: true,
      links: [
        { name: t('sidebar.profile'), to: "/dashboard/user/profile" },
        { name: t('sidebar.security'), to: "/dashboard/user/security" },
        { name: t('sidebar.preferences'), to: "/dashboard/user/preferences" },
        { name: t('sidebar.notifications'), to: "/dashboard/user/notifications" },
      ],
    },
  ];

  // ADMIN SECTIONS
  const adminSections = [
    {
      title: "",
      links: [
        {
          name: t('sidebar.adminDashboard'),
          to: "/dashboard/admin",
          icon: <FaTachometerAlt />,
        },
      ],
    },
    {
      title: t('sidebar.team'),
      icon: <FaUsers />,
      dropdown: true,
      links: [{ name: t('sidebar.manageUsers'), to: "/dashboard/admin/users" }],
    },
    {
      title: t('sidebar.printingOverview'),
      icon: <FaPrint />,
      dropdown: true,
      links: [
        { name: t('sidebar.printLogs'), to: "/dashboard/admin/print-logs" },
        { name: t('sidebar.filamentManager'), to: "/dashboard/admin/filaments" },
        { name: t('sidebar.projectFiles'), to: "/dashboard/admin/project-files" },
      ],
    },
    {
      title: t('sidebar.cuttingOverview'),
      icon: <FaCut />,
      dropdown: true,
      links: [
        { name: t('sidebar.cutLogs'), to: "/dashboard/admin/cut-logs" },
        { name: t('sidebar.materialManager'), to: "/dashboard/admin/materials" },
        { name: t('sidebar.cutFiles'), to: "/dashboard/admin/cut-projects" },
      ],
    },
    {
      title: t('sidebar.settings'),
      icon: <FaCog />,
      dropdown: true,
      links: [
        { name: t('sidebar.profile'), to: "/dashboard/admin/profile" },
        { name: t('sidebar.security'), to: "/dashboard/admin/security" },
        { name: t('sidebar.preferences'), to: "/dashboard/admin/preferences" },
        { name: t('sidebar.notifications'), to: "/dashboard/admin/notifications" },
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
          {translateProfession(profession)}
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
                  className={`dropdown-arrow ${open === section.title ? "open" : ""
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
