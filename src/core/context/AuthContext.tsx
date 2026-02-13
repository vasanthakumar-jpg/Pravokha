import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "@/infra/api/apiClient";

export type UserRole = "SUPER_ADMIN" | "ADMIN" | "SELLER" | "CUSTOMER" | null;

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

  // RBAC
  admin_permissions?: any; // Mapped from adminPermission
  vendor?: {
    id: string;
    status: string;
    businessName?: string;
    storeName?: string;
    pan?: string;
    bankAccount?: string;
    bankAccountNumber?: string;
  };
}

interface AuthContextType {
  user: User | null;
  role: UserRole;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
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
      // Verification Status: Standardize to 'verified' for active accounts
      verificationStatus: (() => {
        // Standardize any variants of "verified" or "active" to the 'verified' flag
        const rawV = (userData.verificationStatus || "").toLowerCase();
        const vendorV = (userData.vendor?.status || "").toLowerCase();
        const userStatus = (userData.status || "").toLowerCase();

        const isVerified =
          rawV === 'verified' ||
          vendorV === 'active' ||
          userStatus === 'active';

        const vStatus = isVerified ? 'verified' : (userData.verificationStatus || userData.vendor?.status || 'unverified');

        console.log(`[AuthContext] Mapping verification status for ${userData.id}:`, {
          rawUserV: userData.verificationStatus,
          vendorStatus: userData.vendor?.status,
          userStatus: userData.status,
          mappedStatus: vStatus
        });

        return vStatus;
      })(),
      verificationComments: userData.verificationComments || userData.vendor?.verificationComments || null,
      verification_comments: userData.verificationComments || userData.vendor?.verificationComments || null,
      // Permissions
      admin_permissions: userData.adminPermission || userData.admin_permissions || null,
      // Vendor Info
      vendor: userData.vendor || null,
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
      const mappedUser = mapUserData(userData);

      // SECURITY FIX: Normalize role to uppercase for consistency
      const normalizedRole = (userData.role?.toUpperCase() || null) as UserRole;

      console.log('[AuthContext] Role normalized on init:', {
        original: userData.role,
        normalized: normalizedRole
      });

      setUser(mappedUser);
      setRole(normalizedRole);
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

  const googleLogin = async (idToken: string) => {
    try {
      setLoading(true);
      const response = await apiClient.post('/auth/google-login', { idToken });
      const { token, user } = response.data;

      localStorage.setItem('pravokha_auth_token', token);
      localStorage.setItem('pravokha_user_role', user.role);
      localStorage.setItem('pravokha_user_id', user.id);

      setUser(mapUserData(user));
      setRole(user.role);
      setAuthError(null);
    } catch (error: any) {
      const message = error.response?.data?.message || "Google login failed";
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
      const mappedUser = mapUserData(userData);
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
    googleLogin,
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
