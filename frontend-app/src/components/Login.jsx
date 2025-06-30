import React, { useState, useEffect, useContext  } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from "react-toastify";
import { UserContext } from '../UserContext';
import 'react-toastify/dist/ReactToastify.css';
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
    const token = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');
    const role = localStorage.getItem('userRole') || sessionStorage.getItem('userRole');

    if (token) {
      if (role === 'admin') {
        navigate('/dashboard/admin', { replace: true });
      } else {
        navigate('/dashboard/user', { replace: true });
      }
    }
  }, [navigate]);

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.warning("Please fill in both email and password.", { className: 'login-toast-warning', bodyClassName: 'toast-body', });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.warning("Please enter a valid email address.", { className: 'login-toast-warning', bodyClassName: 'toast-body', });
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()\-_=+{}[\]|;:'",.<>/\\]).{8,}$/;
    if (!passwordRegex.test(password)) {
      toast.warning("Password must be minimum 8 characters, include uppercase, lowercase, number, and special character.", { className: 'login-toast-warning', bodyClassName: 'toast-body', });
      return;
    }

    setLoading(true);
    await delay(1500);

    try {
      const res = await fetch('https://localhost:7178/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }), });

      if (!res.ok) {
        switch (res.status) {
          case 500:
            toast.error('Server error (500). Please try again later.', { className: 'login-toast-error', bodyClassName: 'toast-body', });
            break;
          case 403:
            toast.error('Access forbidden (403).', { className: 'login-toast-error', bodyClassName: 'toast-body', });
            break;
          case 401:
            toast.warning('Unauthorized (401): Check your credentials.', { className: 'login-toast-warning', bodyClassName: 'toast-body', });
            break;
          default:
            const errorText = await res.text();
            toast.error(`Login failed: ${errorText || 'Unknown error'}`, { className: 'login-toast-error', bodyClassName: 'toast-body', });
        }
      } else {
        const user = await res.json();

        localStorage.clear();

        localStorage.setItem('fullName', user.fullName);
        localStorage.setItem('jwtToken', user.token);
        localStorage.setItem('loggedIn', 'true');
        const email = JSON.parse(atob(user.token.split('.')[1]))["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"];
        localStorage.setItem('email', email);
        localStorage.setItem('userRole', user.role);

        setUser(user);

        toast.success('Login successful! Redirecting...', { className: 'login-toast-success', bodyClassName: 'toast-body', autoClose: 1000,
          onClose: () => {
            if (user.role === 'admin') {
              navigate('/dashboard/admin');
            } else {
              navigate('/dashboard/user');
            }
          }
        });
      }
    } catch (error) {
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        toast.error('Network error: Cannot reach server. Please check your connection.', { className: 'login-toast-error', bodyClassName: 'toast-body', });
      } else {
        toast.error('Login failed. Please try again later.', { className: 'login-toast-error', bodyClassName: 'toast-body', });
      }
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
            <input id="email" type="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} placeholder=" " aria-label="Email" autoComplete="email"/>
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