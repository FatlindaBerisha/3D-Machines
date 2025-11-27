import React, { useState } from "react";
import "../../styles/Preferences.css";

export default function UserNotifications() {
  const [notifications, setNotifications] = useState({
    enabled: true,

    // USER PRINT JOBS
    jobSubmitted: true,
    jobStarted: false,
    jobCompleted: true,
    jobFailed: true,

    // DEADLINE
    deadlineApproaching: true,
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
            {/* ---------------------- USER PRINT JOBS ---------------------- */}

            {/* Job Submitted */}
            <div className="pref-row sub-setting">
              <div className="pref-label-wrap">
                <span className="pref-label">Print Job Submitted</span>
                <span className="pref-description">
                  Notify me when I submit a new print job
                </span>
              </div>

              <label className="switch">
                <input
                  type="checkbox"
                  checked={notifications.jobSubmitted}
                  onChange={() => toggle("jobSubmitted")}
                />
                <span className="slider"></span>
              </label>
            </div>

            {/* Job Started */}
            <div className="pref-row sub-setting">
              <div className="pref-label-wrap">
                <span className="pref-label">Print Started</span>
                <span className="pref-description">
                  Alert me when my print job begins
                </span>
              </div>

              <label className="switch">
                <input
                  type="checkbox"
                  checked={notifications.jobStarted}
                  onChange={() => toggle("jobStarted")}
                />
                <span className="slider"></span>
              </label>
            </div>

            {/* Job Completed */}
            <div className="pref-row sub-setting">
              <div className="pref-label-wrap">
                <span className="pref-label">Print Completed</span>
                <span className="pref-description">
                  Notify me when my print job finishes successfully
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

            {/* Job Failed */}
            <div className="pref-row sub-setting">
              <div className="pref-label-wrap">
                <span className="pref-label">Print Failed / Error</span>
                <span className="pref-description">
                  Notify me if my print job stops, fails, or encounters issues
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

            {/* DEADLINE */}
            <div className="pref-row sub-setting">
              <div className="pref-label-wrap">
                <span className="pref-label">Deadline Approaching</span>
                <span className="pref-description">
                  Receive reminders when a print job is close to its deadline
                </span>
              </div>

              <label className="switch">
                <input
                  type="checkbox"
                  checked={notifications.deadlineApproaching}
                  onChange={() => toggle("deadlineApproaching")}
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