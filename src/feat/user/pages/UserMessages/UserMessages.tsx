import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/Card";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/Tabs";
import { useNotifications, Notification } from "@/shared/hook/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Search, Filter, Check, Bell, ShoppingBag, MessageSquare, AlertTriangle, Info, Trash2, ArrowRight } from "lucide-react";
import { Badge } from "@/ui/Badge";
import { useNavigate } from "react-router-dom";

export default function UserMessages() {
  const { notifications, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const navigate = useNavigate();

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'order':
      case 'order_cancelled':
        return <ShoppingBag className="h-5 w-5 text-blue-500" />;
      case 'message':
        return <MessageSquare className="h-5 w-5 text-green-500" />;
      case 'alert':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch =
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === "all") return true;
    if (activeTab === "unread") return !notification.is_read;
    if (activeTab === "orders") return notification.type === 'order' || notification.type === 'order_cancelled';
    if (activeTab === "system") return notification.type === 'system' || notification.type === 'alert';

    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read if unread
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    // Navigate based on type/metadata
    if (notification.metadata?.order_id) {
      navigate(`/orders/${notification.metadata.order_id}`);
    } else if (notification.type === 'order' || notification.type === 'order_cancelled') {
      // Fallback if metadata is missing (though it shouldn't be for new ones)
      // Check if message contains order number or similar if needed, 
      // but for now assume metadata is the source of truth.
      // If we have a link property, use that.
      if (notification.link) {
        navigate(notification.link);
      }
    }
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">My Notifications</h1>
          <p className="text-muted-foreground mt-1">
            Stay updated with your orders and support messages.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button onClick={() => markAllAsRead()} variant="outline" size="sm">
              <Check className="mr-2 h-4 w-4" /> Mark all as read
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
              <TabsList className="grid w-full grid-cols-4 sm:w-auto">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="unread">
                  Unread
                  {unreadCount > 0 && (
                    <Badge variant="secondary" className="ml-2 h-5 px-1.5 min-w-[1.25rem]">
                      {unreadCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="orders">Orders</TabsTrigger>
                <TabsTrigger value="system">System</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notifications..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <div className="bg-muted/50 p-4 rounded-full mb-4">
                  <Bell className="h-8 w-8 opacity-50" />
                </div>
                <h3 className="text-lg font-medium">No notifications found</h3>
                <p className="text-sm max-w-sm mt-1">
                  {searchQuery
                    ? "Try adjusting your search or filters to find what you're looking for."
                    : "You're all caught up! New notifications will appear here."}
                </p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "group flex items-start gap-4 p-4 rounded-lg transition-all border cursor-pointer",
                    !notification.is_read
                      ? "bg-primary/5 border-primary/20 hover:bg-primary/10"
                      : "border-transparent hover:bg-muted/50 hover:border-muted/50"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className={cn("mt-1 p-2 rounded-full bg-background border shadow-sm shrink-0")}>
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 mb-1">
                      <h4 className={cn("text-sm font-medium pr-8 sm:pr-0", !notification.is_read && "font-semibold text-foreground")}>
                        {notification.title}
                      </h4>
                      <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {notification.message}
                    </p>

                    <div className="flex items-center gap-4 mt-2">
                      {(notification.metadata?.order_id || notification.link) && (
                        <Button
                          variant="link"
                          className="h-auto p-0 text-xs font-semibold text-primary group-hover:underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNotificationClick(notification);
                          }}
                        >
                          View Details <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    {!notification.is_read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary z-10"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                        title="Mark as read"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive z-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
