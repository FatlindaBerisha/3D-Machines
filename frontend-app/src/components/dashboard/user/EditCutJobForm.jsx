import React from "react";
import { toast } from "react-toastify";
import "../../styles/PrintFilament.css";
import { useTranslation } from "react-i18next";

export default function EditCutJobForm({
    formData,
    materials,
    onChange,
    onCancel,
    onSubmit,
}) {
    const { t } = useTranslation();

    function handleSubmit(e) {
        e.preventDefault();

        if (formData.status === "Completed" && !formData.duration.toString().trim()) {
            toast.error(t('toasts.durationRequired'));
            return;
        }
        onSubmit(e);
    }

    return (
        <form onSubmit={handleSubmit} className="edit-job-form" noValidate>
            <h2 className="profile-title">{t('cutLogs.editJob')}</h2>

            <div className="user-input-group">
                <input
                    type="text"
                    name="jobName"
                    value={formData.jobName}
                    onChange={onChange}
                    placeholder=" "
                    required
                    autoComplete="off"
                />
                <label htmlFor="jobName">{t('cutLogs.jobName')}</label>
            </div>

            <div className="user-input-group">
                <select
                    name="materialId"
                    value={formData.materialId ? String(formData.materialId) : ""}
                    onChange={onChange}
                    required
                >
                    {materials.map((m) => (
                        <option key={m.id} value={String(m.id)}>
                            {m.name}
                        </option>
                    ))}
                </select>
                <label htmlFor="materialId">{t('cutLogs.material')}</label>
            </div>

            <div className="user-input-group">
                <select
                    name="status"
                    value={formData.status}
                    onChange={onChange}
                    required
                >
                    <option value="Pending">{t('common.pending')}</option>
                    <option value="In Progress">{t('common.inProgress')}</option>
                    <option value="Completed">{t('common.completed')}</option>
                </select>
                <label htmlFor="status">{t('cutLogs.status')}</label>
            </div>

            <div className="user-input-group">
                <input
                    type="text"
                    name="duration"
                    value={formData.duration}
                    onChange={onChange}
                    placeholder={t('cutLogs.durationPlaceholder')}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    disabled={formData.status !== "Completed"}
                />
                <label htmlFor="duration">{t('cutLogs.durationLabel')}</label>
            </div>

            <div className="user-input-group">
                <textarea
                    name="description"
                    value={formData.description || ""}
                    onChange={onChange}
                    placeholder=" "
                    autoComplete="off"
                    rows="3"
                />
                <label htmlFor="description">{t('materials.description')}</label>
            </div>

            <div className="printlog-buttons">
                <button type="button" className="printlog-cancel" onClick={onCancel}>
                    {t('common.cancel')}
                </button>
                <button type="submit" className="printlog-save">
                    {t('common.save')}
                </button>
            </div>
        </form>
    );
}
