import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import api from "../../../utils/axiosClient"; // <-- IMPORTANT
import "../../styles/PrintFilament.css";

export default function NewPrint() {
  const [form, setForm] = useState({
    jobName: "",
    filamentId: "",
    status: "",
    duration: "",
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
        toast.error("Failed to fetch filaments");
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

    if (name === "duration") {
      if (value === "" || /^[0-9\b]+$/.test(value)) {
        return setForm((prev) => ({ ...prev, [name]: value }));
      }
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  }

  // -------------------------
  // Format Duration
  // -------------------------
  function formatDuration(minutesStr) {
    if (!minutesStr) return null;

    const minutes = parseInt(minutesStr, 10);
    if (isNaN(minutes) || minutes < 0) return null;

    const hours = Math.floor(minutes / 60).toString().padStart(2, "0");
    const mins = (minutes % 60).toString().padStart(2, "0");

    return `${hours}:${mins}:00`;
  }

  // -------------------------
  // Submit Print Job (axios)
  // -------------------------
  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.jobName.trim()) return toast.error("Job name is required");
    if (!form.filamentId) return toast.error("Please select a filament");

    if (form.duration && (isNaN(form.duration) || parseInt(form.duration, 10) < 0)) {
      return toast.error("Duration must be a positive number");
    }

    if (form.status === "Completed" && !form.duration) {
      return toast.error("Duration is required when status is Completed");
    }

    const payload = {
      jobName: form.jobName,
      filamentId: Number(form.filamentId),
      status: form.status || "Pending",
      duration: form.duration ? formatDuration(form.duration) : null,
    };

    try {
      await api.post("/printjob", payload);

      toast.success("Print job created!", { autoClose: 1000 });

      setForm({ jobName: "", filamentId: "", status: "Pending", duration: "" });

      setTimeout(() => {
        navigate("/dashboard/user/print-log");
      }, 1000);
    } catch (err) {
      toast.error(
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Failed to create print job"
      );
    }
  }

  // -------------------------
  // UI
  // -------------------------
  return (
    <form onSubmit={handleSubmit} className="profile-form" noValidate>
      <h2 className="profile-title">New Print Job</h2>

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
        <label htmlFor="jobName">Job Name</label>
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
        <label htmlFor="filamentId">Filament</label>
      </div>

      {/* Status */}
      <div className="input-group">
        <select
          name="status"
          value={form.status}
          onChange={handleChange}
          className={form.status ? "has-value" : ""}
        >
          <option value="" disabled hidden></option>
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>
        <label htmlFor="status">Status</label>
      </div>

      {/* Duration */}
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
        <label htmlFor="duration">Duration (HH:mm:ss)</label>
      </div>

      <button type="submit" className="create-button">
        Create Print Job
      </button>
    </form>
  );
}