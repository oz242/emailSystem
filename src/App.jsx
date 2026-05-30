import React, { useEffect } from 'react';
import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import ToastContainer from './components/Toast';
import Dashboard from './pages/Dashboard';
import ImportPage from './pages/ImportPage';
import ComposePage from './pages/ComposePage';
import SmtpSettingsPage from './pages/SmtpSettingsPage';
import HistoryPage from './pages/HistoryPage';
import LoginPage from './pages/LoginPage';
import AdminUsersPage from './pages/AdminUsersPage';
import useEmailStore from './store/emailStore';

function ProtectedShell() {
  const { user, authLoading } = useEmailStore();

  if (authLoading) {
    return (
      <div className="auth-loading">
        <span className="spinner spinner-lg" />
      </div>
    );
  }

  if (!user?.is_active) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/import" element={<ImportPage />} />
          <Route path="/compose" element={<ComposePage />} />
          <Route path="/smtp" element={<SmtpSettingsPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/admin/users" element={user?.is_admin ? <AdminUsersPage /> : <Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <ToastContainer />
    </div>
  );
}

export default function App() {
  const {
    theme,
    user,
    fetchSmtps,
    fetchCampaigns,
    loadCurrentUser,
    logout
  } = useEmailStore();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, []);

  useEffect(() => {
    loadCurrentUser();

    const handleRejectedAuth = (event) => {
      logout(event.detail?.message || 'Session expired. Please log in again.');
    };

    window.addEventListener('auth:rejected', handleRejectedAuth);
    return () => window.removeEventListener('auth:rejected', handleRejectedAuth);
  }, []);

  useEffect(() => {
    if (user?.is_active) {
      fetchSmtps();
      fetchCampaigns();
    }
  }, [user?.id]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={user?.is_active ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route path="/*" element={<ProtectedShell />} />
      </Routes>
    </BrowserRouter>
  );
}
