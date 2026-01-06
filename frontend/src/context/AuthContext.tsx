import { ReactNode, useEffect, useState } from 'react';
import { api, setAccessToken } from '../lib/api';
import { User } from '../types';

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

    const checkAuth = async () => {
      try {
        const { data } = await api.post('/auth/refresh', undefined, { timeout: 8000 });
        if (data.accessToken) {
          setAccessToken(data.accessToken);
        } else {
          throw new Error('Missing access token');
        }
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

    checkAuth();
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
      await api.post('/auth/revoke');
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

