import { useState, useEffect } from "react";
import { supabase } from "@/infra/api/supabase";
import { useAuth } from "@/core/context/AuthContext";

interface PaymentHistory {
    id: string;
    user_id: string;
    order_id: string | null;
    amount: number;
    payment_method: string;
    payment_type: string;
    status: string;
    transaction_id: string | null;
    created_at: string;
    order?: {
        order_number: string;
    };
}

interface OrderHistory {
    id: string;
    order_number: string;
    user_id: string;
    total: number;
    order_status: string;
    payment_status: string;
    payment_method: string;
    created_at: string;
    items: any[];
}

export function useUserHistory() {
    const { user } = useAuth();
    const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
    const [orderHistory, setOrderHistory] = useState<OrderHistory[]>([]);
    const [loadingPayments, setLoadingPayments] = useState(true);
    const [loadingOrders, setLoadingOrders] = useState(true);

    // Fetch payment history
    const fetchPaymentHistory = async () => {
        if (!user) return;

        setLoadingPayments(true);
        try {
            const { data, error } = await supabase
                .from("user_payments")
                .select(`
          *,
          order:orders(order_number)
        `)
                .eq("user_id", user.id)
                .order("created_at", { ascending: false })
                .limit(20);

            if (error) throw error;
            setPaymentHistory(data || []);
        } catch (error) {
            console.error("Error fetching payment history:", error);
        } finally {
            setLoadingPayments(false);
        }
    };

    // Fetch order history
    const fetchOrderHistory = async () => {
        if (!user) return;

        setLoadingOrders(true);
        try {
            const { data, error } = await supabase
                .from("orders")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false })
                .limit(20);

            if (error) throw error;
            setOrderHistory(data || []);
        } catch (error) {
            console.error("Error fetching order history:", error);
        } finally {
            setLoadingOrders(false);
        }
    };

    useEffect(() => {
        fetchPaymentHistory();
        fetchOrderHistory();
    }, [user]);

    return {
        paymentHistory,
        orderHistory,
        loadingPayments,
        loadingOrders,
        refetchPayments: fetchPaymentHistory,
        refetchOrders: fetchOrderHistory,
    };
}
