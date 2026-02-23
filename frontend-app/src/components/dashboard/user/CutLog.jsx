import React, { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { FaEdit, FaTrash, FaClipboardList, FaCalendarAlt, FaPrint, FaFlask, FaCheckCircle, FaPauseCircle } from "react-icons/fa";
import { HiScissors } from "react-icons/hi2";
import EditCutJobForm from "./EditCutJobForm";
import CutJobDetailsModal from "./CutJobDetailsModal";

import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import api from "../../../utils/axiosClient";
import Preloader from "../../common/Preloader";
import "../../styles/PrintLog.css";

export default function UserCutLog() {
    const { t, i18n } = useTranslation();
    const [cutJobs, setCutJobs] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        id: null,
        jobName: "",
        materialId: "",
        status: "Pending",
        duration: "",
        description: "",
    });
    const [loading, setLoading] = useState(true);

    const [searchParams, setSearchParams] = useSearchParams();

    const [materials, setMaterials] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState(searchParams.get("status") || "");
    const toastIdRef = useRef(null);

    const [selectedJobId, setSelectedJobId] = useState(null);

    function openDetails(jobId) {
        setSelectedJobId(jobId);
    }

    function closeDetails() {
        setSelectedJobId(null);
    }

    // -------------------------------------------------------
    // Merge materials into cutJob list
    // -------------------------------------------------------
    function mergeJobsWithMaterialNames(jobs, materials) {
        const materialMap = {};
        materials.forEach(m => { materialMap[m.id] = m.name; });

        return jobs.map(job => ({
            ...job,
            materialName: materialMap[job.materialId] || "-"
        }));
    }

    // -------------------------------------------------------
    // FETCH DATA (axios)
    // -------------------------------------------------------
    async function fetchData() {
        setLoading(true);
        try {
            const [resJobs, resMaterials] = await Promise.all([
                api.get("/cutjob/my"),
                api.get("/materialsuser"),
            ]);

            setMaterials(resMaterials.data);
            setCutJobs(mergeJobsWithMaterialNames(resJobs.data, resMaterials.data));
        } catch (err) {
            toast.error(err?.response?.data?.message || t('toasts.loadDataFailed'));
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchData();
    }, []);

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

            // Refresh jobs after update
            const [resJobs, resMaterials] = await Promise.all([
                api.get("/cutjob/my"),
                api.get("/materialsuser"),
            ]);

            setMaterials(resMaterials.data);
            setCutJobs(mergeJobsWithMaterialNames(resJobs.data, resMaterials.data));
            closeEditModal();
        } catch (err) {
            toast.error(err?.response?.data?.error || t('toasts.updateCutJobFailed'));
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

    // -------------------------------------------------------
    // DRAG AND DROP HANDLERS
    // -------------------------------------------------------
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
                duration: job.duration, // Keep existing duration
                description: job.description, // Keep existing description
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

    // -------------------------------------------------------
    // FORMATTERS
    // -------------------------------------------------------
    function getStatusTranslation(status) {
        // Hardcoded fallback if keys missing
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
            year: "numeric"
        });
    }

    // -------------------------------------------------------
    // EXPORT TO EXCEL
    // -------------------------------------------------------
    function exportToExcel() {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("My Cut Jobs");

        const header = ["Job Name", "Material", "Status", "Duration", "Created At"];
        const headerRow = worksheet.addRow(header);

        headerRow.eachCell((cell) => {
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FF4374BA" },
            };
            cell.font = { bold: true, size: 12, color: { argb: "FFFFFFFF" } };
        });

        cutJobs.forEach((job) => {
            worksheet.addRow([
                job.jobName,
                job.materialName || "-",
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
                "my-cut-jobs.xlsx"
            );
        });
    }

    if (loading) return <Preloader />;

    // -------------------------------------------------------
    // UI
    // -------------------------------------------------------
    return (
        <div className="printlog-container">
            <h2 className="printlog-title">{t('cutLogs.myTitle')}</h2>

            {selectedJobId && (
                <CutJobDetailsModal
                    jobId={selectedJobId}
                    onClose={closeDetails}
                    onUpdate={fetchData}
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

            <div style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
                        <option value="">{t('common.all')}</option>
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
                    <i className="bi bi-file-earmark-excel-fill"></i> {t('cutLogs.export')}
                </button>
            </div>

            <div className="kanban-board">
                {["Pending", "Meetings", "In Progress", "Testing", "Completed", "Paused"].map((columnStatus) => {
                    const columnJobs = cutJobs.filter((job) => {
                        if (selectedStatus && job.status !== selectedStatus) return false;

                        if (columnStatus === "Pending") return job.status === "Pending" || job.status === "Waiting";
                        if (columnStatus === "In Progress") return job.status === "In Progress" || job.status === "Preparing" || job.status === "File Ready" || job.status === "Machine Setup" || job.status === "Cutting" || job.status === "Cooling" || job.status === "Post-Processing";
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
                                        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                                            <span className="job-name">{job.jobName}</span>
                                            {job.materialName && (
                                                <div className="card-tag">
                                                    {job.materialName}
                                                </div>
                                            )}
                                        </div>
                                        <div className="card-body">
                                            <div className="card-footer">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div className="user-avatar-mini" title={job.user?.fullName}>
                                                        {job.user?.fullName ? job.user.fullName.charAt(0).toUpperCase() : '?'}
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                                                        <span style={{ fontSize: '10px', color: '#666', fontWeight: 600 }}>{job.user?.fullName}</span>
                                                        <span className="card-date">{formatDate(job.createdAt)}</span>
                                                    </div>
                                                </div>

                                                {/* Only show edit/delete if status is Pending */}
                                                {job.status === "Pending" && (
                                                    <div className="card-actions" style={{ display: 'flex', gap: '4px' }}>
                                                        <button onClick={(e) => { e.stopPropagation(); showDeleteConfirm(job.id); }} className="icon-btn delete">
                                                            <FaTrash />
                                                        </button>
                                                    </div>
                                                )}
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
