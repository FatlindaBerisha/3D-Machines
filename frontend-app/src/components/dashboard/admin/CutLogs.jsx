import React, { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { FaEdit, FaTrash, FaClipboardList, FaCalendarAlt, FaPrint, FaFlask, FaCheckCircle, FaPauseCircle, FaFilter } from "react-icons/fa";
import { HiScissors } from "react-icons/hi2";
import EditCutJobForm from "../user/EditCutJobForm";
import CutJobDetailsModal from "../user/CutJobDetailsModal";

import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import api from "../../../utils/axiosClient";
// Preloader import removed
import "../../styles/PrintLog.css";

export default function AdminCutLogs() {
    const { t, i18n } = useTranslation();
    const [cutJobs, setCutJobs] = useState([]);
    const [users, setUsers] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);

    const [searchParams, setSearchParams] = useSearchParams();

    // Filtering
    const [selectedUser, setSelectedUser] = useState(""); // User ID to filter by, "" for all
    const [selectedStatus, setSelectedStatus] = useState(searchParams.get("status") || "");
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const filterMenuRef = useRef(null);

    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        id: null,
        jobName: "",
        materialId: "",
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
        setLoading(true);
        try {
            const [jobsRes, userRes, materialRes] = await Promise.all([
                api.get("/cutjob"),
                api.get("/user"),
                api.get("/material"),
            ]);

            // Merge data for easier display
            const materialMap = {};
            materialRes.data.forEach(m => materialMap[m.id] = m.name);

            const userMap = {};
            userRes.data.forEach(u => userMap[u.id] = u.fullName || u.username);

            const jobsWithDetails = jobsRes.data.map(job => ({
                ...job,
                materialName: materialMap[job.materialId] || "-",
                userFullName: userMap[job.userId] || job.user?.fullName || "Unknown"
            }));

            setCutJobs(jobsWithDetails);
            setUsers(userRes.data);
            setMaterials(materialRes.data);
        } catch (err) {
            toast.error(t('toasts.loadDataFailed'));
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, []);

    // Click outside to close filter menu
    useEffect(() => {
        function handleClickOutside(event) {
            if (filterMenuRef.current && !filterMenuRef.current.contains(event.target)) {
                setShowFilterMenu(false);
            }
        }
        if (showFilterMenu) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showFilterMenu]);

    // ------------------------------
    // FILTER
    // ------------------------------
    // Helper helper to check if job belongs to a main category
    function isJobInStatusCategory(job, category) {
        if (category === "Pending") return job.status === "Pending" || job.status === "Waiting";
        if (category === "Meetings") return job.status === "Meetings";
        if (category === "In Progress") {
            return ["In Progress", "Preparing", "File Ready", "Toolpath Ready", "Machine Setup", "Cutting", "Finishing", "Cooling", "Post-Processing"].includes(job.status);
        }
        if (category === "Testing") return job.status === "Testing";
        if (category === "Completed") return job.status === "Completed" || job.status === "Done";
        if (category === "Paused") return ["Paused", "Failed", "Recut Needed"].includes(job.status);
        return job.status === category;
    }

    const filteredJobs = cutJobs.filter(j => {
        const userMatch = selectedUser ? j.userId === parseInt(selectedUser, 10) : true;
        const statusMatch = selectedStatus ? isJobInStatusCategory(j, selectedStatus) : true;
        return userMatch && statusMatch;
    });

    const allColumns = ["Pending", "Meetings", "In Progress", "Testing", "Completed", "Paused"];
    const visibleColumns = selectedStatus ? [selectedStatus] : allColumns;

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
            materialId: String(job.materialId),
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
            materialId: "",
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
        if (!editForm.materialId) return toast.error(t('toasts.selectMaterial'));

        if (editForm.duration && (isNaN(editForm.duration) || editForm.duration < 0)) {
            return toast.error(t('toasts.durationPositive'));
        }

        const payload = {
            id: editForm.id,
            jobName: editForm.jobName,
            materialId: Number(editForm.materialId),
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
            await api.put(`/cutjob/${editForm.id}`, payload);
            toast.success(t('toasts.cutJobUpdated'));

            loadData(); // Reload all data
            closeEditModal();
        } catch (err) {
            toast.error(err?.response?.data?.error || t('toasts.updateCutJobFailed'));
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
                <p>{t('cutLogs.deleteConfirm')}</p>
                <div className="btn-group">
                    <button
                        className="confirm-yes"
                        onClick={() => {
                            handleDelete(id);
                            toast.dismiss(toastIdRef.current);
                            toastIdRef.current = null;
                        }}
                    >
                        {t('cutLogs.yes')}
                    </button>
                    <button
                        className="confirm-no"
                        onClick={() => {
                            toast.dismiss(toastIdRef.current);
                            toastIdRef.current = null;
                        }}
                    >
                        {t('cutLogs.no')}
                    </button>
                </div>
            </div>,
            { autoClose: false, closeOnClick: false, closeButton: false, icon: true }
        );
    }

    async function handleDelete(id) {
        try {
            await api.delete(`/cutjob/${id}`);
            toast.success(t('toasts.cutJobDeleted'));
            setCutJobs(prev => prev.filter(job => job.id !== id));
        } catch (err) {
            toast.error(t('toasts.deleteCutJobFailed'));
        }
    }

    // DRAG AND DROP HANDLERS
    function handleDragStart(e, jobId) {
        e.dataTransfer.setData("jobId", jobId);
    }

    async function handleDrop(e, newStatus) {
        e.preventDefault();
        const jobId = parseInt(e.dataTransfer.getData("jobId"), 10);
        const job = cutJobs.find((j) => j.id === jobId);

        if (!job || job.status === newStatus) return;

        // Optimistic Update
        const originalStatus = job.status;
        setCutJobs((prev) =>
            prev.map((j) => (j.id === jobId ? { ...j, status: newStatus } : j))
        );

        try {
            const payload = {
                id: job.id,
                jobName: job.jobName,
                materialId: job.materialId,
                status: newStatus,
                duration: job.duration,
                description: job.description,
            };

            await api.put(`/cutjob/${job.id}`, payload);
            toast.success(t('toasts.statusUpdated'));
        } catch (err) {
            // Revert on failure
            setCutJobs((prev) =>
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
        if (status === "In Progress") return <HiScissors style={style} />;
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
        const worksheet = workbook.addWorksheet(t('cutLogs.title') || "All Cut Jobs");

        const header = [
            t('cutLogs.user'),
            t('cutLogs.jobName'),
            t('cutLogs.material'),
            t('cutLogs.status'),
            t('cutLogs.duration'),
            t('cutLogs.createdAt')
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
                job.materialName,
                getStatusTranslation(job.status),
                job.duration || "-",
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
                "admin-cut-jobs.xlsx"
            );
        });
    }

    // Preloader removed per user request
    // if (loading) return <Preloader />;

    // UI
    return (
        <div className="printlog-container">
            <div className="admin-header-controls" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px', gap: '20px' }}>
                <h2 className="printlog-title" style={{ margin: 0 }}>
                    {t('cutLogs.title')}
                </h2>

                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }} ref={filterMenuRef}>
                        <button
                            onClick={() => setShowFilterMenu(!showFilterMenu)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 16px',
                                borderRadius: '6px',
                                border: '1.5px solid #3f51b5',
                                backgroundColor: 'white',
                                color: '#3f51b5',
                                fontWeight: '600',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            <FaFilter />
                            {t('common.filter')}
                        </button>

                        {showFilterMenu && (
                            <div
                                style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    marginTop: '8px',
                                    background: 'white',
                                    border: '1.5px solid #3f51b5',
                                    borderRadius: '6px',
                                    padding: '16px',
                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                                    zIndex: 50,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '16px',
                                    minWidth: '240px'
                                }}
                            >
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#000000', textTransform: 'uppercase', letterSpacing: '0.025em' }}>
                                        {t('common.user') || 'User'}
                                    </label>
                                    <select
                                        className="user-filter-select"
                                        value={selectedUser}
                                        onChange={(e) => setSelectedUser(e.target.value)}
                                        style={{
                                            padding: '8px 12px',
                                            borderRadius: '4px',
                                            border: '1.5px solid #3f51b5',
                                            fontSize: '14px',
                                            cursor: 'pointer',
                                            fontWeight: '500',
                                            backgroundColor: '#ffffff',
                                            color: '#000000',
                                            width: '100%'
                                        }}
                                    >
                                        <option value="" hidden>{t('common.allUsers')}</option>
                                        {users
                                            .sort((a, b) => (a.fullName || "").localeCompare(b.fullName || ""))
                                            .map(u => (
                                                <option key={u.id} value={u.id}>{u.fullName}</option>
                                            ))}
                                    </select>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#000000', textTransform: 'uppercase', letterSpacing: '0.025em' }}>
                                        {t('common.status') || 'Status'}
                                    </label>
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
                                        style={{
                                            padding: '8px 12px',
                                            borderRadius: '4px',
                                            border: '1.5px solid #3f51b5',
                                            fontSize: '14px',
                                            cursor: 'pointer',
                                            fontWeight: '500',
                                            backgroundColor: '#ffffff',
                                            color: '#000000',
                                            width: '100%'
                                        }}
                                    >
                                        <option value="">{t('common.allStatuses') || "All Statuses"}</option>
                                        {["Pending", "Meetings", "In Progress", "Testing", "Completed", "Paused"].map(s => (
                                            <option key={s} value={s}>{getStatusTranslation(s)}</option>
                                        ))}
                                    </select>
                                </div>

                                {(selectedUser || selectedStatus) && (
                                    <button
                                        onClick={() => {
                                            setSelectedUser("");
                                            setSelectedStatus("");
                                            searchParams.delete("status");
                                            setSearchParams(searchParams);
                                        }}
                                        style={{
                                            marginTop: '4px',
                                            padding: '10px',
                                            background: '#3f51b5',
                                            border: '1px solid #3f51b5',
                                            borderRadius: '4px',
                                            color: '#ffffff',
                                            fontSize: '13px',
                                            fontWeight: '700',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                        }}
                                        onMouseOver={(e) => e.target.style.opacity = '0.9'}
                                        onMouseOut={(e) => e.target.style.opacity = '1'}
                                    >
                                        {t('common.resetFilters')}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    <button className="export-excel-btn" onClick={exportToExcel} style={{ marginBottom: 0 }}>
                        <i className="bi bi-file-earmark-excel-fill"></i> {t('cutLogs.export')}
                    </button>
                </div>
            </div>

            {selectedJobId && (
                <CutJobDetailsModal
                    jobId={selectedJobId}
                    onClose={closeDetails}
                    onUpdate={loadData}
                />
            )}

            {isEditing && (
                <div className="modal-overlay" onClick={closeEditModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <EditCutJobForm
                            formData={editForm}
                            materials={materials}
                            onChange={handleEditChange}
                            onCancel={closeEditModal}
                            onSubmit={handleEditSubmit}
                            editingId={editForm.id}
                        />
                    </div>
                </div>
            )}

            <div className="kanban-board">
                {visibleColumns.map((columnStatus) => {
                    const columnJobs = filteredJobs.filter((job) => isJobInStatusCategory(job, columnStatus));

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
                                        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                                            <span className="job-name" title={job.jobName}>{job.jobName}</span>
                                            {job.materialName && (
                                                <div className="card-tag">
                                                    {job.materialName}
                                                </div>
                                            )}
                                        </div>
                                        <div className="card-body">
                                            <div className="card-footer">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div className="user-avatar-mini" title={job.userFullName}>
                                                        {job.userFullName ? job.userFullName.charAt(0).toUpperCase() : '?'}
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                                                        <span style={{ fontSize: '10px', color: '#666', fontWeight: 600 }}>{job.userFullName}</span>
                                                        <span className="card-date">{formatDate(job.createdAt)}</span>
                                                    </div>
                                                </div>
                                                <div className="card-actions" style={{ display: 'flex', gap: '4px' }}>
                                                    <button onClick={(e) => { e.stopPropagation(); showDeleteConfirm(job.id); }} className="icon-btn delete">
                                                        <FaTrash />
                                                    </button>
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
