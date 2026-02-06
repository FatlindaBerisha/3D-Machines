import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../../../utils/axiosClient";
import "../../styles/PrintFilament.css";

export default function NewPrint() {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    jobName: "",
    filamentId: "",
    description: "",
  });

  const [filaments, setFilaments] = useState([]);
  const navigate = useNavigate();

  // -------------------------
  // Fetch Filaments (axios)
  // -------------------------
  useEffect(() => {
    async function fetchFilaments() {
      try {
        const res = await api.get("/filamentsuser");
        setFilaments(res.data);
      } catch (err) {
        toast.error(t('toasts.filamentsFailed'));
      }
    }

    fetchFilaments();
  }, []);

  // -------------------------
  // Handle Change
  // -------------------------
  function handleChange(e) {
    const { name, value } = e.target;

    if (name === "jobName") {
      return setForm((prev) => ({
        ...prev,
        [name]: value.charAt(0).toUpperCase() + value.slice(1),
      }));
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  }

  // -------------------------
  // Submit Print Job (axios)
  // -------------------------
  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.jobName.trim()) return toast.error(t('toasts.jobNameRequired'));
    if (!form.filamentId) return toast.error(t('toasts.selectFilament'));
    if (!form.description.trim()) return toast.error(t('toasts.descriptionRequired') || "Description is required");

    const payload = {
      jobName: form.jobName,
      filamentId: Number(form.filamentId),
      description: form.description,
      // status is handled by backend (default Pending)
      // duration is calculated by start/finish actions
    };

    try {
      await api.post("/printjob", payload);

      toast.success(t('toasts.printJobCreated'), { autoClose: 1000 });

      setForm({ jobName: "", filamentId: "", description: "" });

      setTimeout(() => {
        navigate("/dashboard/user/print-log");
      }, 1000);
    } catch (err) {
      toast.error(
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        t('toasts.printJobCreateFailed')
      );
    }
  }

  // -------------------------
  // UI
  // -------------------------
  return (
    <form onSubmit={handleSubmit} className="profile-form" noValidate>
      <h2 className="profile-title">{t('newPrint.title')}</h2>

      {/* Job Name */}
      <div className="user-input-group">
        <input
          type="text"
          name="jobName"
          value={form.jobName}
          onChange={handleChange}
          placeholder=" "
          required
          autoComplete="off"
          aria-label="Job Name"
        />
        <label htmlFor="jobName">{t('newPrint.jobName')}</label>
      </div>

      {/* Filament */}
      <div className="input-group">
        <select
          name="filamentId"
          value={form.filamentId}
          onChange={handleChange}
          className={form.filamentId ? "has-value" : ""}
          disabled={!filaments.length}
        >
          <option value="" disabled hidden></option>
          {filaments.map((f) => (
            <option key={String(f.id)} value={String(f.id)}>
              {f.name}
            </option>
          ))}
        </select>
        <label htmlFor="filamentId">{t('newPrint.filament')}</label>
      </div>

      {/* Description */}
      <div className="user-input-group">
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder=" "
          required
          autoComplete="off"
          aria-label="Description"
          rows="3"
        />
        <label htmlFor="description">{t('newPrint.description')}</label>
      </div>

      <button type="submit" className="create-button">
        {t('newPrint.createButton')}
      </button>
    </form>
  );
}