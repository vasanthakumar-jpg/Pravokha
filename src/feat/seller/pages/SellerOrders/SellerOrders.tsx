import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/core/context/AuthContext";
import { apiClient } from "@/infra/api/apiClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/ui/Card";
import { Button } from "@/ui/Button";
import { Badge } from "@/ui/Badge";
import { Separator } from "@/ui/Separator";
import { toast } from "@/shared/hook/use-toast";
import {
  Package,
  Calendar,
  MapPin,
  CreditCard,
  ArrowLeft,
  Truck,
  Phone,
  Mail,
  User,
  Search,
  Filter
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Input } from "@/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/Select";

interface OrderItem {
  productId: string;
  variantId: string;
  title: string;
  colorName: string;
  size: string;
  price: number;
  quantity: number;
  image: string;
  sellerId: string;
}

interface Order {
  id: string;
  order_number: string;
  created_at: string;
  total: number;
  order_status: string;
  payment_status: string;
  payment_method: string;
  items: OrderItem[];
  shipping_address: any;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
}

export default function SellerOrders() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (user) {
      loadSellerOrders();
    }
  }, [user, currentPage, statusFilter, searchTerm]);

  const loadSellerOrders = async () => {
    try {
      setLoading(true);

      const params: any = {
        page: currentPage,
        limit: pageSize
      };

      if (statusFilter !== "all") {
        params.status = statusFilter.toUpperCase();
      }

      if (searchTerm) {
        params.search = searchTerm;
      }

      const response = await apiClient.get("/orders", { params });

      if (response.data.success) {
        const orders = (response.data.data || response.data.orders || []);
        // Transform to match component's expected interface
        const transformedOrders = orders.map((order: any) => ({
          id: order.id,
          order_number: order.orderNumber,
          created_at: order.createdAt,
          total: order.total,
          order_status: order.status,
          payment_status: order.paymentStatus,
          payment_method: order.paymentMethod,
          items: order.items || [],
          shipping_address: order.shippingAddress,
          customer_name: order.customerName,
          customer_email: order.customerEmail,
          customer_phone: order.customerPhone,
        }));
        setOrders(transformedOrders);
        setTotalCount(response.data.meta?.total || response.data.total || orders.length);
      }
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

  const totalPages = Math.ceil(totalCount / pageSize);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 animate-pulse">
        <header className="bg-white border-b h-20 flex items-center">
          <div className="container max-w-7xl mx-auto px-4 sm:px-8 flex items-center gap-4">
            <div className="h-8 w-48 bg-muted rounded-xl" />
          </div>
        </header>
        <main className="container max-w-7xl mx-auto py-8 px-4 sm:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="h-11 flex-1 bg-muted/60 rounded-xl" />
            <div className="h-11 w-full sm:w-48 bg-muted/60 rounded-xl" />
          </div>

          {/* Mobile Card Skeleton */}
          <div className="grid grid-cols-1 gap-4 sm:hidden">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-48 bg-muted/20 border border-border/40 rounded-[24px] p-5 space-y-4">
                <div className="flex justify-between">
                  <div className="h-6 w-32 bg-muted/40 rounded-lg" />
                  <div className="h-6 w-16 bg-muted/40 rounded-full" />
                </div>
                <div className="h-20 bg-muted/30 rounded-xl border border-dashed" />
                <div className="flex justify-between">
                  <div className="h-8 w-20 bg-muted/40 rounded-lg" />
                  <div className="h-8 w-20 bg-muted/40 rounded-lg" />
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table Skeleton */}
          <div className="hidden sm:block rounded-[24px] border border-border/40 overflow-hidden bg-white/50 backdrop-blur-sm">
            <div className="h-14 bg-muted/20 border-b border-border/40" />
            <div className="space-y-0">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="flex gap-6 items-center p-6 border-b border-border/20 last:border-0 h-20">
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-24 bg-muted/40 rounded" />
                    <div className="h-3 w-16 bg-muted/20 rounded" />
                  </div>
                  <div className="h-4 w-24 bg-muted/40 rounded" />
                  <div className="h-4 w-20 bg-muted/40 rounded" />
                  <div className="h-7 w-24 bg-muted/40 rounded-full" />
                  <div className="h-7 w-16 bg-muted/40 rounded-full" />
                  <div className="h-8 w-20 bg-muted/40 rounded-lg ml-auto" />
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/seller")} className="-ml-2">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
                <p className="text-sm text-muted-foreground">Manage your product orders</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by Order ID or Customer Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px] bg-white">
              <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {orders.length === 0 ? (
          <Card className="rounded-[32px] border-dashed bg-card/40 backdrop-blur-xl">
            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              <div className="bg-primary/5 p-6 rounded-full mb-6">
                <Package className="h-10 w-10 text-primary opacity-40" />
              </div>
              <h3 className="text-xl font-bold mb-2">No orders found</h3>
              <p className="text-muted-foreground max-w-sm">
                {searchTerm || statusFilter !== 'all'
                  ? "Try adjusting your filters to see more results."
                  : "You haven't received any orders for your products yet."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Mobile Cards View */}
            <div className="block sm:hidden space-y-4">
              {orders.map((order) => (
                <Card key={order.id} className="rounded-[24px] overflow-hidden border-border/40 bg-white/50 backdrop-blur-sm shadow-sm">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{format(new Date(order.created_at), "MMM dd, yyyy")}</p>
                        <h3 className="font-bold text-gray-900 tracking-tight">#{order.order_number}</h3>
                      </div>
                      <Badge className={cn("px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider", getStatusColor(order.order_status))}>
                        {order.order_status}
                      </Badge>
                    </div>

                    <div className="flex justify-between items-center py-2 border-y border-dashed border-border/60">
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Items</p>
                        <p className="font-bold text-sm">{order.items.length} Product{order.items.length !== 1 ? 's' : ''}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total</p>
                        <p className="font-bold text-lg text-primary">₹{order.total.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-1">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Status</p>
                        <Badge variant="outline" className={cn("text-[10px] font-bold", order.payment_status === 'paid' ? "text-emerald-600 border-emerald-500/20 bg-emerald-50" : "text-amber-600 border-amber-500/20 bg-amber-50")}>
                          {order.payment_status === 'paid' ? 'Paid' : 'Pending'}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="h-9 rounded-xl border-border/60 text-[11px] font-bold px-3">
                          Invoice
                        </Button>
                        <Button size="sm" className="h-9 rounded-xl bg-[#146B6B] hover:bg-[#0E4D4D] text-white text-[11px] font-bold px-3">
                          Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Desktop Table View */}
            <Card className="hidden sm:block rounded-[24px] border-border/40 overflow-hidden bg-white/50 backdrop-blur-sm shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border/40">
                      <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Order Details</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Date</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Status</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Payment</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-muted/10 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900">#{order.order_number}</span>
                            <span className="text-[10px] text-muted-foreground font-medium">{order.items.length} Items</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-gray-600">{format(new Date(order.created_at), "MMM dd, yyyy")}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-primary text-sm">₹{order.total.toLocaleString()}</span>
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={cn("px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider", getStatusColor(order.order_status))}>
                            {order.order_status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className={cn("text-[10px] font-bold", order.payment_status === 'paid' ? "text-emerald-600 border-emerald-500/20 bg-emerald-50" : "text-amber-600 border-amber-500/20 bg-amber-50")}>
                            {order.payment_status === 'paid' ? 'Paid' : 'Pending'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-white shadow-sm border border-border/20">
                              <Search className="h-4 w-4 text-muted-foreground" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-white shadow-sm border border-border/20">
                              <Truck className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-8 border-t border-border/40">
                <p className="text-sm text-muted-foreground font-medium">
                  Showing <span className="text-foreground font-bold">{(currentPage - 1) * pageSize + 1}</span> to <span className="text-foreground font-bold">{Math.min(currentPage * pageSize, totalCount)}</span> of <span className="text-foreground font-bold">{totalCount}</span> orders
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
        )}
      </main>
    </div>
  );
}
