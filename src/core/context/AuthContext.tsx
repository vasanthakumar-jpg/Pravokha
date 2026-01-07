import { createContext, useContext, useState, useEffect, ReactNode, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/infra/api/supabase";
import { User, Session } from "@supabase/supabase-js";

type UserRole = "admin" | "seller" | "user" | "moderator" | "support" | "manager" | "buyer" | null;

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
  refreshProfile: () => Promise<void>;
  clearSuspensionError: () => void;
  isSuspended: boolean;
  suspensionReason: string | null;
  verificationStatus: 'pending' | 'verified' | 'rejected' | 'unverified';
  verificationComments: string | null;
  authError: string | null;
  profile: any | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  role: null,
  loading: true,
  suspensionError: null,
  signOut: async () => { },
  refreshRole: async () => { },
  refreshProfile: async () => { },
  clearSuspensionError: () => { },
  isSuspended: false,
  suspensionReason: null,
  verificationStatus: 'unverified',
  verificationComments: null,
  authError: null,
  profile: null,
});

export const useAuth = () => useContext(AuthContext);

async function fetchWithTimeout<T>(promise: Promise<T>, timeoutMs: number, errorLabel: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${errorLabel} timed out after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole>(() => {
    try {
      const storedRole = localStorage.getItem('pravokha_user_role') as UserRole;
      const storedId = localStorage.getItem('pravokha_user_id');
      // We don't have the user ID yet to verify, so we'll trust it for the first render
      // if it exists, but handleAuthStateChange will verify it.
      return storedRole || null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [suspensionError, setSuspensionError] = useState<SuspensionError | null>(null);
  const [isSuspended, setIsSuspended] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verified' | 'rejected' | 'unverified'>('unverified');
  const [verificationComments, setVerificationComments] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any | null>(null);

  // Prevent duplicate concurrent fetches
  const fetchingRef = useRef(false);
  const lastProcessedUserIdRef = useRef<string | null>(null);

  const clearSuspensionError = () => {
    setSuspensionError(null);
  };

  const fetchUserRole = async (userId: string): Promise<UserRole> => {
    const timeoutMs = 15000;
    const startTime = Date.now();

    try {
      console.log(`[AuthContext] Fetching roles for user ${userId}...`);

      const { data, error } = await fetchWithTimeout(
        Promise.resolve(supabase
          .from("users")
          .select("role")
          .eq("id", userId)),
        timeoutMs,
        "Roles fetch"
      ) as any;

      const elapsed = Date.now() - startTime;
      console.log(`[AuthContext] Roles query completed in ${elapsed}ms:`, { roles: data, error });

      if (error) {
        console.error("[AuthContext] Error fetching user roles:", error.message);
        throw error;
      }

      // Role Prioritization Logic
      const role: string = data[0]?.role;
      if (role === "admin") return "admin";
      if (role === "seller" || role === "dealer") return "seller";
      if (role === "moderator") return "moderator";
      if (role === "support") return "support";
      if (role === "manager") return "manager";
      if (role === "buyer" || role === "user") return "user";

      return "user";
    } catch (error: any) {
      const elapsed = Date.now() - startTime;
      console.warn(`[AuthContext] Role fetch failed/timed out after ${elapsed}ms. Returning null to force re-fetch or default.`, error.message);
      return null;
    }
  };

  const fetchUserProfile = async (userId: string) => {
    const timeoutMs = 15000;
    const startTime = Date.now();

    try {
      console.log(`[AuthContext] Fetching profile for user ${userId}...`);

      const { data: profileData, error: profileError } = await fetchWithTimeout(
        Promise.resolve(supabase
          .from('users')
          .select('status, verificationStatus, name, phone, address, email')
          .eq('id', userId)
          .maybeSingle()), // Use maybeSingle to prevent 406 on missing
        timeoutMs,
        "Profile fetch"
      ) as any;

      const elapsed = Date.now() - startTime;
      console.log(`[AuthContext] Profile query completed in ${elapsed}ms:`, { status: profileData?.status, error: profileError });

      if (profileError) {
        console.warn("[AuthContext] Profile fetch error:", profileError.message);
        throw profileError;
      }

      if (profileData) {
        const status = profileData.status;

        if (status === 'inactive') {
          console.warn("[AuthContext] User has inactive status, signing out");
          await supabase.auth.signOut();
          return { shouldSignOut: true, profile: null };
        }

        setIsSuspended(status === 'suspended');
        setVerificationStatus((profileData.verificationStatus as any) || 'unverified');
        setVerificationComments(null); // verificationComments not in Prisma schema
        setProfile({ ...profileData, full_name: profileData.name }); // Map name to full_name for UI

        return { shouldSignOut: false, profile: profileData };
      }
      return { shouldSignOut: false, profile: null };
    } catch (error: any) {
      const elapsed = Date.now() - startTime;
      console.warn(`[AuthContext] Profile fetch failed/timed out after ${elapsed}ms. Defaulting to empty profile.`, error.message);
      // Fail open: return a default profile result instead of throwing a fatal error
      return { shouldSignOut: false, profile: null };
    }
  };

  const refreshRole = async () => {
    if (user) {
      const newRole = await fetchUserRole(user.id);
      setRole(newRole);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      console.log("[AuthContext] Manually refreshing profile");
      await fetchUserProfile(user.id);
    }
  };

  const handleAuthStateChange = async (currentUser: User | null) => {
    console.log("[AuthContext] handleAuthStateChange called, user:", currentUser ? "exists" : "null");

    // Prevent duplicate concurrent executions
    if (fetchingRef.current) {
      console.log("[AuthContext] Already fetching, skipping duplicate call");
      return;
    }

    // Optimization: Skip if we already processed this user and have a role
    if (currentUser?.id === lastProcessedUserIdRef.current && role !== null) {
      console.log("[AuthContext] User unchanged and already loaded, skipping redundant fetch");
      // Even if skipping, ensure loading is false if it was true
      if (loading) setLoading(false);
      return;
    }

    try {
      fetchingRef.current = true;

      // Only show full loading screen if we don't have a role yet (initial load or user change)
      // or if the user ID has changed.
      const isNewUser = currentUser?.id !== localStorage.getItem('pravokha_user_id');

      if (role === null || isNewUser) {
        console.log("[AuthContext] Setting loading(true) for fresh initialization or user change");
        setLoading(true);
        // ONLY clear if it's truly a different account
        if (isNewUser) {
          console.log("[AuthContext] New user detected, clearing role cache");
          localStorage.removeItem('pravokha_user_role');
          localStorage.removeItem('pravokha_user_id');
          setRole(null);
        }
      } else {
        console.log("[AuthContext] Maintaining current role during background refresh");
      }

      setAuthError(null);

      if (!currentUser) {
        console.log("[AuthContext] No user, clearing state");
        lastProcessedUserIdRef.current = null;
        localStorage.removeItem('pravokha_user_role');
        localStorage.removeItem('pravokha_user_id');
        setSession(null);
        setUser(null);
        setRole(null);
        setIsSuspended(false);
        setVerificationStatus('unverified');
        setVerificationComments(null);
        setAuthError(null);
        setProfile(null); // Clear profile on sign out
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
        console.log("[AuthContext] User is inactive or suspended, signing out");
        setProfile(null);
        await signOut(); // Ensure global logout
        return;
      }

      console.log("[AuthContext] Setting role and completing initialization");
      lastProcessedUserIdRef.current = currentUser.id;

      // ONLY update the role if the fetch was successful (not null)
      if (userRole) {
        localStorage.setItem('pravokha_user_role', userRole);
        localStorage.setItem('pravokha_user_id', currentUser.id);
        setRole(userRole);
      } else {
        console.warn("[AuthContext] Preserving existing role due to fetch timeout/error");
      }

      setProfile(profileResult.profile); // Set profile from fetch result
      setAuthError(null);
      setLoading(false);
    } catch (error: any) {
      console.error("[AuthContext] Error in handleAuthStateChange:", error);

      // If we already have a role (background check failed), don't show the fatal error screen
      if (role !== null) {
        console.warn("[AuthContext] Background status check failed, maintaining current session.");
      } else {
        setAuthError(error.message || "Authentication failed to connect to database");
      }

      setLoading(false);
    } finally {
      fetchingRef.current = false;
    }
  };

  // Safety timer to ensure loading state resolves even if something hangs
  useEffect(() => {
    if (!loading) return;

    const timer = setTimeout(() => {
      console.warn("[AuthContext] Safety timer triggered after 20s. Forcing resolution.");
      // Don't show a fatal error, just stop loading. The app might still work if defaults were used.
      setLoading(false);
    }, 20000); // 20 seconds safety cap

    return () => clearTimeout(timer);
  }, [loading]);

  useEffect(() => {
    let mounted = true;
    console.log("[AuthContext] Component mounting");

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
          table: 'users',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          const newProfile = payload.new as any;
          console.log("[AuthContext] Profile real-time update RECEIVED:", newProfile);

          setProfile((prev: any) => {
            const updated = { ...prev, ...newProfile };
            console.log("[AuthContext] Merging profile state. Old:", prev, "New:", updated);
            return updated;
          });

          if (newProfile.verificationStatus) {
            setVerificationStatus(newProfile.verificationStatus);
          }
          if (newProfile.verificationComments !== undefined) {
            setVerificationComments(newProfile.verificationComments);
          }
          if (newProfile.status) {
            setIsSuspended(newProfile.status === 'suspended');

            // 10/10 Polish: Immediate session invalidation if suspended or inactive
            if (newProfile.status === 'suspended' || newProfile.status === 'inactive') {
              console.warn("[AuthContext] Account status changed to restricted. Invalidating session.");
              signOut();
            }
          }
        }
      )
      .subscribe((status) => {
        console.log(`[AuthContext] Subscription status for profile_changes_${user.id}:`, status);
      });

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
      localStorage.removeItem('pravokha_user_role');
      localStorage.removeItem('pravokha_user_id');
    } catch (error) {
      console.error("[AuthContext] Error signing out:", error);
    } finally {
      setLoading(false);
      navigate('/auth');
    }
  };

  return (
    <AuthContext.Provider value={{
      user, session, role, loading, suspensionError, signOut, refreshRole, refreshProfile, clearSuspensionError,
      isSuspended, suspensionReason, verificationStatus,
      verificationComments,
      authError,
      profile
    }}>
      {children}
    </AuthContext.Provider>
  );
};
