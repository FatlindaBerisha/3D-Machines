import React, { useState } from "react";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import api from "../utils/axiosClient";

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.warning(t('toasts.enterEmail'));
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/forgot-password", { email });

      toast.success(t('toasts.resetLinkSent'));
      setEmail("");

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

  return (
    <div className="forgot-wrapper">
      <form className="forgot-form" onSubmit={handleSubmit}>
        <h2 className="forgot-title">{t('forgotPassword.title')}</h2>
        <p className="forgot-description">
          {t('forgotPassword.description')}
        </p>

        <div className="input-group">
          <input
            id="forgot-email"
            type="email"
            value={email}
            placeholder=" "
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            className="input"
          />
          <label htmlFor="forgot-email">{t('forgotPassword.emailAddress')}</label>
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
              {t('forgotPassword.sending')}
            </>
          ) : (
            t('forgotPassword.sendResetLink')
          )}
        </button>

        <p className="forgot-toggle-text">
          <Link className="forgot-toggle-btn" to="/">
            <FiArrowLeft className="back-icon" />
            {t('forgotPassword.backToLogin')}
          </Link>
        </p>
      </form>
    </div>
  );
}