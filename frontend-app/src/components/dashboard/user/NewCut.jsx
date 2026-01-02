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
        status: "",
        duration: "",
    });

    const [materials, setMaterials] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        async function fetchMaterials() {
            try {
                const res = await api.get("/materialsuser");
                setMaterials(res.data);
            } catch (err) {
                toast.error("Failed to fetch materials");
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

        if (name === "duration") {
            if (value === "" || /^[0-9\b]+$/.test(value)) {
                return setForm((prev) => ({ ...prev, [name]: value }));
            }
            return;
        }

        setForm((prev) => ({ ...prev, [name]: value }));
    }

    function formatDuration(minutesStr) {
        if (!minutesStr) return null;

        const minutes = parseInt(minutesStr, 10);
        if (isNaN(minutes) || minutes < 0) return null;

        const hours = Math.floor(minutes / 60).toString().padStart(2, "0");
        const mins = (minutes % 60).toString().padStart(2, "0");

        return `${hours}:${mins}:00`;
    }

    async function handleSubmit(e) {
        e.preventDefault();

        if (!form.jobName.trim()) return toast.error(t('toasts.jobNameRequired'));
        if (!form.materialId) return toast.error("Please select a material");

        if (form.duration && (isNaN(form.duration) || parseInt(form.duration, 10) < 0)) {
            return toast.error(t('toasts.durationPositive'));
        }

        if (form.status === "Completed" && !form.duration) {
            return toast.error("Duration is required when status is Completed");
        }

        const payload = {
            jobName: form.jobName,
            materialId: Number(form.materialId),
            status: form.status || "Pending",
            duration: form.duration ? formatDuration(form.duration) : null,
        };

        try {
            await api.post("/cutjob", payload);
            toast.success("Cut job created!", { autoClose: 1000 });
            setForm({ jobName: "", materialId: "", status: "Pending", duration: "" });
            setTimeout(() => {
                navigate("/dashboard/user/cut-log");
            }, 1000);
        } catch (err) {
            toast.error(
                err?.response?.data?.error ||
                err?.response?.data?.message ||
                "Failed to create cut job"
            );
        }
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
                            {m.name}
                        </option>
                    ))}
                </select>
                <label htmlFor="materialId">{t('newCut.material')}</label>
            </div>

            <div className="input-group">
                <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className={form.status ? "has-value" : ""}
                >
                    <option value="" disabled hidden></option>
                    <option value="Pending">{t('newCut.pending')}</option>
                    <option value="In Progress">{t('newCut.inProgress')}</option>
                    <option value="Completed">{t('newCut.completed')}</option>
                </select>
                <label htmlFor="status">{t('newCut.status')}</label>
            </div>

            <div className="user-input-group">
                <input
                    type="text"
                    name="duration"
                    value={form.duration}
                    onChange={handleChange}
                    placeholder="HH:mm:ss"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    disabled={form.status !== "Completed"}
                />
                <label htmlFor="duration">{t('newCut.duration')}</label>
            </div>

            <button type="submit" className="create-button">
                {t('newCut.createButton')}
            </button>
        </form>
    );
}
