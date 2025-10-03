'use client';

// Simple authentication system using localStorage
const AUTH_KEY = 'kids-points-auth';
const DEFAULT_PASSWORD = 'admin123'; // In production, this would be properly hashed and stored securely

export interface AuthState {
  isAuthenticated: boolean;
  user?: {
    username: string;
    role: 'admin';
  };
}

export function login(password: string): boolean {
  if (password === DEFAULT_PASSWORD) {
    const authState: AuthState = {
      isAuthenticated: true,
      user: {
        username: 'admin',
        role: 'admin'
      }
    };
    localStorage.setItem(AUTH_KEY, JSON.stringify(authState));
    return true;
  }
  return false;
}

export function logout(): void {
  localStorage.removeItem(AUTH_KEY);
}

export function getAuthState(): AuthState {
  if (typeof window === 'undefined') {
    return { isAuthenticated: false };
  }

  try {
    const stored = localStorage.getItem(AUTH_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error parsing auth state:', error);
    localStorage.removeItem(AUTH_KEY);
  }

  return { isAuthenticated: false };
}

export function isAuthenticated(): boolean {
  return getAuthState().isAuthenticated;
}