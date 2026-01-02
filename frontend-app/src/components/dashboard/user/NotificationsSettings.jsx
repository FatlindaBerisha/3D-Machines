import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import "../../styles/Preferences.css";

export default function UserNotifications() {
  const { t } = useTranslation();
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
      <h2 className="preferences-title">{t('notifications.title')}</h2>

      <div className="pref-section">

        {/* Enable / Disable All */}
        <div className="pref-row">
          <div className="pref-label-wrap">
            <span className="pref-label">{t('notifications.enableNotifications')}</span>
            <span className="pref-description">
              {t('notifications.enableDesc')}
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
                <span className="pref-label">{t('notifications.jobSubmitted')}</span>
                <span className="pref-description">
                  {t('notifications.jobSubmittedDesc')}
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
                <span className="pref-label">{t('notifications.printStarted')}</span>
                <span className="pref-description">
                  {t('notifications.printStartedDesc')}
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
                <span className="pref-label">{t('notifications.printCompleted')}</span>
                <span className="pref-description">
                  {t('notifications.printCompletedDesc')}
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
                <span className="pref-label">{t('notifications.printFailed')}</span>
                <span className="pref-description">
                  {t('notifications.printFailedDesc')}
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
                <span className="pref-label">{t('notifications.deadlineApproaching')}</span>
                <span className="pref-description">
                  {t('notifications.deadlineDesc')}
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