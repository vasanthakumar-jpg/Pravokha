import * as React from "react";
import { Bell, Check, Info, AlertTriangle, ShoppingBag, MessageSquare, Trash2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function NotificationDropdown() {
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
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    navigate(getMessagesLink());
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-xl hover:bg-primary/10 dark:hover:bg-primary/20 group transition-all duration-300">
          <Bell className={cn("h-5 w-5 transition-transform group-hover:rotate-12 dark:text-white", unreadCount > 0 && "text-primary dark:text-primary")} />
          {unreadCount > 0 && (
            <>
              {/* Premium Pulse Effect */}
              <span className="absolute top-2 right-2 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </span>
              <span className="absolute -top-1 -right-1 h-5 min-w-[1.25rem] px-1 flex items-center justify-center text-[10px] font-black text-white bg-primary rounded-full border-2 border-background shadow-lg shadow-primary/20 animate-in zoom-in duration-500">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[calc(100vw-2rem)] sm:w-96 p-2 rounded-[24px] border-border/40 bg-card/95 backdrop-blur-xl shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500">
        <DropdownMenuLabel className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-black italic tracking-tighter">Alert Pulse</span>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-3 text-[10px] font-black italic tracking-widest text-muted-foreground/60 hover:text-primary hover:bg-primary/5 rounded-full"
                onClick={() => markAllAsRead()}
              >
                Clear Unread
              </Button>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border/40" />
        <ScrollArea className="h-[350px] sm:h-[450px] pr-2">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-center gap-3">
              <div className="h-16 w-16 rounded-3xl bg-muted/20 flex items-center justify-center opacity-30">
                <Bell className="h-8 w-8" />
              </div>
              <p className="text-xs font-black italic tracking-widest text-muted-foreground/40">Pure Silence</p>
            </div>
          ) : (
            <div className="space-y-1 mt-2 px-1">
              {notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={cn(
                    "flex flex-col items-start gap-1 p-4 cursor-pointer rounded-2xl focus:bg-primary/5 group transition-all duration-300 relative",
                    !notification.is_read && "bg-primary/[0.03] border-l-2 border-primary"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-4 w-full">
                    <div className={cn(
                      "mt-1 h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110",
                      !notification.is_read ? "bg-primary/10" : "bg-muted/30"
                    )}>
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={cn("text-xs font-bold capitalize tracking-tight truncate", !notification.is_read ? "text-foreground" : "text-muted-foreground/60")}>
                          {notification.title}
                        </p>
                        <span className="text-[9px] font-bold text-muted-foreground/40 whitespace-nowrap">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-[11px] font-medium text-muted-foreground/70 line-clamp-2 leading-relaxed">
                        {notification.message}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      {!notification.is_read && (
                        <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg text-muted-foreground/30 hover:text-rose-500 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-all"
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
        <div className="p-2">
          <Link to={getMessagesLink()} onClick={() => setIsOpen(false)}>
            <Button variant="outline" className="w-full h-11 rounded-xl font-bold italic tracking-tight text-xs border-primary/20 bg-primary/5 hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 text-primary flex items-center justify-center gap-2 group">
              View All Notifications
              <Sparkles className="h-3 w-3 opacity-50 group-hover:opacity-100 group-hover:animate-pulse" />
            </Button>
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

