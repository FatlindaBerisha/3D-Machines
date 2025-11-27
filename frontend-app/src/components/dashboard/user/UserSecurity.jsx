import React, { useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import api from "../../../utils/axiosClient"; // <-- E RËNDËSISHME
import "../../styles/Profile.css";

export default function Security() {
  const navigate = useNavigate();

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

  const [deleteModal, setDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");

  // ------------------------------------------------------------
  // Input Change
  // ------------------------------------------------------------
  const handleChange = (e) => {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  // ------------------------------------------------------------
  // Change Password (me axiosClient → refresh token automatik)
  // ------------------------------------------------------------
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
      await api.put("/user/change-password", {
        oldPassword: formData.oldPassword,
        newPassword: formData.newPassword
      });

      toast.success("Password updated!");
      setEditMode(false);
      setFormData({ oldPassword: "", newPassword: "", confirmPassword: "" });

    } catch (err) {
      toast.error(
        err?.response?.data || 
        err?.response?.data?.message ||
        "Password update failed."
      );
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------------------
  // Delete Account (me axiosClient → refresh token punon)
  // ------------------------------------------------------------
  const handleDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      toast.error("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      await api.delete("/user/delete", {
        data: { password: deletePassword }, // axios DELETE dërgon body kështu
      });

      localStorage.clear();
      sessionStorage.clear();

      toast.success("Account deleted.");
      navigate("/", { replace: true });

    } catch (err) {
      toast.error(
        err?.response?.data ||
        err?.response?.data?.message ||
        "Delete failed."
      );
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------------------
  // UI
  // ------------------------------------------------------------
  return (
    <div className="security-container">

      {/* ------------------ DEFAULT VIEW ------------------ */}
      {!editMode && (
        <>

          {/* STATIC PASSWORD DISPLAY */}
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

          {/* DELETE ACCOUNT SECTION */}
          <div className="delete-account-section">
            <h3 className="static-label">Delete Account</h3>
            <p style={{ color: "#6b7280", marginBottom: "10px" }}>
              Permanently delete your account and all associated data.
            </p>

            <button
              className="delete-account-btn"
              onClick={() => setDeleteModal(true)}
            >
              Delete
            </button>
          </div>
        </>
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

      {/* ------------------ DELETE MODAL ------------------ */}
      {deleteModal && (
        <div className="modal-overlay">
          <div className="shopify-modal">

            <h2 className="modal-title">Delete Account</h2>

            <div className="modal-warning-box">
              <i className="bi bi-exclamation-triangle-fill"></i>
              <p>
                After deleting your account, your data will be permanently removed.
                This action cannot be undone.
              </p>
            </div>

            <div className="user-input-group modal-input">
              <input
                type="password"
                placeholder=" "
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
              />
              <label>Enter your password to confirm</label>
            </div>

            <div className="modal-actions">
              <button
                className="modal-back-btn"
                onClick={() => setDeleteModal(false)}
              >
                Cancel
              </button>

              <button
                className="modal-delete-btn"
                onClick={handleDeleteAccount}
                disabled={loading}
              >
                {loading ? "Deleting..." : "Delete"}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}