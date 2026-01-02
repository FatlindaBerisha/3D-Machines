import axios from "axios";
import { getConnection, createConnection } from "./signalRConnection";
import { logout } from "./auth";

// Auto-switch between local and production
const baseURL = "https://localhost:7178/api";

const api = axios.create({
  baseURL,
  withCredentials: false,
});

// Debug init
try {
  const _j = localStorage.getItem("jwtToken");
  const _r = localStorage.getItem("refreshToken");
  console.log(
    "axiosClient initialized. jwtPrefix:",
    _j ? _j.slice(0, 8) : null,
    " refreshPrefix:",
    _r ? _r.slice(0, 8) : null
  );
} catch (e) {}

// Wait for refresh from other tab
function waitForRefreshDone(timeout = 10000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();

    function check() {
      if (localStorage.getItem("refresh-done")) return resolve(true);
      if (!localStorage.getItem("refreshing")) return resolve(false);
      if (Date.now() - start > timeout)
        return reject(new Error("refresh-timeout"));
      setTimeout(check, 200);
    }

    function onStorage(e) {
      if (
        e.key === "refresh-done" ||
        e.key === "refreshing" ||
        e.key === "app-logout"
      ) {
        cleanup();
        if (localStorage.getItem("refresh-done")) return resolve(true);
        return resolve(false);
      }
    }

    function cleanup() {
      window.removeEventListener("storage", onStorage);
    }

    window.addEventListener("storage", onStorage);
    check();
  });
}

// Parse JWT expiry
function getAccessTokenExpirySeconds(token) {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (!payload.exp) return null;
    const now = Math.floor(Date.now() / 1000);
    return payload.exp - now;
  } catch {
    return null;
  }
}

// Attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("jwtToken");
  if (token) {
    config.headers = config.headers || {};
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

// Response + refresh handling
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    console.error("Axios Error:", error);

    const originalRequest = error.config;
    const status = error.response?.status;

    if (!error.response) return Promise.reject(error);

    if ((status === 401 || status === 403) && !originalRequest._retry) {
      originalRequest._retry = true;

      if (localStorage.getItem("refreshing")) {
        try {
          const finished = await waitForRefreshDone();
          if (finished) {
            const newToken = localStorage.getItem("jwtToken");
            if (newToken) {
              originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
              return api(originalRequest);
            }
          }
        } catch {}
      }

      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        await logout();
        return;
      }

      try {
        // Mark refresh
        localStorage.setItem("refreshing", Date.now().toString());

        const access = localStorage.getItem("jwtToken");
        const secs = getAccessTokenExpirySeconds(access);
        console.log(
          "Refreshing with token:",
          refreshToken.slice(0, 8),
          "Expires in:",
          secs
        );

        // 🔥 FIXED: use SAME baseURL (local or render)
        const refreshResponse = await axios.post(
          `${baseURL}/auth/refresh-token`,
          { refreshToken }
        );

        const data = refreshResponse.data;
        console.log("Refresh Response:", data);

        localStorage.setItem("jwtToken", data.token);
        localStorage.setItem("refreshToken", data.refreshToken);
        localStorage.setItem(
          "refresh-done",
          JSON.stringify({ ts: Date.now() })
        );
        localStorage.removeItem("refreshing");

        // Restart SignalR with new token
        const oldConn = getConnection();
        if (oldConn) await oldConn.stop().catch(() => {});
        const newConn = createConnection(data.token);
        if (newConn) newConn.start().catch(console.error);

        originalRequest.headers["Authorization"] = `Bearer ${data.token}`;
        return api(originalRequest);
      } catch (refreshErr) {
        console.error("Refresh FAILED:", refreshErr);

        await logout();
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

export default api;