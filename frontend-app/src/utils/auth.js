import { removeAuth } from './storage';

export async function logout({ revoke = true } = {}) {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    if (revoke && refreshToken) {
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
  } catch (e) { }

  try {
    const savedEmail = localStorage.getItem('savedEmail');
    const savedPassword = localStorage.getItem('savedPassword');

    removeAuth();

    localStorage.setItem('app-logout', Date.now().toString());
    localStorage.setItem('logoutToast', 'true');
    localStorage.removeItem('loginSession');
  } catch (e) { }

  window.location.replace('/');
}

const auth = { logout };
export default auth;
