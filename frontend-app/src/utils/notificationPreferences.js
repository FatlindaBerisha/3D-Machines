export const DEFAULT_PREFERENCES = {
    enabled: true,
    // User Keys
    jobSubmitted: true,
    jobStarted: true,
    jobCompleted: true,
    jobFailed: true,
    deadlineApproaching: true,

    // Admin Keys
    jobCreated: true,
    printerOffline: true,
    newUserRegistered: true,
};

export const getNotificationPreferences = () => {
    try {
        const stored = localStorage.getItem("notification_preferences");
        if (!stored) return DEFAULT_PREFERENCES;

    } catch (err) {
        console.error("Error reading notification preferences:", err);
        return DEFAULT_PREFERENCES;
    }
};

export const setNotificationPreferences = (prefs) => {
    try {
        localStorage.setItem("notification_preferences", JSON.stringify(prefs));
    } catch (err) {
        console.error("Error saving notification preferences:", err);
    }
};
