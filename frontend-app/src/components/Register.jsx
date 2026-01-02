import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import './styles/Form.css';
import logo from '../assets/logo.png';

import api from "../utils/axiosClient";

export default function RegisterForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.body.classList.add("auth-page");
    return () => document.body.classList.remove("auth-page");
  }, []);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    profession: '',
    gender: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
      toast.error("Full name must be at least 3 letters.");
      setLoading(false);
      return;
    }

    if (!phone || phone.length < 8) {
      toast.error("Please enter a valid phone number.");
      setLoading(false);
      return;
    }

    if (!emailRegex.test(email)) {
      toast.error("Invalid email format.");
      setLoading(false);
      return;
    }

    if (!passwordRegex.test(password)) {
      toast.error("Password must include uppercase, lowercase, number and symbol.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      setLoading(false);
      return;
    }

    if (!profession || !gender) {
      toast.error("Please complete all required fields.");
      setLoading(false);
      return;
    }

    try {
      await delay(800);

      const payload = {
        fullName: fullName.trim(),
        phone: "+" + phone,
        profession,
        email,
        password,
        gender
      };

      await api.post("/auth/register", payload);

      toast.success("Registration successful! Please check your email to verify your account.");
      navigate("/");
    } catch (err) {
      toast.error(
        err?.response?.data ||
        err?.response?.data?.message ||
        "Registration failed."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="left-panel">
        <h2>{t('login.title')}</h2>
        <p>
          {t('login.description')}
        </p>
      </div>

      <div className="right-panel">
        <form className="auth-form register" onSubmit={handleSubmit} noValidate>
          <img src={logo} alt="Logo" className="logo-img" />

          <div className="input-group">
            <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} placeholder=" " disabled={loading} />
            <label>{t('register.fullName')}</label>
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
            <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder=" " disabled={loading} />
            <label>{t('register.email')}</label>
          </div>

          <div className="input-group">
            <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} placeholder=" " disabled={loading} />
            <label>{t('register.password')}</label>
            <button
              type="button"
              onClick={() => setShowPassword(prev => !prev)}
              className={`show-password-btn btn-show ${showPassword ? 'active' : ''}`}
              aria-label={showPassword ? t('register.hidePassword') : t('register.showPassword')}
              aria-pressed={showPassword}
            >
              <i className={showPassword ? "bi bi-eye-slash" : "bi bi-eye"}></i>
            </button>
          </div>

          <div className="input-group">
            <input type={showConfirmPassword ? "text" : "password"} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder=" " disabled={loading} />
            <label>{t('register.confirmPassword')}</label>
            <button
              type="button"
              onClick={() => setShowConfirmPassword(prev => !prev)}
              className={`show-password-btn btn-show ${showConfirmPassword ? 'active' : ''}`}
              aria-label={showConfirmPassword ? t('register.hidePassword') : t('register.showPassword')}
              aria-pressed={showConfirmPassword}
            >
              <i className={showConfirmPassword ? "bi bi-eye-slash" : "bi bi-eye"}></i>
            </button>
          </div>

          <div className="side-column">
            <div className="input-group">
              <select name="profession" value={formData.profession} onChange={handleChange} className={formData.profession ? 'has-value' : ''} disabled={loading}>
                <option value="" disabled hidden></option>
                <option value="student">{t('common.student')}</option>
                <option value="engineer">{t('common.engineer')}</option>
                <option value="designer">{t('common.designer')}</option>
              </select>
              <label>{t('register.profession')}</label>
            </div>

            <div className="input-group">
              <select name="gender" value={formData.gender} onChange={handleChange} className={formData.gender ? 'has-value' : ''} disabled={loading}>
                <option value="" disabled hidden></option>
                <option value="female">{t('genderOptions.female')}</option>
                <option value="male">{t('genderOptions.male')}</option>
                <option value="notsay">{t('genderOptions.notSay')}</option>
                <option value="custom">{t('genderOptions.custom')}</option>
              </select>
              <label>{t('register.gender')}</label>
            </div>
          </div>

          <div className="terms-container">
            <label className="terms-label">
              {t('register.terms')}{' '}
              <a href="/terms" target="_blank" rel="noopener noreferrer">{t('register.mechanicTerms')}</a> {t('register.and')}{' '}
              <a href="/privacy" target="_blank" rel="noopener noreferrer">{t('register.dataPolicy')}</a>
            </label>
          </div>

          <button type="submit" className="btn-primary" disabled={loading} aria-busy={loading}>
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" style={{ marginRight: '8px' }}></span>
                {t('register.registering')}
              </>
            ) : (
              t('register.registerButton')
            )}
          </button>

          <p className="toggle-text">
            {t('register.haveAccount')} <Link className="toggle-btn" to="/">{t('register.login')}</Link>
          </p>
        </form>
      </div>
    </div>
  );
}