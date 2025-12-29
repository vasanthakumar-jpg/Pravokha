import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/Popover";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import styles from "./NotificationBell.module.css";
import { cn } from "@/lib/utils";

export function NotificationBell() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (user) {
            fetchNotifications();

            const channel = supabase
                .channel('schema-db-changes')
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'notifications',
                        filter: `user_id=eq.${user.id}`,
                    },
                    (payload) => {
                        setNotifications((prev) => [payload.new, ...prev]);
                        setUnreadCount((prev) => prev + 1);
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [user]);

    const fetchNotifications = async () => {
        const { data } = await supabase
            .from('notifications' as any)
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);

        if (data) {
            setNotifications(data);
            setUnreadCount(data.filter((n: any) => !n.is_read).length);
        }
    };

    const handleMarkAsRead = async (id: string) => {
        await supabase.from('notifications' as any).update({ is_read: true }).eq('id', id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const handleMarkAllRead = async () => {
        await supabase.from('notifications' as any).update({ is_read: true }).eq('user_id', user?.id) as any;
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className={styles.badge}>
                            {unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className={styles.popoverContent} align="end">
                <div className={styles.header}>
                    <h4 className={styles.title}>Notifications</h4>
                    {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" onClick={handleMarkAllRead} className={styles.markAllButton}>
                            Mark all read
                        </Button>
                    )}
                </div>
                <ScrollArea className={styles.scrollArea}>
                    {notifications.length === 0 ? (
                        <div className={styles.emptyState}>
                            No notifications yet
                        </div>
                    ) : (
                        <div className={styles.notificationList}>
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        styles.notificationItem,
                                        !notification.is_read && styles.unread
                                    )}
                                    onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
                                >
                                    <div className={styles.itemHeader}>
                                        <p className={cn(
                                            styles.itemTitle,
                                            !notification.is_read && styles.itemTitleUnread
                                        )}>
                                            {notification.title}
                                        </p>
                                        <span className={styles.itemTime}>
                                            {format(new Date(notification.created_at), 'MMM d, HH:mm')}
                                        </span>
                                    </div>
                                    <p className={styles.itemMessage}>
                                        {notification.message}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}

export default NotificationBell;
