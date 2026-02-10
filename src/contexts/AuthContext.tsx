// frontend/src/contexts/AuthContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api, { User } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  updateProfile: (data: Partial<RegisterData & User>) => Promise<void>;
  changePassword: (data: ChangePasswordData) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

interface RegisterData {
  username?: string;
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  default_currency?: string;
  theme?: string;
}

interface ChangePasswordData {
  old_password: string;
  new_password: string;
  new_password_confirm: string;
}

type ApiError = {
  response?: {
    data?: {
      detail?: string;
      [key: string]: unknown;
    };
  };
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const token = localStorage.getItem('access_token');

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await api.get('/auth/profile/');
      setUser(response.data);
      if (response.data?.theme) {
        document.documentElement.setAttribute('data-theme', response.data.theme);
      }
    } catch (error) {
      console.error('Erro ao carregar usuário:', error);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    } finally {
      setLoading(false);
    }
  };

  const parseErrorMessage = (error: unknown, fallback: string) => {
    const apiError = error as ApiError;
    const data = apiError.response?.data;
    if (data?.detail && typeof data.detail === 'string') {
      return data.detail;
    }

    if (data) {
      const firstError = Object.values(data)[0];
      if (Array.isArray(firstError)) {
        return String(firstError[0]);
      }
      if (firstError) {
        return String(firstError);
      }
    }

    if (error instanceof Error && error.message) {
      return error.message;
    }

    return fallback;
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login/', { email, password });
      const { access, refresh } = response.data;

      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);

      await loadUser();
      router.push('/dashboard');
    } catch (error: unknown) {
      throw new Error(parseErrorMessage(error, 'Erro ao fazer login'));
    }
  };

  const register = async (data: RegisterData) => {
    try {
      await api.post('/auth/register/', data);
      await login(data.email, data.password);
    } catch (error: unknown) {
      throw new Error(parseErrorMessage(error, 'Erro ao fazer cadastro'));
    }
  };

  const updateProfile = async (data: Partial<RegisterData & User>) => {
    try {
      const response = await api.patch('/auth/profile/', data);
      setUser(response.data);
      if (response.data?.theme) {
        document.documentElement.setAttribute('data-theme', response.data.theme);
      }
    } catch (error: unknown) {
      throw new Error(parseErrorMessage(error, 'Erro ao atualizar perfil'));
    }
  };

  const changePassword = async (data: ChangePasswordData) => {
    try {
      await api.put('/auth/change-password/', data);
    } catch (error: unknown) {
      throw new Error(parseErrorMessage(error, 'Erro ao alterar senha'));
    }
  };

  const logout = () => {
    const refresh = localStorage.getItem('refresh_token');
    if (refresh) {
      api.post('/auth/logout/', { refresh }).catch(() => {
        // ignora falha de logout remoto
      });
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        updateProfile,
        changePassword,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
