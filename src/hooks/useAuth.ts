import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
  avatar?: string;
  createdAt: string;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check for saved auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      const savedUser = localStorage.getItem('auth_user');

      if (token && savedUser) {
        try {
          // Verify token is still valid
          const freshUser = await apiClient.getMe();
          setUser(freshUser);
          setIsAuthenticated(true);
        } catch {
          // Token invalid
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
          setUser(null);
          setIsAuthenticated(false);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // Listen for forced logout (401 from API)
  useEffect(() => {
    const handleLogout = () => {
      setUser(null);
      setIsAuthenticated(false);
    };

    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await apiClient.login(email, password);
    localStorage.setItem('auth_token', result.token);
    localStorage.setItem('auth_user', JSON.stringify(result.user));
    setUser(result.user);
    setIsAuthenticated(true);
    return result.user;
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, role: string = 'member') => {
    const result = await apiClient.register(name, email, password, role);
    return result.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const updateProfile = useCallback(async (data: Partial<AuthUser>) => {
    const updated = await apiClient.updateProfile(data);
    setUser(updated);
    localStorage.setItem('auth_user', JSON.stringify(updated));
    return updated;
  }, []);

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
  };
}
