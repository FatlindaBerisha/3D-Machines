const getBaseUrl = () => {
    const hostname = window.location.hostname;
    // If we're on localhost, we might still want to connect to the IP if we're testing external access
    // but usually localhost is fine for the host itself.
    // The most reliable way for other laptops is to use the current hostname (the IP).
    return `http://${hostname}:5151`;
};

export const API_BASE_URL = `${getBaseUrl()}/api`;
export const HUB_URL = `${getBaseUrl()}/hub/notifications`;
export const CHAT_URL = `${getBaseUrl()}/api/chat`;
