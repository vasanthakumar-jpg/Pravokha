import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/infra/api/apiClient";
import { useToast } from "@/shared/hook/use-toast";

export interface UserPreferences {
    emailNotifications: boolean;
    orderUpdates: boolean;
    marketingEmails: boolean;
}

export const usePreferences = (userId?: string) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: preferences, isLoading, refetch } = useQuery({
        queryKey: ["preferences", userId],
        queryFn: async () => {
            const response = await apiClient.get('/users/preferences');
            return response.data.preferences as UserPreferences;
        },
        enabled: !!userId,
    });

    const updatePreferencesMutation = useMutation({
        mutationFn: async (updatedPrefs: Partial<UserPreferences>) => {
            const response = await apiClient.patch('/users/preferences', updatedPrefs);
            return response.data.preferences as UserPreferences;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["preferences", userId] });
            toast({
                title: "Preferences Updated",
                description: "Your notification settings have been saved.",
            });
        },
        onError: (error: any) => {
            console.error("Error updating preferences:", error);
            toast({
                title: "Update Failed",
                description: error.response?.data?.message || "Could not save preferences.",
                variant: "destructive",
            });
        },
    });

    return {
        preferences,
        isLoading,
        updatePreferences: updatePreferencesMutation.mutateAsync,
        isUpdating: updatePreferencesMutation.isPending,
        refetch,
    };
};
