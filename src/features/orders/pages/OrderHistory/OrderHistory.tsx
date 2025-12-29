import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useOrderNotifications } from "@/hooks/useOrderNotifications";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Separator } from "@/components/ui/Separator";
import { Progress } from "@/components/ui/Progress";
import { toast } from "@/hooks/use-toast";
import {
  Package,
  Calendar,
  MapPin,
  CreditCard,
  XCircle,
  Truck,
  CheckCircle,
  Clock,
  Download,
  Eye,
  ShoppingBag
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { OrderCancellationReasonDialog } from "@/features/orders/components/OrderCancellationReasonDialog";
import { generateInvoicePDF } from "@/utils/invoiceGenerator";

interface Order {
  id: string;
  order_number: string;
  created_at: string;
  total: number;
  order_status: string;
  payment_status: string;
  payment_method: string;
  items: any;
  shipping_address: string;
  shipping_city: string;
  shipping_pincode: string;
  customer_name: string;
  customer_phone: string;
  tracking_updates?: any;
  tracking_number?: string;
}

export default function OrderHistory() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | undefined>(undefined);

  useOrderNotifications(userId);
  const [user, setUser] = useState<any>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedOrderAmount, setSelectedOrderAmount] = useState(0);
  const [selectedOrderNumber, setSelectedOrderNumber] = useState("");
  const [selectedOrderIsPrepaid, setSelectedOrderIsPrepaid] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    checkUserAndLoadOrders();
  }, [currentPage]);

  const checkUserAndLoadOrders = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to view your orders",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    setUser(user);
    setUserId(user.id);
    await loadOrders(user.id);
  };

  const loadOrders = async (userId: string) => {
    try {
      setLoading(true);
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await supabase
        .from("orders")
        .select("*", { count: "exact" })
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      setOrders(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error("Error loading orders:", error);
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = (order: Order) => {
    setSelectedOrderId(order.id);
    setSelectedOrderAmount(order.total);
    setSelectedOrderNumber(order.order_number);
    setSelectedOrderIsPrepaid(order.payment_status === "paid");
    setCancelDialogOpen(true);
  };

  const cancelOrder = async (reason: string, comments: string) => {
    if (!selectedOrderId || !user) return;

    try {
      // First, get the order details to find seller IDs
      const { data: orderData, error: fetchError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", selectedOrderId)
        .single();

      if (fetchError) throw fetchError;

      const fullReason = comments ? `${reason}: ${comments}` : reason;

      const cancellationData = {
        order_status: "cancelled",
        payment_status: selectedOrderIsPrepaid ? "refunded" : "cancelled",
        notes: JSON.stringify({
          cancellation_reason: reason,
          cancellation_comments: comments,
          cancelled_at: new Date().toISOString()
        })
      };

      const { error } = await supabase
        .from("orders")
        .update(cancellationData)
        .eq("id", selectedOrderId)
        .eq("order_status", "pending");

      if (error) throw error;

      // Create notification for the user (buyer)
      await supabase.from("notifications" as any).insert({
        user_id: user.id,
        title: "Order Cancelled",
        message: `Your order #${selectedOrderNumber} has been cancelled. Reason: ${fullReason}`,
        type: "order_cancelled",
        link: `/orders/${selectedOrderId}`,
        is_read: false
      });

      // Get unique seller IDs from items
      const items = Array.isArray(orderData.items) ? orderData.items : [];
      const sellerIds = [...new Set(items.map((item: any) => item.sellerId).filter(Boolean))] as string[];

      // Create notifications for each seller
      for (const sellerId of sellerIds) {
        await supabase.from("notifications" as any).insert({
          user_id: sellerId,
          title: "Order Cancelled by Customer",
          message: `Order #${selectedOrderNumber} has been cancelled by the customer. Reason: ${fullReason}`,
          type: "order_cancelled",
          link: `/seller/orders/${selectedOrderId}`,
          is_read: false,
          metadata: { order_id: selectedOrderId, reason, comments }
        });
      }

      // Create notification for admin (get admin user IDs)
      const { data: adminRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      for (const admin of (adminRoles || [])) {
        await supabase.from("notifications" as any).insert({
          user_id: admin.user_id,
          title: "Order Cancelled",
          message: `Order #${selectedOrderNumber} cancelled by customer. Reason: ${fullReason}`,
          type: "order_cancelled",
          link: `/admin/orders/${selectedOrderId}`,
          is_read: false,
          metadata: { order_id: selectedOrderId, reason, comments }
        });
      }

      toast({
        title: "Order Cancelled",
        description: selectedOrderIsPrepaid
          ? `Your order has been cancelled. Refund of ₹${selectedOrderAmount} will be processed within 3-5 business days.`
          : "Your order has been cancelled successfully.",
      });

      setCancelDialogOpen(false);
      setSelectedOrderId(null);

      await loadOrders(user.id);
    } catch (error) {
      console.error("Error cancelling order:", error);
      toast({
        title: "Error",
        description: "Failed to cancel order. Please try again or contact support.",
        variant: "destructive",
      });
    }
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { color: string; icon: any; label: string; progress: number }> = {
      pending: { color: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/30 dark:text-yellow-400', icon: Clock, label: 'Order Pending', progress: 15 },
      confirmed: { color: 'bg-blue-500/10 text-blue-700 border-blue-500/30 dark:text-blue-400', icon: CheckCircle, label: 'Confirmed', progress: 40 },
      packed: { color: 'bg-purple-500/10 text-purple-700 border-purple-500/30 dark:text-purple-400', icon: Package, label: 'Packed', progress: 60 },
      shipped: { color: 'bg-indigo-500/10 text-indigo-700 border-indigo-500/30 dark:text-indigo-400', icon: Truck, label: 'Shipped', progress: 80 },
      delivered: { color: 'bg-green-500/10 text-green-700 border-green-500/30 dark:text-green-400', icon: CheckCircle, label: 'Delivered', progress: 100 },
      cancelled: { color: 'bg-red-500/10 text-red-700 border-red-500/30 dark:text-red-400', icon: XCircle, label: 'Cancelled', progress: 0 },
    };
    return configs[status] || configs.pending;
  };

  const handleDownloadInvoice = async (order: Order) => {
    toast({ title: "Generating Invoice...", description: "Please wait..." });

    try {
      const items = Array.isArray(order.items) ? order.items : [];

      // Calculate subtotal from actual product prices
      const itemsTotal = items.reduce((sum: number, item: any) =>
        sum + ((item.price || 0) * (item.quantity || 1)), 0
      );

      // Get values from database
      const actualTotal = order.total || 0;
      const shippingCharge = (order as any).shipping_charge || 0;

      // Calculate: subtotal = items total, tax = total - subtotal - shipping
      const subtotal = itemsTotal;
      const tax = Math.max(0, actualTotal - subtotal - shippingCharge);

      const invoiceItems = items.map((item: any) => ({
        title: item.title || "Product",
        quantity: item.quantity || 1,
        price: item.price || 0,
        colorName: item.colorName || item.color || "",
        size: item.size || ""
      }));

      await generateInvoicePDF({
        orderNumber: order.order_number || "N/A",
        orderDate: order.created_at ? format(new Date(order.created_at), 'MMMM dd, yyyy') : new Date().toDateString(),
        customerName: order.customer_name || "Customer",
        customerEmail: "",
        customerPhone: order.customer_phone || "N/A",
        shippingAddress: order.shipping_address || "N/A",
        shippingCity: order.shipping_city || "",
        shippingPincode: order.shipping_pincode || "",
        items: invoiceItems,
        subtotal: subtotal,
        tax: tax,
        shipping: shippingCharge,
        total: actualTotal,
        paymentMethod: order.payment_method || 'N/A',
        paymentStatus: order.payment_status || 'pending',
      });

      toast({ title: "Invoice Downloaded", description: `Invoice_${order.order_number}.pdf` });
    } catch (error) {
      console.error("Invoice generation error:", error);
      toast({ title: "Error", description: "Failed to generate invoice", variant: "destructive" });
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground animate-pulse mb-3" />
          <p className="text-muted-foreground">Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="container max-w-4xl mx-auto py-16 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
            <Package className="h-12 w-12 text-primary" />
          </div>
          <h1 className="responsive-h1 mb-3">No orders yet</h1>
          <p className="responsive-body text-muted-foreground mb-8">Start your shopping journey and your orders will appear here</p>
          <Button onClick={() => navigate("/products")} size="lg" className="shadow-lg responsive-button">
            <ShoppingBag className="h-5 w-5 mr-2" />
            Browse products
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <OrderCancellationReasonDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        onConfirm={cancelOrder}
        orderNumber={selectedOrderNumber}
        orderAmount={selectedOrderAmount}
        isPrepaid={selectedOrderIsPrepaid}
      />
      <div className="container max-w-6xl mx-auto py-6 sm:py-10 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="responsive-h1 mb-2 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            My orders
          </h1>
          <p className="responsive-body text-muted-foreground">Track, manage and review your orders</p>
        </div>

        {/* Orders List */}
        <div className="space-y-6">
          {orders.map((order) => {
            const statusConfig = getStatusConfig(order.order_status);
            const StatusIcon = statusConfig.icon;
            const items = Array.isArray(order.items) ? order.items : [];

            return (
              <Card key={order.id} className="overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border-2">
                <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/30 border-b">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="responsive-h4">#{order.order_number}</CardTitle>
                        <Badge className={cn(statusConfig.color, "responsive-label")}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 responsive-small text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(order.created_at), "PPP")}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => navigate(`/orders/${order.id}`)} className="responsive-button">
                        <Eye className="h-4 w-4 mr-2" />
                        View details
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDownloadInvoice(order)} className="responsive-button">
                        <Download className="h-4 w-4 mr-2" />
                        Invoice
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6 space-y-6">
                  {/* Order Progress */}
                  {order.order_status !== 'cancelled' && (
                    <div className="space-y-2">
                      <div className="flex justify-between responsive-small">
                        <span className="text-muted-foreground">Order progress</span>
                        <span className="font-semibold">{statusConfig.progress}%</span>
                      </div>
                      <Progress value={statusConfig.progress} className="h-2" />
                    </div>
                  )}

                  {/* Order Items */}
                  <div>
                    <h3 className="responsive-h4 mb-3 flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Items ({items.length})
                    </h3>
                    <div className="grid gap-4">
                      {items.slice(0, 3).map((item: any, idx: number) => (
                        <div key={idx} className="flex gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg border overflow-hidden bg-muted flex-shrink-0">
                            <img
                              src={item.image || '/placeholder-product.jpg'}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="responsive-body font-semibold line-clamp-1">{item.title}</p>
                            <p className="responsive-small text-muted-foreground mt-1">
                              {item.colorName && <span>{item.colorName}</span>}
                              {item.colorName && item.size && <span> • </span>}
                              {item.size && <span>Size: {item.size}</span>}
                              <span> • Qty: {item.quantity}</span>
                            </p>
                            <p className="responsive-body font-bold mt-2 text-primary">₹{(item.price * item.quantity).toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                      {items.length > 3 && (
                        <p className="text-sm text-muted-foreground text-center py-2">
                          +{items.length - 3} more item{items.length - 3 > 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Shipping & Payment Info */}
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <h3 className="responsive-label flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Delivery address
                      </h3>
                      <div className="responsive-small text-muted-foreground bg-muted/30 p-3 rounded-lg">
                        <p className="responsive-body font-semibold text-foreground">{order.customer_name}</p>
                        <p>{order.shipping_address}</p>
                        <p>{order.shipping_city}, {order.shipping_pincode}</p>
                        <p className="mt-1">{order.customer_phone}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="responsive-label flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Payment details
                      </h3>
                      <div className="responsive-small bg-muted/30 p-3 rounded-lg space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Method:</span>
                          <span className="font-medium capitalize">
                            {order.payment_method === "upi" ? "UPI" :
                              order.payment_method === "qr" ? "QR Code" :
                                order.payment_method === "cod" ? "Cash on Delivery" :
                                  order.payment_method}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status:</span>
                          <Badge variant={order.payment_status === "paid" ? "default" : "secondary"} className="text-xs">
                            {order.payment_status}
                          </Badge>
                        </div>
                        {order.tracking_number && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Tracking:</span>
                            <span className="font-mono text-xs">{order.tracking_number}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Total and Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1">
                      <p className="responsive-small text-muted-foreground">Total amount</p>
                      <p className="responsive-h1 text-primary">₹{order.total.toLocaleString()}</p>
                    </div>

                    {order.order_status === "pending" && (
                      <Button
                        variant="destructive"
                        onClick={() => handleCancelClick(order)}
                        size="lg"
                        className="responsive-button"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Cancel order
                      </Button>
                    )}

                    {order.order_status === "delivered" && (
                      <Button variant="outline" size="lg" className="responsive-button">
                        <Package className="h-4 w-4 mr-2" />
                        Re-order items
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-8 mt-8 border-t border-border/40">
            <p className="responsive-small text-muted-foreground font-medium">
              Showing <span className="text-foreground font-semibold">{(currentPage - 1) * pageSize + 1}</span> to <span className="text-foreground font-semibold">{Math.min(currentPage * pageSize, totalCount)}</span> of <span className="text-foreground font-semibold">{totalCount}</span> orders
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="rounded-xl h-10 px-4 font-bold active:scale-95 transition-all text-xs"
              >
                Previous
              </Button>
              <div className="flex items-center gap-1 mx-2">
                {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                  const pageNum = i + 1;
                  const isActive = pageNum === currentPage;
                  return (
                    <Button
                      key={pageNum}
                      variant={isActive ? "default" : "ghost"}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      className={cn(
                        "h-10 w-10 rounded-xl font-bold transition-all text-xs",
                        isActive ? "bg-[#146B6B] text-white shadow-lg shadow-[#146B6B]/20 scale-105" : "hover:bg-[#146B6B]/10 text-muted-foreground hover:text-[#146B6B]"
                      )}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="rounded-xl h-10 px-4 font-bold active:scale-95 transition-all text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
