import React, { useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { MdEdit, MdDelete } from "react-icons/md";
import EditCutJobForm from "./EditCutJobForm";
import Pagination from "../Pagination";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import api from "../../../utils/axiosClient";
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
    });

    const [materials, setMaterials] = useState([]);
    const toastIdRef = useRef(null);

    const [currentPage, setCurrentPage] = useState(1);
    const jobsPerPage = 5;

    function mergeJobsWithMaterialNames(jobs, materials) {
        const materialMap = {};
        materials.forEach(m => { materialMap[m.id] = m.name; });

        return jobs.map(job => ({
            ...job,
            materialName: materialMap[job.materialId] || "-"
        }));
    }

    useEffect(() => {
        async function fetchData() {
            try {
                const [resJobs, resMaterials] = await Promise.all([
                    api.get("/cutjob/my"),
                    api.get("/materialsuser"),
                ]);

                setMaterials(resMaterials.data);
                setCutJobs(mergeJobsWithMaterialNames(resJobs.data, resMaterials.data));
            } catch (err) {
                toast.error(t('toasts.loadDataFailed'));
            }
        }

        fetchData();
    }, [t]);

    const totalPages = Math.ceil(cutJobs.length / jobsPerPage);
    const indexOfLastJob = currentPage * jobsPerPage;
    const currentJobs = cutJobs.slice(indexOfLastJob - jobsPerPage, indexOfLastJob);

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
        });
    }

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

    async function handleEditSubmit(e) {
        e.preventDefault();

        if (!editForm.jobName.trim()) return toast.error(t('toasts.jobNameRequired'));
        if (!editForm.materialId) return toast.error("Please select a material");

        if (editForm.status === "Completed" && !editForm.duration) {
            return toast.error("Duration is required when status is Completed");
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
        };

        try {
            await api.put(`/cutjob/${editForm.id}`, payload);
            toast.success("Cut job updated!");

            const [resJobs, resMaterials] = await Promise.all([
                api.get("/cutjob/my"),
                api.get("/materialsuser"),
            ]);

            setMaterials(resMaterials.data);
            setCutJobs(mergeJobsWithMaterialNames(resJobs.data, resMaterials.data));
            closeEditModal();
        } catch (err) {
            toast.error("Failed to update cut job");
        }
    }

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
            toast.success("Cut job deleted!");
            setCutJobs(prev => prev.filter(job => job.id !== id));
        } catch (err) {
            toast.error("Failed to delete cut job");
        }
    }

    function getStatusTranslation(status) {
        const statusMap = {
            "Pending": t('common.pending'),
            "In Progress": t('common.inProgress'),
            "Completed": t('common.completed')
        };
        return statusMap[status] || status;
    }

    function formatDate(dateStr) {
        if (!dateStr) return "-";
        const locale = i18n.language === 'sq' ? 'sq-AL' : i18n.language === 'de' ? 'de-DE' : 'en-GB';
        return new Date(dateStr).toLocaleDateString(locale, {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    }

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

    return (
        <div className="printlog-container">
            <h2 className="printlog-title">{t('cutLogs.myTitle')}</h2>

            {isEditing && (
                <div className="modal-overlay" onClick={closeEditModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <EditCutJobForm
                            formData={editForm}
                            materials={materials}
                            onChange={handleEditChange}
                            onCancel={closeEditModal}
                            onSubmit={handleEditSubmit}
                        />
                    </div>
                </div>
            )}

            {cutJobs.length === 0 ? (
                <p className="no-printjobs-message">{t('cutLogs.noCutJobs')}</p>
            ) : (
                <>
                    <div style={{ marginBottom: "8px", textAlign: "right" }}>
                        <button className="export-excel-btn" onClick={exportToExcel}>
                            <i className="bi bi-file-earmark-excel-fill"></i> {t('cutLogs.export')}
                        </button>
                    </div>

                    <table className="printlog-table">
                        <thead>
                            <tr>
                                <th>{t('cutLogs.jobName')}</th>
                                <th>{t('cutLogs.material')}</th>
                                <th>{t('cutLogs.status')}</th>
                                <th>{t('cutLogs.duration')}</th>
                                <th>{t('cutLogs.createdAt')}</th>
                                <th className="actions-cell">{t('common.edit')}</th>
                                <th className="actions-cell">{t('common.delete')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentJobs.map((job) => (
                                <tr key={job.id}>
                                    <td>{job.jobName}</td>
                                    <td>{job.materialName || "-"}</td>
                                    <td>
                                        <span className={`printlog-status printlog-status-${job.status.toLowerCase().replace(" ", "-")}`}>
                                            {getStatusTranslation(job.status)}
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
