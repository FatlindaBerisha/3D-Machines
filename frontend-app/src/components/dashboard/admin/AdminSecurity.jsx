import React, { useState } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import api from "../../../utils/axiosClient";
import { UserContext } from "../../../UserContext";
import { useContext } from "react";
import "../../styles/Profile.css";
import "../../styles/UserSecurity.css";

export default function Security() {
  const { t } = useTranslation();
  const { user } = useContext(UserContext);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [show, setShow] = useState({
    new: false,
    confirm: false
  });

  // ------------------------------------------------------------
  // Password Strength (Strict)
  // ------------------------------------------------------------
  const calculateStrength = (pass) => {
    let score = 0;
    if (!pass) return { score: 0, label: "", color: "#ccc" };

    if (pass.length > 7) score++; // Length > 7
    if (pass.length > 10) score++; // Length > 10
    if (/[A-Z]/.test(pass)) score++; // Uppercase
    if (/[0-9]/.test(pass)) score++; // Number
    if (/[^A-Za-z0-9]/.test(pass)) score++; // Symbol

    if (score < 3) return { score: 1, label: t('security.weak') || "Weak", color: "#e63946" };
    if (score === 3) return { score: 2, label: t('security.medium') || "Medium", color: "#f4a261" };
    if (score === 4) return { score: 3, label: t('security.strong') || "Strong", color: "#2a9d8f" };
    if (score >= 5) return { score: 4, label: t('security.verySecure') || "Very Secure", color: "#22c55e" };

    return { score: 0, label: "", color: "#ccc" };
  };

  // ------------------------------------------------------------
  // Generate Password (Guaranteed Very Secure)
  // ------------------------------------------------------------
  const generatePassword = () => {
    const isVerySecure = Math.random() < 0.5; // 50% chance for Very Secure vs Secure

    const lower = "abcdefghijklmnopqrstuvwxyz";
    const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const nums = "0123456789";
    const syms = "!@#$%^&*()_+";

    let newPass = "";

    if (isVerySecure) {
      // Very Secure: Upper + Num + Symbol
      const allChars = lower + upper + nums + syms;
      newPass += upper.charAt(Math.floor(Math.random() * upper.length));
      newPass += nums.charAt(Math.floor(Math.random() * nums.length));
      newPass += syms.charAt(Math.floor(Math.random() * syms.length));
      newPass += lower.charAt(Math.floor(Math.random() * lower.length));

      for (let i = 0; i < 12; i++) {
        newPass += allChars.charAt(Math.floor(Math.random() * allChars.length));
      }
    } else {
      // Secure: Upper + Num (No Symbols)
      const allChars = lower + upper + nums;
      newPass += upper.charAt(Math.floor(Math.random() * upper.length));
      newPass += nums.charAt(Math.floor(Math.random() * nums.length));
      newPass += lower.charAt(Math.floor(Math.random() * lower.length));

      for (let i = 0; i < 13; i++) {
        newPass += allChars.charAt(Math.floor(Math.random() * allChars.length));
      }
    }

    // Shuffle
    newPass = newPass.split('').sort(() => 0.5 - Math.random()).join('');

    setFormData(prev => ({ ...prev, newPassword: newPass, confirmPassword: newPass }));
  };

  const handleChange = (e) => {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.oldPassword || !formData.newPassword || !formData.confirmPassword) {
      toast.error(t('security.fillAllFields') || "Please fill all fields.");
      return;
    }

    if (formData.newPassword.length < 6) {
      toast.error(t('security.passwordLength'));
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error(t('toasts.passwordsDoNotMatch'));
      return;
    }

    setLoading(true);

    try {
      // --- axiosClient automatic token + refresh ---
      await api.put("/user/change-password", {
        oldPassword: formData.oldPassword,
        newPassword: formData.newPassword
      });

      toast.success(t('toasts.passwordUpdated'));

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

  const handleSendResetLink = async () => {
    if (!user?.email) {
      toast.error(t('toasts.loadDataFailed'));
      return;
    }

    setResetLoading(true);
    try {
      await api.post("/auth/forgot-password", {
        email: user.email,
        language: i18n.language
      });
      toast.success(t('toasts.resetLinkSent'));
    } catch (err) {
      toast.error(t('toasts.resetPasswordFailed'));
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="security-page-wrapper">
      <div className="security-container">
        <h2 className="security-title">{t('security.title')}</h2>

        {/* NEW PASSWORD SECTION LAYOUT (Preferences Style) */}
        <div className="security-row">
          <div className="security-label-group">
            <h3 className="security-row-title">{t('security.password')}</h3>
            <span className="password-dots-mini">••••••••••••••</span>
            <div className="reset-password-container">
              <span>{t('security.forgotPasswordText')}</span>
              <button
                type="button"
                onClick={handleSendResetLink}
                className="reset-password-link"
                disabled={resetLoading}
              >
                {resetLoading ? t('forgotPassword.sending') : t('security.resetLinkPart')}
              </button>
            </div>
          </div>

          <button className="icon-action-btn" onClick={() => setEditMode(true)} title={t('security.edit')}>
            <i className="bi bi-pencil-square"></i>
          </button>
        </div>

        {/* ------------------ EDIT PASSWORD MODAL ------------------ */}
        {editMode && (
          <div className="modal-overlay">
            <div className="shopify-modal">
              <h2 className="security-modal-title">
                {t('security.changePassword')}
              </h2>

              <form onSubmit={handleSubmit} noValidate>

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
                  <label>{t('security.currentPassword')}</label>
                  <button
                    type="button"
                    className="show-password-btn"
                    onClick={() => setShow((p) => ({ ...p, old: !p.old }))}
                    tabIndex="-1"
                  >
                    <i className={show.old ? "bi bi-eye-slash" : "bi bi-eye"}></i>
                  </button>
                </div>

                {/* New Password & Generator */}
                <div className="user-input-group password-group">
                  <input
                    type={show.new ? "text" : "password"}
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    required
                    placeholder=" "
                    style={{ paddingRight: "80px" }}
                  />
                  <label>{t('security.newPassword')}</label>

                  <div style={{ position: "absolute", right: "40px", top: "50%", transform: "translateY(-50%)" }}>
                    <button
                      type="button"
                      onClick={generatePassword}
                      title={t('security.generatePassword')}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#3f51b5", fontSize: "18px" }}
                      tabIndex="-1"
                    >
                      <i className="bi bi-magic"></i>
                    </button>
                  </div>

                  <button
                    type="button"
                    className="show-password-btn"
                    onClick={() => setShow((p) => ({ ...p, new: !p.new }))}
                    tabIndex="-1"
                  >
                    <i className={show.new ? "bi bi-eye-slash" : "bi bi-eye"}></i>
                  </button>
                </div>

                {/* Strength Indicator */}
                {formData.newPassword && (
                  <div className="password-strength-meter" style={{ marginBottom: "15px", marginTop: "-10px", fontSize: "13px", display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ flex: 1, height: "5px", backgroundColor: "#eee", borderRadius: "3px", overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${(calculateStrength(formData.newPassword).score / 4) * 100}%`,
                          backgroundColor: calculateStrength(formData.newPassword).color,
                          height: "100%",
                          transition: "width 0.3s ease, background-color 0.3s ease"
                        }}
                      />
                    </div>
                    <span style={{ color: calculateStrength(formData.newPassword).color, fontWeight: "700", minWidth: "60px", textAlign: "right" }}>
                      {calculateStrength(formData.newPassword).label}
                    </span>
                  </div>
                )}

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
                  <label>{t('security.confirmPassword')}</label>
                  <button
                    type="button"
                    className="show-password-btn"
                    onClick={() => setShow((p) => ({ ...p, confirm: !p.confirm }))}
                    tabIndex="-1"
                  >
                    <i className={show.confirm ? "bi bi-eye-slash" : "bi bi-eye"}></i>
                  </button>
                </div>

                <div className="modal-actions" style={{ marginTop: "30px" }}>
                  <button
                    type="submit"
                    className="modal-delete-btn"
                    style={{ backgroundColor: "#28a745", order: 2 }}
                    disabled={loading}
                  >
                    {loading ? t('security.updating') : t('security.savePassword')}
                  </button>

                  <button
                    type="button"
                    className="modal-back-btn"
                    onClick={() => {
                      setEditMode(false);
                      setFormData({ oldPassword: "", newPassword: "", confirmPassword: "" });
                    }}
                    style={{ order: 1 }}
                  >
                    {t('security.cancel')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}