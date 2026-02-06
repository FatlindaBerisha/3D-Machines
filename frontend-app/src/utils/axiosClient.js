import axios from "axios";
import { getConnection, createConnection } from "./signalRConnection";
import { logout } from "./auth";
import { getToken, getRefreshToken, setAuth } from "./storage";

const api = axios.create({
  baseURL: "http://localhost:5151/api",
  withCredentials: false,
});



function waitForRefreshDone(timeout = 10000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();

    function check() {
      if (localStorage.getItem('refresh-done')) return resolve(true);
      if (!localStorage.getItem('refreshing')) return resolve(false);
      if (Date.now() - start > timeout) return reject(new Error('refresh-timeout'));
      setTimeout(check, 200);
    }

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

function getAccessTokenExpirySeconds(token) {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = JSON.parse(atob(parts[1]));
    if (!payload || !payload.exp) return null;
    const now = Math.floor(Date.now() / 1000);
    return payload.exp - now;
  } catch (e) {
    return null;
  }
}

// Attach access token
api.interceptors.request.use((config) => {
  const token = getToken();
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

    if (!error.response) {
      return Promise.reject(error);
    }

    if ((status === 401 || status === 403) && !originalRequest._retry) {
      originalRequest._retry = true;

      if (localStorage.getItem('refreshing')) {
        try {
          const didFinish = await waitForRefreshDone();
          if (didFinish) {
            const newToken = getToken();
            if (newToken) {
              originalRequest.headers = originalRequest.headers || {};
              originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
              return api(originalRequest);
            }
          }
        } catch (e) {
          console.warn('Wait for refresh timed out, attempting refresh in this tab');
        }
      }

      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        await logout();
        return;
      }

      try {
        try { localStorage.setItem('refreshing', Date.now().toString()); } catch { }
        try {
          const access = getToken();
          const secs = getAccessTokenExpirySeconds(access);
          console.log("Refreshing with token (prefix):", refreshToken?.slice(0, 8), "len:", refreshToken?.length);
          if (secs !== null) console.log(`Access token expires in ${secs}s`);
          else console.log('No valid access token present to check expiry');
        } catch (e) { }

        const res = await axios.post("http://localhost:5151/api/auth/refresh-token", {
          refreshToken
        });

        console.log("Refresh Response:", res.data);

        try { console.log("Saving new token prefixes:", res.data.token?.slice(0, 8), res.data.refreshToken?.slice(0, 8)); } catch { }

        const isLocal = !!localStorage.getItem('jwtToken');
        setAuth(res.data, isLocal);

        try { localStorage.setItem('refresh-done', JSON.stringify({ ts: Date.now(), prefix: (res.data.refreshToken || '').slice(0, 8) })); } catch { }
        try { localStorage.removeItem('refreshing'); } catch { }

        const oldConn = getConnection();
        if (oldConn) {
          console.log("Stopping old SignalR connection...");
          await oldConn.stop().catch(() => { });
        }

        const newConn = createConnection(res.data.token);
        if (newConn) {
          console.log("Starting new SignalR connection with refreshed token...");
          newConn.start().catch(err => console.error("SignalR restart error:", err));
        }

        originalRequest.headers["Authorization"] = `Bearer ${res.data.token}`;
        return api(originalRequest);

      } catch (refreshErr) {
        console.error("Refresh Token FAILED (first attempt):", refreshErr);
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

        const currentRefresh = getRefreshToken();
        if (currentRefresh && currentRefresh !== refreshToken && !originalRequest._retry2) {
          console.log("Detected rotated refresh token in storage, retrying refresh with new token...");
          originalRequest._retry2 = true;
          try {
            const res2 = await axios.post("http://localhost:5151/api/auth/refresh-token", {
              refreshToken: currentRefresh
            });

            console.log("Refresh Response (retry):", res2.data);



            const isLocal2 = !!localStorage.getItem('jwtToken');
            setAuth(res2.data, isLocal2);

            const oldConn2 = getConnection();
            if (oldConn2) {
              await oldConn2.stop().catch(() => { });
            }
            const newConn2 = createConnection(res2.data.token);
            if (newConn2) newConn2.start().catch(err => console.error("SignalR restart error:", err));

            originalRequest.headers["Authorization"] = `Bearer ${res2.data.token}`;
            return api(originalRequest);
          } catch (retryErr) {
            console.error("Refresh Token FAILED (retry):", retryErr);
          }
        }

        await logout();
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

export default api;