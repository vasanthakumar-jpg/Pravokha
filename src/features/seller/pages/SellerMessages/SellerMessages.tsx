import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/Collapsible";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate } from "react-router-dom";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Search,
  Filter,
  Check,
  Bell,
  ShoppingBag,
  MessageSquare,
  AlertTriangle,
  Info,
  Trash2,
  ChevronDown,
  ChevronUp,
  Package,
  MapPin,
  CreditCard,
  User,
  Phone,
  Mail,
  ArrowRight
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Separator } from "@/components/ui/Separator";

export default function SellerMessages() {
  const { notifications, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [orderDetails, setOrderDetails] = useState<Record<string, any>>({});
  const [loadingOrders, setLoadingOrders] = useState<Set<string>>(new Set());

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

  const extractOrderIdFromLink = (link: string | null): string | null => {
    if (!link) return null;
    // Extract order ID from links like "/seller/orders/:orderId"
    const match = link.match(/\/orders\/([a-f0-9-]+)/);
    return match ? match[1] : null;
  };

  const fetchOrderDetails = async (orderId: string) => {
    if (orderDetails[orderId]) return; // Already fetched

    setLoadingOrders(prev => new Set(prev).add(orderId));

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error) throw error;

      setOrderDetails(prev => ({ ...prev, [orderId]: data }));
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoadingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  const toggleOrderExpansion = async (notification: Notification) => {
    const orderId = extractOrderIdFromLink(notification.link);
    if (!orderId) return;

    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
      await fetchOrderDetails(orderId);
    }
    setExpandedOrders(newExpanded);
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

  const renderOrderDetails = (notif: Notification, orderId: string) => {
    const order = orderDetails[orderId];
    if (!order) return null;

    const items = Array.isArray(order.items) ? order.items : [];
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    const tax = Math.round(subtotal * 0.18);
    const shipping = (order as any).shipping_charge || 0;
    const total = subtotal + tax + shipping;

    return (
      <div className="mt-3 p-4 bg-background dark:bg-card shadow-xl border border-primary/20 rounded-2xl space-y-5 animate-in slide-in-from-top-4 duration-500 relative ring-8 ring-primary/5">
        {/* Order Items */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="font-bold text-xs flex items-center gap-2 text-primary uppercase tracking-widest">
              <Package className="h-4 w-4" />
              Order Items ({items.length})
            </h5>
            <Link to={`/seller/orders/${orderId}`} className="text-[10px] font-bold text-primary hover:underline uppercase tracking-tighter bg-primary/5 px-2 py-1 rounded-md">
              Full Order Details
            </Link>
          </div>
          <div className="grid gap-3">
            {items.map((item: any, idx: number) => (
              <Link
                key={idx}
                to={`/seller/orders/${orderId}`}
                className="flex gap-4 p-3 bg-muted/30 dark:bg-black/20 hover:bg-primary/5 transition-all rounded-xl border border-transparent hover:border-primary/20 group"
              >
                <div className="w-16 h-16 rounded-xl border overflow-hidden bg-background flex-shrink-0 group-hover:scale-105 transition-transform">
                  {item.image ? (
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="h-6 w-6 text-muted-foreground m-auto mt-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0 py-0.5">
                  <p className="font-bold text-sm sm:text-[15px] truncate leading-tight group-hover:text-primary transition-colors">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">
                    {item.colorName && `${item.colorName} • `}
                    {item.size && `Size: ${item.size} • `}
                    Qty: {item.quantity}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-sm font-black text-primary">₹{(item.price * item.quantity).toLocaleString()}</p>
                    <ArrowRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <Separator className="opacity-40" />

        {/* Pricing Summary */}
        <div className="grid grid-cols-2 gap-4 bg-muted/20 p-3 rounded-xl border border-border/40">
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Financial Details</p>
            <div className="flex justify-between text-xs font-medium">
              <span className="text-muted-foreground">Subtotal:</span>
              <span>₹{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs font-medium">
              <span className="text-muted-foreground">GST:</span>
              <span>₹{tax.toLocaleString()}</span>
            </div>
          </div>
          <div className="flex flex-col justify-end items-end">
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter mb-1">Total Payout</p>
            <p className="text-lg font-black text-primary leading-none">₹{total.toLocaleString()}</p>
          </div>
        </div>

        {/* Customer & Shipping Summary (Compact) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-background p-3 rounded-xl border border-border/20 shadow-sm">
          <div className="space-y-1.5">
            <h5 className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1.5">
              <User className="h-3 w-3" /> Customer Info
            </h5>
            <div className="text-[12px] leading-tight">
              <p className="font-bold truncate">{order.customer_name}</p>
              <p className="text-muted-foreground truncate opacity-70">{order.customer_email}</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <h5 className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1.5">
              <MapPin className="h-3 w-3" /> Shipping Target
            </h5>
            <div className="text-[12px] leading-tight">
              <p className="font-bold truncate opacity-80">{order.shipping_city}, {order.shipping_pincode}</p>
              <p className="text-muted-foreground truncate opacity-70 line-clamp-1">{order.shipping_address}</p>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] font-bold uppercase py-0 border-primary/20 bg-primary/5 text-primary tracking-widest">
              {order.payment_method}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-[11px] font-black uppercase tracking-tighter hover:bg-primary/10 hover:text-primary transition-all group"
            onClick={() => toggleOrderExpansion(notif)}
          >
            Close Dropdown
            <ChevronUp className="ml-1.5 h-3 w-3 group-hover:-translate-y-0.5 transition-transform" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Messages & Notifications</h1>
          <p className="text-sm text-muted-foreground italic">
            Manage your store updates, order alerts, and system messages.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {unreadCount > 0 && (
            <Button onClick={() => markAllAsRead()} variant="outline" size="sm" className="w-full sm:w-auto h-9 px-4 rounded-xl font-bold border-primary/20 hover:bg-primary hover:text-white transition-all">
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
                placeholder="Search messages..."
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
                <h3 className="text-lg font-medium">No messages found</h3>
                <p className="text-sm max-w-sm mt-1">
                  {searchQuery
                    ? "Try adjusting your search or filters to find what you're looking for."
                    : "You're all caught up! New notifications will appear here."}
                </p>
              </div>
            ) : (
              filteredNotifications.map((notification) => {
                const orderId = extractOrderIdFromLink(notification.link);
                const isExpanded = orderId ? expandedOrders.has(orderId) : false;
                const isLoading = orderId ? loadingOrders.has(orderId) : false;

                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "flex flex-col gap-2 p-4 rounded-lg transition-colors border cursor-pointer",
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
                    <div className="flex items-start gap-4">
                      <div className={cn("mt-1 p-2 rounded-full bg-background border shadow-sm")}>
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 mb-1">
                          <h4 className={cn("text-sm font-medium", !notification.is_read && "font-semibold text-foreground")}>
                            {notification.title}
                          </h4>
                          <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {notification.message}
                        </p>
                        {notification.link && orderId && (
                          <Button
                            variant="link"
                            className="h-auto p-0 text-xs mt-2 gap-1"
                            onClick={() => toggleOrderExpansion(notification)}
                          >
                            {isExpanded ? (
                              <>
                                Hide Details <ChevronUp className="h-3 w-3" />
                              </>
                            ) : (
                              <>
                                View Details <ChevronDown className="h-3 w-3" />
                              </>
                            )}
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

                    {/* Expandable Order Details */}
                    {orderId && isExpanded && (
                      isLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                      ) : (
                        renderOrderDetails(notification, orderId)
                      )
                    )}
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
