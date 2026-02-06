import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../../ThemeContext";
import api from "../../../utils/axiosClient";
import "../../styles/Preferences.css";

export default function Preferences() {
  const { t, i18n } = useTranslation();
  const { isDarkMode, setDarkMode } = useTheme();

  const [preferences, setPreferences] = useState({
    language: i18n.language || "en",
    notifications: true,
    push: false,
    email: false,
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/user/profile");
        if (res.data.preferredLanguage) {
          setPreferences(prev => ({ ...prev, language: res.data.preferredLanguage }));
          if (res.data.preferredLanguage !== i18n.language) {
            i18n.changeLanguage(res.data.preferredLanguage);
          }
        }
      } catch (err) {
        console.error("Failed to fetch profile for preferences:", err);
      }
    };
    fetchProfile();
  }, []); // Run once on mount

  const toggle = (key) => {
    if (key === 'darkMode') {
      setDarkMode(!isDarkMode);
    } else {
      setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
    }
  };

  const handleLanguageChange = async (e) => {
    const newLang = e.target.value;
    setPreferences((prev) => ({ ...prev, language: newLang }));
    i18n.changeLanguage(newLang);

    try {
      // We need to send full name etc because profile PUT requires it
      // Alternatively, we could add a dedicated preference endpoint.
      // For now, let's fetch profile first or just send the lang update if we have a special endpoint.
      // I'll update the backend to allow just sending Preference if I want, but I already updated UpdateProfile.
      // So I'll fetch current profile first to not overwrite with blanks.
      const profile = await api.get("/user/profile");
      await api.put("/user/profile", {
        ...profile.data,
        preferredLanguage: newLang
      });
    } catch (err) {
      console.error("Failed to update language preference on backend:", err);
    }
  };

  return (
    <div className="preferences-container">

      {/* Page Title */}
      <h2 className="preferences-title">{t('preferences.title')}</h2>

      {/* ----------- APPEARANCE ----------- */}
      <div className="pref-section">
        <h3 className="pref-section-title">{t('preferences.appearance')}</h3>

        {/* Dark Mode */}
        <div className="pref-row">
          <div className="pref-label-wrap">
            <span className="pref-label">{t('preferences.darkMode')}</span>
            <span className="pref-description">{t('preferences.darkModeDesc')}</span>
          </div>

          <label className="switch">
            <input
              type="checkbox"
              checked={isDarkMode}
              onChange={() => toggle("darkMode")}
            />
            <span className="slider"></span>
          </label>
        </div>
      </div>

      {/* ----------- LANGUAGE ----------- */}
      <div className="pref-section">
        <h3 className="pref-section-title">{t('preferences.language')}</h3>

        <div className="pref-row">
          <div className="pref-label-wrap">
            <span className="pref-label">{t('preferences.language')}</span>
            <span className="pref-description">{t('preferences.languageDesc')}</span>
          </div>

          <select
            className="pref-select"
            value={preferences.language}
            onChange={handleLanguageChange}
          >
            <option value="en">{t('languages.english')}</option>
            <option value="sq">{t('languages.albanian')}</option>
            <option value="de">{t('languages.german')}</option>
          </select>
        </div>
      </div>
    </div>
  );
}
