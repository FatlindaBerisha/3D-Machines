import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UserProvider } from './UserContext';

import Login from './components/Login';
import Register from './components/Register';
import Terms from './components/Terms';
import Privacy from './components/Privacy';
import DashboardLayout from './components/layout/DashboardLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ProfileRouter from './components/dashboard/ProfileRouter';

import AdminDashboard from './components/dashboard/admin/AdminDashboard';
import ManageTeam from './components/dashboard/admin/ManageTeam';
import PrintLogs from './components/dashboard/admin/PrintLogs';
import Filaments from './components/dashboard/admin/Filaments';

import UserDashboard from './components/dashboard/user/UserDashboard';
import NewPrint from './components/dashboard/user/NewPrint';
import PrintLog from './components/dashboard/user/PrintLog';
import FilamentManager from './components/dashboard/user/FilamentManager';

import 'react-phone-input-2/lib/style.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function App() {
  return (
    <UserProvider>
      <Router>
        <ToastContainer
          position="top-right"
          autoClose={4000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
          toastClassName="login-toast"
          bodyClassName="toast-body"
        />

        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />

          {/* Protected ADMIN routes */}
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
            <Route path="profile" element={<ProfileRouter />} />
          </Route>

          {/* Protected USER routes */}
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
            <Route path="filament" element={<FilamentManager />} />
            <Route path="profile" element={<ProfileRouter />} />
          </Route>
        </Routes>
      </Router>
    </UserProvider>
  );
}