import { useState, useEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { AdminDashboard } from './components/AdminDashboard';
import { Login } from './components/Login';
import { useAuth } from './contexts/AuthContext';
import { Toaster } from './components/ui/sonner';

export default function App() {
  const [currentView, setCurrentView] = useState('landing');
  const { user, isAuthenticated, logout, loading } = useAuth();

  const handleNavigateToDashboard = () => {
    if (isAuthenticated()) {
      setCurrentView('dashboard');
    } else {
      setCurrentView('login');
    }
  };

  const handleLoginSuccess = () => {
    setCurrentView('landing');
  };

  const handleLogout = () => {
    logout();
    setCurrentView('landing');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster />
      {currentView === 'landing' && (
        <LandingPage onNavigateToDashboard={handleNavigateToDashboard} />
      )}
      {currentView === 'login' && (
        <Login
          onLoginSuccess={handleLoginSuccess}
          onNavigateToLanding={() => setCurrentView('landing')}
        />
      )}
      {currentView === 'dashboard' && (
        <AdminDashboard
          user={user}
          onNavigateToLanding={() => setCurrentView('landing')}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}
