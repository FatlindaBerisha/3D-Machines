import React, { useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";
import { MdEdit, MdDelete } from "react-icons/md";
import EditPrintJobForm from "./EditPrintJobForm";
import Pagination from "../Pagination";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import api from "../../../utils/axiosClient";  // <-- SUPER IMPORTANT
import "../../styles/PrintLog.css";

export default function PrintLog() {
  const [printJobs, setPrintJobs] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    id: null,
    jobName: "",
    filamentId: "",
    status: "Pending",
    duration: "",
  });

  const [filaments, setFilaments] = useState([]);
  const toastIdRef = useRef(null);

  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 5;

  // -------------------------------------------------------
  // Merge filaments into printJob list
  // -------------------------------------------------------
  function mergeJobsWithFilamentNames(jobs, filaments) {
    const filamentMap = {};
    filaments.forEach(f => { filamentMap[f.id] = f.name; });

    return jobs.map(job => ({
      ...job,
      filamentName: filamentMap[job.filamentId] || "-"
    }));
  }

  // -------------------------------------------------------
  // FETCH DATA (axios auto-refresh)
  // -------------------------------------------------------
  useEffect(() => {
    async function fetchData() {
      try {
        const [resJobs, resFilaments] = await Promise.all([
          api.get("/printjob/my"),
          api.get("/filamentsuser"),
        ]);

        setFilaments(resFilaments.data);
        setPrintJobs(mergeJobsWithFilamentNames(resJobs.data, resFilaments.data));
      } catch (err) {
        toast.error(err?.response?.data?.message || "Failed to load print jobs");
      }
    }

    fetchData();
  }, []);

  // -------------------------------------------------------
  // Pagination
  // -------------------------------------------------------
  const totalPages = Math.ceil(printJobs.length / jobsPerPage);
  const indexOfLastJob = currentPage * jobsPerPage;
  const currentJobs = printJobs.slice(indexOfLastJob - jobsPerPage, indexOfLastJob);

  // -------------------------------------------------------
  // EDIT MODAL OPEN
  // -------------------------------------------------------
  function openEditModal(job) {
    let durationMinutes = "";

    if (job.duration) {
      const parts = job.duration.split(":");
      if (parts.length === 3) {
        durationMinutes = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
      }
    }

    setEditForm({
      id: job.id,
      jobName: job.jobName,
      filamentId: String(job.filamentId),
      status: job.status,
      duration: durationMinutes,
    });

    setIsEditing(true);
  }

  function closeEditModal() {
    setIsEditing(false);
    setEditForm({
      id: null,
      jobName: "",
      filamentId: "",
      status: "Pending",
      duration: "",
    });
  }

  // -------------------------------------------------------
  // Edit Form Change
  // -------------------------------------------------------
  function handleEditChange(e) {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  }

  function formatDuration(minutesStr) {
    if (!minutesStr) return null;
    const minutes = parseInt(minutesStr, 10);
    const hours = Math.floor(minutes / 60).toString().padStart(2, "0");
    const mins = (minutes % 60).toString().padStart(2, "0");
    return `${hours}:${mins}:00`;
  }

  // -------------------------------------------------------
  // SUBMIT EDIT (axios)
  // -------------------------------------------------------
  async function handleEditSubmit(e) {
    e.preventDefault();

    if (!editForm.jobName.trim()) return toast.error("Job name is required");
    if (!editForm.filamentId) return toast.error("Please select a filament");

    if (editForm.duration && (isNaN(editForm.duration) || editForm.duration < 0)) {
      return toast.error("Duration must be a positive number");
    }

    const payload = {
      id: editForm.id,
      jobName: editForm.jobName,
      filamentId: Number(editForm.filamentId),
      status: editForm.status,
      duration:
        editForm.status === "Pending"
          ? null
          : editForm.duration
          ? formatDuration(editForm.duration)
          : null,
    };

    try {
      await api.put(`/printjob/${editForm.id}`, payload);

      toast.success("Print job updated!");

      // Refresh print jobs after update
      const [resJobs, resFilaments] = await Promise.all([
        api.get("/printjob/my"),
        api.get("/filamentsuser"),
      ]);

      setFilaments(resFilaments.data);
      setPrintJobs(mergeJobsWithFilamentNames(resJobs.data, resFilaments.data));
      closeEditModal();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to update print job");
    }
  }

  // -------------------------------------------------------
  // DELETE (axios)
  // -------------------------------------------------------
  function showDeleteConfirm(id) {
    if (toastIdRef.current) {
      toast.dismiss(toastIdRef.current);
      toastIdRef.current = null;
    }

    toastIdRef.current = toast.info(
      <div className="toast-confirmation">
        <p>Are you sure you want to delete this print job?</p>
        <div className="btn-group">
          <button
            className="confirm-yes"
            onClick={() => {
              handleDelete(id);
              toast.dismiss(toastIdRef.current);
              toastIdRef.current = null;
            }}
          >
            Yes
          </button>
          <button
            className="confirm-no"
            onClick={() => {
              toast.dismiss(toastIdRef.current);
              toastIdRef.current = null;
            }}
          >
            No
          </button>
        </div>
      </div>,
      { autoClose: false, closeOnClick: false, closeButton: false, icon: true }
    );
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/printjob/${id}`);

      toast.success("Print job deleted!");
      setPrintJobs(prev => prev.filter(job => job.id !== id));
    } catch (err) {
      toast.error("Failed to delete print job");
    }
  }

  // -------------------------------------------------------
  // FORMATTERS
  // -------------------------------------------------------
  function formatDate(dateStr) {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  // -------------------------------------------------------
  // EXPORT TO EXCEL (unchanged)
  // -------------------------------------------------------
  function exportToExcel() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("My Print Jobs");

    const header = ["Job Name", "Filament", "Status", "Duration", "Created At"];
    const headerRow = worksheet.addRow(header);

    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4374BA" },
      };
      cell.font = { bold: true, size: 12, color: { argb: "FFFFFFFF" } };
    });

    printJobs.forEach((job) => {
      worksheet.addRow([
        job.jobName,
        job.filamentName || "-",
        job.status,
        job.duration || "-",
        formatDate(job.createdAt),
      ]);
    });

    worksheet.columns = [
      { width: 25 },
      { width: 20 },
      { width: 15 },
      { width: 15 },
      { width: 20 },
    ];

    workbook.xlsx.writeBuffer().then((buffer) => {
      saveAs(
        new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
        "my-print-jobs.xlsx"
      );
    });
  }

  // -------------------------------------------------------
  // UI
  // -------------------------------------------------------
  return (
    <div className="printlog-container">
      <h2 className="printlog-title">My Print Jobs</h2>

      {isEditing && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <EditPrintJobForm
              formData={editForm}
              filaments={filaments}
              onChange={handleEditChange}
              onCancel={closeEditModal}
              onSubmit={handleEditSubmit}
              editingId={editForm.id}
            />
          </div>
        </div>
      )}

      {printJobs.length === 0 ? (
        <p className="no-printjobs-message">No print jobs found.</p>
      ) : (
        <>
          <div style={{ marginBottom: "8px", textAlign: "right" }}>
            <button className="export-excel-btn" onClick={exportToExcel}>
              <i className="bi bi-file-earmark-excel-fill"></i> Export
            </button>
          </div>

          <table className="printlog-table">
            <thead>
              <tr>
                <th>Job Name</th>
                <th>Filament</th>
                <th>Status</th>
                <th>Duration</th>
                <th>Created At</th>
                <th className="actions-cell">Edit</th>
                <th className="actions-cell">Delete</th>
              </tr>
            </thead>
            <tbody>
              {currentJobs.map((job) => (
                <tr key={job.id}>
                  <td>{job.jobName}</td>
                  <td>{job.filamentName || "-"}</td>
                  <td>
                    <span className={`printlog-status printlog-status-${job.status.toLowerCase().replace(" ", "-")}`}>
                      {job.status}
                    </span>
                  </td>
                  <td>{job.duration || "-"}</td>
                  <td>{formatDate(job.createdAt)}</td>
                  <td className="actions-cell">
                    <button onClick={() => openEditModal(job)} className="printlog-icon-btn edit">
                      <MdEdit />
                    </button>
                  </td>
                  <td className="actions-cell">
                    <button onClick={() => showDeleteConfirm(job.id)} className="printlog-icon-btn delete">
                      <MdDelete />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </>
      )}
    </div>
  );
}