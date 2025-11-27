// Centralized logout helper
// - Revokes refresh token (best-effort)
// - Clears localStorage
// - Broadcasts logout to other tabs via `app-logout` key
// - Redirects to `/login` using replace()

export async function logout({ revoke = true } = {}) {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    if (revoke && refreshToken) {
      // Best-effort revoke: use fetch to avoid axios interceptors
      try {
        await fetch('https://localhost:7178/api/auth/revoke-token', {
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

  // Clear storage and notify other tabs
  try {
    localStorage.clear();
    // write a timestamp so other tabs detect the change
    localStorage.setItem('app-logout', Date.now().toString());
  } catch (e) {
    /* ignore */
  }

  // Use replace to avoid keeping protected pages in history
  window.location.replace('/login');
}

const auth = { logout };
export default auth;
