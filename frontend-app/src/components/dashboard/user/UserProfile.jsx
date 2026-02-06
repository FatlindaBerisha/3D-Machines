import React, { useContext, useState, useEffect, useMemo } from "react";
import { UserContext } from '../../../UserContext';
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import api from "../../../utils/axiosClient";

import '../../styles/Profile.css';

export default function UserProfile() {
  const { t, i18n } = useTranslation();
  const { setUser } = useContext(UserContext);
  const [originalData, setOriginalData] = useState(null);

  const professionOptions = useMemo(() => [
    { value: "student", label: t('common.student') },
    { value: "engineer", label: t('common.engineer') },
    { value: "designer", label: t('common.designer') },
  ], [t]);

  const genderOptions = useMemo(() => [
    { value: "female", label: t('genderOptions.female') },
    { value: "male", label: t('genderOptions.male') },
    { value: "notsay", label: t('genderOptions.notSay') },
    { value: "custom", label: t('genderOptions.custom') },
  ], [t]);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    profession: "",
    gender: "",
    pendingEmail: null // Add pendingEmail to state
  });

  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Email Change Modal State
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailChangeData, setEmailChangeData] = useState({
    newEmail: "",
    currentPassword: ""
  });
  const [emailChangeLoading, setEmailChangeLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ------------------------------------------------------------
  // FETCH PROFILE (axios auto-refresh)
  // ------------------------------------------------------------
  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      try {
        const res = await api.get("/user/profile");
        const data = res.data;

        setFormData({
          fullName: data.fullName || "",
          email: data.email || "",
          phone: data.phone || "",
          profession: data.profession || professionOptions[0].value,
          gender: data.gender || genderOptions[0].value,
          pendingEmail: data.pendingEmail // Set pending email from backend
        });

        setUser(data);
      } catch (error) {
        toast.error(error?.response?.data?.message || t('toasts.loadDataFailed'));
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [setUser]);

  // ------------------------------------------------------------
  // Form change handler
  // ------------------------------------------------------------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ------------------------------------------------------------
  // SUBMIT PROFILE EDIT (axios)
  // ------------------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const bodyToSend = {
        fullName: formData.fullName,
        phone: formData.phone,
        profession: formData.profession,
        gender: formData.gender,
      };

      await api.put("/user/profile", bodyToSend);

      toast.success(t('profile.profileUpdated'));

      setUser(prevUser => ({
        ...prevUser,
        ...bodyToSend,
      }));

      setIsEditing(false);

    } catch (error) {
      toast.error(error?.response?.data?.message || t('toasts.printJobUpdateFailed'));
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------------------
  // EMAIL CHANGE HANDLERS
  // ------------------------------------------------------------
  const handleEmailChangeInput = (e) => {
    const { name, value } = e.target;
    setEmailChangeData(prev => ({ ...prev, [name]: value }));
  };

  const handleRequestEmailChange = async (e) => {
    e.preventDefault();
    setEmailChangeLoading(true);

    try {
      await api.post("/user/request-email-change", {
        newEmail: emailChangeData.newEmail,
        currentPassword: emailChangeData.currentPassword,
        language: i18n.language
      });

      toast.success(t('profile.emailChangeRequested'));
      setShowEmailModal(false);
      setEmailChangeData({ newEmail: "", currentPassword: "" });
      setShowPassword(false);

      // Update local state to show the pending email immediately
      setFormData(prev => ({ ...prev, pendingEmail: emailChangeData.newEmail }));

    } catch (error) {
      toast.error(error?.response?.data?.message || t('toasts.genericError'));
    } finally {
      setEmailChangeLoading(false);
    }
  };

  const closeEmailModal = () => {
    setShowEmailModal(false);
    setEmailChangeData({ newEmail: "", currentPassword: "" });
    setShowPassword(false);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="profile-form">
        <h2 className="profile-title">{t('profile.title')}</h2>

        {/* Full Name */}
        <div className="user-input-group">
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder=" "
            disabled={!isEditing || loading}
            required
          />
          <label>{t('profile.fullName')}</label>
        </div>

        {/* Phone */}
        <div className="user-input-group">
          <PhoneInput
            country={'xk'}
            value={formData.phone}
            onChange={phone => setFormData(prev => ({ ...prev, phone }))}
            inputProps={{ name: 'phone', disabled: !isEditing || loading }}
            containerClass={isEditing ? "react-tel-input enabled" : "react-tel-input disabled"}
            inputClass="form-control"
            buttonClass="flag-dropdown"
            dropdownClass="phone-dropdown"
            enableSearch={false}
            disableSearchIcon={true}
            countryCodeEditable={false}
            masks={{ xk: '.........' }}
          />
        </div>

        {/* Email with Change Button */}
        <div className={`user-input-group ${isEditing ? 'email-row' : ''}`}>
          <input
            type="email"
            name="email"
            value={formData.email}
            placeholder=" "
            disabled
          />
          <label>{t('profile.email')}</label>
          {isEditing && (
            <button
              type="button"
              className="change-email-btn"
              onClick={() => setShowEmailModal(true)}
              title={t('profile.changeEmail')}
            >
              <i className="bi bi-pencil-square"></i>
            </button>
          )}
        </div>

        {/* Pending Email Notice */}
        {formData.pendingEmail && (
          <div className="pending-email-notice">
            <i className="bi bi-info-circle-fill"></i>
            <span>
              {t('profile.pendingEmailCheck')} <b>{formData.pendingEmail}</b>
            </span>
          </div>
        )}

        {/* Profession + Gender */}
        <div className="row-selects">
          <div className="user-input-group">
            <select
              name="profession"
              value={formData.profession}
              onChange={handleChange}
              disabled={!isEditing || loading}
              required
            >
              {professionOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <label>{t('profile.profession')}</label>
          </div>

          <div className="user-input-group">
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              disabled={!isEditing || loading}
              required
            >
              {genderOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <label>{t('profile.gender')}</label>
          </div>
        </div>

        {/* Buttons */}
        {!isEditing ? (
          <button
            type="button"
            onClick={() => {
              setOriginalData(formData);
              setIsEditing(true);
            }}
            className="edit-button"
          >
            {t('profile.edit')}
          </button>
        ) : (
          <div className="edit-buttons-row">
            <button type="submit" disabled={loading} className="submit-button">
              {loading ? t('profile.updating') : t('profile.save')}
            </button>
            <button
              type="button"
              onClick={() => {
                if (originalData) setFormData(originalData);
                setIsEditing(false);
              }}
              disabled={loading}
              className="cancel-button"
            >
              {t('profile.cancel')}
            </button>
          </div>
        )}
      </form>

      {/* Email Change Modal */}
      {showEmailModal && (
        <div className="modal-overlay" onClick={closeEmailModal}>
          <div className="modal-box email-change-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="security-modal-title">{t('profile.changeEmailModal.title')}</h2>
            <p className="modal-description">{t('profile.changeEmailModal.description')}</p>

            <form onSubmit={handleRequestEmailChange}>
              <div className="user-input-group modal-input">
                <input
                  type="email"
                  name="newEmail"
                  value={emailChangeData.newEmail}
                  onChange={handleEmailChangeInput}
                  placeholder=" "
                  required
                  autoComplete="off"
                />
                <label>{t('profile.changeEmailModal.newEmail')}</label>
              </div>

              <div className="user-input-group modal-input password-group">
                <input
                  type={showPassword ? "text" : "password"}
                  name="currentPassword"
                  value={emailChangeData.currentPassword}
                  onChange={handleEmailChangeInput}
                  placeholder=" "
                  required
                  autoComplete="off"
                />
                <label>{t('profile.changeEmailModal.currentPassword')}</label>
                <button
                  type="button"
                  className={`show-password-btn ${showPassword ? 'active' : ''}`}
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                </button>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-back-btn"
                  onClick={closeEmailModal}
                >
                  {t('profile.changeEmailModal.cancel')}
                </button>
                <button
                  type="submit"
                  className="submit-button"
                  disabled={emailChangeLoading}
                >
                  {emailChangeLoading ? t('profile.updating') : t('profile.changeEmailModal.submit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}