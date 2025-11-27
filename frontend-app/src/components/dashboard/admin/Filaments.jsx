import React, { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "react-toastify";
import { MdEdit, MdDelete } from "react-icons/md";
import Pagination from "../Pagination";
import api from "../../..//utils/axiosClient";
import "../../styles/PrintFilament.css";

function FilamentModal({ initialData, isEditing, onSubmit, onCancel }) {
  const [form, setForm] = useState(initialData);

  useEffect(() => {
    setForm(initialData);
  }, [initialData]);

  function capitalize(str) {
    return str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "";
  }

  function formatSentences(str) {
    return str
      ? str.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase())
      : "";
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }

    const formattedData = {
      ...form,
      color: capitalize(form.color),
      description: formatSentences(form.description),
      diameter: parseFloat(form.diameter) || 0,
    };

    await onSubmit(formattedData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <form onSubmit={handleSubmit} noValidate>
          <h3 className="filament-title">{isEditing ? "Edit Filament" : "Add New Filament"}</h3>

          <div className="row-inputs">
            <div className="filament-input-group half-width">
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder=" "
                required
                autoComplete="off"
              />
              <label>Name</label>
            </div>

            <div className="filament-input-group half-width">
              <input
                type="text"
                name="color"
                value={form.color}
                onChange={handleChange}
                placeholder=" "
                autoComplete="off"
              />
              <label>Color</label>
            </div>
          </div>

          <div className="row-inputs">
            <div className="filament-input-group half-width">
              <select
                name="materialType"
                value={form.materialType}
                onChange={handleChange}
                className={form.materialType ? "has-value" : ""}
                required
              >
                <option value="" disabled hidden></option>
                <option value="PLA">PLA</option>
                <option value="ABS">ABS</option>
                <option value="PETG">PETG</option>
                <option value="TPU">TPU</option>
                <option value="Nylon">Nylon</option>
                <option value="ASA">ASA</option>
                <option value="PC">PC</option>
              </select>
              <label>Material Type</label>
            </div>

            <div className="filament-input-group half-width">
              <input
                type="number"
                step="0.01"
                name="diameter"
                value={form.diameter}
                onChange={handleChange}
                placeholder=" "
                autoComplete="off"
              />
              <label>Diameter (mm)</label>
            </div>
          </div>

          <div className="filament-input-group">
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder=" "
              rows={3}
            />
            <label>Description</label>
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

export default function AdminFilaments() {
  const [filaments, setFilaments] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [currentData, setCurrentData] = useState({
    name: "",
    color: "",
    materialType: "",
    diameter: "",
    description: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const filamentsPerPage = 4;

  const toastIdRef = useRef(null);

  // -------------------------
  // FETCH FILAMENTS (axios)
  // -------------------------
  const fetchFilaments = useCallback(async () => {
    try {
      const res = await api.get("/filament");
      setFilaments(res.data);
    } catch (err) {
      toast.error("Failed to load filaments.");
    }
  }, []);

  useEffect(() => {
    fetchFilaments();
  }, [fetchFilaments]);

  const openAddModal = () => {
    setCurrentData({
      name: "",
      color: "",
      materialType: "",
      diameter: "",
      description: "",
    });
    setEditingId(null);
    setModalOpen(true);
  };

  const openEditModal = (filament) => {
    setCurrentData({
      ...filament,
      diameter: filament.diameter?.toString() || "",
    });
    setEditingId(filament.id);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
  };

  // -------------------------
  // CREATE / UPDATE FILAMENT
  // -------------------------
  const handleSubmit = async (formData) => {
    try {
      const url = editingId ? `/filament/${editingId}` : `/filament`;
      const method = editingId ? api.put : api.post;

      await method(url, formData);

      toast.success(editingId ? "Filament updated!" : "Filament created!");
      await fetchFilaments();
      closeModal();
    } catch (err) {
      toast.error("Failed to save filament.");
    }
  };

  // -------------------------
  // DELETE FILAMENT
  // -------------------------
  const handleDelete = async (id) => {
    try {
      const resCheck = await api.get(`/filament/${id}/check-tasks`);
      if (resCheck.data.hasTasks) {
        toast.error("This filament cannot be deleted because it has linked tasks.");
        return;
      }

      // Confirmation toast
      if (toastIdRef.current !== null) {
        toast.dismiss(toastIdRef.current);
        toastIdRef.current = null;
      }

      toastIdRef.current = toast.info(
        <div className="toast-confirmation">
          <p>Are you sure you want to delete this filament?</p>
          <div className="btn-group">
            <button
              className="confirm-yes"
              onClick={async () => {
                try {
                  await api.delete(`/filament/${id}`);
                  toast.success("Filament deleted successfully!");
                  setFilaments((prev) => prev.filter((f) => f.id !== id));
                } catch {
                  toast.error("Failed to delete filament.");
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
        {
          autoClose: false,
          closeOnClick: false,
          closeButton: false,
          icon: true,
          className: "toast-info-box",
        }
      );
    } catch {
      toast.error("Failed to check filament.");
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(filaments.length / filamentsPerPage);
  const currentFilaments = filaments.slice(
    (currentPage - 1) * filamentsPerPage,
    currentPage * filamentsPerPage
  );

  return (
    <div className="filament-container">
      <h2 className="filament-title">Filament Manager</h2>

      {filaments.length === 0 ? (
        <p className="no-filaments-message">No filaments found.</p>
      ) : (
        <>
          <table className="filament-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Color</th>
                <th>Material</th>
                <th>Diameter</th>
                <th>Description</th>
                <th>Edit</th>
                <th>Delete</th>
              </tr>
            </thead>
            <tbody>
              {currentFilaments.map((f) => (
                <tr key={f.id}>
                  <td>{f.name}</td>
                  <td>{f.color}</td>
                  <td>{f.materialType}</td>
                  <td>{f.diameter}</td>
                  <td>{f.description}</td>
                  <td>
                    <button onClick={() => openEditModal(f)} className="edit">
                      <MdEdit />
                    </button>
                  </td>
                  <td>
                    <button onClick={() => handleDelete(f.id)} className="delete">
                      <MdDelete />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </>
      )}

      <button
        onClick={openAddModal}
        className="create-button"
        style={{ marginTop: "20px" }}
        title="Add new filament"
      >
        Add New Filament
      </button>

      {modalOpen && (
        <FilamentModal
          initialData={currentData}
          isEditing={!!editingId}
          onSubmit={handleSubmit}
          onCancel={closeModal}
        />
      )}
    </div>
  );
}