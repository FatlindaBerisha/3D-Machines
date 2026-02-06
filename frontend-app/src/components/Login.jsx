import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from "react-toastify";
import { UserContext } from '../UserContext';
import api from "../utils/axiosClient";
import { removeAuth } from '../utils/storage';
import './styles/Form.css';
import logo from '../assets/logo.png';

export default function LoginForm() {
  const { setUser } = useContext(UserContext);
  const { t, i18n } = useTranslation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add("auth-page");

    const savedEmail = localStorage.getItem('savedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }

    return () => document.body.classList.remove("auth-page");
  }, []);

  useEffect(() => {
    const logoutToast = localStorage.getItem('logoutToast');
    const loginSession = localStorage.getItem('loginSession');


    if (logoutToast === 'true') {
      toast.info(t('toasts.logoutMessage'), {
        style: { background: "#345ea0", color: "#fff" }
      });
      localStorage.removeItem('logoutToast');
      localStorage.removeItem('loginSession');
    }
    else if (loginSession === 'active') {
      toast.info(t('toasts.logoutMessage'), {
        style: { background: "#345ea0", color: "#fff" }
      });
      localStorage.removeItem('loginSession');
    }
  }, []);

  const delay = (ms) => new Promise(res => setTimeout(res, ms));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.warning(t('toasts.fillAllFields'));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.warning(t('toasts.invalidEmail'));
      return;
    }

    setLoading(true);
    await delay(800);

    try {
      const res = await api.post("/auth/login", { email, password, language: i18n.language });

      const data = res.data;

      if (!data?.token) {
        toast.error(t('toasts.invalidResponse'));
        return;
      }

      removeAuth();

      // ALWAYS use localStorage for auth (so new tabs work)
      localStorage.setItem("jwtToken", data.token);
      if (data.refreshToken) {
        localStorage.setItem("refreshToken", data.refreshToken);
      }

      let decodedEmail = "";
      try {
        const payload = JSON.parse(atob(data.token.split(".")[1]));
        decodedEmail =
          payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"] ||
          payload.email ||
          payload.Email ||
          "";
      } catch { }

      localStorage.setItem("loggedIn", "true");

      // "Remember Me" only controls saving the email for next time
      if (rememberMe) {
        localStorage.setItem('savedEmail', decodedEmail || email);
      } else {
        localStorage.removeItem('savedEmail');
      }
      localStorage.removeItem('savedPassword');

      const userObj = {
        token: data.token,
        refreshToken: data.refreshToken || null,
        role: data.role || "user",
        fullName: data.fullName || "",
        profession: data.profession || "",
        gender: data.gender || "",
        email: decodedEmail || email,
      };

      localStorage.setItem("user", JSON.stringify(userObj));

      // Update Context immediately so app knows user is logged in
      setUser(userObj);

      localStorage.setItem('loginSession', 'active');

      // Store welcome name for Dashboard to show
      const welcomeName = userObj.fullName || userObj.email.split('@')[0];
      localStorage.setItem('welcomeName', welcomeName);

      // Navigate immediately
      navigate(userObj.role === "admin" ? "/dashboard/admin" : "/dashboard/user");

    } catch (err) {
      let msg = err?.response?.data?.message || err?.response?.data || t('toasts.loginFailed');
      const lowerMsg = msg.toLowerCase();

      if (lowerMsg.includes("email not verified")) {
        toast.error(t('toasts.emailNotVerified'));
        return;
      }

      if (lowerMsg.includes("incorrect password")) {
        toast.error(t('toasts.incorrectPassword'));
        return;
      }

      if (lowerMsg.includes("user not found")) {
        toast.error(t('toasts.userNotFound'));
        return;
      }

      // Detect lockout messages
      if (lowerMsg.includes("too many attempts") || lowerMsg.includes("locked")) {
        // Try to extract minutes
        const minutesMatch = msg.match(/(\d+)\s*minutes/i) || msg.match(/(\d+)\s*min/i);
        const minutes = minutesMatch ? minutesMatch[1] : "15";

        toast.error(t('toasts.accountLocked', { minutes }));
        return;
      }

      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="auth-wrapper modern">
      <div className="left-panel">
        <h2>{t('login.title')}</h2>
        <p>
          {t('login.description')}
        </p>
      </div>

      <div className="right-panel">
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <img src={logo} alt="Logo" className="logo-img" />

          <div className="input-group">
            <input id="email" type="text" name="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} placeholder=" " aria-label={t('login.email')} autoComplete="email" />
            <label htmlFor="email">{t('login.email')}</label>
          </div>

          <div className="input-group">
            <input type={showPassword ? "text" : "password"} name="password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} placeholder=" " aria-label={t('login.password')} autoComplete="current-password" />
            <label>{t('login.password')}</label>
            <button
              type="button"
              onClick={() => setShowPassword(prev => !prev)}
              className={`show-password-btn btn-show ${showPassword ? 'active' : ''}`}
              aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
              aria-pressed={showPassword}
            >
              <i className={showPassword ? "bi bi-eye-slash" : "bi bi-eye"}></i>
            </button>
          </div>

          <div className="remember-forgot">
            <label className="checkbox-label" htmlFor="rememberMe">
              <input
                type="checkbox"
                id="rememberMe"
                name="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              {t('login.rememberMe')}
            </label>

            <Link to="/forgot-password" className="forgot-password-link">
              {t('login.forgotPassword')}
            </Link>
          </div>

          <button type="submit" className="btn-primary" disabled={loading} aria-busy={loading}>
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" style={{ marginRight: '8px' }}>
                </span>
                {t('login.loggingIn')}
              </>
            ) : (
              t('login.loginButton')
            )}
          </button>

          <p className="toggle-text">
            {t('login.noAccount')}{' '}
            <Link className="toggle-btn" to="/register">
              {t('login.register')}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}