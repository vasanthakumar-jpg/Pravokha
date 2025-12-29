
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [uploading, setUploading] = useState(false);

    // Fetch Settings Query
    const { data: settings, isLoading: loading, refetch } = useQuery({
        queryKey: ["sellerSettings", user?.id],
        queryFn: async () => {
            if (!user) throw new Error("Not authenticated");

            // 1. Fetch Request 1: Public Profile Data
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profileError) throw profileError;

            // 2. Fetch Request 2: Secure Secrets (Bank Details)
            const { data: secretData } = await supabase
                .from('seller_secrets')
                .select('payout_details')
                .eq('id', user.id)
                .maybeSingle();

            // Transform DB structure to Flat State
            return {
                storeName: profileData.store_name || "",
                storeDescription: profileData.store_description || "",
                storeLogoUrl: profileData.store_logo_url || null,
                storeBannerUrl: profileData.store_banner_url || null,
                // CRITICAL FIX: Always fallback to auth user email if profile email is empty
                email: profileData.email || user.email || "",
                phone: profileData.business_info?.phone || "",
                address: profileData.business_info?.address || "",
                gst: profileData.business_info?.gst || "",
                pan: profileData.business_info?.pan || "",
                vacationMode: profileData.store_config?.vacation_mode || false,
                autoConfirm: profileData.store_config?.auto_confirm ?? true,
                returnPolicy: profileData.store_config?.return_policy || "",

                // Secrets
                bankAccount: secretData?.payout_details?.account_number || "",
                ifsc: secretData?.payout_details?.ifsc || "",
                beneficiaryName: secretData?.payout_details?.beneficiary_name || "",
                metaTitle: profileData.meta_title || "",
                metaDescription: profileData.meta_description || ""
            } as SellerProfile;
        },
        enabled: !!user?.id,
        staleTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: false, // Prevent auto-refresh annoyance
    });

    const uploadImage = async (file: File, type: 'logo' | 'banner'): Promise<string | null> => {
        if (!user) return null;
        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/${type}_${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            // Ensure 'seller-assets' bucket exists or use 'public'
            const { error: uploadError } = await supabase.storage
                .from('seller-assets')
                .upload(filePath, file);

            if (uploadError) {
                console.error("Upload error:", uploadError);
                throw new Error("Failed to upload image.");
            }

            const { data: { publicUrl } } = supabase.storage
                .from('seller-assets')
                .getPublicUrl(filePath);

            return publicUrl;
        } catch (error: any) {
            console.error("Error uploading image:", error);
            toast({
                title: "Upload Failed",
                description: error.message || "Could not upload image.",
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

            // 1. Update Profile (Public Info)
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    store_name: newSettings.storeName,
                    store_description: newSettings.storeDescription,
                    store_logo_url: newSettings.storeLogoUrl,
                    store_banner_url: newSettings.storeBannerUrl,
                    business_info: {
                        phone: newSettings.phone,
                        address: newSettings.address,
                        gst: newSettings.gst,
                        pan: newSettings.pan
                    },
                    store_config: {
                        vacation_mode: newSettings.vacationMode,
                        auto_confirm: newSettings.autoConfirm,
                        return_policy: newSettings.returnPolicy
                    },
                    meta_title: newSettings.metaTitle,
                    meta_description: newSettings.metaDescription
                })
                .eq('id', user.id);

            if (profileError) throw profileError;

            // 2. Update Secrets (Secure Info) - Upsert
            const { error: secretError } = await supabase
                .from('seller_secrets')
                .upsert({
                    id: user.id,
                    payout_details: {
                        account_number: newSettings.bankAccount,
                        ifsc: newSettings.ifsc,
                        beneficiary_name: newSettings.beneficiaryName
                    },
                    updated_at: new Date().toISOString()
                });

            if (secretError) throw secretError;

            // 3. Audit Logging
            await supabase.from('audit_logs').insert({
                actor_id: user.id,
                target_id: user.id,
                target_type: 'settings',
                action_type: 'settings_update',
                severity: 'warning',
                description: `Store/Business settings updated for "${newSettings.storeName}".`,
                metadata: {
                    business_info: { gst: newSettings.gst, pan: newSettings.pan },
                    store_config: { vacation_mode: newSettings.vacationMode, auto_confirm: newSettings.autoConfirm },
                    bank_updated: true
                }
            });

            return newSettings;
        },
        onSuccess: () => {
            toast({
                title: "Configuration Saved",
                description: "Your store settings have been updated successfully.",
            });
            // CRITICAL: Invalidate profile query so Header updates immediately!
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
