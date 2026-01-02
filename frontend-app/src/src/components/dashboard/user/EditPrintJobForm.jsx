import React from "react";
import { toast } from "react-toastify";
import "../../styles/PrintFilament.css";

export default function EditPrintJobForm({
  formData,
  filaments,
  onChange,
  onCancel,
  onSubmit,
}) {
  function handleSubmit(e) {
    e.preventDefault();

    if (formData.status === "Completed" && !formData.duration.trim()) {
      toast.error("Please provide a duration before marking as Completed.");
      return;
    }
    onSubmit(e);
  }

  return (
    <form onSubmit={handleSubmit} className="edit-job-form" noValidate>
      <h2 className="profile-title">Edit Print Job</h2>

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
        <label htmlFor="jobName">Job Name</label>
      </div>

      <div className="user-input-group">
        <select
          name="filamentId"
          value={formData.filamentId ? String(formData.filamentId) : ""}
          onChange={onChange}
          required
        >
          {filaments.map((f) => (
            <option key={f.id} value={String(f.id)}>
              {f.name}
            </option>
          ))}
        </select>
        <label htmlFor="filamentId">Filament</label>
      </div>

      <div className="user-input-group">
        <select
          name="status"
          value={formData.status}
          onChange={onChange}
          required
        >
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>
        <label htmlFor="status">Status</label>
      </div>

      <div className="user-input-group">
        <input
          type="text"
          name="duration"
          value={formData.duration}
          onChange={onChange}
          placeholder="Duration in minutes"
          inputMode="numeric"
          pattern="[0-9]*"
          disabled={formData.status !== "Completed"}
        />
        <label htmlFor="duration">Duration (minutes)</label>
      </div>
      
      <div className="printlog-buttons">
        <button type="button" className="printlog-cancel" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="printlog-save">
          Save Changes
        </button>
      </div>
    </form>
  );
}