import { useState, useEffect } from "react";
import { apiClient } from "@/infra/api/apiClient";
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

    const mapPreferences = (data: any): UserPreferences => ({
        user_id: data.userId,
        email_notifications: data.emailNotifications,
        order_updates: data.orderUpdates,
        marketing_emails: data.marketingEmails,
        sms_notifications: data.smsNotifications,
        theme: data.theme,
        language: data.language,
        currency: data.currency
    });

    const mapPreferencesToBackend = (prefs: Partial<UserPreferences>) => {
        const updates: any = {};
        if (prefs.email_notifications !== undefined) updates.emailNotifications = prefs.email_notifications;
        if (prefs.order_updates !== undefined) updates.orderUpdates = prefs.order_updates;
        if (prefs.marketing_emails !== undefined) updates.marketingEmails = prefs.marketing_emails;
        if (prefs.sms_notifications !== undefined) updates.smsNotifications = prefs.sms_notifications;
        if (prefs.theme !== undefined) updates.theme = prefs.theme;
        if (prefs.language !== undefined) updates.language = prefs.language;
        if (prefs.currency !== undefined) updates.currency = prefs.currency;
        return updates;
    };

    // Fetch preferences
    const fetchPreferences = async () => {
        if (!user) return;

        setLoading(true);
        try {
            const response = await apiClient.get('/users/preferences');
            const data = response.data.preferences;
            setPreferences(mapPreferences(data));
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
            const backendUpdates = mapPreferencesToBackend(updates);
            const response = await apiClient.patch('/users/preferences', backendUpdates);
            const data = response.data.preferences;

            setPreferences(mapPreferences(data));
            toast({
                title: "Success",
                description: "Preferences updated successfully",
            });
            return mapPreferences(data);
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
