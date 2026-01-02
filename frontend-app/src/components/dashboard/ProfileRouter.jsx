import React from 'react';
import AdminProfile from './admin/AdminProfile';
import UserProfile from './user/UserProfile';

export default function ProfileRouter() {
  // Helper to get the role from storage
  const getRole = () => {
    // 1. Try to find 'user' in localStorage
    let stored = localStorage.getItem('user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.role) return parsed.role;
      } catch (e) {
        // ignore JSON error
      }
    }

    // 2. Try to find 'user' in sessionStorage
    stored = sessionStorage.getItem('user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.role) return parsed.role;
      } catch (e) {
        // ignore JSON error
      }
    }

    // 3. Fallback to legacy 'userRole' key
    return localStorage.getItem('userRole');
  };

  const role = getRole();

  if (role === 'admin') {
    return <AdminProfile />;
  } else if (role === 'user') {
    return <UserProfile />;
  } else {
    // Optional: Render user profile as default or show specific error based on what 'role' actually is.
    // For now, keeping the error message but logging what happened can be useful for debugging.
    console.warn(`ProfileRouter: Role not recognized. Value: ${role}`);
    return <div>Role isn't recognized ({role || 'undefined'})</div>;
  }
}