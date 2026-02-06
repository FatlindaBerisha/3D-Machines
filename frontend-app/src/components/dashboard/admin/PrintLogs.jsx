import React, { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { FaEdit, FaTrash, FaClipboardList, FaCalendarAlt, FaPrint, FaFlask, FaCheckCircle, FaPauseCircle } from "react-icons/fa";
import EditPrintJobForm from "../user/EditPrintJobForm";
import PrintJobDetailsModal from "../user/PrintJobDetailsModal";

import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import api from "../../../utils/axiosClient";
import "../../styles/PrintLog.css";

export default function PrintLogs() {
  const { t, i18n } = useTranslation();
  const [printJobs, setPrintJobs] = useState([]);
  const [users, setUsers] = useState([]);
  const [filaments, setFilaments] = useState([]);

  const [searchParams, setSearchParams] = useSearchParams();

  // Filtering
  const [selectedUser, setSelectedUser] = useState(""); // User ID to filter by, "" for all
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get("status") || "");

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    id: null,
    jobName: "",
    filamentId: "",
    status: "Pending",
    duration: "",
    description: "",
  });

  const toastIdRef = useRef(null);
  const [selectedJobId, setSelectedJobId] = useState(null);

  function openDetails(jobId) {
    setSelectedJobId(jobId);
  }

  function closeDetails() {
    setSelectedJobId(null);
  }

  // FETCH DATA (axios)
  async function loadData() {
    try {
      const [jobsRes, userRes, filamentRes] = await Promise.all([
        api.get("/printjob"),
        api.get("/user"),
        api.get("/filament"),
      ]);

      // Merge data for easier display
      const filamentMap = {};
      filamentRes.data.forEach(f => filamentMap[f.id] = f.name);

      const userMap = {};
      userRes.data.forEach(u => userMap[u.id] = u.fullName || u.username);

      const jobsWithDetails = jobsRes.data.map(job => ({
        ...job,
        filamentName: filamentMap[job.filamentId] || "-",
        userFullName: userMap[job.userId] || job.user?.fullName || "Unknown"
      }));

      setPrintJobs(jobsWithDetails);
      setUsers(userRes.data);
      setFilaments(filamentRes.data);
    } catch (err) {
      toast.error(t('toasts.loadDataFailed'));
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // ------------------------------
  // FILTER
  // ------------------------------
  const filteredJobs = printJobs.filter(j => {
    const userMatch = selectedUser ? j.userId === parseInt(selectedUser, 10) : true;
    const statusMatch = selectedStatus ? j.status === selectedStatus : true;
    return userMatch && statusMatch;
  });

  // EDIT MODAL OPEN
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
      description: job.description || "",
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
      description: "",
    });
  }

  // Edit Form Change
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

  // SUBMIT EDIT (axios)
  async function handleEditSubmit(e) {
    e.preventDefault();

    if (!editForm.jobName.trim()) return toast.error(t('toasts.jobNameRequired'));
    if (!editForm.filamentId) return toast.error(t('toasts.selectFilament'));

    if (editForm.duration && (isNaN(editForm.duration) || editForm.duration < 0)) {
      return toast.error(t('toasts.durationPositive'));
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
      description: editForm.description,
    };

    try {
      await api.put(`/printjob/${editForm.id}`, payload);
      toast.success(t('toasts.printJobUpdated'));

      loadData(); // Reload all data
      closeEditModal();
    } catch (err) {
      toast.error(err?.response?.data?.error || t('toasts.printJobUpdateFailed'));
    }
  }

  // DELETE (axios)
  function showDeleteConfirm(id) {
    if (toastIdRef.current) {
      toast.dismiss(toastIdRef.current);
      toastIdRef.current = null;
    }

    toastIdRef.current = toast.info(
      <div className="toast-confirmation">
        <p>{t('printLogs.deleteConfirm')}</p>
        <div className="btn-group">
          <button
            className="confirm-yes"
            onClick={() => {
              handleDelete(id);
              toast.dismiss(toastIdRef.current);
              toastIdRef.current = null;
            }}
          >
            {t('printLogs.yes')}
          </button>
          <button
            className="confirm-no"
            onClick={() => {
              toast.dismiss(toastIdRef.current);
              toastIdRef.current = null;
            }}
          >
            {t('printLogs.no')}
          </button>
        </div>
      </div>,
      { autoClose: false, closeOnClick: false, closeButton: false, icon: true }
    );
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/printjob/${id}`);
      toast.success(t('toasts.printJobDeleted'));
      setPrintJobs(prev => prev.filter(job => job.id !== id));
    } catch (err) {
      toast.error(t('toasts.printJobDeleteFailed'));
    }
  }

  // DRAG AND DROP HANDLERS
  function handleDragStart(e, jobId) {
    e.dataTransfer.setData("jobId", jobId);
  }

  async function handleDrop(e, newStatus) {
    e.preventDefault();
    const jobId = parseInt(e.dataTransfer.getData("jobId"), 10);
    const job = printJobs.find((j) => j.id === jobId);

    if (!job || job.status === newStatus) return;

    // Optimistic Update
    const originalStatus = job.status;
    setPrintJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, status: newStatus } : j))
    );

    try {
      const payload = {
        id: job.id,
        jobName: job.jobName,
        filamentId: job.filamentId,
        status: newStatus,
        duration: job.duration,
        description: job.description,
      };

      await api.put(`/printjob/${job.id}`, payload);
      toast.success(t('toasts.statusUpdated'));
    } catch (err) {
      // Revert on failure
      setPrintJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, status: originalStatus } : j))
      );
      toast.error(t('toasts.statusUpdateFailed'));
    }
  }

  // FORMATTERS
  function getStatusTranslation(status) {
    if (status === "Pending") return t('kanban.todo') || "ToDo";
    if (status === "In Progress") return t('kanban.inProgress') || "In Progress";
    if (status === "Testing") return t('kanban.testing') || "Testing";
    if (status === "Completed") return t('kanban.done') || "Done";
    if (status === "Paused") return t('kanban.onHold') || "On Hold";
    if (status === "Meetings") return t('kanban.meetings') || "Meetings";
    return status;
  }

  function getStatusIcon(status) {
    const style = { color: 'white', marginRight: '8px', fontSize: '18px' };
    if (status === "Pending") return <FaClipboardList style={style} />;
    if (status === "Meetings") return <FaCalendarAlt style={style} />;
    if (status === "In Progress") return <FaPrint style={style} />;
    if (status === "Testing") return <FaFlask style={style} />;
    if (status === "Completed") return <FaCheckCircle style={style} />;
    if (status === "Paused") return <FaPauseCircle style={style} />;
    return null;
  }

  function formatDate(dateStr) {
    if (!dateStr) return "-";
    const locale = i18n.language === 'sq' ? 'sq-AL' : i18n.language === 'de' ? 'de-DE' : 'en-GB';
    return new Date(dateStr).toLocaleDateString(locale, {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  // EXPORT TO EXCEL
  function exportToExcel() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(t('printLogs.title') || "All Print Jobs");

    const header = [
      t('printLogs.user'),
      t('printLogs.jobName'),
      t('printLogs.filament'),
      t('printLogs.status'),
      t('printLogs.duration'),
      t('printLogs.createdAt')
    ];
    const headerRow = worksheet.addRow(header);

    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4374BA" },
      };
      cell.font = { bold: true, size: 12, color: { argb: "FFFFFFFF" } };
    });

    filteredJobs.forEach((job) => {
      worksheet.addRow([
        job.userFullName,
        job.jobName,
        job.filamentName,
        getStatusTranslation(job.status),
        job.durationFormatted || "-",
        formatDate(job.createdAt),
      ]);
    });

    worksheet.columns = [
      { width: 25 },
      { width: 25 },
      { width: 20 },
      { width: 15 },
      { width: 15 },
      { width: 20 },
    ];

    workbook.xlsx.writeBuffer().then((buffer) => {
      saveAs(
        new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
        "admin-print-jobs.xlsx"
      );
    });
  }

  // UI
  return (
    <div className="printlog-container">
      <div className="admin-header-controls" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px', gap: '20px' }}>
        <h2 className="printlog-title" style={{ margin: 0 }}>
          {t('printLogs.title')}
        </h2>

        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <select
              className="user-filter-select"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '5px', border: '1px solid #ccc', minWidth: '180px', fontSize: '14px', cursor: 'pointer' }}
            >
              <option value="" hidden>{t('common.all')}</option>
              {users
                .sort((a, b) => (a.fullName || "").localeCompare(b.fullName || ""))
                .map(u => (
                  <option key={u.id} value={u.id}>{u.fullName}</option>
                ))}
            </select>
            {selectedUser && (
              <button
                onClick={() => setSelectedUser("")}
                className="icon-btn"
                title={t('common.all')}
                style={{ padding: '8px', color: '#666', background: '#f8f9fa', border: '1px solid #ddd', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <i className="bi bi-x-lg" style={{ fontSize: '14px' }}></i>
              </button>
            )}

            <select
              className="status-filter-select"
              value={selectedStatus}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedStatus(val);
                if (val) searchParams.set("status", val);
                else searchParams.delete("status");
                setSearchParams(searchParams);
              }}
              style={{ padding: '8px 12px', borderRadius: '5px', border: '1px solid #ccc', minWidth: '150px', fontSize: '14px', cursor: 'pointer' }}
            >
              <option value="">{t('common.allStatuses') || "All Statuses"}</option>
              {["Pending", "Meetings", "In Progress", "Testing", "Completed", "Paused"].map(s => (
                <option key={s} value={s}>{getStatusTranslation(s)}</option>
              ))}
            </select>
            {selectedStatus && (
              <button
                onClick={() => {
                  setSelectedStatus("");
                  searchParams.delete("status");
                  setSearchParams(searchParams);
                }}
                className="icon-btn"
                title={t('common.all')}
                style={{ padding: '8px', color: '#666', background: '#f8f9fa', border: '1px solid #ddd', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <i className="bi bi-x-lg" style={{ fontSize: '14px' }}></i>
              </button>
            )}
          </div>

          <button className="export-excel-btn" onClick={exportToExcel} style={{ marginBottom: 0 }}>
            <i className="bi bi-file-earmark-excel-fill"></i> {t('printLogs.export')}
          </button>
        </div>
      </div>

      {selectedJobId && (
        <PrintJobDetailsModal
          jobId={selectedJobId}
          onClose={closeDetails}
          onUpdate={loadData}
        />
      )}

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

      <div className="kanban-board">
        {["Pending", "Meetings", "In Progress", "Testing", "Completed", "Paused"].map((columnStatus) => {
          const columnJobs = filteredJobs.filter((job) => {
            if (columnStatus === "Pending") return job.status === "Pending" || job.status === "Waiting";
            if (columnStatus === "In Progress") return job.status === "In Progress" || job.status === "Preparing" || job.status === "Printing" || job.status === "Post-Processing";
            if (columnStatus === "Completed") return job.status === "Completed" || job.status === "Done";
            if (columnStatus === "Paused") return job.status === "Paused" || job.status === "Failed";
            return job.status === columnStatus;
          });

          return (
            <div
              key={columnStatus}
              className={`kanban-column column-${columnStatus.toLowerCase().replace(" ", "-")}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, columnStatus)}
            >
              <h3>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {getStatusIcon(columnStatus)}
                  {getStatusTranslation(columnStatus)}
                </div>
                <span>({columnJobs.length})</span>
              </h3>
              <div className="kanban-column-content">
                {columnJobs.map((job) => (
                  <div
                    key={job.id}
                    className="kanban-card"
                    draggable
                    onDragStart={(e) => handleDragStart(e, job.id)}
                    onClick={() => openDetails(job.id)}
                  >
                    <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span className="job-name">{job.jobName}</span>
                      <div className="card-actions" style={{ display: 'flex', gap: '4px', minWidth: '50px', justifyContent: 'flex-end' }}>
                        <button onClick={(e) => { e.stopPropagation(); openEditModal(job); }} className="icon-btn edit">
                          <FaEdit />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); showDeleteConfirm(job.id); }} className="icon-btn delete">
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                    <div className="card-body">
                      {job.filamentName && (
                        <div className="card-tag">
                          {job.filamentName}
                        </div>
                      )}

                      <div className="card-footer">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span className="card-date">{formatDate(job.createdAt)}</span>
                          <span style={{ fontSize: '10px', color: '#666', fontWeight: 600 }}>{job.userFullName}</span>
                        </div>
                        <div className="user-avatar-mini" title={job.userFullName}>
                          {job.userFullName ? job.userFullName.split(' ').map(n => n[0]).join('').toUpperCase() : '?'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}