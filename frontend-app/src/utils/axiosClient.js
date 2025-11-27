import axios from "axios";
import { getConnection, createConnection } from "./signalRConnection";
import { logout } from "./auth";

const api = axios.create({
  baseURL: "https://localhost:7178/api",
  withCredentials: false,
});

// Initialization debug: confirm this module is loaded and show token prefixes
try {
  const _j = localStorage.getItem('jwtToken');
  const _r = localStorage.getItem('refreshToken');
  console.log('axiosClient initialized. jwtPrefix:', _j ? _j.slice(0,8) : null, ' refreshPrefix:', _r ? _r.slice(0,8) : null);
} catch (e) {}

// Helper: wait for another tab to finish refresh (multi-tab coordination)
function waitForRefreshDone(timeout = 10000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();

    function check() {
      // If refresh-done present, resolve
      if (localStorage.getItem('refresh-done')) return resolve(true);
      // If refreshing flag removed and no refresh-done, then nothing to wait for
      if (!localStorage.getItem('refreshing')) return resolve(false);
      if (Date.now() - start > timeout) return reject(new Error('refresh-timeout'));
      setTimeout(check, 200);
    }

    // Also listen to storage events (faster)
    function onStorage(e) {
      if (e.key === 'refresh-done' || e.key === 'refreshing' || e.key === 'app-logout') {
        cleanup();
        if (localStorage.getItem('refresh-done')) return resolve(true);
        return resolve(false);
      }
    }

    function cleanup() {
      window.removeEventListener('storage', onStorage);
    }

    window.addEventListener('storage', onStorage);
    check();
  });
}

// Helper: parse JWT and return seconds until expiry (or null)
function getAccessTokenExpirySeconds(token) {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = JSON.parse(atob(parts[1]));
    if (!payload || !payload.exp) return null;
    // exp is in seconds since epoch
    const now = Math.floor(Date.now() / 1000);
    return payload.exp - now;
  } catch (e) {
    return null;
  }
}

// Attach access token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("jwtToken");
  if (token) {
    config.headers = config.headers || {};
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

// Response + refresh token handler
api.interceptors.response.use(
  (res) => res,

  async (error) => {
    console.error("Axios Error:", error);

    const originalRequest = error.config;
    const status = error.response?.status;

    // If no response → network/cors issue
    if (!error.response) {
      return Promise.reject(error);
    }

    // Only refresh ONCE
    if ((status === 401 || status === 403) && !originalRequest._retry) {
      originalRequest._retry = true;

      // If another tab is already refreshing, wait for it to finish and reuse tokens
      if (localStorage.getItem('refreshing')) {
        try {
          const didFinish = await waitForRefreshDone();
          if (didFinish) {
            const newToken = localStorage.getItem('jwtToken');
            if (newToken) {
              originalRequest.headers = originalRequest.headers || {};
              originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
              return api(originalRequest);
            }
          }
          // if no new token, fallthrough to attempt refresh in this tab
        } catch (e) {
          // timed out waiting - proceed to attempt refresh
          console.warn('Wait for refresh timed out, attempting refresh in this tab');
        }
      }

      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        await logout();
        return;
      }

      try {
        // Mark that this tab is performing refresh (multi-tab coordination)
        try { localStorage.setItem('refreshing', Date.now().toString()); } catch {}
          // Debug: show masked preview of token being sent and expiry info
          try {
            const access = localStorage.getItem('jwtToken');
            const secs = getAccessTokenExpirySeconds(access);
            console.log("Refreshing with token (prefix):", refreshToken?.slice(0,8), "len:", refreshToken?.length);
            if (secs !== null) console.log(`Access token expires in ${secs}s`);
            else console.log('No valid access token present to check expiry');
          } catch (e) {}

        // Refresh request WITHOUT interceptors
        const res = await axios.post("https://localhost:7178/api/auth/refresh-token", {
          refreshToken
        });

        console.log("Refresh Response:", res.data);

        // Save new tokens (log masked previews)
        try { console.log("Saving new token prefixes:", res.data.token?.slice(0,8), res.data.refreshToken?.slice(0,8)); } catch {}
        localStorage.setItem("jwtToken", res.data.token);
        localStorage.setItem("refreshToken", res.data.refreshToken);
        // Notify other tabs that refresh is done and include a small marker
        try { localStorage.setItem('refresh-done', JSON.stringify({ ts: Date.now(), prefix: (res.data.refreshToken||'').slice(0,8) })); } catch {}
        // remove the 'refreshing' flag after a short delay so listeners pick up both keys
        try { localStorage.removeItem('refreshing'); } catch {}

        // Session refreshed — components will handle user notifications

        // Restart SignalR with new token
        const oldConn = getConnection();
        if (oldConn) {
          console.log("Stopping old SignalR connection...");
          await oldConn.stop().catch(() => {});
        }

        const newConn = createConnection(res.data.token);
        if (newConn) {
          console.log("Starting new SignalR connection with refreshed token...");
          newConn.start().catch(err => console.error("SignalR restart error:", err));
        }

        // Retry original request with new token
        originalRequest.headers["Authorization"] = `Bearer ${res.data.token}`;
        return api(originalRequest);

      } catch (refreshErr) {
        console.error("Refresh Token FAILED (first attempt):", refreshErr);

        // Inspect error and print a categorized reason for easier debugging
        try {
          if (!refreshErr?.response) {
            console.error('Refresh failed: no response from server. Possible network / CORS issue.');
          } else {
            const st = refreshErr.response.status;
            const data = refreshErr.response.data;
            console.error('Refresh failed: server responded with', st, data);
            if (st === 400) console.error('Reason: Bad Request. Payload may be malformed.');
            else if (st === 401) console.error('Reason: Invalid or expired refresh token.');
            else if (st === 403) console.error('Reason: Forbidden.');
            else if (st >= 500) console.error('Reason: Server error.');
          }
        } catch (e) { console.error('Error while classifying refresh error', e); }

        // Possible token rotation race: another tab may have refreshed and saved
        // a new refreshToken. Try one more time with the current localStorage value.
          const currentRefresh = localStorage.getItem("refreshToken");
          if (currentRefresh && currentRefresh !== refreshToken && !originalRequest._retry2) {
          console.log("Detected rotated refresh token in storage, retrying refresh with new token...");
          originalRequest._retry2 = true;
          try {
            const res2 = await axios.post("https://localhost:7178/api/auth/refresh-token", {
              refreshToken: currentRefresh
            });

            console.log("Refresh Response (retry):", res2.data);

            localStorage.setItem("jwtToken", res2.data.token);
            localStorage.setItem("refreshToken", res2.data.refreshToken);

            // Restart SignalR with new token
            const oldConn2 = getConnection();
            if (oldConn2) {
              await oldConn2.stop().catch(() => {});
            }
            const newConn2 = createConnection(res2.data.token);
            if (newConn2) newConn2.start().catch(err => console.error("SignalR restart error:", err));

            originalRequest.headers["Authorization"] = `Bearer ${res2.data.token}`;
            return api(originalRequest);
          } catch (retryErr) {
            console.error("Refresh Token FAILED (retry):", retryErr);
            // fall through to logout below
          }
        }

        // Let the UI react to this by redirecting to login; components can show toasts
        await logout();
        return Promise.reject(refreshErr);
      }
    }

    // Other errors — let calling components inspect `error.response` and
    // produce user-facing messages. No local `msg` variable required.
    return Promise.reject(error);
  }
);

export default api;