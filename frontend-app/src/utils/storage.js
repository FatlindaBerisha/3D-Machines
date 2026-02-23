// Minimal storage helper for auth tokens
export function getToken() {
  return localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken') || null;
}

export function getRefreshToken() {
  return localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken') || null;
}

// setAuth: store tokens and optional user info. If remember is true, use localStorage, else sessionStorage
export function setAuth({ token, refreshToken, user } = {}, remember = true) {
  const store = remember ? localStorage : sessionStorage;
  if (token === undefined || token === null) {
    store.removeItem('jwtToken');
  } else {
    store.setItem('jwtToken', token);
  }

  if (refreshToken === undefined || refreshToken === null) {
    store.removeItem('refreshToken');
  } else {
    store.setItem('refreshToken', refreshToken);
  }

  if (user === undefined || user === null) {
    store.removeItem('user');
  } else {
    try { store.setItem('user', JSON.stringify(user)); } catch (e) { /* ignore */ }
  }
}

export function getUser() {
  const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch (e) {
    return null;
  }
}

export function clearAuth() {
  try { localStorage.removeItem('jwtToken'); localStorage.removeItem('refreshToken'); localStorage.removeItem('user'); } catch { }
  try { sessionStorage.removeItem('jwtToken'); sessionStorage.removeItem('refreshToken'); sessionStorage.removeItem('user'); } catch { }
}

export const removeAuth = clearAuth;

export default { getToken, getRefreshToken, setAuth, clearAuth, getUser, removeAuth };
