import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/Card";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/Tabs";
import { useNotifications, Notification } from "@/shared/hook/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Search, Filter, Check, Bell, ShoppingBag, MessageSquare, AlertTriangle, Info, Trash2, ArrowLeft } from "lucide-react";
import { Badge } from "@/ui/Badge";
import { AdminHeaderSkeleton, AdminTableSkeleton } from "@/feat/admin/components/AdminSkeleton";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "@/core/context/AdminContext";

export default function AdminMessages() {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const { notifications, markAsRead, markAllAsRead, deleteNotification, loading } = useNotifications();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // CRITICAL: Authentication check to prevent unauthorized access
  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate("/auth");
    }
  }, [isAdmin, adminLoading, navigate]);

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'order':
        return <ShoppingBag className="h-5 w-5 text-blue-500" />;
      case 'order_cancelled':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
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

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 flex flex-col gap-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-xl border-border/60 bg-card gap-2 font-medium text-xs w-fit justify-start shadow-sm"
              onClick={() => navigate("/admin")}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Messages & Notifications</h1>
              <p className="text-xs sm:text-base text-muted-foreground mt-1">Platform communications</p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {unreadCount > 0 && (
              <Button
                onClick={() => markAllAsRead()}
                variant="outline"
                className="flex-1 sm:flex-none h-10 rounded-xl border-border/60 bg-card font-medium text-xs shadow-sm"
              >
                <Check className="mr-2 h-4 w-4" /> Mark all as read
              </Button>
            )}
          </div>
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
                placeholder="Search messages..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <AdminTableSkeleton />
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-1"
              >
                {filteredNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                    <div className="bg-muted/50 p-4 rounded-full mb-4">
                      <Bell className="h-8 w-8 opacity-50" />
                    </div>
                    <h3 className="text-lg font-medium">No messages found</h3>
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
                        "flex items-start gap-4 p-4 rounded-lg transition-colors border cursor-pointer",
                        !notification.is_read
                          ? "bg-primary/5 border-primary/20 hover:bg-primary/10"
                          : "border-transparent hover:bg-muted/50 hover:border-muted"
                      )}
                      onClick={() => {
                        if (!notification.is_read) {
                          markAsRead(notification.id);
                        }
                      }}
                    >
                      <div className={cn("mt-1 p-2 rounded-full bg-background border shadow-sm")}>
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 mb-1">
                          <h4 className={cn("text-sm font-medium", !notification.is_read && "font-semibold text-foreground")}>
                            {notification.title}
                          </h4>
                          <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                            {(() => {
                              try {
                                const date = new Date(notification.created_at || notification.createdAt);
                                if (isNaN(date.getTime())) return "Recently";
                                return formatDistanceToNow(date, { addSuffix: true });
                              } catch (e) {
                                return "Recently";
                              }
                            })()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {notification.message}
                        </p>
                        {notification.link && (
                          <Button
                            variant="link"
                            className="h-auto p-0 text-xs mt-2 font-bold text-primary hover:text-primary/80 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(notification.link);
                            }}
                          >
                            View Details
                          </Button>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        {!notification.is_read && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            onClick={() => markAsRead(notification.id)}
                            title="Mark as read"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteNotification(notification.id)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
