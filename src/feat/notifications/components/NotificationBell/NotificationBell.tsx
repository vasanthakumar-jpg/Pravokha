import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/ui/Button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/ui/Popover";
import { ScrollArea } from "@/ui/ScrollArea";
import { apiClient } from "@/infra/api/apiClient";
import { useAuth } from "@/core/context/AuthContext";
import { format } from "date-fns";
import styles from "./NotificationBell.module.css";
import { cn } from "@/lib/utils";

export function NotificationBell() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (user?.id) {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 60000); // Increased to 60s
            return () => clearInterval(interval);
        }
    }, [user?.id]);

    const fetchNotifications = async () => {
        try {
            const response = await apiClient.get('/notifications', { params: { limit: 20 } });
            if (response.data.success) {
                const data = response.data.notifications || [];
                setNotifications(data);
                setUnreadCount(data.filter((n: any) => !n.isRead).length);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const handleMarkAsRead = async (id: string) => {
        try {
            await apiClient.patch(`/notifications/${id}`, { isRead: true });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await apiClient.post('/notifications/mark-all-read');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
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
                                        !notification.isRead && styles.unread
                                    )}
                                    onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                                >
                                    <div className={styles.itemHeader}>
                                        <p className={cn(
                                            styles.itemTitle,
                                            !notification.isRead && styles.itemTitleUnread
                                        )}>
                                            {notification.title}
                                        </p>
                                        <span className={styles.itemTime}>
                                            {format(new Date(notification.createdAt), 'MMM d, HH:mm')}
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
