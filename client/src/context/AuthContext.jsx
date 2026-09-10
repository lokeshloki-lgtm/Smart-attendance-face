import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AUTH_CONTEXT_KEY = '__SMART_ATTEND_AUTH_CONTEXT__';
const AuthContext = globalThis[AUTH_CONTEXT_KEY] || createContext();
globalThis[AUTH_CONTEXT_KEY] = AuthContext;

export const normalizeRole = (role) => String(role || '').trim().toUpperCase();

export const getHomeRoute = (role) => normalizeRole(role) === 'ADMIN' ? '/dashboard' : '/student/dashboard';

const normalizeUser = (value) => value ? { ...value, role: normalizeRole(value.role) } : null;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state from localStorage
  useEffect(() => {
    let cancelled = false;
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      const validateStoredSession = async () => {
        try {
          const parsedUser = JSON.parse(storedUser);
          const response = await authAPI.getProfile();
          if (cancelled) return;
          setToken(storedToken);
          const authenticatedUser = normalizeUser(response.data.data || parsedUser);
          setUser(authenticatedUser);
          localStorage.setItem('user', JSON.stringify(authenticatedUser));
        } catch (err) {
          if (cancelled) return;
          console.warn('Stored authentication session is no longer valid:', err.response?.status || err.message);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        } finally {
          if (!cancelled) setIsLoading(false);
        }
      };
      void validateStoredSession();
    } else {
      setIsLoading(false);
    }

    return () => { cancelled = true; };
  }, []);

  const register = async (userData) => {
    try {
      setIsLoading(true);
      const response = await authAPI.register(userData);
      const { token, user } = response.data.data;

      localStorage.setItem('token', token);
      const authenticatedUser = normalizeUser(user);
      localStorage.setItem('user', JSON.stringify(authenticatedUser));
      setToken(token);
      setUser(authenticatedUser);
      setError(null);

      return { ...response.data, data: { ...response.data.data, user: authenticatedUser } };
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setIsLoading(true);
      const response = await authAPI.login({ email, password });
      const { token, user } = response.data.data;

      localStorage.setItem('token', token);
      const authenticatedUser = normalizeUser(user);
      localStorage.setItem('user', JSON.stringify(authenticatedUser));
      setToken(token);
      setUser(authenticatedUser);
      setError(null);

      return { ...response.data, data: { ...response.data.data, user: authenticatedUser } };
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
      setError(null);
    }
  };

  const isAuthenticated = !!token && !!user;
  const isAdmin = normalizeRole(user?.role) === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        error,
        isAuthenticated,
        isAdmin,
        register,
        login,
        logout,
        setError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
