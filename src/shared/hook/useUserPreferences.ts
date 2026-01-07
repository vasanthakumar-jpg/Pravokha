import { useState, useEffect } from "react";
import { supabase } from "@/infra/api/supabase";
import { useAuth } from "@/core/context/AuthContext";
import { useToast } from "@/shared/hook/use-toast";

interface UserPreferences {
    user_id: string;
    email_notifications: boolean;
    order_updates: boolean;
    marketing_emails: boolean;
    sms_notifications: boolean;
    theme: string;
    language: string;
    currency: string;
}

export function useUserPreferences() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [preferences, setPreferences] = useState<UserPreferences | null>(null);
    const [loading, setLoading] = useState(true);

    // Fetch preferences
    const fetchPreferences = async () => {
        if (!user) return;

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("user_preferences" as any)
                .select("*")
                .eq("user_id", user.id)
                .single();

            if (error && error.code !== "PGRST116") {
                throw error;
            }

            // If no preferences exist, create default ones
            if (!data) {
                const defaultPrefs = {
                    user_id: user.id,
                    email_notifications: true,
                    order_updates: true,
                    marketing_emails: false,
                    sms_notifications: false,
                    theme: "system",
                    language: "en",
                    currency: "INR",
                };

                const { data: newData, error: insertError } = await supabase
                    .from("user_preferences" as any)
                    .insert(defaultPrefs)
                    .select()
                    .single();

                if (insertError) throw insertError;
                setPreferences(newData as unknown as UserPreferences);
            } else {
                setPreferences(data as unknown as UserPreferences);
            }
        } catch (error: any) {
            console.error("Error fetching preferences:", error);
            toast({
                title: "Error",
                description: "Failed to load preferences",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    // Update preferences
    const updatePreferences = async (updates: Partial<UserPreferences>) => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from("user_preferences" as any)
                .upsert({ user_id: user.id, ...updates, updated_at: new Date().toISOString() })
                .select()
                .single();

            if (error) throw error;

            setPreferences(data as unknown as UserPreferences);
            toast({
                title: "Success",
                description: "Preferences updated successfully",
            });
            return data as unknown as UserPreferences;
        } catch (error: any) {
            console.error("Error updating preferences:", error);
            toast({
                title: "Error",
                description: "Failed to update preferences",
                variant: "destructive",
            });
            throw error;
        }
    };

    useEffect(() => {
        fetchPreferences();
    }, [user]);

    return {
        preferences,
        loading,
        updatePreferences,
        refetch: fetchPreferences,
    };
}
