import type { PageView, User } from '../types/dashboard';

interface NavbarProps {
  activePage: PageView;
  setActivePage: (page: PageView) => void;
  user: User | null;
  onLogout: () => void;
  serialConnected?: boolean;
}

export function Navbar({ activePage, setActivePage, user, onLogout, serialConnected }: NavbarProps) {
  const handleBrandClick = () => {
    if (user) {
      setActivePage('dashboard');
    } else {
      setActivePage('landing');
    }
  };

  return (
    <header className="site-header">
      <div className="header-inner">
        <div className="brand" onClick={handleBrandClick} style={{ cursor: 'pointer' }}>
          <div className="brand-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19L12 5L20 19" />
              <path d="M6 15H18" />
              <path d="M12 5V19" />
            </svg>
          </div>
          <div className="brand-text">
            <span className="brand-title">PONTIS SHM</span>
            <span className="brand-subtitle">Bridge Health System</span>
          </div>
        </div>

        <nav className="nav-menu">
          {!user && (
            <button
              className={`nav-link ${activePage === 'landing' ? 'active' : ''}`}
              onClick={() => setActivePage('landing')}
            >
              Overview
            </button>
          )}
          {user && (
            <button
              className={`nav-link ${activePage === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActivePage('dashboard')}
            >
              Live Dashboard
            </button>
          )}
        </nav>

        <div className="nav-actions">
          {activePage === 'dashboard' && serialConnected !== undefined && (
            <div className={`status-badge ${serialConnected ? 'online' : 'offline'}`}>
              <span className="dot" />
              <span>{serialConnected ? 'Live Stream' : 'Disconnected'}</span>
            </div>
          )}

          {user ? (
            <div className="user-profile">
              <span className="user-avatar">{user.name.charAt(0).toUpperCase()}</span>
              <span className="user-name">{user.name}</span>
              <button className="btn btn-sm btn-outline" onClick={onLogout}>
                Logout
              </button>
            </div>
          ) : (
            <button className="btn btn-primary" onClick={() => setActivePage('login')}>
              Dashboard Login
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
