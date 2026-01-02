import React, { useContext, useState, useEffect, useMemo } from "react";
import { UserContext } from '../../../UserContext';
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import api from "../../../utils/axiosClient";

import '../../styles/Profile.css';

export default function UserProfile() {
  const { t } = useTranslation();
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
  });

  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

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
        });

        setUser(data);
      } catch (error) {
        toast.error(error?.response?.data?.message || t('toasts.loadDataFailed'));
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [setUser, professionOptions, genderOptions]);

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

  return (
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

      {/* Email */}
      <div className="user-input-group">
        <input
          type="email"
          name="email"
          value={formData.email}
          placeholder=" "
          disabled
        />
        <label>{t('profile.email')}</label>
      </div>

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
  );
}