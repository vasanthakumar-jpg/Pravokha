import { useState, useEffect } from "react";
import { useAuth } from "@/core/context/AuthContext";
import { useProfile } from "./useProfile";
import { useUserAddresses } from "./useUserAddresses";
import { useSavedPaymentMethods } from "./useSavedPaymentMethods";
import { useUserPreferences } from "./useUserPreferences";
import { useUserHistory } from "./useUserHistory";
import { useToast } from "./use-toast";

// Re-export types to match useMockSettings interface for seamless transition
export interface Address {
    id: string;
    label: string;
    full_name: string;
    phone: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    pincode: string;
    is_default: boolean;
}

export interface PaymentMethod {
    id: string;
    type: 'card' | 'upi' | 'netbanking';
    label: string;
    last4?: string;
    expiry?: string;
    upiId?: string;
    is_default: boolean;
}

// Unified Hook
export function useUserSettings() {
    const { user } = useAuth();
    const { profile, loading: loadingProfile, updateProfile } = useProfile(user?.id);
    const { addresses, loading: loadingAddresses, addAddress, updateAddress, deleteAddress } = useUserAddresses();
    const { paymentMethods, loading: loadingPayments, addPaymentMethod, deletePaymentMethod } = useSavedPaymentMethods();
    const { preferences, loading: loadingPreferences, updatePreferences } = useUserPreferences();
    // History is read-only usually
    const { paymentHistory, orderHistory, loadingPayments: loadingHistory } = useUserHistory();

    const loading = loadingProfile || loadingAddresses || loadingPayments || loadingPreferences || loadingHistory;

    // Map Real Data to UI Interfaces if needed

    // Transform PaymentMethods to match UI expectation
    const formattedPayments = paymentMethods.map(pm => ({
        id: pm.id,
        type: 'card' as const, // For now assuming mostly cards or mapping logic
        label: pm.card_holder_name || pm.card_brand || 'Card',
        last4: pm.card_last4,
        expiry: `${pm.card_exp_month}/${pm.card_exp_year}`,
        is_default: pm.is_default,
        upiId: undefined
    }));

    // Helper to match mock's updateProfile signature which accepts a full profile object
    // Real updateProfile accepts Partial<Profile>
    const handleUpdateProfile = async (data: any) => {
        // Ensure email is not sent if it's not in the profiles table (it's in auth)
        // AND sanitize date_of_birth to avoid "invalid input syntax" error
        const { email, ...updates } = data;

        if (updates.date_of_birth === "") {
            updates.date_of_birth = null;
        }

        await updateProfile(updates);
    };

    return {
        loading,
        profile: profile ? { ...profile, email: user?.email || '' } : {
            full_name: '', email: user?.email || '', phone: '', bio: '', date_of_birth: '', avatar_url: user?.avatar_url || ''
        },
        addresses,
        payments: formattedPayments,
        preferences: preferences || {
            email_notifications: false, order_updates: false, marketing_emails: false, sms_notifications: false
        },
        updateProfile: handleUpdateProfile,
        addAddress,
        updateAddress,
        deleteAddress,
        updatePreferences,
        addPaymentMethod,
        deletePaymentMethod,
        // Legacy support + New detailed props
        history: orderHistory.map(order => ({
            id: order.id,
            order: { order_number: order.order_number },
            status: order.order_status,
            amount: order.total,
            created_at: order.created_at,
            type: 'order'
        })),
        orders: orderHistory,
        paymentHistory: paymentHistory
    };
}
