import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/infra/api/apiClient";
import { useAuth } from "@/core/context/AuthContext";
import { toast } from "@/shared/hook/use-toast";

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'order' | 'message' | 'system' | 'alert' | 'order_cancelled';
    isRead: boolean;
    createdAt: string;
    link?: string;
    metadata?: any;
}

export function useNotifications() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = useCallback(async () => {
        if (!user) return;
        try {
            const response = await apiClient.get('/notifications');
            const data = response.data;
            setNotifications(data);
            setUnreadCount(data.filter((n: any) => !n.isRead).length);
        } catch (error: any) {
            // Suppress 429 rate limit errors to avoid console spam
            if (error?.response?.status !== 429) {
                console.error('Error loading notifications:', error);
            }
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchNotifications();

        // Polling as a simpler alternative to Socket.io/Realtime
        const interval = setInterval(fetchNotifications, 60000); // Poll every 60s (reduced from 30s to avoid rate limits)
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    const markAsRead = async (id: string) => {
        try {
            await apiClient.patch(`/notifications/${id}/read`);
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
            );
        } catch (error) {
            console.error(error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await apiClient.patch('/notifications/read-all');
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            toast({
                title: "Success",
                description: "All notifications marked as read",
            });
        } catch (error) {
            console.error(error);
        }
    };

    const deleteNotification = async (id: string) => {
        try {
            await apiClient.delete(`/notifications/${id}`);
            setNotifications((prev) => prev.filter((n) => n.id !== id));
            toast({
                title: "Deleted",
                description: "Notification removed",
            });
        } catch (error) {
            console.error(error);
        }
    };

    return {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refresh: fetchNotifications
    };
}
