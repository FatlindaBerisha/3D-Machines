import React, { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import { MdDownload, MdSearch } from "react-icons/md";
import { useTranslation } from "react-i18next";
import api from "../../../utils/axiosClient";
import "../../styles/PrintFilament.css";

export default function UserCutProjects() {
    const { t } = useTranslation();
    const [projects, setProjects] = useState([]);
    const [search, setSearch] = useState("");
    const [showSearch, setShowSearch] = useState(false);
    const [page, setPage] = useState(1);

    const pageSize = 5;

    const fetchProjects = useCallback(async () => {
        try {
            const res = await api.get("/cutprojects");
            setProjects(res.data);
        } catch (err) {
            toast.error(err?.response?.data?.message || "Failed to fetch cutting projects");
        }
    }, []);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    const filteredProjects = projects
        .filter(
            (p) =>
                p.moduleName.toLowerCase().includes(search.toLowerCase()) ||
                p.fileName.toLowerCase().includes(search.toLowerCase())
        )
        .sort((a, b) => a.moduleName.localeCompare(b.moduleName));

    const totalPages = Math.ceil(filteredProjects.length / pageSize);
    const paginatedProjects = filteredProjects.slice(
        (page - 1) * pageSize,
        page * pageSize
    );

    const handleDownload = async (id, fileName) => {
        try {
            const res = await api.get(`/cutprojects/${id}/download`, {
                responseType: "blob",
            });

            const blob = new Blob([res.data]);
            const url = window.URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = fileName;
            a.click(); // Keep this line to trigger download
            // The provided Code Edit had `document.body.removeChild(link);` here,
            // but the original code does not append 'a' to the body, so removing it would cause an error.
            // Keeping `a.click()` as it's the functional part of the original download logic.
            window.URL.revokeObjectURL(url);

            toast.success(t('toasts.downloadSuccess'));
        } catch (err) {
            console.error("Download error:", err); // Added from Code Edit
            toast.error(t('toasts.downloadFailed'));
        }
    };

    return (
        <div className="filament-container">
            <h2 className="filament-title">Cutting Projects</h2>

            <div
                className="search-bar"
                style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}
            >
                <button
                    onClick={() => setShowSearch((v) => !v)}
                    style={{
                        background: "#f0f0f0",
                        border: "none",
                        borderRadius: "50%",
                        padding: 8,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: showSearch ? "0 0 0 2px #3f51b5" : "none",
                        transition: "box-shadow 0.2s",
                    }}
                    title="Search"
                >
                    <MdSearch style={{ fontSize: 22, color: "#3f51b5" }} />
                </button>

                {showSearch && (
                    <input
                        type="text"
                        placeholder="Search projects..."
                        value={search}
                        autoFocus
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                        style={{
                            padding: 8,
                            width: 250,
                            borderRadius: 6,
                            border: "1px solid #3f51b5",
                            fontSize: 16,
                            outline: "none",
                            transition: "border-color 0.2s",
                        }}
                    />
                )}
            </div>

            {paginatedProjects.length === 0 ? (
                <p className="no-filaments-message">{t('projects.noProjects')}</p>
            ) : (
                <>
                    <div className="filament-table-wrapper">
                        <table className="filament-table">
                            <thead>
                                <tr>
                                    <th>{t('projects.moduleName')}</th>
                                    <th>{t('projects.file')}</th>
                                    <th>{t('projects.downloads')}</th>
                                    <th className="download-header">{t('projects.downloads')}</th>
                                </tr>
                            </thead>

                            <tbody>
                                {paginatedProjects.map((p) => (
                                    <tr key={p.id}>
                                        <td>{p.moduleName}</td>
                                        <td>{p.fileName}</td>
                                        <td>{p.downloadCount}</td>
                                        <td>
                                            <button
                                                onClick={() => handleDownload(p.id, p.fileName)}
                                                className="download"
                                            >
                                                <MdDownload style={{ fontSize: 22, marginRight: 6 }} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className="pagination-wrapper">
                            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                                &lt;
                            </button>

                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i}
                                    className={page === i + 1 ? "active" : ""}
                                    onClick={() => setPage(i + 1)}
                                >
                                    {i + 1}
                                </button>
                            ))}

                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                            >
                                &gt;
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
