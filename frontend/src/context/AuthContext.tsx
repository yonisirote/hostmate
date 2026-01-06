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
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      setIsLoading(false);
      return;
    }

    setUser(JSON.parse(storedUser) as User);

    const checkAuth = async () => {
      try {
        const { data } = await api.post('/auth/refresh', undefined, { timeout: 8000 });
        if (data.accessToken) {
          setAccessToken(data.accessToken);
        } else {
          throw new Error('Missing access token');
        }
      } catch {
        localStorage.removeItem('user');
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
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = async () => {
    try {
      await api.post('/auth/revoke');
    } catch (e) {
      console.error('Logout failed', e);
    }
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

