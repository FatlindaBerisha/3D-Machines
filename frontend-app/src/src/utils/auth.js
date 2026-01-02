const API_BASE =
  process.env.NODE_ENV === "development"
    ? "https://localhost:7178"
    : process.env.REACT_APP_API_URL;

export async function logout({ revoke = true } = {}) {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    if (revoke && refreshToken) {
      try {
        await fetch(`${API_BASE}/api/auth/revoke-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
      } catch (e) {
        console.warn('Revoke request failed (ignored):', e);
      }
    }
  } catch (e) {
    // ignore
  }

  try {
    localStorage.clear();
    localStorage.setItem('app-logout', Date.now().toString());
  } catch (e) {}

  window.location.replace('/');
}

const auth = { logout };
export default auth;