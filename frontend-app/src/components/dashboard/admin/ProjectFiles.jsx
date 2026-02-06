import React, { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { MdEdit, MdDelete } from "react-icons/md";
import "../../styles/PrintFilament.css";
import api from "../../../utils/axiosClient";

function ProjectModal({ initialData, isEditing, onSubmit, onCancel }) {
  const { t } = useTranslation();
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
    if (!form.moduleName.trim()) return toast.error(t('toasts.moduleNameRequired'));
    if (!isEditing && !form.file) return toast.error(t('toasts.selectFile'));
    await onSubmit(form);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <form onSubmit={handleSubmit} noValidate>
          <h3 className="filament-title">{isEditing ? t('projects.editTitle') : t('projects.addTitle')}</h3>

          <div className="filament-input-group full-width">
            <input
              type="text"
              name="moduleName"
              value={form.moduleName}
              onChange={handleChange}
              placeholder=" "
              required
            />
            <label>{t('projects.moduleName')}</label>
          </div>

          <div className="filament-input-group full-width">
            <input
              type="file"
              name="file"
              accept=".stl,.obj,.wrl,.vrml,.3mf"
              onChange={handleChange}
            />
            <label>{t('projects.projectFile')}</label>
          </div>

          <div className="printlog-buttons">
            <button type="button" className="printlog-cancel" onClick={onCancel}>
              {t('common.cancel')}
            </button>
            <button type="submit" className="printlog-save">
              {isEditing ? t('common.save') : t('common.add')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminProjects() {
  const { t } = useTranslation();
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
      const msg = err?.response?.data?.message || err.message || "Failed to fetch projects";
      toast.error(msg);
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
      const msg = err?.response?.data?.message || err.message || "Failed to save project";
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
        <p>{t('projects.deleteConfirm')}</p>

        <div className="btn-group">
          <button
            className="confirm-yes"
            onClick={async () => {
              try {
                await api.delete(`/projects/${id}`);
                toast.success(t('toasts.projectDeleted'));
                fetchProjects();
              } catch (err) {
                toast.error(
                  err?.response?.data?.message || t('toasts.deleteProjectFailed')
                );
              } finally {
                toast.dismiss(toastIdRef.current);
                toastIdRef.current = null;
              }
            }}
          >
            {t('projects.yes')}
          </button>

          <button
            className="confirm-no"
            onClick={() => {
              toast.dismiss(toastIdRef.current);
              toastIdRef.current = null;
            }}
          >
            {t('projects.no')}
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
      <h2 className="filament-title">{t('projects.title')}</h2>

      {paginatedProjects.length === 0 ? (
        <p className="no-filaments-message">{t('projects.noProjects')}</p>
      ) : (
        <>
          <table className="filament-table">
            <thead>
              <tr>
                <th style={{ width: "200px" }}>{t('projects.moduleName')}</th>
                <th style={{ width: "400px" }}>{t('projects.file')}</th>
                <th>{t('projects.downloads')}</th>
                <th style={{ width: "80px", textAlign: "center" }}>{t('common.edit')}</th>
                <th style={{ width: "80px", textAlign: "center" }}>{t('common.delete')}</th>
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
        {t('projects.addNew')}
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