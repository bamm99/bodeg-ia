import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { DashboardLayout } from './components/DashboardLayout';

function MainApp() {
  const { isAuthenticated, logout } = useAuth();
  const [currentView, setCurrentView] = useState<'landing' | 'login' | 'dashboard'>(
    isAuthenticated ? 'dashboard' : 'landing'
  );

  const handleLogout = () => {
    logout();
    setCurrentView('landing');
  };

  if (isAuthenticated || currentView === 'dashboard') {
    return <DashboardLayout onLogout={handleLogout} />;
  }

  if (currentView === 'login') {
    return (
      <LoginPage
        onBackToLanding={() => setCurrentView('landing')}
        onLoginSuccess={() => setCurrentView('dashboard')}
      />
    );
  }

  return <LandingPage onOpenLogin={() => setCurrentView('login')} />;
}

export function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
