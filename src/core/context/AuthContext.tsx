import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "@/infra/api/apiClient";

export type UserRole = "ADMIN" | "DEALER" | "USER" | null;

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status?: string;
}

interface AuthContextType {
  user: User | null;
  role: UserRole;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  signOut: () => void;
  refreshProfile: () => Promise<void>;
  authError: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const initializeAuth = async () => {
    const token = localStorage.getItem('pravokha_auth_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      // We need a /me or /profile endpoint to verify token and get user info
      const response = await apiClient.get('/auth/me'); // I should add this endpoint if it doesn't exist
      setUser(response.data.user);
      setRole(response.data.user.role);
    } catch (error) {
      console.error("Auth initialization failed:", error);
      localStorage.removeItem('pravokha_auth_token');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await apiClient.post('/auth/login', { email, password });
      const { token, user } = response.data;

      localStorage.setItem('pravokha_auth_token', token);
      localStorage.setItem('pravokha_user_role', user.role);
      localStorage.setItem('pravokha_user_id', user.id);

      setUser(user);
      setRole(user.role);
      setAuthError(null);
    } catch (error: any) {
      const message = error.response?.data?.message || "Login failed";
      setAuthError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: any) => {
    try {
      setLoading(true);
      const response = await apiClient.post('/auth/register', data);
      const { token, user } = response.data;

      localStorage.setItem('pravokha_auth_token', token);
      localStorage.setItem('pravokha_user_role', user.role);
      localStorage.setItem('pravokha_user_id', user.id);

      setUser(user);
      setRole(user.role);
      setAuthError(null);
    } catch (error: any) {
      const message = error.response?.data?.message || "Registration failed";
      setAuthError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => {
    localStorage.removeItem('pravokha_auth_token');
    localStorage.removeItem('pravokha_user_role');
    localStorage.removeItem('pravokha_user_id');
    setUser(null);
    setRole(null);
    navigate('/auth');
  };

  const refreshProfile = async () => {
    await initializeAuth();
  };

  return (
    <AuthContext.Provider value={{
      user,
      role,
      loading,
      login,
      register,
      signOut,
      refreshProfile,
      authError
    }}>
      {children}
    </AuthContext.Provider>
  );
}
