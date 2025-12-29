import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/Table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/AlertDialog";
import { Search, Eye, Package, Filter, Trash2, RotateCcw, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  total: number;
  status: 'pending' | 'confirmed' | 'packed' | 'shipped' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed';
  created_at: string;
  items_count: number;
}

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  packed: { label: 'Packed', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  shipped: { label: 'Shipped', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-800 border-green-300' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800 border-red-300' },
};

const paymentStatusConfig = {
  pending: { label: 'Pending', color: 'bg-gray-100 text-gray-800' },
  paid: { label: 'Paid', color: 'bg-green-100 text-green-800' },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-800' },
};

export default function SellerOrdersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentTab, setCurrentTab] = useState<string>("all");

  // Delete functionality
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);

  // Consolidated fetch trigger with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders();
    }, 300);
    return () => clearTimeout(timer);
  }, [user, searchQuery, statusFilter, currentTab]);

  const fetchOrders = async () => {
    if (!user) return;

    try {
      setLoading(true);
      let query = (supabase as any)
        .from('orders')
        .select(`
          id,
          order_number,
          customer_name,
          customer_email,
          total,
          order_status,
          payment_status,
          created_at,
          items
        `)
        .is('deleted_at', null);

      const { data: userData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      const isAdmin = userData?.role === 'admin';

      if (!isAdmin) {
        query = query.eq('seller_id', user.id);
      }

      // Apply DB filters
      if (currentTab !== 'all') {
        query = query.eq('order_status', currentTab);
      } else if (statusFilter !== 'all') {
        query = query.eq('order_status', statusFilter);
      }

      if (searchQuery) {
        // Search in order_number or customer_email
        query = query.or(`order_number.ilike.%${searchQuery}%,customer_email.ilike.%${searchQuery}%,customer_name.ilike.%${searchQuery}%`);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      const transformedOrders: Order[] = (data || []).map((order: any) => ({
        id: order.id,
        order_number: order.order_number,
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        total: order.total,
        status: order.order_status as any,
        payment_status: order.payment_status as any,
        created_at: order.created_at,
        items_count: Array.isArray(order.items) ? order.items.length : 0,
      }));

      setOrders(transformedOrders);
      setFilteredOrders(transformedOrders); // We now use DB results directly
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };


  const handleCancelClick = (order: Order) => {
    setOrderToCancel(order);
    setCancelDialogOpen(true);
  };

  const handleCancelOrder = async () => {
    if (!orderToCancel) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({
          order_status: 'cancelled',
          notes: JSON.stringify({
            cancellation_reason: 'Cancelled by seller/admin',
            cancelled_at: new Date().toISOString()
          })
        })
        .eq('id', orderToCancel.id);

      if (error) throw error;

      toast({
        title: "Order Cancelled",
        description: `Order #${orderToCancel.order_number} has been cancelled.`,
      });

      fetchOrders();
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
      // Soft delete - set deleted_at timestamp
      const { error } = await (supabase as any)
        .from('orders')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', deletedOrder.id);

      if (error) throw error;

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
        duration: 10000, // 10 seconds to undo
      });
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
      // Restore - remove deleted_at timestamp
      const { error } = await (supabase as any)
        .from('orders')
        .update({ deleted_at: null })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Order Restored",
        description: "The order has been restored successfully.",
      });

      fetchOrders(); // Refresh the list
    } catch (error) {
      console.error('Error restoring order:', error);
      toast({
        title: "Error",
        description: "Failed to restore order",
        variant: "destructive",
      });
    }
  };

  const getOrderStats = () => {
    return {
      all: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      confirmed: orders.filter(o => o.status === 'confirmed').length,
      packed: orders.filter(o => o.status === 'packed').length,
      shipped: orders.filter(o => o.status === 'shipped').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
    };
  };

  const stats = getOrderStats();

  if (loading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className=" text-xl sm:text-2xl font-bold">Orders</h1>
          <p className="text-muted-foreground">Manage and track your orders</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.all}</div>
            <p className="text-xs text-muted-foreground">Total Orders</p>
          </CardContent>
        </Card>
        {Object.entries(statusConfig).map(([status, config]) => (
          <Card key={status}>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats[status as keyof typeof stats]}</div>
              <p className="text-xs text-muted-foreground">{config.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Object.entries(statusConfig).map(([status, config]) => (
                  <SelectItem key={status} value={status}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table with Tabs */}
      <Card>
        <CardHeader>
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 sm:grid-cols-4 md:grid-cols-7 h-auto">
              <TabsTrigger value="all" className="text-xs sm:text-sm px-2 py-2">All ({stats.all})</TabsTrigger>
              <TabsTrigger value="pending" className="text-xs sm:text-sm px-2 py-2">Pending ({stats.pending})</TabsTrigger>
              <TabsTrigger value="confirmed" className="text-xs sm:text-sm px-2 py-2">Confirmed ({stats.confirmed})</TabsTrigger>
              <TabsTrigger value="packed" className="text-xs sm:text-sm px-2 py-2">Packed ({stats.packed})</TabsTrigger>
              <TabsTrigger value="shipped" className="text-xs sm:text-sm px-2 py-2">Shipped ({stats.shipped})</TabsTrigger>
              <TabsTrigger value="delivered" className="text-xs sm:text-sm px-2 py-2">Delivered ({stats.delivered})</TabsTrigger>
              <TabsTrigger value="cancelled" className="text-xs sm:text-sm px-2 py-2">Cancelled ({stats.cancelled})</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No orders found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold text-[11px] tracking-wider">Order #</TableHead>
                  <TableHead className="font-bold text-[11px] tracking-wider">Items</TableHead>
                  <TableHead className="font-bold text-[11px] tracking-wider">Total</TableHead>
                  <TableHead className="font-bold text-[11px] tracking-wider">Status</TableHead>
                  <TableHead className="font-bold text-[11px] tracking-wider">Payment</TableHead>
                  <TableHead className="font-bold text-[11px] tracking-wider">Date</TableHead>
                  <TableHead className="font-bold text-[11px] tracking-wider text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.order_number}</TableCell>
                    <TableCell>{order.items_count}</TableCell>
                    <TableCell className="font-bold">₹{order.total.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className={statusConfig[order.status].color} variant="outline">
                        {statusConfig[order.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={paymentStatusConfig[order.payment_status].color} variant="secondary">
                        {paymentStatusConfig[order.payment_status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>{format(new Date(order.created_at), 'MMM dd, yyyy')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {order.status !== 'cancelled' && order.status !== 'delivered' && (
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
                          onClick={() => navigate(`/seller/orders/${order.id}`)}
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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
              This will remove it from your orders list. You can undo this action within 10 seconds.
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
  );
}

