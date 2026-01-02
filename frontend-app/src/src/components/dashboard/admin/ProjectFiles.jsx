import React, { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "react-toastify";
import { MdEdit, MdDelete } from "react-icons/md";
import "../../styles/PrintFilament.css";
// UserContext not used in this component
import api from "../../../utils/axiosClient";

function ProjectModal({ initialData, isEditing, onSubmit, onCancel }) {
  const [form, setForm] = useState(initialData);

  useEffect(() => setForm(initialData), [initialData]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "file") {
      setForm(f => ({ ...f, file: files[0] }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.moduleName.trim()) return toast.error("Module name is required");
    await onSubmit(form);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <form onSubmit={handleSubmit} noValidate>
          <h3 className="filament-title">{isEditing ? "Edit Project" : "Add New Project"}</h3>

          <div className="filament-input-group full-width">
            <input
              type="text"
              name="moduleName"
              value={form.moduleName}
              onChange={handleChange}
              placeholder=" "
              required
            />
            <label>Module Name</label>
          </div>

          <div className="filament-input-group full-width">
            <input
              type="file"
              name="file"
              accept=".stl,.obj,.wrl,.vrml,.3mf"
              onChange={handleChange}
            />
            <label>Project File</label>
          </div>

          <div className="printlog-buttons">
            <button type="button" className="printlog-cancel" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="printlog-save">
              {isEditing ? "Save" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminProjects() {
  const [projects, setProjects] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [currentData, setCurrentData] = useState({ moduleName: "", file: null });
  const [page, setPage] = useState(1);
  const toastIdRef = useRef(null);
  const pageSize = 5;

  // token not needed here

  // -------------------------------------
  // FETCH PROJECTS (axios)
  // -------------------------------------
  const fetchProjects = useCallback(async () => {
    try {
      const res = await api.get("/projects");
      setProjects(res.data);
    } catch (err) {
      toast.error("Failed to fetch projects");
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // -------------------------------------
  // MODAL LOGIC
  // -------------------------------------
  const openAddModal = () => {
    setCurrentData({ moduleName: "", file: null });
    setEditingId(null);
    setModalOpen(true);
  };

  const openEditModal = (project) => {
    setCurrentData({ moduleName: project.moduleName, file: null });
    setEditingId(project.id);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setCurrentData({ moduleName: "", file: null });
  };

  // -------------------------------------
  // CREATE / UPDATE PROJECT (axios)
  // -------------------------------------
  const handleSubmit = async (formData) => {
    try {
      const formToSend = new FormData();
      formToSend.append("ModuleName", formData.moduleName);
      if (formData.file) formToSend.append("File", formData.file);

      const url = editingId
        ? `/projects/${editingId}/update`
        : "/projects/upload";

      await api.post(url, formToSend, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success(editingId ? "Project updated!" : "Project created!");
      closeModal();
      fetchProjects();
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to save project";
      toast.error(msg);
    }
  };

  // -------------------------------------
  // DELETE PROJECT (axios)
  // -------------------------------------
  const handleDelete = async (id) => {
    if (toastIdRef.current) {
      toast.dismiss(toastIdRef.current);
      toastIdRef.current = null;
    }

    toastIdRef.current = toast.info(
      <div className="toast-confirmation">
        <p>Are you sure you want to delete this project?</p>

        <div className="btn-group">
          <button
            className="confirm-yes"
            onClick={async () => {
              try {
                await api.delete(`/projects/${id}`);
                toast.success("Project deleted!");
                fetchProjects();
              } catch (err) {
                toast.error(
                  err?.response?.data?.message || "Failed to delete project"
                );
              } finally {
                toast.dismiss(toastIdRef.current);
                toastIdRef.current = null;
              }
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
  };

  // -------------------------------------
  // PAGINATION
  // -------------------------------------
  const totalPages = Math.ceil(projects.length / pageSize);
  const paginatedProjects = projects.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="filament-container">
      <h2 className="filament-title">Project Manager</h2>

      {paginatedProjects.length === 0 ? (
        <p className="no-filaments-message">No projects found.</p>
      ) : (
        <>
          <table className="filament-table">
            <thead>
              <tr>
                <th style={{ width: "200px" }}>Module Name</th>
                <th style={{ width: "400px" }}>File</th>
                <th>Downloads</th>
                <th style={{ width: "80px", textAlign: "center" }}>Edit</th>
                <th style={{ width: "80px", textAlign: "center" }}>Delete</th>
              </tr>
            </thead>

            <tbody>
              {paginatedProjects.map((p) => (
                <tr key={p.id}>
                  <td>{p.moduleName}</td>
                  <td>{p.fileName}</td>
                  <td>{p.downloadCount}</td>

                  <td style={{ textAlign: "center" }}>
                    <button
                      onClick={() => openEditModal(p)}
                      className="edit"
                      title="Edit Project"
                    >
                      <MdEdit />
                    </button>
                  </td>

                  <td style={{ textAlign: "center" }}>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="delete"
                      title="Delete Project"
                    >
                      <MdDelete />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div
              className="pagination-wrapper"
              style={{ marginTop: 16, display: "flex", gap: 6 }}
            >
              <button
                className="pagination-arrow"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                &lt;
              </button>

              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  className={`pagination-btn${page === i + 1 ? " active" : ""}`}
                  onClick={() => setPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}

              <button
                className="pagination-arrow"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                &gt;
              </button>
            </div>
          )}
        </>
      )}

      <button
        className="create-button"
        onClick={openAddModal}
        style={{ marginTop: 20 }}
      >
        Add New Project
      </button>

      {modalOpen && (
        <ProjectModal
          initialData={currentData}
          isEditing={!!editingId}
          onSubmit={handleSubmit}
          onCancel={closeModal}
        />
      )}
    </div>
  );
}