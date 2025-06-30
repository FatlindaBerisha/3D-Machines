import React, { useContext, useState, useEffect, useMemo } from "react";
import { UserContext } from '../../../UserContext';
import { toast } from "react-toastify";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

import '../../styles/Profile.css';

export default function UserProfile() {
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

  const [formData, setFormData] = useState({ fullName: "", email: "", phone: "", profession: "", gender: "", password: "", confirmPassword: "", });

  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const token = localStorage.getItem("jwtToken");

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      try {
        const res = await fetch("https://localhost:7178/api/user/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch profile");
        const data = await res.json();

        setFormData({
          fullName: data.fullName || "",
          email: data.email || "",
          phone: data.phone || "",
          profession: data.profession || professionOptions[0].value,
          gender: data.gender || genderOptions[0].value,
          password: "",
          confirmPassword: "",
        });

        setUser(data);
      } catch (error) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [token, setUser, professionOptions, genderOptions]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Password and Confirm Password do not match");
      return;
    }

    setLoading(true);

    try {
      const bodyToSend = {
        fullName: formData.fullName,
        phone: formData.phone,
        profession: formData.profession,
        gender: formData.gender,
        ...(formData.password && { password: formData.password }),
      };

      const res = await fetch("https://localhost:7178/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bodyToSend),
      });

      if (!res.ok) throw new Error("Update failed");

      toast.success("Profile updated successfully!");
      setUser(prevUser => ({
        ...prevUser,
        ...bodyToSend,
      }));

      setFormData(prev => ({ ...prev, password: "", confirmPassword: "" }));
      setIsEditing(false);
      setShowPassword(false);
      setShowConfirmPassword(false);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="profile-form">
      <h2 className="profile-title">User Profile</h2>

      <div className="user-input-group">
        <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} placeholder=" " disabled={!isEditing || loading} required />
        <label>Full Name</label>
      </div>

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
          disableSearch={true}
          masks={{ xk: '.........' }}
        />
      </div>

      <div className="user-input-group">
        <input type="email" name="email" value={formData.email} placeholder=" " disabled />
        <label>Email</label>
      </div>

      {isEditing && (
        <>
          <div className="user-input-group password-group">
            <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} placeholder=" " disabled={loading} />
            <label>New Password</label>
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

          <div className="user-input-group password-group">
            <input type={showConfirmPassword ? "text" : "password"} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder=" " disabled={loading} />
            <label>Confirm Password</label>
            <button
              type="button"
              onClick={() => setShowConfirmPassword(prev => !prev)}
              className={`show-password-btn btn-show ${showConfirmPassword ? 'active' : ''}`}
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              aria-pressed={showConfirmPassword}
            >
              <i className={showConfirmPassword ? "bi bi-eye-slash" : "bi bi-eye"}></i>
            </button>
          </div>
        </>
      )}

      <div className="row-selects">
        <div className="user-input-group">
          <select name="profession" value={formData.profession} onChange={handleChange} disabled={!isEditing || loading} required >
            {professionOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <label>Profession</label>
        </div>

        <div className="user-input-group">
          <select name="gender" value={formData.gender} onChange={handleChange} disabled={!isEditing || loading} required >
            {genderOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <label>Gender</label>
        </div>
      </div>

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
              if (originalData) {
                setFormData(originalData);
              }
              setIsEditing(false);
              setShowPassword(false);
              setShowConfirmPassword(false);
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