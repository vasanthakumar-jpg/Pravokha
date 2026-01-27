import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/infra/api/apiClient";
import { useAuth } from "@/core/context/AuthContext";

interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  avatar_url: string | null;
  email: string | null;
  bio: string | null;
  date_of_birth: string | null;
  status: 'active' | 'suspended' | 'inactive';
  verificationStatus: 'pending' | 'verified' | 'rejected' | 'unverified';
  verificationComments: string | null;
  bankAccount: string | null;
  ifsc: string | null;
  beneficiaryName: string | null;
  gst: string | null;
  pan: string | null;
  storeName: string | null;
  storeDescription: string | null;
  storeLogoUrl: string | null;
  storeBannerUrl: string | null;
}

export function useProfile(userId: string | undefined) {
  const queryClient = useQueryClient();
  const { refreshProfile: refreshAuthProfile } = useAuth();

  const { data: profile, isLoading: loading, refetch } = useQuery({
    queryKey: ["profile", userId],
    queryFn: async () => {
      if (!userId) return null;
      console.log('[useProfile] Fetching profile from Node backend for userId:', userId);

      const response = await apiClient.get(`/users/${userId}`);
      const data = response.data.user;

      // Map backend camelCase to frontend snake_case/legacy keys
      return {
        id: data.id,
        full_name: data.name,
        phone: data.phone,
        address: data.address,
        avatar_url: data.avatarUrl,
        email: data.email,
        bio: data.bio,
        date_of_birth: data.dateOfBirth,
        status: data.status,
        verificationStatus: data.verificationStatus,
        verificationComments: data.verificationComments,
        bankAccount: data.bankAccount,
        ifsc: data.ifsc,
        beneficiaryName: data.beneficiaryName,
        gst: data.gst,
        pan: data.pan,
        storeName: data.storeName,
        storeDescription: data.storeDescription,
        storeLogoUrl: data.storeLogoUrl,
        storeBannerUrl: data.storeBannerUrl
      } as Profile;
    },

    enabled: !!userId,
    staleTime: 1000 * 10, // Cache for 10 seconds to avoid stale profile data issues
    refetchOnWindowFocus: false,
  });

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!userId) return;

    try {
      // Map frontend updates back to backend expected fields
      const backendUpdates: any = {};
      if (updates.full_name !== undefined) backendUpdates.name = updates.full_name;
      if (updates.phone !== undefined) backendUpdates.phone = updates.phone;
      if (updates.address !== undefined) backendUpdates.address = updates.address;
      if (updates.avatar_url !== undefined) backendUpdates.avatarUrl = updates.avatar_url;
      if (updates.bio !== undefined) backendUpdates.bio = updates.bio;

      // Handle both formats for robustness
      if (updates.date_of_birth !== undefined) {
        backendUpdates.dateOfBirth = updates.date_of_birth;
      } else if ((updates as any).dateOfBirth !== undefined) {
        backendUpdates.dateOfBirth = (updates as any).dateOfBirth;
      }

      console.log('[useProfile] Updating profile with:', backendUpdates);
      await apiClient.patch('/users/profile', backendUpdates);

      console.log('[useProfile] Profile updated successfully, refreshing auth context...');

      // CRITICAL: Wait a bit for backend to complete write
      await new Promise(resolve => setTimeout(resolve, 300));

      // CRITICAL: Refresh AuthContext FIRST to update header/UI immediately
      await refreshAuthProfile();

      // Then invalidate query cache to trigger re-fetch everywhere
      queryClient.invalidateQueries({ queryKey: ["profile", userId] });

      // Force immediate refetch to ensure fresh data
      await refetch();

      console.log('[useProfile] All refreshes complete');

      return true;
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  };

  return { profile, loading, refreshProfile: refetch, updateProfile };
}

