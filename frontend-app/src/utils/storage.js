// Minimal storage helper for auth tokens

export function getUser() {
  const u = localStorage.getItem('user') || sessionStorage.getItem('user');
  if (!u) return null;
  try { return JSON.parse(u); } catch { return null; }
}
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
    try { store.setItem('user', JSON.stringify(user)); } catch (e) { }
  }
}

export function removeAuth() {
  ['jwtToken', 'refreshToken', 'user'].forEach(key => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
}

export const clearAuth = removeAuth;

export default { getToken, getRefreshToken, getUser, setAuth, clearAuth, removeAuth };
