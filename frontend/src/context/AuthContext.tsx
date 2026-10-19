import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';
import type { User } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    aicte_id: string;
    institute_name: string;
    nodal_officer: string;
    email: string;
    password: string;
    region: string;
  }) => Promise<void>;
  logout: () => void;
  updateProfile: (data: {
    full_name?: string;
    phone?: string;
    designation?: string;
    department?: string;
  }) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from token on mount
  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      const token = localStorage.getItem('vidya_token');
      if (!token) {
        if (isMounted) setIsLoading(false);
        return;
      }

      try {
        const currentUser = await api.getMe();
        if (isMounted) {
          setUser(currentUser);
        }
      } catch (err) {
        // Token invalid or expired
        localStorage.removeItem('vidya_token');
        localStorage.removeItem('vidya_user');
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const loggedInUser = await api.login(email, password);
      localStorage.setItem('vidya_token', loggedInUser.token);
      localStorage.setItem('vidya_user', JSON.stringify({
        id: loggedInUser.id,
        email: loggedInUser.email,
        full_name: loggedInUser.full_name,
        role: loggedInUser.role,
      }));
      setUser(loggedInUser);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (data: {
    aicte_id: string;
    institute_name: string;
    nodal_officer: string;
    email: string;
    password: string;
    region: string;
  }) => {
    setIsLoading(true);
    try {
      const registeredUser = await api.register(data);
      localStorage.setItem('vidya_token', registeredUser.token);
      setUser(registeredUser);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('vidya_token');
    localStorage.removeItem('vidya_user');
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (data: {
    full_name?: string;
    phone?: string;
    designation?: string;
    department?: string;
  }) => {
    const updated = await api.updateProfile(data);
    setUser(updated);
  }, []);

  const changePassword = useCallback(async (oldPassword: string, newPassword: string) => {
    await api.changePassword(oldPassword, newPassword);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
