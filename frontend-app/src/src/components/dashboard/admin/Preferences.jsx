import React, { useState } from "react";
import "../../styles/Preferences.css";

export default function Preferences() {

  const [preferences, setPreferences] = useState({
    darkMode: false,
    language: "English",
  });

  const toggle = (key) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="preferences-container">

      <h2 className="preferences-title">Preferences</h2>

      {/* ----------- APPEARANCE ----------- */}
      <div className="pref-section">
        <h3 className="pref-section-title">Appearance</h3>

        <div className="pref-row">
          <div className="pref-label-wrap">
            <span className="pref-label">Dark Mode</span>
            <span className="pref-description">
              Switch between light and dark mode
            </span>
          </div>

          <label className="switch">
            <input
              type="checkbox"
              checked={preferences.darkMode}
              onChange={() => toggle("darkMode")}
            />
            <span className="slider"></span>
          </label>
        </div>
      </div>

      {/* ----------- LANGUAGE ----------- */}
      <div className="pref-section">
        <h3 className="pref-section-title">Language</h3>

        <div className="pref-row">
          <div className="pref-label-wrap">
            <span className="pref-label">Language</span>
            <span className="pref-description">
              Choose your preferred language
            </span>
          </div>

          <select
            className="pref-select"
            value={preferences.language}
            onChange={(e) =>
              setPreferences((prev) => ({
                ...prev,
                language: e.target.value,
              }))
            }
          >
            <option>English</option>
            <option>Albanian</option>
            <option>German</option>
          </select>
        </div>
      </div>

    </div>
  );
}