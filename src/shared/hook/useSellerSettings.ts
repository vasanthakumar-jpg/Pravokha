import { useState } from "react";
import { useAuth } from "@/core/context/AuthContext";
import { apiClient } from "@/infra/api/apiClient";
import { useToast } from "@/shared/hook/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface SellerProfile {
    storeName: string;
    storeDescription: string;
    storeLogoUrl: string | null;
    storeBannerUrl: string | null;
    email: string;
    phone: string;
    address: string;
    gst: string;
    pan: string;
    vacationMode: boolean;
    autoConfirm: boolean;
    returnPolicy: string;
    bankAccount: string;
    ifsc: string;
    beneficiaryName: string;
    metaTitle?: string;
    metaDescription?: string;
}

export const useSellerSettings = () => {
    const { user, refreshProfile } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [uploading, setUploading] = useState(false);

    // Fetch Settings Query
    const { data: settings, isLoading: loading, refetch } = useQuery({
        queryKey: ["sellerSettings", user?.id],
        queryFn: async () => {
            if (!user) throw new Error("Not authenticated");

            const response = await apiClient.get('/users/settings/dealer');
            const data = response.data.settings;

            return {
                storeName: data.storeName || "",
                storeDescription: data.storeDescription || "",
                storeLogoUrl: data.storeLogoUrl || null,
                storeBannerUrl: data.storeBannerUrl || null,
                email: data.email || user.email || "",
                phone: data.phone || "",
                address: data.address || "",
                gst: data.gst || "",
                pan: data.pan || "",
                vacationMode: data.vacationMode || false,
                autoConfirm: data.autoConfirm ?? true,
                returnPolicy: data.returnPolicy || "",
                bankAccount: data.bankAccount || "",
                ifsc: data.ifsc || "",
                beneficiaryName: data.beneficiaryName || "",
                metaTitle: data.metaTitle || "",
                metaDescription: data.metaDescription || ""
            } as SellerProfile;
        },
        enabled: !!user?.id,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    });

    // Migrate image uploading to use backend endpoint
    const uploadImage = async (file: File, type: 'logo' | 'banner'): Promise<string | null> => {
        if (!user) return null;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('type', type);

            const response = await apiClient.post('/uploads/single', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });
            return response.data.url;
        } catch (error: any) {
            console.error("Error uploading image:", error);
            toast({
                title: "Upload Failed",
                description: "Could not upload image.",
                variant: "destructive",
            });
            return null;
        } finally {
            setUploading(false);
        }
    };

    // Save Mutation
    const saveMutation = useMutation({
        mutationFn: async (newSettings: SellerProfile) => {
            if (!user) throw new Error("No user");

            await apiClient.patch('/users/settings/dealer', newSettings);
            return newSettings;
        },
        onSuccess: async () => {
            toast({
                title: "Configuration Saved",
                description: "Your store settings have been updated successfully.",
            });
            await refreshProfile();
            queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
            queryClient.invalidateQueries({ queryKey: ["sellerSettings", user?.id] });
        },
        onError: (error) => {
            console.error("Error saving settings:", error);
            toast({
                title: "Save Failed",
                description: "Could not update settings. Please try again.",
                variant: "destructive",
            });
        }
    });

    return {
        settings,
        loading,
        saving: saveMutation.isPending,
        uploading,
        saveSettings: saveMutation.mutateAsync,
        uploadImage,
        refetch
    };
};
