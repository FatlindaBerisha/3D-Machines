import React, { useState } from "react";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import api from "../utils/axiosClient";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.warning("Please enter your email.");
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/forgot-password", { email });

      toast.success("Reset link sent! Check your email.");
      setEmail("");

    } catch (err) {
      toast.error(
        err?.response?.data ||
        err?.response?.data?.message ||
        "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-wrapper">
      <form className="forgot-form" onSubmit={handleSubmit}>
        <h2 className="forgot-title">Forgot Your Password</h2>
        <p className="forgot-description">
          Please enter your email address to receive a password reset link.
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
          <label htmlFor="forgot-email">Email Address</label>
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
              Sending...
            </>
          ) : (
            "Send Reset Link"
          )}
        </button>

        <p className="forgot-toggle-text">
          <Link className="forgot-toggle-btn" to="/">
            <FiArrowLeft className="back-icon" />
            Back to Login
          </Link>
        </p>
      </form>
    </div>
  );
}