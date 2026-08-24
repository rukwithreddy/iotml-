import { useEffect, useState } from 'react';
import { Footer } from './components/Footer';
import { Navbar } from './components/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { getUser, logout } from './services/auth';
import type { PageView, User } from './types/dashboard';

export default function App() {
  const [activePage, setActivePage] = useState<PageView>('landing');
  const [user, setUser] = useState<User | null>(null);

  // Check auth state on mount
  useEffect(() => {
    const existingUser = getUser();
    if (existingUser) {
      setUser(existingUser);
      setActivePage('dashboard');
    }
  }, []);

  const handleLogout = () => {
    logout();
    setUser(null);
    setActivePage('landing');
  };

  const handleNavigate = (page: PageView) => {
    if (user) {
      // Logged in users only see dashboard
      setActivePage('dashboard');
      return;
    }

    if (page === 'dashboard' && !user) {
      setActivePage('login');
      return;
    }

    setActivePage(page);
  };

  return (
    <div className="app-container">
      <Navbar
        activePage={user ? 'dashboard' : activePage}
        setActivePage={handleNavigate}
        user={user}
        onLogout={handleLogout}
      />

      <main className="main-content">
        {!user && activePage === 'landing' && (
          <LandingPage setActivePage={handleNavigate} user={user} />
        )}
        {!user && activePage === 'login' && (
          <LoginPage setActivePage={handleNavigate} setUser={setUser} />
        )}
        {user && (
          <DashboardPage />
        )}
      </main>

      <Footer />
    </div>
  );
}
