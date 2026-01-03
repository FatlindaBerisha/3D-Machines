import React, { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { MdEdit, MdDelete } from "react-icons/md";
import Pagination from "../Pagination";
import api from "../../../utils/axiosClient";
import "../../styles/PrintFilament.css";

function MaterialModal({ initialData, isEditing, onSubmit, onCancel }) {
    const { t } = useTranslation();
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
            toast.error(t('toasts.nameRequired'));
            return;
        }

        const formattedData = {
            ...form,
            color: capitalize(form.color),
            description: formatSentences(form.description),
            thickness: parseFloat(form.thickness) || 0,
        };

        await onSubmit(formattedData);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <form onSubmit={handleSubmit} noValidate>
                    <h3 className="filament-title">{isEditing ? t('materials.editTitle') : t('materials.addTitle')}</h3>

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
                            <label>{t('materials.name')}</label>
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
                            <label>{t('materials.color')}</label>
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
                                <option value="Laser Cutting">{t('cuttingTypes.laser')}</option>
                                <option value="CNC Cutting">{t('cuttingTypes.cnc')}</option>
                                <option value="Waterjet Cutting">{t('cuttingTypes.waterjet')}</option>
                                <option value="Plasma Cutting">{t('cuttingTypes.plasma')}</option>
                                <option value="Manual / Mechanical Cutting">{t('cuttingTypes.manual')}</option>
                            </select>
                            <label>{t('materials.materialType')}</label>
                        </div>

                        <div className="filament-input-group half-width">
                            <input
                                type="number"
                                step="0.01"
                                name="thickness"
                                value={form.thickness}
                                onChange={handleChange}
                                placeholder=" "
                                autoComplete="off"
                            />
                            <label>{t('materials.thickness')}</label>
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
                        <label>{t('materials.description')}</label>
                    </div>

                    <div className="printlog-buttons">
                        <button type="button" className="printlog-cancel" onClick={onCancel}>
                            {t('materials.cancel')}
                        </button>
                        <button type="submit" className="printlog-save">
                            {isEditing ? t('materials.save') : t('materials.add')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function AdminMaterials() {
    const { t } = useTranslation();
    const [materials, setMaterials] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [currentData, setCurrentData] = useState({
        name: "",
        color: "",
        materialType: "",
        thickness: "",
        description: "",
    });

    const [currentPage, setCurrentPage] = useState(1);
    const materialsPerPage = 5;

    const toastIdRef = useRef(null);

    const fetchMaterials = useCallback(async () => {
        try {
            const res = await api.get("/material");
            setMaterials(res.data);
        } catch (err) {
            const msg = err?.response?.data?.message || err.message || t('toasts.loadDataFailed');
            toast.error(msg);
        }
    }, [t]);

    useEffect(() => {
        fetchMaterials();
    }, [fetchMaterials]);

    const openAddModal = () => {
        setCurrentData({
            name: "",
            color: "",
            materialType: "",
            thickness: "",
            description: "",
        });
        setEditingId(null);
        setModalOpen(true);
    };

    const openEditModal = (material) => {
        setCurrentData({
            ...material,
            thickness: material.thickness?.toString() || "",
        });
        setEditingId(material.id);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditingId(null);
    };

    const handleSubmit = async (formData) => {
        try {
            const url = editingId ? `/material/${editingId}` : `/material`;
            const method = editingId ? api.put : api.post;

            await method(url, formData);

            toast.success(editingId ? t('toasts.success') : t('toasts.success'));
            await fetchMaterials();
            closeModal();
        } catch (err) {
            const msg = err?.response?.data?.message || err.message || t('toasts.error');
            toast.error(msg);
        }
    };

    const handleDelete = async (id) => {
        try {
            const resCheck = await api.get(`/material/${id}/check-tasks`);
            if (resCheck.data.hasTasks) {
                toast.error(t('materials.cannotDelete'));
                return;
            }

            if (toastIdRef.current !== null) {
                toast.dismiss(toastIdRef.current);
                toastIdRef.current = null;
            }

            toastIdRef.current = toast.info(
                <div className="toast-confirmation">
                    <p>{t('materials.deleteConfirm')}</p>
                    <div className="btn-group">
                        <button
                            className="confirm-yes"
                            onClick={async () => {
                                try {
                                    await api.delete(`/material/${id}`);
                                    toast.success(t('toasts.deleteSuccess'));
                                    setMaterials((prev) => prev.filter((m) => m.id !== id));
                                } catch (err) {
                                    const msg = err?.response?.data?.message || err.message || t('toasts.error');
                                    toast.error(msg);
                                } finally {
                                    toast.dismiss(toastIdRef.current);
                                    toastIdRef.current = null;
                                }
                            }}
                        >
                            {t('materials.yes')}
                        </button>

                        <button
                            className="confirm-no"
                            onClick={() => {
                                toast.dismiss(toastIdRef.current);
                                toastIdRef.current = null;
                            }}
                        >
                            {t('materials.no')}
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
            toast.error(t('toasts.error'));
        }
    };

    const totalPages = Math.ceil(materials.length / materialsPerPage);
    const currentMaterials = materials.slice(
        (currentPage - 1) * materialsPerPage,
        currentPage * materialsPerPage
    );

    return (
        <div className="filament-container">
            <h2 className="filament-title">{t('materials.title')}</h2>

            {materials.length === 0 ? (
                <p className="no-filaments-message">{t('materials.noMaterials')}</p>
            ) : (
                <>
                    <table className="filament-table">
                        <thead>
                            <tr>
                                <th>{t('materials.name')}</th>
                                <th>{t('materials.color')}</th>
                                <th>{t('materials.materialType')}</th>
                                <th>{t('materials.thickness')}</th>
                                <th>{t('materials.description')}</th>
                                <th>{t('materials.edit')}</th>
                                <th>{t('materials.delete')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentMaterials.map((m) => (
                                <tr key={m.id}>
                                    <td>{m.name}</td>
                                    <td>{m.color}</td>
                                    <td>{m.materialType}</td>
                                    <td>{m.thickness}</td>
                                    <td>{m.description}</td>
                                    <td>
                                        <button onClick={() => openEditModal(m)} className="edit">
                                            <MdEdit />
                                        </button>
                                    </td>
                                    <td>
                                        <button onClick={() => handleDelete(m.id)} className="delete">
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
                title={t('materials.addNew')}
            >
                {t('materials.addNew')}
            </button>

            {modalOpen && (
                <MaterialModal
                    initialData={currentData}
                    isEditing={!!editingId}
                    onSubmit={handleSubmit}
                    onCancel={closeModal}
                />
            )}
        </div>
    );
}
