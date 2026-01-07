import { ReactNode, useEffect, useState } from 'react';

import type { User } from '../types';

import { refresh, revoke } from '../api/auth';
import { onAuthFailure, setAccessToken } from '../lib/api';

import { AuthContext } from './auth-context';

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let storedUser: string | null = null;
    try {
      storedUser = localStorage.getItem('user');
    } catch {
      // localStorage may be unavailable (e.g., private browsing on some mobile browsers)
      setIsLoading(false);
      return;
    }

    if (!storedUser) {
      setIsLoading(false);
      return;
    }

    let parsedUser: User;
    try {
      parsedUser = JSON.parse(storedUser) as User;
    } catch {
      // Corrupted data in localStorage
      try {
        localStorage.removeItem('user');
      } catch {
        // Ignore if removal fails
      }
      setIsLoading(false);
      return;
    }

    setUser(parsedUser);

    const unsubscribe = onAuthFailure(() => {
      try {
        localStorage.removeItem('user');
      } catch {
        // Ignore if removal fails
      }
      setAccessToken(null);
      setUser(null);
    });

    const checkAuth = async () => {
      try {
        const data = await refresh();
        setAccessToken(data.accessToken);
      } catch {
        try {
          localStorage.removeItem('user');
        } catch {
          // Ignore if removal fails
        }
        setAccessToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    void checkAuth();

    return () => {
      unsubscribe();
    };
  }, []);

  const login = (userData: User, token: string) => {
    setUser(userData);
    setAccessToken(token);
    try {
      localStorage.setItem('user', JSON.stringify(userData));
    } catch {
      // localStorage may be unavailable or full
    }
  };

  const logout = async () => {
    try {
      await revoke();
    } catch (e) {
      console.error('Logout failed', e);
    }
    setUser(null);
    setAccessToken(null);
    try {
      localStorage.removeItem('user');
    } catch {
      // Ignore if removal fails
    }
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

