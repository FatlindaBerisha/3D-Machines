import React, { useContext, useState, useEffect, useMemo } from "react";
import { UserContext } from '../../../UserContext';
import { toast } from "react-toastify";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

import api from "../../../utils/axiosClient";
import '../../styles/Profile.css';

export default function AdminProfile() {
  const { setUser } = useContext(UserContext);
  const [originalData, setOriginalData] = useState(null);

  const professionOptions = useMemo(() => [
    { value: "student", label: "Student" },
    { value: "engineer", label: "Engineer" },
    { value: "designer", label: "Designer" },
  ], []);

  const genderOptions = useMemo(() => [
    { value: "female", label: "Female" },
    { value: "male", label: "Male" },
    { value: "notsay", label: "Rather not say" },
    { value: "custom", label: "Customised" },
  ], []);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    profession: "",
    gender: "",
  });

  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // =========================
  // LOAD PROFILE (AUTOMATIC REFRESH TOKEN WORKS)
  // =========================
  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);

      try {
        const res = await api.get("/user/profile"); // <-- axiosClient
        const data = res.data;

        setFormData({
          fullName: data.fullName || "",
          email: data.email || "",
          phone: data.phone || "",
          profession: data.profession || professionOptions[0].value,
          gender: data.gender || genderOptions[0].value,
        });

        setUser(data);
      } catch (err) {
        toast.error("Failed to fetch profile.");
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [setUser, professionOptions, genderOptions]);


  // =========================
  // UPDATE PROFILE
  // =========================
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

      await api.put("/user/profile", bodyToSend); // <-- axiosClient

      toast.success("Profile updated successfully!");

      setUser(prev => ({
        ...prev,
        ...bodyToSend,
      }));

      setIsEditing(false);
    } catch (error) {
      toast.error("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };


  // =========================
  // RENDER UI
  // =========================
  return (
    <form onSubmit={handleSubmit} className="profile-form">
      <h2 className="profile-title">Admin Profile</h2>

      {/* Full Name */}
      <div className="user-input-group">
        <input
          type="text"
          name="fullName"
          value={formData.fullName}
          onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
          placeholder=" "
          disabled={!isEditing || loading}
          required
        />
        <label>Full Name</label>
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
        <label>Email</label>
      </div>

      {/* Selects */}
      <div className="row-selects">
        <div className="user-input-group">
          <select
            name="profession"
            value={formData.profession}
            onChange={(e) => setFormData(prev => ({ ...prev, profession: e.target.value }))}
            disabled={!isEditing || loading}
            required
          >
            {professionOptions.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <label>Profession</label>
        </div>

        <div className="user-input-group">
          <select
            name="gender"
            value={formData.gender}
            onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
            disabled={!isEditing || loading}
            required
          >
            {genderOptions.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <label>Gender</label>
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
          Edit
        </button>
      ) : (
        <div className="edit-buttons-row">
          <button type="submit" disabled={loading} className="submit-button">
            {loading ? "Updating..." : "Save Changes"}
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
            Cancel
          </button>
        </div>
      )}
    </form>
  );
}