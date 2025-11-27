import React, { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import { MdDownload, MdSearch } from "react-icons/md";
import api from "../../../utils/axiosClient"; // <-- E RËNDËSISHME
import "../../styles/PrintFilament.css";

export default function UserProjects() {
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [page, setPage] = useState(1);

  const pageSize = 5;

  // ------------------------------------------------------------
  // FETCH PROJECTS (me axiosClient → refresh token automatik)
  // ------------------------------------------------------------
  const fetchProjects = useCallback(async () => {
    try {
      const res = await api.get("/projects");
      setProjects(res.data);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to fetch projects");
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // ------------------------------------------------------------
  // FILTER + SORT
  // ------------------------------------------------------------
  const filteredProjects = projects
    .filter(
      (p) =>
        p.moduleName.toLowerCase().includes(search.toLowerCase()) ||
        p.fileName.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => a.moduleName.localeCompare(b.moduleName));

  // Pagination
  const totalPages = Math.ceil(filteredProjects.length / pageSize);
  const paginatedProjects = filteredProjects.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  // ------------------------------------------------------------
  // DOWNLOAD FILE (axios blob)
  // ------------------------------------------------------------
  const handleDownload = async (id, fileName) => {
    try {
      const res = await api.get(`/projects/${id}/download`, {
        responseType: "blob",
      });

      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();

      window.URL.revokeObjectURL(url);
      toast.success("Download successful!");
    } catch (err) {
      toast.error("Download failed");
    }
  };

  // ------------------------------------------------------------
  // UI
  // ------------------------------------------------------------
  return (
    <div className="filament-container">
      <h2 className="filament-title">Projects</h2>

      {/* Search bar */}
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

      {/* Projects table */}
      {paginatedProjects.length === 0 ? (
        <p className="no-filaments-message">No projects found.</p>
      ) : (
        <>
          <table className="filament-table">
            <thead>
              <tr>
                <th>Module Name</th>
                <th>File</th>
                <th>Downloads</th>
                <th className="download-header">Download</th>
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

          {/* Pagination */}
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