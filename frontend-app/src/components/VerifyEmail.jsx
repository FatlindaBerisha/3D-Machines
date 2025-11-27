import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../utils/axiosClient";
import { toast } from "react-toastify";

export default function VerifyEmail() {
  const [status, setStatus] = useState("processing");
  const [message, setMessage] = useState("Processing your verification, please wait...");

  const [resendEmail, setResendEmail] = useState("");
  const [isResending, setIsResending] = useState(false);

  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token");

  useEffect(() => {
    async function verify() {
      try {
        const res = await api.get(`/auth/verify-email?token=${token}`);
        const msg = res?.data?.message || "Email verified! You can now log in.";

        setStatus("success");
        setMessage(msg);
        toast.success(msg);

        setTimeout(() => {
          navigate("/");
        }, 1000);
      } catch (err) {
        const backendMsg = err?.response?.data;
        const finalMsg =
          typeof backendMsg === "string"
            ? backendMsg
            : backendMsg?.message || "Invalid or expired verification link.";

        setStatus("error");
        setMessage(finalMsg);
        toast.error(finalMsg);
      }
    }

    if (token) {
      verify();
    } else {
      setStatus("error");
      setMessage("Verification link is missing a token.");
    }
  }, [token, navigate]);

  async function handleResend() {
    if (!resendEmail) {
      toast.error("Please enter your email.");
      return;
    }

    try {
      setIsResending(true);
      const res = await api.post("/auth/resend-verification", { email: resendEmail });
      const msg = res?.data?.message || "A new verification email has been sent.";
      toast.success(msg);
    } catch (err) {
      const backendMsg = err?.response?.data;
      const finalMsg =
        typeof backendMsg === "string"
          ? backendMsg
          : backendMsg?.message || "Could not resend verification email.";
      toast.error(finalMsg);
    } finally {
      setIsResending(false);
    }
  }

  return (
    <div className="forgot-wrapper">
      <form className="forgot-form" onSubmit={(e) => e.preventDefault()}>
        <h2 className="forgot-title">Verify Your Email</h2>

        {status === "processing" && (
          <p className="forgot-description">{message}</p>
        )}

        {status === "success" && (
          <>
            <p className="forgot-description">{message}</p>
            <p className="forgot-description" style={{ marginTop: "10px" }}>
              Redirecting you to the login page...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <p className="forgot-description" style={{ marginTop: "10px" }}>
              Enter your email below to receive a new verification link.
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
              <label htmlFor="verify-email-resend">Email Address</label>
            </div>

            <button
              type="button"
              className="forgot-btn"
              onClick={handleResend}
              disabled={isResending}
            >
              {isResending ? "Sending..." : "Resend Verification Email"}
            </button>
          </>
        )}
      </form>
    </div>
  );
}