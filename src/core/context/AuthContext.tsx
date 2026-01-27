import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "@/infra/api/apiClient";

export type UserRole = "ADMIN" | "DEALER" | "USER" | "admin" | "seller" | "user" | null;

// CRITICAL: This interface must match what AuthContext provides
// Backend sends camelCase, AuthContext maps to snake_case
export interface User {
  id: string;
  email: string;
  role: string;
  status: string;

  // Backend fields (camelCase) - may be present
  avatarUrl?: string | null;
  dateOfBirth?: string | null;
  verificationStatus?: string;
  verificationComments?: string | null;

  // Frontend mapped fields (snake_case) - what components actually use
  avatar_url?: string | null;
  full_name?: string | null;
  name?: string | null;
  date_of_birth?: string | null;
  phone?: string | null;
  bio?: string | null;
  verification_comments?: string | null;

  // Metadata
  createdAt?: string;
  updatedAt?: string;
  _lastFetchedAt?: number; // Added by AuthContext to force re-renders
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
  verificationComments: string | null;
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

  // Helper to ensure CONSISTENT mapping from backend (camelCase) to frontend (snake_case)
  const mapUserData = useCallback((userData: any): User => {
    if (!userData) return null as any;

    return {
      ...userData,
      // Avatar: backend sends avatarUrl, frontend expects avatar_url
      avatar_url: userData.avatarUrl || userData.avatar_url || null,
      // Name: backend may send 'name', frontend uses both
      full_name: userData.name || userData.fullName || userData.full_name || null,
      name: userData.name || userData.fullName || userData.full_name || null,
      // DOB: backend sends dateOfBirth
      date_of_birth: userData.dateOfBirth || userData.date_of_birth || null,
      // Verification Status
      verificationStatus: userData.verificationStatus || userData.verification_status || 'unverified',
      verificationComments: userData.verificationComments || userData.verification_comments || null,
      verification_comments: userData.verificationComments || userData.verification_comments || null,
      // Force new object creation with timestamp
      _lastFetchedAt: Date.now()
    };
  }, []);

  const initializeAuth = async () => {
    const token = localStorage.getItem('pravokha_auth_token');
    if (!token) {
      setUser(null);
      setRole(null);
      setLoading(false);
      return;
    }

    try {
      const response = await apiClient.get('/auth/me');
      const userData = response.data.user;

      console.log('[AuthContext] initializeAuth - Raw backend data:', userData);
      const mappedUser = mapUserData(userData);
      console.log('[AuthContext] initializeAuth - Mapped user data:', mappedUser);

      setUser(mappedUser);
      setRole(userData.role);
      setAuthError(null);
    } catch (error: any) {
      console.error('[AuthContext] Auth initialization failed:', error);
      localStorage.removeItem('pravokha_auth_token');
      localStorage.removeItem('pravokha_user_role');
      localStorage.removeItem('pravokha_user_id');
      setUser(null);
      setRole(null);
      setAuthError('Session expired. Please login again.');
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

      setUser(mapUserData(user));
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

      setUser(mapUserData(user));
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
    try {
      console.log('[AuthContext] refreshProfile - Forcing re-fetch from backend');
      const response = await apiClient.get('/auth/me');
      const userData = response.data.user;

      console.log('[AuthContext] refreshProfile - Raw backend data:', userData);
      const mappedUser = mapUserData(userData);
      console.log('[AuthContext] refreshProfile - Mapped user data:', mappedUser);
      setRole(userData.role);
      setUser(mappedUser);

      console.log('[AuthContext] refreshProfile - User state updated successfully');
    } catch (error) {
      console.error('[AuthContext] Failed to refresh profile:', error);
    }
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
    verificationStatus: user?.verificationStatus || 'unverified',
    verificationComments: user?.verificationComments || user?.verification_comments || null
  }), [user, role, loading, authError, login, register, signOut, refreshProfile]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}
