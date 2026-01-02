import React, { useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FiArrowLeft } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import api from "../utils/axiosClient";

export default function ResetPassword() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      toast.error(t('toasts.fillBothFields'));
      return;
    }

    if (password !== confirmPassword) {
      toast.error(t('toasts.passwordsDoNotMatch'));
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/reset-password", {
        token,
        newPassword: password,
      });

      toast.success(t('toasts.passwordResetSuccess'));

      setTimeout(() => navigate("/"), 1500);

    } catch (err) {
      toast.error(
        err?.response?.data ||
        err?.response?.data?.message ||
        t('toasts.resetPasswordFailed')
      );
    } finally {
      setLoading(false);
    }
  };

  if (!token) return <h2>{t('toasts.invalidToken')}</h2>;

  return (
    <div className="forgot-wrapper">
      <form className="forgot-form" onSubmit={handleSubmit}>
        <h2 className="forgot-title">{t('resetPassword.title')}</h2>
        <p className="forgot-description">
          {t('resetPassword.description')}
        </p>

        {/* New Password */}
        <div className="input-group">
          <input
            type={showPassword ? "text" : "password"}
            placeholder=" "
            value={password}
            required
            onChange={(e) => setPassword(e.target.value)}
          />
          <label>{t('resetPassword.newPassword')}</label>

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className={`show-password-btn btn-show ${showPassword ? "active" : ""}`}
          >
            <i className={showPassword ? "bi bi-eye-slash" : "bi bi-eye"}></i>
          </button>
        </div>

        {/* Confirm Password */}
        <div className="input-group">
          <input
            type={showConfirm ? "text" : "password"}
            placeholder=" "
            value={confirmPassword}
            required
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <label>{t('resetPassword.confirmPassword')}</label>

          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className={`show-password-btn btn-show ${showConfirm ? "active" : ""}`}
          >
            <i className={showConfirm ? "bi bi-eye-slash" : "bi bi-eye"}></i>
          </button>
        </div>

        <button type="submit" className="forgot-btn" disabled={loading}>
          {loading ? (
            <>
              <span
                className="spinner-border spinner-border-sm"
                role="status"
                aria-hidden="true"
                style={{ marginRight: "8px" }}
              ></span>
              {t('resetPassword.resetting')}
            </>
          ) : (
            t('resetPassword.resetButton')
          )}
        </button>

        <p className="forgot-toggle-text">
          <Link className="forgot-toggle-btn" to="/">
            <FiArrowLeft className="back-icon" />
            {t('resetPassword.backToLogin')}
          </Link>
        </p>
      </form>
    </div>
  );
}