import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../../../utils/axiosClient";
import "../../styles/PrintFilament.css";

export default function NewCut() {
    const { t } = useTranslation();
    const [form, setForm] = useState({
        jobName: "",
        materialId: "",
        description: "" // Added description
    });

    const [materials, setMaterials] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        async function fetchMaterials() {
            try {
                const res = await api.get("/materialsuser");
                setMaterials(res.data);
            } catch (err) {
                toast.error(t('toasts.failedFetchMaterials'));
            }
        }

        fetchMaterials();
    }, []);

    function handleChange(e) {
        const { name, value } = e.target;

        if (name === "jobName") {
            return setForm((prev) => ({
                ...prev,
                [name]: value.charAt(0).toUpperCase() + value.slice(1),
            }));
        }

        // Removed duration logic

        setForm((prev) => ({ ...prev, [name]: value }));
    }

    async function handleSubmit(e) {
        e.preventDefault();

        if (!form.jobName.trim()) return toast.error(t('toasts.jobNameRequired'));
        if (!form.materialId) return toast.error(t('toasts.selectMaterial'));
        if (!form.description.trim()) return toast.error(t('toasts.descriptionRequired') || "Description is required");

        // Removed duration/status validation

        const payload = {
            jobName: form.jobName,
            materialId: Number(form.materialId),
            status: "Pending", // Default
            duration: null,    // Default
            description: form.description // Added
        };

        try {
            await api.post("/cutjob", payload);
            toast.success(t('toasts.cutJobCreated'), { autoClose: 1000 });
            setForm({ jobName: "", materialId: "", description: "" });
            setTimeout(() => {
                navigate("/dashboard/user/cut-log");
            }, 1000);
        } catch (err) {
            toast.error(
                err?.response?.data?.error ||
                err?.response?.data?.message ||
                t('toasts.createCutJobFailed') || "Failed to create cut job"
            );
        }
    }

    function translateMaterialName(name) {
        const map = {
            "Laser Cutting": "cuttingTypes.laser",
            "CNC Cutting": "cuttingTypes.cnc",
            "Waterjet Cutting": "cuttingTypes.waterjet",
            "Plasma Cutting": "cuttingTypes.plasma",
            "Manual / Mechanical Cutting": "cuttingTypes.manual",
            "Prerje Manuale / Mekanike": "cuttingTypes.manual"
        };
        return map[name] ? t(map[name]) : name;
    }

    return (
        <form onSubmit={handleSubmit} className="profile-form" noValidate>
            <h2 className="profile-title">{t('newCut.title')}</h2>

            <div className="user-input-group">
                <input
                    type="text"
                    name="jobName"
                    value={form.jobName}
                    onChange={handleChange}
                    placeholder=" "
                    required
                    autoComplete="off"
                />
                <label htmlFor="jobName">{t('newCut.jobName')}</label>
            </div>

            <div className="input-group">
                <select
                    name="materialId"
                    value={form.materialId}
                    onChange={handleChange}
                    className={form.materialId ? "has-value" : ""}
                    disabled={!materials.length}
                >
                    <option value="" disabled hidden></option>
                    {materials.map((m) => (
                        <option key={String(m.id)} value={String(m.id)}>
                            {translateMaterialName(m.name)}
                        </option>
                    ))}
                </select>
                <label htmlFor="materialId">{t('newCut.material')}</label>
            </div>

            <div className="user-input-group">
                <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder=" "
                    required
                    autoComplete="off"
                    rows="3"
                    style={{ paddingTop: '10px' }}
                />
                <label htmlFor="description">{t('materials.description')}</label>
            </div>

            <button type="submit" className="create-button">
                {t('newCut.createButton')}
            </button>
        </form>
    );
}
