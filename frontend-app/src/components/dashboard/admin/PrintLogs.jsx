import React, { useEffect, useState, useRef } from "react";
import ReactDOM from "react-dom";
import { toast } from "react-toastify";
import Pagination from "../Pagination";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import api from "../../../utils/axiosClient"; // <--- IMPORTANT
import "../../styles/PrintFilament.css";

export default function PrintLogs() {
  const [printJobs, setPrintJobs] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 5;
  const dropdownRef = useRef();
  const iconRef = useRef(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const [filaments, setFilaments] = useState([]);

  // ------------------------------
  // FETCH ALL DATA (axiosClient)
  // ------------------------------
  useEffect(() => {
    async function loadData() {
      try {
        const [jobsRes, userRes, filamentRes] = await Promise.all([
          api.get("/printjob"),
          api.get("/user"),
          api.get("/filament"),
        ]);

        setPrintJobs(jobsRes.data);
        setUsers(userRes.data);
        setFilaments(filamentRes.data);
      } catch (err) {
        toast.error("Failed to load data");
      }
    }

    loadData();
  }, []);

  function getFilamentNameById(id) {
    const filament = filaments.find((f) => f.id === id);
    return filament ? filament.name : "-";
  }

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  function toggleUserDropdown() {
    if (!showUserDropdown && iconRef.current) {
      const rect = iconRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
      });
    }
    setShowUserDropdown((prev) => !prev);
  }

  // ------------------------------
  // Close dropdown on outside click
  // ------------------------------
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        iconRef.current &&
        !iconRef.current.contains(event.target)
      ) {
        setShowUserDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ------------------------------
  // Checkbox user filter
  // ------------------------------
  function handleUserCheckboxChange(userId) {
    setSelectedUsers((prev) => {
      const updated = new Set(prev);
      updated.has(userId) ? updated.delete(userId) : updated.add(userId);
      return updated;
    });
    setCurrentPage(1);
  }

  // ------------------------------
  // Filtering print jobs
  // ------------------------------
  const filteredPrintJobs =
    selectedUsers.size === 0
      ? printJobs
      : printJobs.filter((job) =>
          selectedUsers.has(job.userId || job.user?.id)
        );

  const totalPages = Math.ceil(filteredPrintJobs.length / jobsPerPage);
  const currentJobs = filteredPrintJobs.slice(
    (currentPage - 1) * jobsPerPage,
    currentPage * jobsPerPage
  );

  function formatDuration(durationStr) {
    if (!durationStr) return "-";
    if (typeof durationStr === "string" && durationStr.includes(":"))
      return durationStr;

    const minutes = parseInt(durationStr, 10);
    if (isNaN(minutes)) return "-";

    const hours = Math.floor(minutes / 60).toString().padStart(2, "0");
    const mins = (minutes % 60).toString().padStart(2, "0");

    return `${hours}:${mins}:00`;
  }

  function formatDate(dateString) {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  // ------------------------------
  // Export to Excel
  // ------------------------------
  function exportToExcel() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Print Jobs");

    const header = ["User", "Job Name", "Filament", "Status", "Duration", "Created At"];
    const headerRow = worksheet.addRow(header);

    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4374BA" },
      };
      cell.font = {
        bold: true,
        size: 12,
        color: { argb: "FFFFFFFF" },
      };
      cell.border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      };
    });

    worksheet.autoFilter = { from: "A1", to: "F1" };

    const sortedJobs = [...filteredPrintJobs].sort((a, b) =>
      (a.userFullName || a.user?.fullName || "").localeCompare(
        b.userFullName || b.user?.fullName || ""
      )
    );

    sortedJobs.forEach((job) => {
      worksheet.addRow([
        job.userFullName ||
          job.user?.fullName ||
          users.find((u) => u.id === (job.userId || job.user?.id))?.fullName ||
          "Unknown",
        job.jobName || "-",
        job.filamentName || job.filament?.name || getFilamentNameById(job.filamentId),
        job.status || job.Status || "-",
        formatDuration(job.duration || job.Duration),
        formatDate(job.createdAt || job.CreatedAt),
      ]);
    });

    worksheet.columns = [
      { width: 20 },
      { width: 25 },
      { width: 20 },
      { width: 15 },
      { width: 15 },
      { width: 18 },
    ];

    workbook.xlsx.writeBuffer().then((buffer) => {
      saveAs(
        new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        "all-print-jobs.xlsx"
      );
    });
  }

  return (
    <div className="printjobs-container">
      <h2 className="printjobs-title">All Print Jobs</h2>

      {printJobs.length === 0 ? (
        <p className="no-printjobs-message">No print jobs found.</p>
      ) : (
        <>
          <div style={{ marginBottom: "8px", textAlign: "right" }}>
            <button
              className="export-excel-btn"
              onClick={exportToExcel}
              title="Export to Excel"
            >
              <i className="bi bi-file-earmark-excel-fill"></i> Export
            </button>
          </div>

          <table className="printjobs-table">
            <thead>
              <tr>
                <th>
                  <div className="printjobs-user-filter">
                    User
                    <span
                      ref={iconRef}
                      onClick={toggleUserDropdown}
                      className="printjobs-filter-icon"
                      title="Filter users"
                      role="button"
                      tabIndex={0}
                      onKeyPress={(e) => {
                        if (e.key === "Enter" || e.key === " ") toggleUserDropdown();
                      }}
                    >
                      ▼
                    </span>

                    {showUserDropdown &&
                      ReactDOM.createPortal(
                        <div
                          ref={dropdownRef}
                          className="printjobs-user-dropdown"
                          style={{
                            position: "absolute",
                            top: dropdownPos.top,
                            left: dropdownPos.left,
                          }}
                        >
                          {users.map((user) => (
                            <label
                              key={user.id}
                              style={{ display: "block", cursor: "pointer" }}
                            >
                              <input
                                type="checkbox"
                                checked={selectedUsers.has(user.id)}
                                onChange={() => handleUserCheckboxChange(user.id)}
                                style={{ marginRight: "8px" }}
                              />
                              {user.fullName || user.username || "Unknown User"}
                            </label>
                          ))}
                        </div>,
                        document.body
                      )}
                  </div>
                </th>

                <th>Job Name</th>
                <th>Filament</th>
                <th>Status</th>
                <th>Duration</th>
                <th>Created At</th>
              </tr>
            </thead>

            <tbody>
              {currentJobs.map((job) => (
                <tr key={job.id}>
                  <td>
                    {job.userFullName ||
                      job.user?.fullName ||
                      users.find((u) => u.id === (job.userId || job.user?.id))
                        ?.fullName ||
                      "-"}
                  </td>
                  <td>{job.jobName || "-"}</td>
                  <td>
                    {job.filamentName ||
                      job.filament?.name ||
                      getFilamentNameById(job.filamentId)}
                  </td>

                  <td>
                    <span
                      className={`printlog-status printlog-status-${
                        (job.status || job.Status || "")
                          .toLowerCase()
                          .replace(" ", "-")
                      }`}
                    >
                      {job.status || job.Status || "-"}
                    </span>
                  </td>

                  <td>{formatDuration(job.duration || job.Duration)}</td>
                  <td>{formatDate(job.createdAt || job.CreatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
}