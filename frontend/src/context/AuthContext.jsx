import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { AuthContext } from './authContextValue';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('bharat-buddy-user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('bharat-buddy-token') || null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      localStorage.setItem('bharat-buddy-token', token);
    } else {
      localStorage.removeItem('bharat-buddy-token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('bharat-buddy-user', JSON.stringify(user));
    } else {
      localStorage.removeItem('bharat-buddy-user');
    }
  }, [user]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      const payload = data.data;
      const nextUser = payload.user;
      setToken(payload.token);
      setUser(nextUser);
      localStorage.setItem('bharat-buddy-token', payload.token);
      localStorage.setItem('bharat-buddy-user', JSON.stringify(nextUser));
      return payload;
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', payload);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  const fetchMe = useCallback(async () => {
    if (!token) return null;
    const { data } = await api.get('/users/me');
    setUser(data.data);
    return data.data;
  }, [token]);

  const value = useMemo(() => ({
    user,
    token,
    loading,
    isAuthenticated: Boolean(token),
    login,
    register,
    logout,
    fetchMe,
    setUser,
  }), [user, token, loading, fetchMe]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
