import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from "react-toastify";
import { UserContext } from '../UserContext';
import api from "../utils/axiosClient";
import './styles/Form.css';
import logo from '../assets/logo.png';

export default function LoginForm() {
  const { setUser } = useContext(UserContext);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add("auth-page");
    return () => document.body.classList.remove("auth-page");
  }, []);

  const delay = (ms) => new Promise(res => setTimeout(res, ms));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.warning("Please fill in both fields.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.warning("Invalid email format.");
      return;
    }

    setLoading(true);
    await delay(800);

    try {
      const res = await api.post("/auth/login", { email, password });

      const data = res.data;

      if (!data?.token) {
        toast.error("Invalid response from server.");
        return;
      }

      localStorage.clear();

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
      } catch {}

      localStorage.setItem("fullName", data.fullName || "");
      localStorage.setItem("userRole", data.role || "user");
      localStorage.setItem("profession", data.profession || "");
      localStorage.setItem("gender", data.gender || "");
      localStorage.setItem("email", decodedEmail || email);
      localStorage.setItem("loggedIn", "true");

      const userObj = {
        token: data.token,
        refreshToken: data.refreshToken || null,
        role: data.role || "user",
        fullName: data.fullName || "",
        profession: data.profession || "",
        gender: data.gender || "",
        email: decodedEmail || email,
      };

      setUser(userObj);

      toast.success("Login successful!", {
        autoClose: 900,
        onClose: () => {
          navigate(userObj.role === "admin" ? "/dashboard/admin" : "/dashboard/user");
        },
      });

    } catch (err) {
      let msg = err?.response?.data?.message || err?.response?.data || "Login failed.";

      if (msg.toLowerCase().includes("email not verified")) {
          toast.error("Your email is not verified. Please check your inbox.");
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
        <h2>3D Machines – Access Portal</h2>
        <p>
          Manage your entire 3D printing process from a single, easy-to-use interface.
          Easily track your print jobs, monitor filament consumption, and view your printer’s status in real time.
          Developed to simplify things and allow you to print high-quality results consistently and reliably.
        </p>
      </div>

      <div className="right-panel">
        <form className="auth-form" onSubmit={handleSubmit}>
          <img src={logo} alt="Logo" className="logo-img" />

          <div className="input-group">
            <input id="email" type="text" name="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} placeholder=" " aria-label="Email" autoComplete="email"/>
            <label htmlFor="email">Email</label>
          </div>
          
          <div className="input-group">
            <input type={showPassword ? "text" : "password"} name="password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} placeholder=" " aria-label="Password" autoComplete="current-password"/>
            <label>Password</label>
            <button
              type="button"
              onClick={() => setShowPassword(prev => !prev)}
              className={`show-password-btn btn-show ${showPassword ? 'active' : ''}`}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
            >
              <i className={showPassword ? "bi bi-eye-slash" : "bi bi-eye"}></i>
            </button>
          </div>
          
          <div className="remember-forgot">
            <label className="checkbox-label" htmlFor="rememberMe">
              <input type="checkbox" id="rememberMe" name="rememberMe"/>
              Remember Me
            </label>

            <Link to="/forgot-password" className="forgot-password-link">
              Forgot Password?
            </Link>
          </div>

          <button type="submit" className="btn-primary" disabled={loading} aria-busy={loading}>
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" style={{ marginRight: '8px' }}>
                </span>
                Logging in...
              </>
            ) : (
              'Login'
            )}
          </button>

          <p className="toggle-text">
            Don’t have an account?{' '}
            <Link className="toggle-btn" to="/register">
              Register
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}