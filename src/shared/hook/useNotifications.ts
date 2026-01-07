import { useState, useEffect } from "react";
import { supabase } from "@/infra/api/supabase";
import { useAuth } from "@/core/context/AuthContext";
import { toast } from "@/shared/hook/use-toast";

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'order' | 'message' | 'system' | 'alert' | 'order_cancelled';
    is_read: boolean;
    created_at: string;
    link?: string;
    metadata?: any;
}

export function useNotifications() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    // Sync unread count with notifications state
    useEffect(() => {
        setUnreadCount(notifications.filter(n => !n.is_read).length);
    }, [notifications]);

    useEffect(() => {
        if (!user) return;

        const fetchNotifications = async () => {
            try {
                const { data, error } = await supabase
                    .from('notifications' as any)
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(50);

                if (error) {
                    // Silent fail if table doesn't exist
                    if (error.code === '42P01' || error.message?.includes('does not exist')) {
                        console.log('Notifications table not yet created');
                        setNotifications([]);
                        return;
                    }
                    throw error;
                }

                // Ensure data matches interface
                setNotifications((data as unknown) as Notification[]);
                // Unread count is handled by the effect above
            } catch (error) {
                // Don't log error if table doesn't exist
                const errorMsg = (error as any)?.message || '';
                if (!errorMsg.includes('does not exist')) {
                    console.error('Error loading notifications:', error);
                }
                setNotifications([]);
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();

        // Subscribe to real-time changes
        const channel = supabase
            .channel('notifications-realtime')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'notifications' as any,
                    filter: `user_id=eq.${user.id}`,
                },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        const newNotification = payload.new as Notification;
                        setNotifications((prev) => [newNotification, ...prev]);

                        toast({
                            title: newNotification.title,
                            description: newNotification.message,
                        });
                    } else if (payload.eventType === 'UPDATE') {
                        setNotifications((prev) =>
                            prev.map((n) => (n.id === payload.new.id ? (payload.new as Notification) : n))
                        );
                        // Re-fetch to be safe about count or just decrement if mark read
                        // Simpler to just assume user actions update local state correctly, 
                        // but for external updates (like opened elsewhere), we might drift.
                        // Ideally we'd re-count.
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const markAsRead = async (id: string) => {
        try {
            const { error } = await supabase
                .from('notifications' as any)
                .update({ is_read: true })
                .eq('id', id);

            if (error) throw error;

            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
            );
        } catch (error) {
            console.error(error);
        }
    };

    const markAllAsRead = async () => {
        if (!user) return;
        try {
            const { error } = await supabase
                .from('notifications' as any)
                .update({ is_read: true })
                .eq('user_id', user.id)
                .eq('is_read', false);

            if (error) throw error;

            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
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
            const { error } = await supabase
                .from('notifications' as any)
                .delete()
                .eq('id', id);

            if (error) throw error;

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
    };
}
