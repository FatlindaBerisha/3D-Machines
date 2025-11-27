import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UserProvider } from './UserContext';

import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import Terms from './components/Terms';
import Privacy from './components/Privacy';
import VerifyEmail from './components/VerifyEmail';

import DashboardLayout from './components/layout/DashboardLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import PublicRoute from './components/auth/PublicRoute';
import ProfileRouter from './components/dashboard/ProfileRouter';

import AdminDashboard from './components/dashboard/admin/AdminDashboard';
import ManageTeam from './components/dashboard/admin/ManageTeam';
import PrintLogs from './components/dashboard/admin/PrintLogs';
import Filaments from './components/dashboard/admin/Filaments';
import ProjectFiles from './components/dashboard/admin/ProjectFiles';
import AdminSecurity from './components/dashboard/admin/AdminSecurity';
import Preferences from './components/dashboard/admin/Preferences';
import Notifications from './components/dashboard/admin/NotificationsSettings';

import UserDashboard from './components/dashboard/user/UserDashboard';
import NewPrint from './components/dashboard/user/NewPrint';
import PrintLog from './components/dashboard/user/PrintLog';
import UserProjects from './components/dashboard/user/UserProjects';
import UserSecurity from './components/dashboard/user/UserSecurity';
import UserPreferences from './components/dashboard/user/Preferences';
import UserNotification from './components/dashboard/user/NotificationsSettings';

import { ToastContainer } from 'react-toastify';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'react-toastify/dist/ReactToastify.css';
import 'react-phone-input-2/lib/style.css';

export default function App() {
  return (
    <UserProvider>
      <Router>
        <ToastContainer
          position="top-right"
          autoClose={4000}
          theme="colored"
          toastClassName="login-toast"
          bodyClassName="toast-body"
          style={{ zIndex: 10000 }}
        />

        <Routes>
          {/* PUBLIC ROUTES */}
          <Route 
            path="/" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />

          <Route 
            path="/register" 
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } 
          />

          <Route 
            path="/forgot-password" 
            element={
              <PublicRoute>
                <ForgotPassword />
              </PublicRoute>
            } 
          />

          <Route 
            path="/reset-password" 
            element={
              <PublicRoute>
                <ResetPassword />
              </PublicRoute>
            } 
          />

          <Route 
            path="/terms" 
            element={
              <PublicRoute>
                <Terms />
              </PublicRoute>
            } 
          />

          <Route 
            path="/privacy" 
            element={
              <PublicRoute>
                <Privacy />
              </PublicRoute>
            } 
          />

          <Route 
            path="/verify-email" 
            element={
              <PublicRoute>
                <VerifyEmail />
              </PublicRoute>
            } 
          />

          {/* PROTECTED ADMIN ROUTES */}
          <Route
            path="/dashboard/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<ManageTeam />} />
            <Route path="print-logs" element={<PrintLogs />} />
            <Route path="filaments" element={<Filaments />} />
            <Route path="project-files" element={<ProjectFiles />} />
            <Route path="profile" element={<ProfileRouter />} />
            <Route path="security" element={<AdminSecurity />} />
            <Route path="preferences" element={<Preferences />} />
            <Route path="notifications" element={<Notifications />} />
          </Route>

          {/* PROTECTED USER ROUTES */}
          <Route
            path="/dashboard/user"
            element={
              <ProtectedRoute allowedRoles={['user']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<UserDashboard />} />
            <Route path="new-print" element={<NewPrint />} />
            <Route path="print-log" element={<PrintLog />} />
            <Route path="user-projects" element={<UserProjects />} />
            <Route path="profile" element={<ProfileRouter />} />
            <Route path="security" element={<UserSecurity />} />
            <Route path="preferences" element={<UserPreferences />} />
            <Route path="notifications" element={<UserNotification />} />
          </Route>
        </Routes>
      </Router>
    </UserProvider>
  );
}