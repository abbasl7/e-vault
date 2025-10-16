import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useEffect } from 'react';
import { Toaster } from './components/ui/toaster';

// Pages
import LoginPage from './pages/LoginPage';
import SetupPage from './pages/SetupPage';
import DashboardPage from './pages/DashboardPage';
import BanksPage from './pages/BanksPage';
import CardsPage from './pages/CardsPage';
import PoliciesPage from './pages/PoliciesPage';
import AadharPage from './pages/AadharPage';
import PanPage from './pages/PanPage';
import LicensePage from './pages/LicensePage';
import VoterIdPage from './pages/VoterIdPage';
import MiscPage from './pages/MiscPage';
import AllDocumentsPage from './pages/AllDocumentsPage';
import SettingsPage from './pages/SettingsPage';
import BackupRestorePage from './pages/BackupRestorePage';
import PasswordResetPage from './pages/PasswordResetPage';

function App() {
  const { isAuthenticated, checkInactivity, updateActivity } = useAuthStore();

  // Check for inactivity
  useEffect(() => {
    const interval = setInterval(() => {
      checkInactivity();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [checkInactivity]);

  // Update activity on user interaction
  useEffect(() => {
    const handleActivity = () => {
      if (isAuthenticated) {
        updateActivity();
      }
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
    };
  }, [isAuthenticated, updateActivity]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/setup" element={<SetupPage />} />
        <Route path="/login" element={<LoginPage />} />
        
        {/* Protected routes */}
        {isAuthenticated ? (
          <>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/banks" element={<BanksPage />} />
            <Route path="/cards" element={<CardsPage />} />
            <Route path="/policies" element={<PoliciesPage />} />
            <Route path="/aadhar" element={<AadharPage />} />
            <Route path="/pan" element={<PanPage />} />
            <Route path="/license" element={<LicensePage />} />
            <Route path="/voterid" element={<VoterIdPage />} />
            <Route path="/misc" element={<MiscPage />} />
            <Route path="/documents" element={<AllDocumentsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/backup-restore" element={<BackupRestorePage />} />
            <Route path="/password-reset" element={<PasswordResetPage />} />
          </>
        ) : (
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

export default App;
