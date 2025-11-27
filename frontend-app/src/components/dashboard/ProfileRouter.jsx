import React from 'react';
import AdminProfile from './admin/AdminProfile';
import UserProfile from './user/UserProfile';

export default function ProfileRouter() {
  const role = localStorage.getItem('userRole');

  if (role === 'admin') {
    return <AdminProfile />;
  } else if (role === 'user') {
    return <UserProfile />;
  } else {
    return <div>Role isn't recognized</div>;
  }
}