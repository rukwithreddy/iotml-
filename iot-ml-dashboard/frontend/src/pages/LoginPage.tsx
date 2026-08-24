import React, { useState } from 'react';
import { login } from '../services/auth';
import type { PageView, User } from '../types/dashboard';

interface LoginPageProps {
  setActivePage: (page: PageView) => void;
  setUser: (user: User | null) => void;
}

export function LoginPage({ setActivePage, setUser }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    // Brief timeout for realistic UI feel
    setTimeout(() => {
      const result = login(username, password);
      setIsSubmitting(false);

      if (result.success && result.user) {
        setUser(result.user);
        setActivePage('dashboard');
      } else {
        setError(result.error || 'Invalid credentials');
      }
    }, 400);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19L12 5L20 19" />
              <path d="M6 15H18" />
              <path d="M12 5V19" />
            </svg>
          </div>
          <h2>PONTIS SHM Authentication</h2>
          <p>Enter your monitoring credentials to access the live dashboard</p>
        </div>

        {error && (
          <div className="login-error-alert" role="alert">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              className="form-control"
              placeholder="e.g. rukwith"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-control"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={isSubmitting}>
            {isSubmitting ? 'Authenticating…' : 'Sign In'}
          </button>
        </form>

        <div className="login-footer">
          <button className="btn-link" onClick={() => setActivePage('landing')}>
            &larr; Back to System Overview
          </button>
        </div>
      </div>
    </div>
  );
}
