import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

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
    details?: any; // For storing gateway response or extra info
}

export function useSavedPaymentMethods() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchPaymentMethods = async () => {
        if (!user) return;

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("saved_payment_methods" as any)
                .select("*")
                .eq("user_id", user.id)
                .order("is_default", { ascending: false })
                .order("created_at", { ascending: false });

            if (error) throw error;
            setPaymentMethods((data as unknown as PaymentMethod[]) || []);
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
            if (method.is_default) {
                // Unset other defaults
                await supabase
                    .from("saved_payment_methods" as any)
                    .update({ is_default: false })
                    .eq("user_id", user.id);
            }

            // Remove card_brand from insert payload if it doesn't exist in DB
            const { card_brand, ...insertData } = method;

            // Ensure label is present (default to 'Personal' if missing) to satisfy "Label" Not-Null constraint
            const payload = {
                ...insertData,
                user_id: user.id,
                label: method.label || 'Personal',
                details: {}
            };

            const { data, error } = await supabase
                .from("saved_payment_methods" as any)
                .insert(payload)
                .select()
                .single();

            if (error) throw error;

            setPaymentMethods((prev) => [data as unknown as PaymentMethod, ...prev]);
            toast({
                title: "Success",
                description: "Payment method added successfully",
            });
            return data as unknown as PaymentMethod;
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
            const { error } = await supabase
                .from("saved_payment_methods" as any)
                .delete()
                .eq("id", id)
                .eq("user_id", user.id);

            if (error) throw error;

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
