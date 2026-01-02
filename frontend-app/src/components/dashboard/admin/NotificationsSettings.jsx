import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import "../../styles/Preferences.css";

export default function AdminNotifications() {
  const { t } = useTranslation();
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

            {/* PRINT JOBS */}
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
                  checked={notifications.jobCreated}
                  onChange={() => toggle("jobCreated")}
                />
                <span className="slider"></span>
              </label>
            </div>

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


            {/* MACHINES */}
            <div className="pref-row sub-setting">
              <div className="pref-label-wrap">
                <span className="pref-label">{t('notifications.printerOffline')}</span>
                <span className="pref-description">
                  {t('notifications.printerOfflineDesc')}
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
                <span className="pref-label">{t('notifications.newUserRegistered')}</span>
                <span className="pref-description">
                  {t('notifications.newUserDesc')}
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