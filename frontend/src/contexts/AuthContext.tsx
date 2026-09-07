'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const cleanUrl = rawApiUrl.trim().replace(/\/+$/, '');
const API_URL = cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;

export type Role = 'farmer' | 'buyer' | 'transporter' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  isVerified: boolean;
  profileImage?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  farmerProfile?: { farmSizeAcres?: number; landDocUrl?: string; upiId?: string };
  transporterProfile?: { vehicleType?: string; vehicleCapacityKg?: number; licenseNumber?: string; vehicleNumber?: string; isAvailable?: boolean };
}

interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: Role;
  farmSizeAcres?: number;
  vehicleType?: string;
  vehicleCapacityKg?: number;
  licenseNumber?: string;
  address?: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Axios instance
export const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          error.config.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(error.config);
        } catch {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('cachedUser');
          if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth')) {
            window.location.href = '/auth/login';
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // Instant render from local cache if available (0ms delay)
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('cachedUser');
        if (cached) return JSON.parse(cached);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [accessToken, setAccessToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('accessToken');
    }
    return null;
  });

  const [loading, setLoading] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      const cached = localStorage.getItem('cachedUser');
      // If we already have token and cached user, don't block render!
      if (token && cached) return false;
      if (!token) return false;
    }
    return true;
  });

  const router = useRouter();

  const fetchUser = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
      setAccessToken(token);
      localStorage.setItem('cachedUser', JSON.stringify(data.user));
    } catch {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('cachedUser');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('cachedUser', JSON.stringify(data.user));
    setUser(data.user);
    setAccessToken(data.accessToken);
    setLoading(false);

    // Route to role dashboard
    const dashboardMap: Record<Role, string> = {
      farmer: '/farmer/dashboard',
      buyer: '/buyer/dashboard',
      transporter: '/transporter/dashboard',
      admin: '/admin/dashboard',
    };
    router.push(dashboardMap[data.user.role as Role]);
  };

  const register = async (data: RegisterData) => {
    const { data: res } = await api.post('/auth/register', data);
    localStorage.setItem('accessToken', res.accessToken);
    localStorage.setItem('refreshToken', res.refreshToken);
    localStorage.setItem('cachedUser', JSON.stringify(res.user));
    setUser(res.user);
    setAccessToken(res.accessToken);
    setLoading(false);

    const dashboardMap: Record<Role, string> = {
      farmer: '/farmer/dashboard',
      buyer: '/buyer/dashboard',
      transporter: '/transporter/dashboard',
      admin: '/admin/dashboard',
    };
    router.push(dashboardMap[res.user.role as Role]);
  };

  const logout = () => {
    const refreshToken = localStorage.getItem('refreshToken');
    api.post('/auth/logout', { refreshToken }).catch(() => {});
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('cachedUser');
    setUser(null);
    setAccessToken(null);
    router.push('/');
  };

  const refreshUser = () => fetchUser();

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const useRequireRole = (role: Role | Role[]) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/auth/login');
        return;
      }
      const roles = Array.isArray(role) ? role : [role];
      if (!roles.includes(user.role)) {
        router.push('/auth/login');
      }
    }
  }, [user, loading, role, router]);

  return { user, loading };
};
