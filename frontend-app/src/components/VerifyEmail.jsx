import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import api from "../utils/axiosClient";
import { toast } from "react-toastify";

export default function VerifyEmail() {
  const { t, i18n } = useTranslation();
  const [status, setStatus] = useState("processing");
  const [message, setMessage] = useState(t('toasts.verificationProcessing'));

  const [resendEmail, setResendEmail] = useState("");
  const [isResending, setIsResending] = useState(false);

  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token");
  const lng = params.get("lng");

  useEffect(() => {
    if (lng && i18n.language !== lng) {
      i18n.changeLanguage(lng);
    }
  }, [lng, i18n]);

  useEffect(() => {
    async function verify() {
      try {
        const res = await api.get(`/auth/verify-email?token=${token}`);
        let msg = res?.data?.message;

        // Map common backend success messages to translation
        if (!msg || msg === "Email verified successfully." || msg === "Email verified! You can now log in.") {
          msg = t('toasts.emailVerifiedSuccess');
        }

        setStatus("success");
        setMessage(msg);
        toast.success(msg);

        setTimeout(() => {
          navigate("/");
        }, 1000);
      } catch (err) {
        let backendMsg = err?.response?.data;
        if (typeof backendMsg !== "string") {
          backendMsg = backendMsg?.message || backendMsg?.error || JSON.stringify(backendMsg);
        }

        let finalMsg = typeof backendMsg === 'string' ? backendMsg : "";
        const lowerMsg = finalMsg.toLowerCase();

        if (lowerMsg.includes("invalid token")) {
          finalMsg = t('toasts.invalidToken');
        } else if (lowerMsg.includes("email is already verified") || lowerMsg.includes("already verified")) {
          finalMsg = t('toasts.emailAlreadyVerified');
        } else if (!finalMsg) {
          finalMsg = t('toasts.verificationFailed');
        }

        setStatus("error");
        setMessage(finalMsg);
        toast.error(finalMsg);
      }
    }

    if (token) {
      verify();
    } else {
      setStatus("error");
      setMessage(t('toasts.verificationMissingToken'));
    }
  }, [token, navigate]);

  async function handleResend() {
    if (!resendEmail) {
      toast.error(t('toasts.enterEmailResend'));
      return;
    }

    try {
      setIsResending(true);
      const res = await api.post("/auth/resend-verification", { email: resendEmail, language: i18n.language });
      const msg = res?.data?.message || t('toasts.resendSuccess');
      toast.success(msg);
    } catch (err) {
      let backendMsg = err?.response?.data;
      if (typeof backendMsg !== "string") {
        backendMsg = backendMsg?.message || backendMsg?.error || JSON.stringify(backendMsg);
      }

      let finalMsg = typeof backendMsg === 'string' ? backendMsg : "";
      const lowerMsg = finalMsg.toLowerCase();

      if (lowerMsg.includes("email not registered") || lowerMsg.includes("user not found")) {
        finalMsg = t('toasts.emailNotRegistered');
      } else if (!finalMsg) {
        finalMsg = t('toasts.resendFailed');
      }

      toast.error(finalMsg);
    } finally {
      setIsResending(false);
    }
  }

  return (
    <div className="forgot-wrapper">
      <form className="forgot-form" onSubmit={(e) => e.preventDefault()}>
        <h2 className="forgot-title">{t('verifyEmail.title')}</h2>

        {status === "processing" && (
          <p className="forgot-description">{message}</p>
        )}

        {status === "success" && (
          <>
            <p className="forgot-description">{message}</p>
            <p className="forgot-description" style={{ marginTop: "10px" }}>
              {t('verifyEmail.redirecting')}
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <p className="forgot-description" style={{ marginTop: "10px" }}>
              {t('verifyEmail.enterEmail')}
            </p>

            <div className="input-group" style={{ marginTop: "16px" }}>
              <input
                id="verify-email-resend"
                type="email"
                placeholder=" "
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                required
                disabled={isResending}
              />
              <label htmlFor="verify-email-resend">{t('verifyEmail.emailAddress')}</label>
            </div>

            <button
              type="button"
              className="forgot-btn"
              onClick={handleResend}
              disabled={isResending}
            >
              {isResending ? t('verifyEmail.sending') : t('verifyEmail.resendButton')}
            </button>
          </>
        )}
      </form>
    </div>
  );
}