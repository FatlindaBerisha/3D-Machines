import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import './styles/Form.css';
import logo from '../assets/logo.png';

export default function RegisterForm() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loggedIn = localStorage.getItem('loggedIn') === 'true';
    const role = localStorage.getItem('userRole');
    if (loggedIn) {
      if (role === 'admin') {
        navigate('/dashboard/admin', { replace: true });
      } else {
        navigate('/dashboard/user', { replace: true });
      }
    }
  }, [navigate]);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    profession: '',
    gender: '',
    agree: false
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePhoneChange = (value) => {
    setFormData(prev => ({ ...prev, phone: value }));
  };

  const delay = ms => new Promise(res => setTimeout(res, ms));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { fullName, phone, email, password, confirmPassword, profession, gender } = formData;

    const nameRegex = /^[a-zA-Z\s]{3,}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

    if (!nameRegex.test(fullName)) {
      toast.error("Full name must be at least 3 letters and contain only letters/spaces.", {
        className: 'login-toast-error',
        bodyClassName: 'toast-body',
      });
      setLoading(false);
      return;
    }

    if (!phone || phone.length < 8) {
      toast.error("Please enter a valid phone number.", {
        className: 'login-toast-error',
        bodyClassName: 'toast-body',
      });
      setLoading(false);
      return;
    }

    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address.", {
        className: 'login-toast-error',
        bodyClassName: 'toast-body',
      });
      setLoading(false);
      return;
    }

    if (!passwordRegex.test(password)) {
      toast.error("Password must be at least 8 characters and include uppercase, lowercase, number, and symbol.", {
        className: 'login-toast-error',
        bodyClassName: 'toast-body',
      });
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.", {
        className: 'login-toast-error',
        bodyClassName: 'toast-body',
      });
      setLoading(false);
      return;
    }

    if (!profession) {
      toast.error("Please select your profession.", {
        className: 'login-toast-error',
        bodyClassName: 'toast-body',
      });
      setLoading(false);
      return;
    }

    if (!gender) {
      toast.error("Please select your gender.", {
        className: 'login-toast-error',
        bodyClassName: 'toast-body',
      });
      setLoading(false);
      return;
    }

    try {
      await delay(1500);

      const dataToSend = {
        fullName: formData.fullName,
        phone: '+' + formData.phone,
        profession: formData.profession,
        email: formData.email,
        password: formData.password,
        gender: formData.gender
      };

      const res = await fetch('https://localhost:7178/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });

      if (!res.ok) {
        const errorText = await res.text();
        toast.error(`Registration failed: ${errorText || 'Unknown error'}`, {
          className: 'login-toast-error',
          bodyClassName: 'toast-body',
        });
        setLoading(false);
        return;
      }

      toast.success('Registration successful! Redirecting...', {
        className: 'login-toast-success',
        bodyClassName: 'toast-body',
        autoClose: 1000,
        onClose: () => navigate('/')
      });

    } catch (error) {
      toast.error('Registration failed: ' + error.message, {
        className: 'login-toast-error',
        bodyClassName: 'toast-body',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="left-panel">
        <h2>3D Machines – Access Portal</h2>
        <p>
          Manage your entire 3D printing process from a single, easy-to-use interface.
          Easily track your print jobs, monitor filament consumption, and view your printer’s status in real time.
          Developed to simplify things and allow you to print high-quality results consistently and reliably.
        </p>
      </div>

      <div className="right-panel">
        <form className="auth-form register" onSubmit={handleSubmit} noValidate>
          <img src={logo} alt="Logo" className="logo-img" />

          <div className="input-group">
            <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} placeholder=" " disabled={loading}/>
            <label>Full Name</label>
          </div>

          <div className="input-group">
            <PhoneInput
              country={'xk'}
              value={formData.phone}
              onChange={handlePhoneChange}
              inputProps={{ name: 'phone', disabled: loading }}
              containerClass="react-tel-input"
              inputClass="form-control"
              buttonClass="flag-dropdown"
              dropdownClass="phone-dropdown"
              enableSearch={false}
              disableSearchIcon={true}
              countryCodeEditable={false}
              disableSearch={true}
              masks={{ xk: '.........' }}
            />
          </div>

          <div className="input-group">
            <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder=" " disabled={loading}/>
            <label>Email</label>
          </div>

          <div className="input-group">
            <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} placeholder=" " disabled={loading}/>
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

          <div className="input-group">
            <input type={showConfirmPassword ? "text" : "password"} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder=" " disabled={loading}/>
            <label>Confirm Password</label>
            <button
              type="button"
              onClick={() => setShowConfirmPassword(prev => !prev)}
              className={`show-password-btn btn-show ${showConfirmPassword  ? 'active' : ''}`}
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              aria-pressed={showConfirmPassword}
            >
              <i className={showConfirmPassword ? "bi bi-eye-slash" : "bi bi-eye"}></i>
            </button>
          </div>

          <div className="side-column">
            <div className="input-group">
              <select name="profession" value={formData.profession} onChange={handleChange} className={formData.profession ? 'has-value' : ''} disabled={loading}>
                <option value="" disabled hidden></option>
                <option value="student">Student</option>
                <option value="engineer">Engineer</option>
                <option value="designer">Designer</option>
              </select>
              <label>Profession</label>
            </div>

            <div className="input-group">
              <select name="gender" value={formData.gender} onChange={handleChange} className={formData.gender ? 'has-value' : ''} disabled={loading}>
                <option value="" disabled hidden></option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="notsay">Rather not say</option>
                <option value="custom">Customised</option>
              </select>
              <label>Gender</label>
            </div>
          </div>

          <div className="terms-container">
            <label className="terms-label">
              By registering, you accept the{' '}
              <a href="/terms" target="_blank" rel="noopener noreferrer">Mechatronic Terms</a> and{' '}
              <a href="/privacy" target="_blank" rel="noopener noreferrer">Data Policy</a>
            </label>
          </div>

          <button type="submit" className="btn-primary" disabled={loading} aria-busy={loading}>
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" style={{ marginRight: '8px' }}></span>
                Registering...
              </>
            ) : (
              'Register'
            )}
          </button>

          <p className="toggle-text">
            Already have an account? <Link className="toggle-btn" to="/">Login</Link>
          </p>
        </form>
      </div>
    </div>
  );
}