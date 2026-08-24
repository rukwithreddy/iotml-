import type { User } from '../types/dashboard';

const AUTH_KEY = 'shm_auth_user';

// Prototype credentials (hardcoded as requested)
const DEMO_USER = 'rukwith';
const DEMO_PASS = 'rukwith123';

export function login(username: string, pass: string): { success: boolean; error?: string; user?: User } {
  if (username.trim() === DEMO_USER && pass === DEMO_PASS) {
    const user: User = {
      username: DEMO_USER,
      name: 'Rukwith',
    };
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    return { success: true, user };
  }
  return { success: false, error: 'Invalid username or password. Please check your credentials.' };
}

export function logout(): void {
  localStorage.removeItem(AUTH_KEY);
}

export function getUser(): User | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return getUser() !== null;
}
