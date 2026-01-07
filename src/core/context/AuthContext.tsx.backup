import { createContext, useContext, useState, useEffect, ReactNode, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";

type UserRole = "admin" | "seller" | "user" | "moderator" | null;

export interface SuspensionError {
  status: 403;
  code: 'ACCOUNT_SUSPENDED' | 'ACCOUNT_INACTIVE';
  message: string;
  userName?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: UserRole;
  loading: boolean;
  suspensionError: SuspensionError | null;
  signOut: () => Promise<void>;
  refreshRole: () => Promise<void>;
  clearSuspensionError: () => void;
  isSuspended: boolean;
  suspensionReason: string | null;
  verificationStatus: 'pending' | 'verified' | 'rejected' | 'unverified';
  verificationComments: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  role: null,
  loading: true,
  suspensionError: null,
  signOut: async () => { },
  refreshRole: async () => { },
  clearSuspensionError: () => { },
  isSuspended: false,
  suspensionReason: null,
  verificationStatus: 'unverified',
  verificationComments: null,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const [suspensionError, setSuspensionError] = useState<SuspensionError | null>(null);
  const [isSuspended, setIsSuspended] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verified' | 'rejected' | 'unverified'>('unverified');
  const [verificationComments, setVerificationComments] = useState<string | null>(null);

  // Prevent duplicate concurrent fetches
  const fetchingRef = useRef(false);

  const clearSuspensionError = () => {
    setSuspensionError(null);
  };

  const fetchUserRole = async (userId: string): Promise<UserRole> => {
    const timeoutMs = 5000; // 5 second timeout
    const startTime = Date.now();

    try {
      console.log("[AuthContext] Fetching role for user:", userId);

      // Create AbortController for timeout
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => {
        console.warn(`[AuthContext] Role fetch timeout after ${timeoutMs}ms`);
        abortController.abort();
      }, timeoutMs);

      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .limit(1)
          .maybeSingle();

        clearTimeout(timeoutId);

        const elapsed = Date.now() - startTime;
        console.log(`[AuthContext] Role query completed in ${elapsed}ms:`, { data, error });

        if (error) {
          console.warn("[AuthContext] Error fetching user role:", error.message);
          return "user";
        }

        const role = (data?.role as UserRole) || "user";
        console.log("[AuthContext] Role fetched:", role);
        return role;
      } catch (err: any) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
          console.error("[AuthContext] Role fetch aborted due to timeout");
          return "user"; // Default to user role on timeout
        }
        throw err;
      }
    } catch (error) {
      const elapsed = Date.now() - startTime;
      console.error(`[AuthContext] Exception fetching user role after ${elapsed}ms:`, error);
      return "user";
    }
  };

  const fetchUserProfile = async (userId: string) => {
    const timeoutMs = 5000;
    const startTime = Date.now();

    try {
      console.log("[AuthContext] Fetching profile for user:", userId);

      const abortController = new AbortController();
      const timeoutId = setTimeout(() => {
        console.warn(`[AuthContext] Profile fetch timeout after ${timeoutMs}ms`);
        abortController.abort();
      }, timeoutMs);

      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('status, verification_status, verification_comments')
          .eq('id', userId)
          .single();

        clearTimeout(timeoutId);

        const elapsed = Date.now() - startTime;
        console.log(`[AuthContext] Profile query completed in ${elapsed}ms:`, { profileData, profileError });

        if (!profileError && profileData) {
          const status = (profileData as any).status;

          if (status === 'inactive') {
            console.warn("[AuthContext] User has inactive status, signing out");
            await supabase.auth.signOut();
            return { shouldSignOut: true };
          }

          setIsSuspended(status === 'suspended');
          setVerificationStatus((profileData.verification_status as any) || 'unverified');
          setVerificationComments(profileData.verification_comments || null);
        } else if (profileError) {
          console.warn("[AuthContext] Profile error:", profileError);
        }

        return { shouldSignOut: false };
      } catch (err: any) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
          console.error("[AuthContext] Profile fetch aborted due to timeout");
          return { shouldSignOut: false };
        }
        throw err;
      }
    } catch (error) {
      const elapsed = Date.now() - startTime;
      console.error(`[AuthContext] Exception fetching profile after ${elapsed}ms:`, error);
      return { shouldSignOut: false };
    }
  };

  const refreshRole = async () => {
    if (user) {
      const newRole = await fetchUserRole(user.id);
      setRole(newRole);
    }
  };

  const handleAuthStateChange = async (currentUser: User | null) => {
    console.log("[AuthContext] handleAuthStateChange called, user:", currentUser ? "exists" : "null");

    // Prevent duplicate concurrent executions
    if (fetchingRef.current) {
      console.log("[AuthContext] Already fetching, skipping duplicate call");
      return;
    }

    try {
      fetchingRef.current = true;

      if (!currentUser) {
        console.log("[AuthContext] No user, clearing state");
        setSession(null);
        setUser(null);
        setRole(null);
        setIsSuspended(false);
        setVerificationStatus('unverified');
        setVerificationComments(null);
        setLoading(false);
        return;
      }

      console.log("[AuthContext] User exists, fetching role and profile");
      setUser(currentUser);

      // Fetch role and profile in parallel
      const [userRole, profileResult] = await Promise.all([
        fetchUserRole(currentUser.id),
        fetchUserProfile(currentUser.id)
      ]);

      if (profileResult.shouldSignOut) {
        console.log("[AuthContext] User is inactive, signing out");
        return;
      }

      console.log("[AuthContext] Setting role and completing initialization");
      setRole(userRole);
      setLoading(false);
    } catch (error) {
      console.error("[AuthContext] Error in handleAuthStateChange:", error);
      // Even on error, set loading to false to prevent hanging
      setLoading(false);
    } finally {
      fetchingRef.current = false;
    }
  };

  useEffect(() => {
    let mounted = true;
    console.log("[AuthContext] Component mounting");

    // Safety timer - force loading to false after 8 seconds  
    const safetyTimer = setTimeout(() => {
      if (mounted && loading) {
        console.warn("[AuthContext] Safety timer triggered - forcing loading to false");
        setLoading(false);
      }
    }, 8000);

    // Initialize session
    const initializeAuth = async () => {
      try {
        console.log("[AuthContext] Initializing auth...");
        const { data: { session: initialSession } } = await supabase.auth.getSession();

        if (!mounted) {
          console.log("[AuthContext] Component unmounted during init");
          return;
        }

        if (initialSession) {
          console.log("[AuthContext] Initial session found");
          setSession(initialSession);
          await handleAuthStateChange(initialSession.user);
        } else {
          console.log("[AuthContext] No initial session");
          setLoading(false);
        }
      } catch (error) {
        console.error("[AuthContext] Error initializing auth:", error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log("[AuthContext] Auth state changed:", event);

        if (!mounted) {
          console.log("[AuthContext] Component unmounted, ignoring event");
          return;
        }

        // Skip INITIAL_SESSION event since we handle it in initializeAuth
        if (event === 'INITIAL_SESSION') {
          console.log("[AuthContext] Skipping INITIAL_SESSION event");
          return;
        }

        setSession(newSession);
        await handleAuthStateChange(newSession?.user || null);
      }
    );

    return () => {
      console.log("[AuthContext] Component unmounting");
      mounted = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  // Separate effect for real-time profile changes
  useEffect(() => {
    if (!user?.id) return;

    console.log("[AuthContext] Setting up profile subscription for user:", user.id);

    const profileSubscription = supabase
      .channel(`profile_changes_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          console.log("[AuthContext] Profile updated:", payload);
          const newProfile = payload.new as any;

          if (newProfile.verification_status) {
            setVerificationStatus(newProfile.verification_status);
          }
          if (newProfile.verification_comments !== undefined) {
            setVerificationComments(newProfile.verification_comments);
          }
          if (newProfile.status) {
            setIsSuspended(newProfile.status === 'suspended');
          }
        }
      )
      .subscribe();

    return () => {
      console.log("[AuthContext] Cleaning up profile subscription");
      supabase.removeChannel(profileSubscription);
    };
  }, [user?.id]);

  const signOut = async () => {
    try {
      console.log("[AuthContext] Signing out...");
      setLoading(true);

      await supabase.auth.signOut();

      setSession(null);
      setUser(null);
      setRole(null);
      setIsSuspended(false);
      setSuspensionReason(null);
      setVerificationStatus('unverified');
      setVerificationComments(null);
    } catch (error) {
      console.error("[AuthContext] Error signing out:", error);
    } finally {
      setLoading(false);
      window.location.href = '/auth';
    }
  };

  return (
    <AuthContext.Provider value={{
      user, session, role, loading, suspensionError, signOut, refreshRole, clearSuspensionError,
      isSuspended, suspensionReason, verificationStatus, verificationComments
    }}>
      {children}
    </AuthContext.Provider>
  );
}
