import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { apiRequest, fetchCsrfToken } from '../services/api';

export interface User {
  id: number;
  email: string;
  full_name: string;
  date_joined: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (
    fullName: string,
    email: string,
    password: string,
    confirmPassword: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const checkAuth = async () => {
    setIsLoading(true);
    await fetchCsrfToken();
    const res = await apiRequest<{ isAuthenticated: boolean; user: User | null }>('/api/auth/me/');
    if (res.data?.isAuthenticated && res.data.user) {
      setUser(res.data.user);
      setIsAuthenticated(true);
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiRequest<{ message: string; user: User }>('/api/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (res.data?.user) {
      setUser(res.data.user);
      setIsAuthenticated(true);
      return { success: true };
    }

    let errorMessage = 'Invalid email or password.';
    if (res.error) {
      if (typeof res.error === 'string') {
        errorMessage = res.error;
      } else if (res.error.non_field_errors) {
        errorMessage = Array.isArray(res.error.non_field_errors)
          ? res.error.non_field_errors[0]
          : res.error.non_field_errors;
      } else if (res.error.detail) {
        errorMessage = res.error.detail;
      }
    }

    return { success: false, error: errorMessage };
  };

  const register = async (
    fullName: string,
    email: string,
    password: string,
    confirmPassword: string
  ) => {
    const res = await apiRequest<{ message: string; user: User }>('/api/auth/register/', {
      method: 'POST',
      body: JSON.stringify({
        full_name: fullName,
        email,
        password,
        confirm_password: confirmPassword,
      }),
    });

    if (res.data?.user) {
      setUser(res.data.user);
      setIsAuthenticated(true);
      return { success: true };
    }

    let errorMessage = 'Registration failed. Please check your inputs.';
    if (res.error && typeof res.error === 'object') {
      const keys = Object.keys(res.error);
      if (keys.length > 0) {
        const firstVal = res.error[keys[0]];
        errorMessage = Array.isArray(firstVal) ? firstVal[0] : String(firstVal);
      }
    } else if (typeof res.error === 'string') {
      errorMessage = res.error;
    }

    return { success: false, error: errorMessage };
  };

  const logout = async () => {
    await apiRequest('/api/auth/logout/', { method: 'POST' });
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
