import React, { useState } from "react";
import "../../styles/Preferences.css";

export default function Notifications() {
  const [notifications, setNotifications] = useState({
    enabled: true,

    // PRINT JOBS
    jobCreated: true,
    jobCompleted: true,
    jobFailed: true,

    // MACHINES
    printerOffline: false,

    // SYSTEM
    newUserRegistered: false,
  });

  const toggle = (key) =>
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="preferences-container">

      {/* Title */}
      <h2 className="preferences-title">Notifications</h2>

      <div className="pref-section">

        {/* Enable / Disable All */}
        <div className="pref-row">
          <div className="pref-label-wrap">
            <span className="pref-label">Enable Notifications</span>
            <span className="pref-description">
              Turn all notifications on or off
            </span>
          </div>

          <label className="switch">
            <input
              type="checkbox"
              checked={notifications.enabled}
              onChange={() => toggle("enabled")}
            />
            <span className="slider"></span>
          </label>
        </div>

        {notifications.enabled && (
          <>

            {/* PRINT JOBS */}
            <div className="pref-row sub-setting">
              <div className="pref-label-wrap">
                <span className="pref-label">Job Created</span>
                <span className="pref-description">
                  Notify me whenever a user submits a new print job
                </span>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={notifications.jobCreated}
                  onChange={() => toggle("jobCreated")}
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="pref-row sub-setting">
              <div className="pref-label-wrap">
                <span className="pref-label">Job Completed</span>
                <span className="pref-description">
                  Alert me when a print job finishes successfully
                </span>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={notifications.jobCompleted}
                  onChange={() => toggle("jobCompleted")}
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="pref-row sub-setting">
              <div className="pref-label-wrap">
                <span className="pref-label">Job Failed / Error</span>
                <span className="pref-description">
                  Notify if a print job stops, fails, or has slicing issues
                </span>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={notifications.jobFailed}
                  onChange={() => toggle("jobFailed")}
                />
                <span className="slider"></span>
              </label>
            </div>


            {/* MACHINES */}
            <div className="pref-row sub-setting">
              <div className="pref-label-wrap">
                <span className="pref-label">Printer Offline</span>
                <span className="pref-description">
                  Alert me when a printer goes offline or stops responding
                </span>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={notifications.printerOffline}
                  onChange={() => toggle("printerOffline")}
                />
                <span className="slider"></span>
              </label>
            </div>


            {/* SYSTEM */}
            <div className="pref-row sub-setting">
              <div className="pref-label-wrap">
                <span className="pref-label">New User Registered</span>
                <span className="pref-description">
                  Receive alerts when a new user joins the system
                </span>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={notifications.newUserRegistered}
                  onChange={() => toggle("newUserRegistered")}
                />
                <span className="slider"></span>
              </label>
            </div>

          </>
        )}

      </div>
    </div>
  );
}