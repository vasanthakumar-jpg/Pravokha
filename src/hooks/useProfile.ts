
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  avatar_url: string | null;
  email: string | null; // Added email field
  bio: string | null;
  date_of_birth: string | null;
  status: 'active' | 'suspended' | 'inactive';
  verification_status: 'pending' | 'verified' | 'rejected' | 'unverified';
  verification_comments: string | null;
}

export function useProfile(userId: string | undefined) {
  const queryClient = useQueryClient();
  const { refreshProfile } = useAuth();

  const { data: profile, isLoading: loading, refetch } = useQuery({
    queryKey: ["profile", userId],
    queryFn: async () => {
      if (!userId) return null;
      console.log('[useProfile] Fetching profile for userId:', userId);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error('[useProfile] Error fetching profile:', error);
        throw error;
      }

      return data as Profile;
    },

    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });


  const updateProfile = async (updates: Partial<Profile>) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", userId);

      if (error) throw error;

      // Invalidate query to trigger re-fetch everywhere
      queryClient.invalidateQueries({ queryKey: ["profile", userId] });
      await refreshProfile();
      return true;
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  };

  return { profile, loading, refreshProfile: refetch, updateProfile };
}

