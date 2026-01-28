import * as React from "react";
import { Bell, ShoppingBag, MessageSquare, AlertTriangle, Info, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/ui/Button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/ui/DropdownMenu";
import { ScrollArea } from "@/ui/ScrollArea";
import { useNotifications, Notification } from "@/shared/hook/useNotifications";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/core/context/AuthContext";
import styles from "./NotificationBell.module.css";

export function NotificationBell() {
    const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
    const { role } = useAuth();
    const navigate = useNavigate();

    const getIcon = (type: Notification['type']) => {
        switch (type) {
            case 'order':
                return <ShoppingBag className="h-4 w-4 text-emerald-500" />;
            case 'message':
                return <MessageSquare className="h-4 w-4 text-indigo-500" />;
            case 'alert':
                return <AlertTriangle className="h-4 w-4 text-rose-500" />;
            default:
                return <Info className="h-4 w-4 text-amber-500" />;
        }
    };

    const getMessagesLink = () => {
        switch (role) {
            case 'admin':
                return '/admin/messages';
            case 'seller':
                return '/seller/messages';
            case 'user':
                return '/user/messages';
            default:
                return '/user/messages';
        }
    };

    const [isOpen, setIsOpen] = React.useState(false);

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.isRead) {
            markAsRead(notification.id);
        }
        if (notification.link) {
            navigate(notification.link);
        } else {
            navigate(getMessagesLink());
        }
        setIsOpen(false);
    };

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className={styles.bellButton}>
                    <Bell className={cn(styles.bellIcon, unreadCount > 0 && styles.bellIconActive)} />
                    {unreadCount > 0 && (
                        <>
                            {/* Premium Pulse Effect */}
                            <span className={styles.badgeContainer}>
                                <span className={styles.pingAnimation}></span>
                                <span className={styles.badgeDot}></span>
                            </span>
                            <span className={styles.badgeCount}>
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        </>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className={styles.dropdownContent}>
                <DropdownMenuLabel className="px-4 py-3">
                    <div className={styles.header}>
                        <div className={styles.headerTitle}>
                            <Sparkles className={styles.headerIcon} />
                            <span className={styles.headerText}>Notifications</span>
                        </div>
                        {unreadCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className={styles.clearButton}
                                onClick={() => markAllAsRead()}
                            >
                                Clear Unread
                            </Button>
                        )}
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border/40" />
                <ScrollArea className={styles.scrollArea}>
                    {notifications.length === 0 ? (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIconWrapper}>
                                <Bell className={styles.emptyIcon} />
                            </div>
                            <p className={styles.emptyText}>Pure Silence</p>
                        </div>
                    ) : (
                        <div className={styles.listContainer}>
                            {notifications.map((notification) => (
                                <DropdownMenuItem
                                    key={notification.id}
                                    className={cn(
                                        styles.notificationItem,
                                        !notification.isRead && styles.unreadItem
                                    )}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className={styles.itemContentWrapper}>
                                        <div className={cn(
                                            styles.iconWrapper,
                                            !notification.isRead ? styles.iconUnread : styles.iconRead
                                        )}>
                                            {getIcon(notification.type)}
                                        </div>
                                        <div className={styles.textContent}>
                                            <div className={styles.titleRow}>
                                                <p className={cn(styles.title, !notification.isRead ? "" : styles.titleRead)}>
                                                    {notification.title}
                                                </p>
                                                <span className={styles.time}>
                                                    {notification.createdAt && !isNaN(new Date(notification.createdAt).getTime())
                                                        ? formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })
                                                        : 'N/A'}
                                                </span>
                                            </div>
                                            <p className={styles.message}>
                                                {notification.message}
                                            </p>
                                        </div>
                                        <div className={styles.actions}>
                                            {!notification.isRead && (
                                                <div className={styles.unreadDot} />
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className={styles.deleteButton}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteNotification(notification.id);
                                                }}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                </DropdownMenuItem>
                            ))}
                        </div>
                    )}
                </ScrollArea>
                <DropdownMenuSeparator className="bg-border/40" />
                <div className={styles.viewAllContainer}>
                    <Link to={getMessagesLink()} onClick={() => setIsOpen(false)}>
                        <Button variant="outline" className={styles.viewAllButton}>
                            View All Notifications
                            <Sparkles className={styles.sparkles} />
                        </Button>
                    </Link>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
