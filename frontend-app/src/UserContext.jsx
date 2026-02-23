import React, { createContext, useState, useEffect } from 'react';

export const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user') || sessionStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const [token, setToken] = useState(() =>
    localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken') || null
  );

  // Sync to storage when state change
  useEffect(() => {
    if (user) {
      const store = localStorage.getItem('user') ? localStorage : sessionStorage;
      store.setItem('user', JSON.stringify(user));
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      const store = localStorage.getItem('jwtToken') ? localStorage : sessionStorage;
      store.setItem('jwtToken', token);
    }
  }, [token]);

  return (
    <UserContext.Provider value={{ user, setUser, token, setToken }}>
      {children}
    </UserContext.Provider>
  );
}