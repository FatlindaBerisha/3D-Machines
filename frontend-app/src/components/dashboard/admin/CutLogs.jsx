import React, { useEffect, useState, useRef } from "react";
import ReactDOM from "react-dom";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import Pagination from "../Pagination";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import api from "../../../utils/axiosClient";
import "../../styles/PrintFilament.css";

export default function AdminCutLogs() {
    const { t, i18n } = useTranslation();
    const [cutJobs, setCutJobs] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState(new Set());
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const jobsPerPage = 5;
    const dropdownRef = useRef();
    const iconRef = useRef(null);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
    const [materials, setMaterials] = useState([]);

    useEffect(() => {
        async function loadData() {
            try {
                const [jobsRes, userRes, materialRes] = await Promise.all([
                    api.get("/cutjob"),
                    api.get("/user"),
                    api.get("/material"),
                ]);

                setCutJobs(jobsRes.data);
                setUsers(userRes.data);
                setMaterials(materialRes.data);
            } catch (err) {
                toast.error(t('toasts.loadDataFailed'));
            }
        }

        loadData();
    }, [t]);

    function translateMaterialName(name) {
        if (!name) return "-";
        const map = {
            "Laser Cutting": "cuttingTypes.laser",
            "CNC Cutting": "cuttingTypes.cnc",
            "Waterjet Cutting": "cuttingTypes.waterjet",
            "Plasma Cutting": "cuttingTypes.plasma",
            "Manual / Mechanical Cutting": "cuttingTypes.manual"
        };
        return map[name] ? t(map[name]) : name;
    }

    function getMaterialNameById(id) {
        const mat = materials.find((m) => m.id === id);
        return mat ? translateMaterialName(mat.name) : "-";
    }

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    function toggleUserDropdown() {
        if (!showUserDropdown && iconRef.current) {
            const rect = iconRef.current.getBoundingClientRect();
            setDropdownPos({
                top: rect.bottom + window.scrollY + 6,
                left: rect.left + window.scrollX,
            });
        }
        setShowUserDropdown((prev) => !prev);
    }

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

    function handleUserCheckboxChange(userId) {
        setSelectedUsers((prev) => {
            const updated = new Set(prev);
            updated.has(userId) ? updated.delete(userId) : updated.add(userId);
            return updated;
        });
        setCurrentPage(1);
    }

    const filteredCutJobs =
        selectedUsers.size === 0
            ? cutJobs
            : cutJobs.filter((job) =>
                selectedUsers.has(job.userId || job.user?.id)
            );

    const totalPages = Math.ceil(filteredCutJobs.length / jobsPerPage);
    const currentJobs = filteredCutJobs.slice(
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

    function getStatusTranslation(status) {
        const statusMap = {
            "Pending": t('common.pending'),
            "In Progress": t('common.inProgress'),
            "Completed": t('common.completed')
        };
        return statusMap[status] || status;
    }

    function formatDate(dateString) {
        if (!dateString) return "-";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "-";

        const locale = i18n.language === 'sq' ? 'sq-AL' : i18n.language === 'de' ? 'de-DE' : 'en-GB';
        return date.toLocaleDateString(locale, {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    }

    function exportToExcel() {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Cut Jobs");

        const header = ["User", "Job Name", "Material", "Status", "Duration", "Created At"];
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

        const sortedJobs = [...filteredCutJobs].sort((a, b) =>
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
                job.materialName || job.material?.name || getMaterialNameById(job.materialId),
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
                "all-cut-jobs.xlsx"
            );
        });
    }

    return (
        <div className="printjobs-container">
            <h2 className="printjobs-title">{t('cutLogs.title')}</h2>

            {cutJobs.length === 0 ? (
                <p className="no-printjobs-message">{t('cutLogs.noCutJobs')}</p>
            ) : (
                <>
                    <div style={{ marginBottom: "8px", textAlign: "right" }}>
                        <button
                            className="export-excel-btn"
                            onClick={exportToExcel}
                            title={t('cutLogs.exportToExcel')}
                        >
                            <i className="bi bi-file-earmark-excel-fill"></i> {t('cutLogs.export')}
                        </button>
                    </div>

                    <table className="printjobs-table">
                        <thead>
                            <tr>
                                <th>
                                    <div className="printjobs-user-filter">
                                        {t('cutLogs.user')}
                                        <span
                                            style={{ marginLeft: '10px' }}
                                            ref={iconRef}
                                            onClick={toggleUserDropdown}
                                            className="printjobs-filter-icon"
                                            title={t('cutLogs.filterUsers')}
                                            role="button"
                                            tabIndex={0}
                                            onKeyPress={(e) => {
                                                if (e.key === "Enter" || e.key === " ") toggleUserDropdown();
                                            }}
                                        >
                                            <i className="bi bi-arrow-down-circle-fill"></i>
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

                                <th>{t('cutLogs.jobName')}</th>
                                <th>{t('cutLogs.material')}</th>
                                <th>{t('cutLogs.status')}</th>
                                <th>{t('cutLogs.duration')}</th>
                                <th>{t('cutLogs.createdAt')}</th>
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
                                        {translateMaterialName(
                                            job.materialName ||
                                            job.material?.name ||
                                            materials.find((m) => m.id === job.materialId)?.name
                                        )}
                                    </td>

                                    <td>
                                        <span
                                            className={`printlog-status printlog-status-${(job.status || job.Status || "")
                                                .toLowerCase()
                                                .replace(" ", "-")
                                                }`}
                                        >
                                            {getStatusTranslation(job.status || job.Status || "-")}
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
