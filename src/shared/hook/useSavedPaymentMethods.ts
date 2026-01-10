import { useState, useEffect } from "react";
import { apiClient } from "@/infra/api/apiClient";
import { useAuth } from "@/core/context/AuthContext";
import { useToast } from "@/shared/hook/use-toast";

export interface PaymentMethod {
    id: string;
    user_id: string;
    card_last4: string;
    card_brand: string;
    card_exp_month: number;
    card_exp_year: number;
    card_holder_name: string;
    is_default: boolean;
    created_at: string;
    type: string;
    label?: string;
    details?: any;
}

export function useSavedPaymentMethods() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [loading, setLoading] = useState(true);

    const mapPaymentMethod = (data: any): PaymentMethod => ({
        id: data.id,
        user_id: data.userId,
        card_last4: data.cardLast4,
        card_brand: data.cardBrand,
        card_exp_month: data.cardExpMonth,
        card_exp_year: data.cardExpYear,
        card_holder_name: data.cardHolderName,
        is_default: data.isDefault,
        created_at: data.createdAt,
        type: data.type,
        label: data.label,
        details: data.details
    });

    const fetchPaymentMethods = async () => {
        if (!user) return;

        setLoading(true);
        try {
            const response = await apiClient.get('/payments/methods');
            const data = response.data.paymentMethods;
            setPaymentMethods(data.map(mapPaymentMethod));
        } catch (error: any) {
            console.error("Error fetching payment methods:", error);
            toast({
                title: "Error",
                description: "Failed to load payment methods",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const addPaymentMethod = async (method: Omit<PaymentMethod, "id" | "user_id" | "created_at">) => {
        if (!user) return;

        try {
            const backendData = {
                cardLast4: method.card_last4,
                cardBrand: method.card_brand,
                cardExpMonth: method.card_exp_month,
                cardExpYear: method.card_exp_year,
                cardHolderName: method.card_holder_name,
                isDefault: method.is_default,
                type: method.type,
                label: method.label || 'Personal',
                details: method.details || {}
            };

            const response = await apiClient.post('/payments/methods', backendData);
            const data = response.data.paymentMethod;

            setPaymentMethods((prev) => [mapPaymentMethod(data), ...prev]);
            toast({
                title: "Success",
                description: "Payment method added successfully",
            });
            return mapPaymentMethod(data);
        } catch (error: any) {
            console.error("Error adding payment method:", error);
            toast({
                title: "Error",
                description: "Failed to add payment method",
                variant: "destructive",
            });
            throw error;
        }
    };

    const deletePaymentMethod = async (id: string) => {
        if (!user) return;

        try {
            await apiClient.delete(`/payments/methods/${id}`);
            setPaymentMethods((prev) => prev.filter((pm) => pm.id !== id));
            toast({
                title: "Success",
                description: "Payment method removed",
            });
        } catch (error: any) {
            console.error("Error removing payment method:", error);
            toast({
                title: "Error",
                description: "Failed to remove payment method",
                variant: "destructive",
            });
            throw error;
        }
    };

    useEffect(() => {
        fetchPaymentMethods();
    }, [user]);

    return {
        paymentMethods,
        loading,
        addPaymentMethod,
        deletePaymentMethod,
        refetch: fetchPaymentMethods,
    };
}
