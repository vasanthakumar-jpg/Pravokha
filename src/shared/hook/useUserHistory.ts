import { useState, useEffect } from "react";
import { apiClient } from "@/infra/api/apiClient";
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

    const fetchHistory = async () => {
        if (!user) return;

        setLoadingPayments(true);
        setLoadingOrders(true);
        try {
            const response = await apiClient.get("/orders");
            const rawData = response.data;
            const data = Array.isArray(rawData.data) ? rawData.data : [];

            // Map backend orders to OrderHistory
            const mappedOrders: OrderHistory[] = data.map((o: any) => ({
                id: o.id,
                order_number: o.orderNumber,
                user_id: o.userId,
                total: o.total,
                order_status: o.status,
                payment_status: o.paymentStatus,
                payment_method: o.paymentMethod || 'N/A',
                created_at: o.createdAt,
                items: o.items || []
            }));

            // Map backend orders to PaymentHistory (since we don't have a separate table for payments yet)
            const mappedPayments: PaymentHistory[] = data.map((o: any) => ({
                id: `pay-${o.id}`,
                user_id: o.userId,
                order_id: o.id,
                amount: o.total,
                payment_method: o.paymentMethod || 'Stripe',
                payment_type: 'Order Payment',
                status: o.paymentStatus,
                transaction_id: o.stripeIntentId,
                created_at: o.createdAt,
                order: {
                    order_number: o.orderNumber
                }
            }));

            setOrderHistory(mappedOrders);
            setPaymentHistory(mappedPayments);
        } catch (error) {
            console.error("Error fetching history:", error);
        } finally {
            setLoadingPayments(false);
            setLoadingOrders(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, [user]);

    return {
        paymentHistory,
        orderHistory,
        loadingPayments,
        loadingOrders,
        refetchPayments: fetchHistory,
        refetchOrders: fetchHistory,
    };
}
