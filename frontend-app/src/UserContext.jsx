import React, { createContext, useState, useEffect } from 'react';

export const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    const savedToken = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');

    if (savedUser) {
      try { setUser(JSON.parse(savedUser)); } catch { }
    }
    if (savedToken) setToken(savedToken);
  }, []);

  const syncToStorage = (key, value, isObject = false) => {
    const sValue = isObject ? JSON.stringify(value) : value;
    if (localStorage.getItem(key)) {
      localStorage.setItem(key, sValue);
    } else if (sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, sValue);
    }
  };

  useEffect(() => {
    if (user) syncToStorage('user', user, true);
  }, [user]);

  useEffect(() => {
    if (token) syncToStorage('jwtToken', token);
  }, [token]);

  return (
    <UserContext.Provider value={{ user, setUser, token, setToken }}>
      {children}
    </UserContext.Provider>
  );
}