import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "@/core/context/AdminContext";
import { useAuth } from "@/core/context/AuthContext";
import { apiClient } from "@/infra/api/apiClient";
import { AdminSkeleton } from "@/feat/admin/components/AdminSkeleton";

import { Card, CardContent, CardHeader, CardTitle } from "@/ui/Card";
import { Button } from "@/ui/Button";
import { Badge } from "@/ui/Badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/Select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/ui/Sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/ui/AlertDialog";
import { toast } from "@/shared/hook/use-toast";
import { ArrowLeft, Package, Truck, MapPin, Calendar, CreditCard, User, Trash2, RotateCcw, XCircle } from "lucide-react";
import { format } from "date-fns";

interface Order {
  id: string;
  order_number: string;
  created_at: string;
  total: number;
  order_status: string;
  payment_status: string;
  customer_name: string;
  customer_email: string;
  shipping_address: any;
  items: any[];
  payment_method: string;
}

export default function AdminOrders() {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Delete and Cancel dialogs
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate("/auth");
      return;
    }
    if (isAdmin) {
      loadOrders();
    }
  }, [isAdmin, adminLoading, navigate]);

  const mapOrderData = (apiOrder: any): Order => ({
    id: apiOrder.id,
    order_number: apiOrder.order_number || apiOrder.orderNumber || apiOrder.id?.slice(0, 8),
    created_at: apiOrder.created_at || apiOrder.createdAt || new Date().toISOString(),
    total: apiOrder.total || 0,
    order_status: (apiOrder.order_status || apiOrder.status || 'pending').toLowerCase(),
    payment_status: (apiOrder.payment_status || apiOrder.paymentStatus || 'pending').toLowerCase(),
    customer_name: apiOrder.customer_name || apiOrder.customerName || "N/A",
    customer_email: apiOrder.customer_email || apiOrder.customerEmail || "N/A",
    shipping_address: {
      address_line1: apiOrder.shipping_address || apiOrder.shippingAddress || "",
      city: apiOrder.shipping_city || apiOrder.shippingCity || "",
      pincode: apiOrder.shipping_pincode || apiOrder.shippingPincode || "",
      state: "",
      country: "India"
    },
    items: apiOrder.items || [],
    payment_method: apiOrder.payment_method || apiOrder.paymentMethod || "Online"
  });

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/orders");

      if (response.data.success) {
        const transformedOrders = (response.data.data || []).map(mapOrderData);
        setOrders(transformedOrders);
      }
    } catch (error) {
      console.error("Error loading orders:", error);
      toast({
        title: "Error",
        description: "Failed to load orders from backend",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const trackingUpdate = {
        status: newStatus,
        timestamp: new Date().toISOString(),
        message: `Order ${newStatus}`,
      };

      const response = await apiClient.patch(`/orders/${orderId}/status`, {
        status: newStatus.toUpperCase(),
        trackingUpdates: [trackingUpdate]
      });

      if (response.data.success) {
        toast({
          title: "Success",
          description: "Order status updated successfully",
        });

        // Update local state
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, order_status: newStatus } : o));
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(prev => prev ? { ...prev, order_status: newStatus } : null);
        }
      }
    } catch (error) {
      console.error("Error updating order:", error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  const handleCancelClick = (order: Order) => {
    setOrderToCancel(order);
    setCancelDialogOpen(true);
  };

  const handleCancelOrder = async () => {
    if (!orderToCancel) return;

    try {
      const response = await apiClient.post(`/orders/${orderToCancel.id}/cancel`);

      if (response.data.success) {
        toast({
          title: "Order Cancelled",
          description: `Order #${orderToCancel.order_number} has been cancelled.`,
        });

        setOrders(prev => prev.map(o =>
          o.id === orderToCancel.id ? { ...o, order_status: 'cancelled' } : o
        ));
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast({
        title: "Error",
        description: "Failed to cancel order",
        variant: "destructive",
      });
    } finally {
      setCancelDialogOpen(false);
      setOrderToCancel(null);
    }
  };

  const handleDeleteClick = (order: Order) => {
    setOrderToDelete(order);
    setDeleteDialogOpen(true);
  };

  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;

    const deletedOrder = orderToDelete;

    try {
      const response = await apiClient.delete(`/orders/${deletedOrder.id}`);

      if (response.data.success) {
        // Remove from local state
        setOrders(prev => prev.filter(o => o.id !== deletedOrder.id));

        // Show toast with undo option
        toast({
          title: "Order Deleted",
          description: `Order #${deletedOrder.order_number} has been deleted. Click Undo to restore.`,
          action: (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleUndoDelete(deletedOrder.id)}
            >
              <RotateCcw className="h-3 w-3 mr-1" /> Undo
            </Button>
          ),
          duration: 10000,
        });
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      toast({
        title: "Error",
        description: "Failed to delete order",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setOrderToDelete(null);
    }
  };

  const handleUndoDelete = async (orderId: string) => {
    try {
      const response = await apiClient.post(`/orders/${orderId}/restore`);

      if (response.data.success) {
        toast({
          title: "Order Restored",
          description: "The order has been restored successfully.",
        });

        loadOrders(); // Refresh the list
      }
    } catch (error) {
      console.error('Error restoring order:', error);
      toast({
        title: "Error",
        description: "Failed to restore order",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "confirmed":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "shipped":
        return "bg-purple-500/10 text-purple-600 border-purple-500/20";
      case "delivered":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      case "cancelled":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (adminLoading || loading) {
    return <AdminSkeleton variant="table" />;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="w-full mx-auto py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-6 xl:px-8 flex flex-col gap-4 sm:gap-6 lg:gap-8 pb-6 sm:pb-8 lg:pb-10">
        <div className="flex flex-col gap-3 sm:gap-6">
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
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Order Management</h1>
                <p className="text-xs sm:text-base text-muted-foreground mt-1">
                  View and manage all orders
                </p>
              </div>
            </div>
          </div>
        </div>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Orders Yet</h3>
              <p className="text-muted-foreground">Orders will appear here once customers start purchasing</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3 sm:space-y-6">
            {orders.map((order) => (
              <Card key={order.id} className="overflow-hidden">
                <CardHeader className="bg-muted/30 p-3 sm:p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base sm:text-lg">
                          Order #{order.order_number}
                        </CardTitle>
                        <Badge variant="outline" className="text-xs font-normal">
                          {format(new Date(order.created_at), "MMM d, yyyy")}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                        <User className="h-3 w-3" /> {order.customer_name}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge className={getStatusColor(order.order_status)}>
                        {order.order_status}
                      </Badge>
                      <Badge variant={order.payment_status === 'paid' ? 'default' : 'secondary'}>
                        {order.payment_status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-3 sm:pt-6 p-3 sm:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6">
                    <div>
                      <p className="text-sm font-medium mb-1 text-muted-foreground">Total Amount</p>
                      <p className="text-xl font-bold">₹{order.total}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1 text-muted-foreground">Items</p>
                      <p className="text-sm">
                        {Array.isArray(order.items) ? order.items.length : 0} item(s)
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1 text-muted-foreground">Payment Method</p>
                      <p className="text-sm capitalize">{order.payment_method || 'N/A'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={order.order_status}
                        onValueChange={(value) => updateOrderStatus(order.id, value)}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="shipped">Shipped</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedOrder(order);
                          setIsSheetOpen(true);
                        }}
                      >
                        View Details
                      </Button>
                      {order.order_status !== 'cancelled' && order.order_status !== 'delivered' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCancelClick(order)}
                          title="Cancel Order"
                          className="text-orange-500 hover:text-orange-600 hover:bg-orange-50"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(order)}
                        title="Delete Order"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Order Details Sheet */}
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
            <SheetHeader className="mb-6">
              <SheetTitle>Order Details</SheetTitle>
              <SheetDescription>
                Order #{selectedOrder?.order_number}
              </SheetDescription>
            </SheetHeader>

            {selectedOrder && (
              <div className="space-y-6">
                {/* Status Section */}
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Order Status</p>
                    <Badge className={`mt-1 ${getStatusColor(selectedOrder.order_status)}`}>
                      {selectedOrder.order_status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Payment Status</p>
                    <Badge variant={selectedOrder.payment_status === 'paid' ? 'default' : 'secondary'} className="mt-1">
                      {selectedOrder.payment_status}
                    </Badge>
                  </div>
                </div>

                {/* Items Section */}
                <div>
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Package className="h-4 w-4" /> Order Items
                  </h3>
                  <div className="space-y-3">
                    {Array.isArray(selectedOrder.items) && selectedOrder.items.map((item: any, index: number) => (
                      <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                        <div className="h-16 w-16 bg-muted rounded overflow-hidden flex-shrink-0">
                          {item.image ? (
                            <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                          ) : (
                            <Package className="h-8 w-8 m-auto text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.title}</p>
                          <p className="text-xs text-muted-foreground">
                            Qty: {item.quantity} × ₹{item.price}
                          </p>
                          {item.selectedSize && (
                            <Badge variant="outline" className="text-[10px] mt-1 mr-1">
                              Size: {item.selectedSize}
                            </Badge>
                          )}
                          {item.selectedColor && (
                            <Badge variant="outline" className="text-[10px] mt-1">
                              Color: {item.selectedColor}
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm font-medium">
                          ₹{item.price * item.quantity}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-4 pt-4 border-t">
                    <span className="font-medium">Total Amount</span>
                    <span className="font-bold text-lg">₹{selectedOrder.total}</span>
                  </div>
                </div>

                {/* Shipping Details */}
                <div>
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Truck className="h-4 w-4" /> Shipping Details
                  </h3>
                  <div className="p-4 border rounded-lg space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">{selectedOrder.customer_name}</p>
                        <p className="text-muted-foreground">{selectedOrder.customer_email}</p>
                      </div>
                    </div>
                    {selectedOrder.shipping_address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="text-muted-foreground">
                          <p>{selectedOrder.shipping_address.address_line1}</p>
                          {selectedOrder.shipping_address.address_line2 && <p>{selectedOrder.shipping_address.address_line2}</p>}
                          <p>
                            {selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state} {selectedOrder.shipping_address.pincode}
                          </p>
                          <p>{selectedOrder.shipping_address.country}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Info */}
                <div>
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <CreditCard className="h-4 w-4" /> Payment Information
                  </h3>
                  <div className="p-4 border rounded-lg text-sm">
                    <div className="flex justify-between mb-2">
                      <span className="text-muted-foreground">Method</span>
                      <span className="capitalize">{selectedOrder.payment_method || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-muted-foreground">Transaction ID</span>
                      <span className="font-mono text-xs">{selectedOrder.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date</span>
                      <span>{format(new Date(selectedOrder.created_at), "PPP p")}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>

        {/* Cancel Confirmation Dialog */}
        <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel Order?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to cancel order <strong>#{orderToCancel?.order_number}</strong>?
                This action will notify the customer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>No, Keep Order</AlertDialogCancel>
              <AlertDialogAction onClick={handleCancelOrder} className="bg-orange-500 hover:bg-orange-600">
                Yes, Cancel Order
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Order?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete order <strong>#{orderToDelete?.order_number}</strong>?
                This will remove it from the orders list. You can undo this action within 10 seconds.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteOrder} className="bg-red-500 hover:bg-red-600">
                Delete Order
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

