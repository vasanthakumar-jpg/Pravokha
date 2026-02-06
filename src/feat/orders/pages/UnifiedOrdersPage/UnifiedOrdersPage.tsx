import { useState, useEffect } from "react";
import { useAuth } from "@/core/context/AuthContext";
import { apiClient } from "@/infra/api/apiClient";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/ui/Card";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { Badge } from "@/ui/Badge";
import { Separator } from "@/ui/Separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/Tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/ui/Table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/ui/Select";
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
import {
    Search,
    Eye,
    Package,
    Filter,
    ShoppingBag,
    Users,
    Trash2,
    Download,
    RotateCcw,
    AlertCircle,
    Truck,
    CheckCircle2,
    Clock,
    Ban,
    ArrowLeft
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { format } from "date-fns";
import { OrderCancellationReasonDialog } from "@/feat/orders/components/OrderCancellationReasonDialog";
import { toast } from "@/shared/hook/use-toast";
import { generateInvoicePDF } from "@/shared/util/invoiceGenerator";
import { NoResultsFound } from "@/feat/admin/components/NoResultsFound";

interface Order {
    id: string;
    order_number: string;
    customer_name: string;
    customer_email: string;
    customer_phone?: string;
    shipping_address?: string;
    shipping_city?: string;
    shipping_pincode?: string;
    total: number;
    subtotal?: number;
    tax?: number;
    shipping?: number;
    status: 'pending' | 'confirmed' | 'processing' | 'packed' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
    payment_status: 'unpaid' | 'processing' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';
    payment_method?: string;
    created_at: string;
    items_count: number;
    items?: any[];
}

const statusConfig = {
    pending: { label: 'Pending', icon: Clock, color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    confirmed: { label: 'Confirmed', icon: CheckCircle2, color: 'bg-blue-100 text-blue-800 border-blue-200' },
    processing: { label: 'Processing', icon: Clock, color: 'bg-orange-100 text-orange-800 border-orange-200' },
    packed: { label: 'Packed', icon: Package, color: 'bg-purple-100 text-purple-800 border-purple-200' },
    shipped: { label: 'Shipped', icon: Truck, color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    delivered: { label: 'Delivered', icon: CheckCircle2, color: 'bg-green-100 text-green-800 border-green-200' },
    cancelled: { label: 'Cancelled', icon: Ban, color: 'bg-red-100 text-red-800 border-red-200' },
    refunded: { label: 'Refunded', icon: RotateCcw, color: 'bg-orange-100 text-orange-800 border-orange-200' },
};

const paymentStatusConfig = {
    unpaid: { label: 'Unpaid', color: 'bg-gray-100 text-gray-800 border-gray-200' },
    processing: { label: 'Processing', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    paid: { label: 'Paid', color: 'bg-green-100 text-green-800 border-green-200' },
    failed: { label: 'Failed', color: 'bg-red-100 text-red-800 border-red-200' },
    refunded: { label: 'Refunded', color: 'bg-orange-100 text-orange-800 border-orange-200' },
    partially_refunded: { label: 'Partial Refund', color: 'bg-orange-50 text-orange-700 border-orange-200' },
};

export default function UnifiedOrdersPage() {
    const { user, verificationStatus } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // State
    const [myOrders, setMyOrders] = useState<Order[]>([]);
    const [filteredMyOrders, setFilteredMyOrders] = useState<Order[]>([]);
    const [platformOrders, setPlatformOrders] = useState<Order[]>([]);
    const [filteredPlatformOrders, setFilteredPlatformOrders] = useState<Order[]>([]);
    const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
    const [filteredCustomerOrders, setFilteredCustomerOrders] = useState<Order[]>([]);

    const [myOrdersCount, setMyOrdersCount] = useState(0);
    const [businessOrdersCount, setBusinessOrdersCount] = useState(0);
    const [platformOrdersCount, setPlatformOrdersCount] = useState(0);

    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const isSellerContext = location.pathname.startsWith('/seller');
    const [mainTab, setMainTab] = useState<string>(isSellerContext ? "customer-orders" : "my-orders");
    const [userRole, setUserRole] = useState<'ADMIN' | 'DEALER' | 'USER' | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);

    const isVerified = verificationStatus === 'verified' || (user as any)?.status === 'active';
    const isAdmin = userRole === 'ADMIN';

    // Dialog States
    const [cancellingOrder, setCancellingOrder] = useState<Order | null>(null);
    const [isCancellationOpen, setIsCancellationOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
    const [myOrderDeleteDialogOpen, setMyOrderDeleteDialogOpen] = useState(false);
    const [myOrderToDelete, setMyOrderToDelete] = useState<Order | null>(null);

    const [debouncedSearch, setDebouncedSearch] = useState("");

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        checkUserRole();
    }, [user]);

    useEffect(() => {
        if (user && userRole) {
            setCurrentPage(1); // Reset to first page on filter change
            fetchOrders();
        }
    }, [user, userRole, statusFilter, debouncedSearch, mainTab]);

    useEffect(() => {
        if (user && userRole) {
            fetchOrders();
        }
    }, [currentPage]);

    useEffect(() => {
        filterOrders();
    }, [myOrders, customerOrders, platformOrders, searchQuery, statusFilter, mainTab]);

    const checkUserRole = async () => {
        if (!user) return;
        if (location.pathname.startsWith('/admin')) {
            setUserRole('ADMIN');
            return;
        }
        // If the user object from AuthContext already has the role, use it.
        // Otherwise fetch it. Assuming AuthContext user might be partial or just basic info.
        // Ideally we should trust AuthContext, but let's fetch to be safe as per original logic.
        try {
            const { data } = await apiClient.get('/auth/me');
            const userData = data.user;
            const r = userData.role === 'admin' ? 'ADMIN' : (userData.role === 'seller' || userData.role === 'DEALER' ? 'DEALER' : userData.role);
            setUserRole(r);
        } catch (error) {
            console.error("Failed to fetch user role", error);
        }
    };

    const fetchOrders = async () => {
        if (!user || !userRole) return;

        try {
            setLoading(true);

            // Determine context based on tab
            let type = 'buyer'; // default
            if (mainTab === 'customer-orders') type = 'seller';
            if (mainTab === 'platform-orders') type = 'admin';

            // Use the generic orders endpoint with type parameter
            const params = {
                page: currentPage,
                limit: pageSize,
                type: type,
                search: debouncedSearch || undefined,
                status: statusFilter !== 'all' ? statusFilter : undefined
            };

            const response = await apiClient.get('/orders', { params });
            const { data, meta } = response.data;

            const mappedData = mapOrders(data);

            if (mainTab === "my-orders") {
                setMyOrders(mappedData);
                setMyOrdersCount(meta.total); // Approximate logic, ideally separate stats endpoint
            } else if (mainTab === "customer-orders") {
                setCustomerOrders(mappedData);
                setBusinessOrdersCount(meta.total);
            } else {
                setPlatformOrders(mappedData);
                setPlatformOrdersCount(meta.total);
            }

            setTotalCount(meta.total);

            // Fetch counts separately if needed to keep badges updated (optional)
            // For now, setting counts based on current fetch which is only for one tab might be inaccurate for other tabs badges.
            // But preserving original logic structure where practical.
            // Ideally call /orders/stats
            try {
                const stats = await apiClient.get('/orders/stats');
                setMyOrdersCount(stats.data.buyerCount || 0);
                setBusinessOrdersCount(stats.data.sellerCount || 0);
                setPlatformOrdersCount(stats.data.adminCount || 0);
            } catch (e) {
                console.warn("Stats fetch failed", e);
            }

        } catch (error) {
            console.error('Error fetching orders:', error);
            toast({ title: "Error", description: "Failed to load orders", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const mapOrders = (data: any[]): Order[] => {
        return (data || []).map((order: any) => ({
            ...order,
            order_number: order.order_number || order.orderNumber || order.id?.slice(0, 8),
            customer_name: order.customer_name || order.customerName || "Customer",
            customer_email: order.customer_email || order.customerEmail || "",
            created_at: order.created_at || order.createdAt || new Date().toISOString(),
            status: (order.order_status || order.status || 'pending').toLowerCase() as any,
            payment_status: (order.payment_status || order.paymentStatus || 'pending').toLowerCase() as any,
            total: order.total || 0,
            items_count: Array.isArray(order.items) ? order.items.length : (order.items_count || 0),
        }));
    };

    const filterOrders = () => {
        let source: Order[] = [];
        if (mainTab === "my-orders") source = myOrders;
        else if (mainTab === "customer-orders") source = customerOrders;
        else source = platformOrders;

        let filtered = [...source];
        // Server-side filtering is now active, but we keep this for immediate UI feedback if needed
        // or simply pass the source if we trust the server response 100%

        // Actually, since we fetch on every filter change now, 
        // the source IS the filtered results.

        if (statusFilter !== 'all') {
            filtered = filtered.filter(order => order.status === statusFilter);
        }

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(order =>
                order.order_number.toLowerCase().includes(q) ||
                order.customer_name.toLowerCase().includes(q) ||
                (order.customer_email && order.customer_email.toLowerCase().includes(q))
            );
        }

        if (mainTab === "my-orders") setFilteredMyOrders(filtered);
        else if (mainTab === "customer-orders") setFilteredCustomerOrders(filtered);
        else setFilteredPlatformOrders(filtered);
    };

    const totalPages = Math.ceil(totalCount / pageSize);

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleViewOrder = (orderId: string, type: 'buyer' | 'seller') => {
        if (type === 'buyer') {
            navigate(`/orders/${orderId}`);
        } else {
            // Check if user has administrative privileges
            const isAdminPrivileged = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || location.pathname.startsWith('/admin');
            const basePath = isAdminPrivileged ? '/admin' : '/seller';
            navigate(`${basePath}/orders/${orderId}`);
        }
    };

    const handleDownloadInvoice = async (order: Order) => {
        try {
            toast({ title: "Generating Invoice", description: "Please wait..." });
            await generateInvoicePDF({
                orderNumber: order.order_number,
                orderDate: format(new Date(order.created_at), 'dd MMM yyyy'),
                customerName: order.customer_name,
                customerEmail: order.customer_email,
                customerPhone: order.customer_phone || 'N/A',
                shippingAddress: order.shipping_address || 'N/A',
                shippingCity: order.shipping_city || '',
                shippingPincode: order.shipping_pincode || '',
                items: order.items || [],
                subtotal: order.subtotal || (order.total * 0.82), // Fallback approx
                tax: order.tax || (order.total * 0.18),
                shipping: order.shipping || 0,
                total: order.total,
                paymentMethod: order.payment_method || 'Online',
                paymentStatus: order.payment_status || 'Paid'
            });
            toast({ title: "Success", description: "Invoice downloaded successfully." });
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to generate invoice", variant: "destructive" });
        }
    };

    const handleConfirmCancellation = async (reason: string, comments: string) => {
        if (!cancellingOrder || !user) return;
        try {
            await apiClient.post(`/orders/${cancellingOrder.id}/cancel`, {
                reason,
                comments
            });

            // Update Local State with simple optimistic update or refetch
            const updatedStatus = 'cancelled';
            const updater = (prev: Order[]) => prev.map(o => o.id === cancellingOrder.id ? { ...o, status: updatedStatus as any } : o);

            setMyOrders(updater);
            setCustomerOrders(updater);
            setPlatformOrders(updater);

            toast({ title: "Cancelled", description: "Order cancelled successfully." });
        } catch (e) {
            console.error(e);
            toast({ title: "Error", description: "Cancellation failed", variant: "destructive" });
        } finally {
            setIsCancellationOpen(false);
            setCancellingOrder(null);
        }
    };

    // UI Helpers
    const StatusBadge = ({ status }: { status: string }) => {
        const config = statusConfig[status as keyof typeof statusConfig];
        const Icon = config?.icon || AlertCircle;
        return (
            <Badge className={cn("flex items-center gap-1.5 px-2.5 py-0.5 transition-colors cursor-default w-fit whitespace-nowrap", config?.color || "bg-gray-100 text-gray-800")} variant="outline">
                <Icon className="w-3.5 h-3.5" />
                {config?.label || status}
            </Badge>
        );
    };

    const PaymentBadge = ({ status }: { status: string }) => {
        const config = paymentStatusConfig[status as keyof typeof paymentStatusConfig];
        return (
            <Badge variant="outline" className={cn("font-normal border", config?.color || "bg-gray-50 text-gray-600 border-gray-200")}>
                {config?.label || status}
            </Badge>
        );
    };

    const handleExport = () => {
        const ordersToExport = mainTab === "my-orders" ? myOrders : mainTab === "customer-orders" ? customerOrders : platformOrders;
        if (!ordersToExport.length) {
            toast({ title: "No orders", description: "There are no orders to export.", variant: "destructive" });
            return;
        }

        const headers = ["Order Number", "Date", "Customer", "Total", "Status", "Payment"];
        const rows = ordersToExport.map(o => [
            o.order_number,
            format(new Date(o.created_at), 'dd MMM yyyy, hh:mm a'),
            o.customer_name,
            o.total,
            o.status,
            o.payment_status
        ]);

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.href = encodedUri;
        link.download = `orders_export_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
        return (
            <div className="w-full max-w-7xl py-8 px-4 sm:px-6 lg:px-8 space-y-8 animate-pulse">
                {/* Header Skeleton */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="space-y-2">
                        <div className="h-10 w-64 bg-muted rounded-xl" />
                        <div className="h-4 w-48 bg-muted/60 rounded-lg" />
                    </div>
                    <div className="h-10 w-36 bg-muted rounded-xl hidden sm:block" />
                </div>

                {/* Tabs & Search Skeleton */}
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div className="h-11 w-full sm:w-auto inline-flex p-1 bg-muted/20 rounded-xl gap-1">
                        <div className="h-full w-28 sm:w-32 bg-muted/60 rounded-lg" />
                        <div className="h-full w-36 sm:w-40 bg-muted/20 rounded-lg" />
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <div className="h-11 flex-[2] sm:w-64 bg-muted/40 rounded-xl" />
                        <div className="h-11 flex-[1.2] sm:w-32 bg-muted/40 rounded-xl" />
                    </div>
                </div>

                {/* Mobile Grid Skeleton */}
                <div className="grid grid-cols-1 gap-4 sm:hidden">
                    {[1, 2, 3, 4].map(i => (
                        <Card key={i} className="rounded-3xl border-border/40 overflow-hidden">
                            <div className="h-16 bg-muted/20 border-b border-border/40" />
                            <div className="p-5 space-y-4">
                                <div className="flex justify-between items-center">
                                    <div className="h-4 w-24 bg-muted/60 rounded" />
                                    <div className="h-6 w-20 bg-muted rounded-full" />
                                </div>
                                <div className="h-8 w-full bg-muted/40 rounded-xl" />
                                <div className="flex gap-2">
                                    <div className="h-10 flex-1 bg-muted/40 rounded-xl" />
                                    <div className="h-10 flex-1 bg-muted/40 rounded-xl" />
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Desktop Table Skeleton */}
                <Card className="hidden sm:block border shadow-sm overflow-hidden bg-card/40">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow className="hover:bg-transparent">
                                <TableHead><div className="h-4 w-24 bg-muted/40 rounded" /></TableHead>
                                <TableHead><div className="h-4 w-16 bg-muted/40 rounded" /></TableHead>
                                <TableHead><div className="h-4 w-12 bg-muted/40 rounded" /></TableHead>
                                <TableHead><div className="h-4 w-16 bg-muted/40 rounded" /></TableHead>
                                <TableHead><div className="h-4 w-16 bg-muted/40 rounded" /></TableHead>
                                <TableHead className="text-right pr-6"><div className="h-4 w-12 bg-muted/40 rounded ml-auto" /></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <TableRow key={i} className="hover:bg-transparent border-b last:border-0">
                                    <TableCell>
                                        <div className="space-y-2">
                                            <div className="h-4 w-32 bg-muted/60 rounded" />
                                            <div className="h-3 w-16 bg-muted/40 rounded" />
                                        </div>
                                    </TableCell>
                                    <TableCell><div className="h-4 w-20 bg-muted/30 rounded" /></TableCell>
                                    <TableCell><div className="h-4 w-16 bg-muted/30 rounded" /></TableCell>
                                    <TableCell><div className="h-6 w-24 bg-muted/40 rounded-full" /></TableCell>
                                    <TableCell><div className="h-6 w-24 bg-muted/40 rounded-full" /></TableCell>
                                    <TableCell className="text-right pr-4">
                                        <div className="flex justify-end gap-1">
                                            <div className="h-8 w-8 bg-muted/20 rounded-md" />
                                            <div className="h-8 w-8 bg-muted/20 rounded-md" />
                                            <div className="h-8 w-8 bg-muted/20 rounded-md" />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            </div>
        );
    }

    return (
        <div className="w-full mx-auto py-6 lg:py-8 px-4 sm:px-6 lg:px-8 flex flex-col gap-3 sm:gap-6 lg:gap-8">
            <div className="flex flex-col gap-2 sm:gap-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 rounded-xl border-border/40 bg-card/40 backdrop-blur-sm gap-2 font-bold text-xs w-fit justify-start"
                            onClick={() => navigate(isAdmin ? "/admin" : "/seller")}
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Button>
                        <div className="min-w-0">
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">{isAdmin ? "Admin order management" : "All Orders"}</h1>
                            <p className="text-sm sm:text-base text-muted-foreground mt-1">
                                Monitor transaction lifecycle and fulfillment performance.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <Button variant="outline" className="flex-1 sm:flex-none h-10 rounded-xl font-bold text-xs bg-card/20 backdrop-blur-sm" onClick={handleExport}>
                            <Download className="w-4 h-4 mr-2" /> Export Report
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Tabs */}
            {/* Main Tabs */}
            <Tabs value={mainTab} onValueChange={setMainTab} className="space-y-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center bg-muted/50 p-1.5 sm:p-1 rounded-lg">

                    <div className="w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                        <TabsList className="flex w-fit sm:w-auto h-auto sm:h-9 bg-transparent p-0.5 gap-1 min-w-full sm:min-w-0">
                            {!isSellerContext && (
                                <TabsTrigger value="my-orders" className="flex-1 sm:flex-none gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs font-bold tracking-tight px-4 h-9 sm:h-auto whitespace-nowrap" title="My Purchases">
                                    <ShoppingBag className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                    <span>Purchases</span>
                                    <Badge variant="secondary" className="ml-1 bg-muted-foreground/10 text-muted-foreground h-4 px-1 min-w-[1rem] text-[9px]">
                                        {myOrdersCount}
                                    </Badge>
                                </TabsTrigger>
                            )}
                            <TabsTrigger value="customer-orders" className="flex-1 sm:flex-none gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs font-bold tracking-tight px-4 h-9 sm:h-auto whitespace-nowrap" title="Business Sales">
                                <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                <span>{isSellerContext ? "Orders" : "Sales"}</span>
                                <Badge variant="secondary" className="ml-1 bg-muted-foreground/10 text-muted-foreground h-4 px-1 min-w-[1rem] text-[9px]">
                                    {businessOrdersCount}
                                </Badge>
                            </TabsTrigger>
                            {isAdmin && (
                                <TabsTrigger value="platform-orders" className="flex-1 sm:flex-none gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs font-bold tracking-tight px-4 h-9 sm:h-auto whitespace-nowrap" title="Marketplace Orders">
                                    <Package className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                    <span>Marketplace</span>
                                    <Badge variant="secondary" className="ml-1 bg-muted-foreground/10 text-muted-foreground h-4 px-1 min-w-[1rem] text-[9px]">
                                        {platformOrdersCount}
                                    </Badge>
                                </TabsTrigger>
                            )}
                        </TabsList>
                    </div>

                    {/* Filters (Shared) */}
                    <div className="flex flex-wrap lg:flex-nowrap gap-2 w-full lg:w-auto items-center mt-2 lg:mt-0">
                        <div className="relative flex-[2] min-w-[140px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search orders..."
                                className="pl-9 h-10 sm:h-9 bg-background border-border text-sm"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="flex-[1.2] min-w-[120px] h-10 sm:h-9 bg-background border-border text-sm whitespace-nowrap overflow-hidden text-ellipsis">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                {Object.keys(statusConfig).map(status => (
                                    <SelectItem key={status} value={status}>
                                        {status.charAt(0).toUpperCase() + status.slice(1)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Tab Content: My Orders (Buyer View) */}
                <TabsContent value="my-orders" className="mt-0">
                    {/* Mobile Card View (My Orders) */}
                    <div className="grid gap-2 sm:hidden">
                        {filteredMyOrders.length === 0 ? (
                            <NoResultsFound
                                searchTerm={searchQuery}
                                onReset={() => {
                                    setSearchQuery("");
                                    setStatusFilter("all");
                                }}
                                className="my-8"
                            />
                        ) : (
                            filteredMyOrders.map((order) => (
                                <Card key={order.id} className="overflow-hidden border shadow-sm bg-card text-card-foreground">
                                    <CardHeader className="bg-muted/40 p-2.5 sm:p-4 pb-1.5 sm:pb-2">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <CardTitle className="font-semibold text-foreground break-all font-mono" style={{ fontSize: '13px' }}>#{order.order_number}</CardTitle>
                                                <CardDescription className="text-[10px] sm:text-xs mt-0.5 sm:mt-1 text-muted-foreground">
                                                    {format(new Date(order.created_at), 'MMM dd, yyyy')}
                                                </CardDescription>
                                            </div>
                                            <StatusBadge status={order.status} />
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-2.5 sm:p-4 pt-2.5 sm:pt-4 space-y-2.5 sm:space-y-4">
                                        <div className="flex justify-between items-center text-xs sm:text-sm">
                                            <span className="text-muted-foreground">{order.items_count} Items</span>
                                            <span className="font-bold text-sm sm:text-base text-foreground">₹{order.total.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-muted-foreground">Payment</span>
                                            <PaymentBadge status={order.payment_status} />
                                        </div>
                                        <Separator />
                                        <div className="flex justify-between gap-3">
                                            <Button variant="outline" size="sm" className="flex-1 h-8 sm:h-10 text-xs sm:text-sm hover:bg-muted" onClick={() => handleDownloadInvoice(order)}>
                                                <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" /> Invoice
                                            </Button>
                                            <Button variant="default" size="sm" className="flex-1 h-8 sm:h-10 text-xs sm:text-sm" onClick={() => handleViewOrder(order.id, 'buyer')}>
                                                View Details
                                            </Button>
                                        </div>
                                        {(order.status === 'pending' || order.status === 'confirmed') && (
                                            <Button variant="ghost" size="sm" className="w-full h-8 sm:h-10 text-xs sm:text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 mt-1.5 sm:mt-2" onClick={() => { setCancellingOrder(order); setIsCancellationOpen(true); }}>
                                                Cancel Order
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>

                    {/* Desktop Table View (My Orders) */}
                    <Card className="hidden sm:block border shadow-sm overflow-hidden bg-card">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-muted/40">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="text-[11px] font-bold tracking-wider text-muted-foreground/60">Order details</TableHead>
                                        <TableHead className="text-[11px] font-bold tracking-wider text-muted-foreground/60">Date</TableHead>
                                        <TableHead className="text-[11px] font-bold tracking-wider text-muted-foreground/60">Total</TableHead>
                                        <TableHead className="text-[11px] font-bold tracking-wider text-muted-foreground/60">Status</TableHead>
                                        <TableHead className="text-[11px] font-bold tracking-wider text-muted-foreground/60">Payment</TableHead>
                                        <TableHead className="text-right text-[11px] font-bold tracking-wider text-muted-foreground/60">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredMyOrders.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="p-0">
                                                <NoResultsFound
                                                    searchTerm={searchQuery}
                                                    onReset={() => {
                                                        setSearchQuery("");
                                                        setStatusFilter("all");
                                                    }}
                                                    className="border-none bg-transparent py-12"
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredMyOrders.map((order) => (
                                            <TableRow key={order.id} className="group hover:bg-muted/50 transition-colors border-b last:border-0 border-border">
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-sm tracking-tight break-all font-mono">#{order.order_number || order.id.slice(0, 8)}</span>
                                                        <span className="text-[10px] text-muted-foreground">{order.items?.[0]?.product?.title || order.items?.[0]?.product_title || 'Product'}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {format(new Date(order.created_at), 'MMM dd, yyyy')}
                                                </TableCell>
                                                <TableCell className="font-semibold text-foreground">
                                                    ₹{order.total.toLocaleString()}
                                                </TableCell>
                                                <TableCell>
                                                    <StatusBadge status={order.status} />
                                                </TableCell>
                                                <TableCell>
                                                    <PaymentBadge status={order.payment_status} />
                                                </TableCell>
                                                <TableCell className="text-right pr-4">
                                                    <div className="flex justify-end items-center gap-1">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted" onClick={() => handleDownloadInvoice(order)} title="Download Invoice">
                                                            <Download className="w-4 h-4" />
                                                        </Button>
                                                        {(order.status === 'pending' || order.status === 'confirmed') && (
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => { setCancellingOrder(order); setIsCancellationOpen(true); }} title="Cancel Order">
                                                                <Ban className="w-4 h-4" />
                                                            </Button>
                                                        )}
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted" onClick={() => handleViewOrder(order.id, 'buyer')} title="View Details">
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </Card>

                    {/* Pagination Controls (My Orders) */}
                    {totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-8 border-t border-border/40">
                            <p className="text-sm text-muted-foreground font-medium">
                                Showing <span className="text-foreground font-semibold">{(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalCount)}</span> of <span className="text-foreground font-semibold">{totalCount}</span> orders
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="rounded-xl h-10 px-4 font-semibold active:scale-95 transition-all text-xs"
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
                                                    "h-10 w-10 rounded-xl font-semibold transition-all text-xs",
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
                                    className="rounded-xl h-10 px-4 font-semibold active:scale-95 transition-all text-xs"
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </TabsContent>

                {/* Tab Content: Customer Orders (Seller View) */}
                <TabsContent value="customer-orders" className="mt-0">
                    {/* Mobile Card View (Customer Orders) */}
                    <div className="grid gap-2 sm:hidden">
                        {filteredCustomerOrders.length === 0 ? (
                            <NoResultsFound
                                searchTerm={searchQuery}
                                onReset={() => {
                                    setSearchQuery("");
                                    setStatusFilter("all");
                                }}
                                className="my-8"
                            />
                        ) : (
                            filteredCustomerOrders.map((order) => (
                                <Card key={order.id} className="overflow-hidden border shadow-sm bg-card text-card-foreground">
                                    <CardHeader className="bg-muted/40 p-2.5 sm:p-4 pb-1.5 sm:pb-2">
                                        <div className="flex justify-between items-start">
                                            <div className="max-w-[70%]">
                                                <CardTitle className="font-semibold truncate text-foreground" style={{ fontSize: '14px' }}>#{order.order_number}</CardTitle>
                                                <CardDescription className="text-xs mt-1 truncate text-muted-foreground">
                                                    {order.customer_name}
                                                </CardDescription>
                                            </div>
                                            <StatusBadge status={order.status} />
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-2.5 sm:p-4 pt-2.5 sm:pt-4 space-y-2.5 sm:space-y-4">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-muted-foreground">{order.customer_email}</span>
                                        </div>
                                        <Separator />
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-muted-foreground">{order.items_count} Items</span>
                                            <span className="font-semibold text-base text-foreground">₹{order.total.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-muted-foreground">Payment</span>
                                            <PaymentBadge status={order.payment_status} />
                                        </div>
                                        <Button variant="default" size="sm" className="w-full" onClick={() => handleViewOrder(order.id, 'seller')}>
                                            Manage Order
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>

                    {/* Desktop Table View (Customer Orders) */}
                    <Card className="hidden sm:block border overflow-hidden bg-card">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-muted/40">
                                    <TableRow className="bg-muted/30">
                                        <TableHead className="text-[11px] font-bold tracking-wider text-muted-foreground/60">Order ID</TableHead>
                                        <TableHead className="text-[11px] font-bold tracking-wider text-muted-foreground/60">Customer</TableHead>
                                        <TableHead className="text-[11px] font-bold tracking-wider text-muted-foreground/60">Items</TableHead>
                                        <TableHead className="text-[11px] font-bold tracking-wider text-muted-foreground/60">Total amount</TableHead>
                                        <TableHead className="text-[11px] font-bold tracking-wider text-muted-foreground/60">Status</TableHead>
                                        <TableHead className="text-[11px] font-bold tracking-wider text-muted-foreground/60">Payment</TableHead>
                                        <TableHead className="text-right text-[11px] font-bold tracking-wider text-muted-foreground/60 pr-6">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredCustomerOrders.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="p-0">
                                                <NoResultsFound
                                                    searchTerm={searchQuery}
                                                    onReset={() => {
                                                        setSearchQuery("");
                                                        setStatusFilter("all");
                                                    }}
                                                    className="border-none bg-transparent py-12"
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredCustomerOrders.map((order) => (
                                            <TableRow key={order.id} className="hover:bg-muted/50 transition-colors border-b last:border-0 border-border">
                                                <TableCell className="font-medium text-foreground">
                                                    <span className="break-all font-mono">#{order.order_number}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium text-foreground">{order.customer_name}</span>
                                                        <span className="text-xs text-muted-foreground">{order.customer_email}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary" className="font-normal text-xs bg-muted text-muted-foreground">
                                                        {order.items_count} Items
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="font-semibold text-foreground">
                                                    ₹{order.total.toLocaleString()}
                                                </TableCell>
                                                <TableCell>
                                                    <StatusBadge status={order.status} />
                                                </TableCell>
                                                <TableCell>
                                                    <PaymentBadge status={order.payment_status} />
                                                </TableCell>
                                                <TableCell className="text-right pr-4">
                                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted" onClick={() => handleViewOrder(order.id, 'seller')}>
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </Card>

                    {/* Pagination Controls (Customer Orders) */}
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
                </TabsContent>

                {isAdmin && (
                    <TabsContent value="platform-orders" className="mt-0">
                        {/* Desktop Table View (Platform Orders) */}
                        <Card className="hidden sm:block border overflow-hidden bg-card">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-muted/40">
                                        <TableRow className="bg-muted/30">
                                            <TableHead className="text-[11px] font-bold tracking-wider text-muted-foreground/60">Order ID</TableHead>
                                            <TableHead className="text-[11px] font-bold tracking-wider text-muted-foreground/60">Customer</TableHead>
                                            <TableHead className="text-[11px] font-bold tracking-wider text-muted-foreground/60">Items</TableHead>
                                            <TableHead className="text-[11px] font-bold tracking-wider text-muted-foreground/60">Total amount</TableHead>
                                            <TableHead className="text-[11px] font-bold tracking-wider text-muted-foreground/60">Status</TableHead>
                                            <TableHead className="text-[11px] font-bold tracking-wider text-muted-foreground/60">Payment</TableHead>
                                            <TableHead className="text-right text-[11px] font-bold tracking-wider text-muted-foreground/60 pr-6">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredPlatformOrders.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="p-0">
                                                    <NoResultsFound
                                                        searchTerm={searchQuery}
                                                        onReset={() => {
                                                            setSearchQuery("");
                                                            setStatusFilter("all");
                                                        }}
                                                        className="border-none bg-transparent py-12"
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredPlatformOrders.map((order) => (
                                                <TableRow key={order.id} className="hover:bg-muted/50 transition-colors border-b last:border-0 border-border">
                                                    <TableCell className="font-medium text-foreground">
                                                        <span className="break-all font-mono">#{order.order_number}</span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-medium text-foreground">{order.customer_name}</span>
                                                            <span className="text-xs text-muted-foreground">{order.customer_email}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="secondary" className="font-normal text-xs bg-muted text-muted-foreground">
                                                            {order.items_count} Items
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="font-semibold text-foreground">
                                                        ₹{order.total.toLocaleString()}
                                                    </TableCell>
                                                    <TableCell>
                                                        <StatusBadge status={order.status} />
                                                    </TableCell>
                                                    <TableCell>
                                                        <PaymentBadge status={order.payment_status} />
                                                    </TableCell>
                                                    <TableCell className="text-right pr-4">
                                                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted" onClick={() => handleViewOrder(order.id, 'seller')}>
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </Card>

                        {/* Pagination (Platform Orders) */}
                        {totalPages > 1 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-8 border-t border-border/40">
                                <p className="text-sm text-muted-foreground font-medium">
                                    Showing <span className="text-foreground font-bold">{(currentPage - 1) * pageSize + 1}</span> to <span className="text-foreground font-bold">{Math.min(currentPage * pageSize, totalCount)}</span> of <span className="text-foreground font-bold">{totalCount}</span> orders
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="rounded-xl h-10 px-4 font-bold text-xs font-bold active:scale-95 transition-all">Previous</Button>
                                    <div className="flex items-center gap-1 mx-2">
                                        {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => (
                                            <Button key={i + 1} variant={i + 1 === currentPage ? "default" : "ghost"} size="sm" onClick={() => handlePageChange(i + 1)} className={cn("h-10 w-10 rounded-xl font-bold transition-all text-xs", i + 1 === currentPage ? "bg-[#146B6B] text-white" : "text-muted-foreground")}>{i + 1}</Button>
                                        ))}
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="rounded-xl h-10 px-4 font-bold text-xs font-bold active:scale-95 transition-all">Next</Button>
                                </div>
                            </div>
                        )}
                    </TabsContent>
                )}
            </Tabs>

            {/* Cancellation Dialog */}
            {cancellingOrder && (
                <OrderCancellationReasonDialog
                    open={isCancellationOpen}
                    onOpenChange={setIsCancellationOpen}
                    onConfirm={handleConfirmCancellation}
                    orderNumber={cancellingOrder.order_number}
                    orderAmount={cancellingOrder.total}
                    isPrepaid={cancellingOrder.payment_status === 'paid'}
                />
            )}
        </div>
    );
}

