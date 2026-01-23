import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "@/infra/api/apiClient";

export type UserRole = "ADMIN" | "DEALER" | "USER" | "admin" | "seller" | "user" | null;

interface User {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  status?: string;
  avatar_url?: string;
  verificationStatus: string;
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
  isSuspended: boolean;
  verificationStatus: string;
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
      const response = await apiClient.get('/auth/me');
      const userData = response.data.user;
      setUser({
        ...userData,
        avatar_url: userData.avatarUrl,
        verificationStatus: userData.verificationStatus
      });
      setRole(userData.role);
      setAuthError(null);
    } catch (error: any) {
      console.error("Auth initialization failed:", error);
      if (error.code === 'ERR_NETWORK' || !error.response) {
        setAuthError("Unable to connect to the server. Please ensure the backend is running on port 5000.");
      } else {
        localStorage.removeItem('pravokha_auth_token');
        setUser(null);
        setRole(null);
      }
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

      setUser({ ...user, avatar_url: user.avatarUrl, verificationStatus: user.verificationStatus });
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

      setUser({ ...user, avatar_url: user.avatarUrl, verificationStatus: user.verificationStatus });
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

  const refreshProfile = useCallback(async () => {
    await initializeAuth();
  }, []);

  const contextValue = useMemo(() => ({
    user,
    role,
    loading,
    login,
    register,
    signOut,
    refreshProfile,
    authError,
    isSuspended: user?.status === 'suspended',
    verificationStatus: user?.verificationStatus || 'unverified'
  }), [user, role, loading, authError, login, register, signOut, refreshProfile]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}
