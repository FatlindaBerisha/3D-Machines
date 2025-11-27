import React, { useState } from "react";
import { toast } from "react-toastify";
import api from "../../../utils/axiosClient"; // <-- ADD THIS
import "../../styles/Profile.css";

export default function Security() {
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [show, setShow] = useState({
    old: false,
    new: false,
    confirm: false
  });

  const handleChange = (e) => {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters.");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      // --- axiosClient automatic token + refresh ---
      await api.put("/user/change-password", {
        oldPassword: formData.oldPassword,
        newPassword: formData.newPassword
      });

      toast.success("Password updated!");

      setEditMode(false);
      setFormData({ oldPassword: "", newPassword: "", confirmPassword: "" });

    } catch (err) {
      const errMsg =
        err?.response?.data ||
        err?.response?.statusText ||
        "Password update failed.";
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="security-container">

      {/* ------------------ STATIC VIEW ------------------ */}
      {!editMode && (
        <div className="password-static-row">
          <div className="password-column">
            <span className="static-label">Password</span>
            <span className="password-dots">••••••••••••••</span>

            <div className="security-status">
              <i className="bi bi-check-circle-fill"></i>
              Very secure
            </div>
          </div>

          <button className="edit-password-btn" onClick={() => setEditMode(true)}>
            Edit
          </button>
        </div>
      )}

      {/* ------------------ EDIT PASSWORD FORM ------------------ */}
      {editMode && (
        <form className="profile-form" onSubmit={handleSubmit}>

          <h2 className="profile-title">Change Password</h2>

          {/* Current Password */}
          <div className="user-input-group password-group">
            <input
              type={show.old ? "text" : "password"}
              name="oldPassword"
              value={formData.oldPassword}
              onChange={handleChange}
              required
              placeholder=" "
            />
            <label>Current Password</label>
            <button
              type="button"
              className="show-password-btn"
              onClick={() => setShow((p) => ({ ...p, old: !p.old }))}
            >
              <i className={show.old ? "bi bi-eye-slash" : "bi bi-eye"}></i>
            </button>
          </div>

          {/* New Password */}
          <div className="user-input-group password-group">
            <input
              type={show.new ? "text" : "password"}
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              required
              placeholder=" "
            />
            <label>New Password</label>
            <button
              type="button"
              className="show-password-btn"
              onClick={() => setShow((p) => ({ ...p, new: !p.new }))}
            >
              <i className={show.new ? "bi bi-eye-slash" : "bi bi-eye"}></i>
            </button>
          </div>

          {/* Confirm Password */}
          <div className="user-input-group password-group">
            <input
              type={show.confirm ? "text" : "password"}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder=" "
            />
            <label>Confirm Password</label>
            <button
              type="button"
              className="show-password-btn"
              onClick={() => setShow((p) => ({ ...p, confirm: !p.confirm }))}
            >
              <i className={show.confirm ? "bi bi-eye-slash" : "bi bi-eye"}></i>
            </button>
          </div>

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? "Updating..." : "Save Password"}
          </button>

          <button
            type="button"
            className="cancel-edit-btn"
            onClick={() => setEditMode(false)}
          >
            Cancel
          </button>

        </form>
      )}
    </div>
  );
}