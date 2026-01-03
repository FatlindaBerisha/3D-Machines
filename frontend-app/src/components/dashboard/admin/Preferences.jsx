import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../../ThemeContext";
import "../../styles/Preferences.css";

export default function Preferences() {
  const { t, i18n } = useTranslation();
  const { isDarkMode, setDarkMode } = useTheme();

  const [preferences, setPreferences] = useState({
    language: i18n.language || "en",
  });

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    i18n.changeLanguage(newLang);
    setPreferences((prev) => ({ ...prev, language: newLang }));
  };

  return (
    <div className="preferences-container">
      <h2 className="preferences-title">{t('preferences.title')}</h2>

      {/* ----------- APPEARANCE ----------- */}
      <div className="pref-section">
        <h3 className="pref-section-title">{t('preferences.appearance')}</h3>

        <div className="pref-row">
          <div className="pref-label-wrap">
            <span className="pref-label">{t('preferences.darkMode')}</span>
            <span className="pref-description">
              {t('preferences.darkModeDesc')}
            </span>
          </div>

          <label className="switch">
            <input
              type="checkbox"
              checked={isDarkMode}
              onChange={() => setDarkMode(!isDarkMode)}
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
            <span className="pref-description">
              {t('preferences.languageDesc')}
            </span>
          </div>

          <select
            className="pref-select"
            value={preferences.language}
            onChange={handleLanguageChange}
          >
            <option value="en">English</option>
            <option value="sq">Shqip</option>
            <option value="de">Deutsch</option>
          </select>
        </div>
      </div>
    </div>
  );
}
