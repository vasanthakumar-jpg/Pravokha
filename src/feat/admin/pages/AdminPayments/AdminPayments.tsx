import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/ui/Card";
import { Button } from "@/ui/Button";
import { Badge } from "@/ui/Badge";
import { Input } from "@/ui/Input";
import { Separator } from "@/ui/Separator";
import { ScrollArea } from "@/ui/ScrollArea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/ui/Table";
import {
  Sheet,
  SheetContent,
  SheetClose,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/ui/Sheet";
import {
  CreditCard,
  DollarSign,
  ArrowDownRight,
  Search,
  Filter,
  Download,
  MoreHorizontal,
  CheckCircle2,
  Clock,
  ShoppingBag,
  Receipt,
  Truck,
  MapPin,
  ExternalLink,
  Package,
  TrendingUp,
  Wallet,
  AlertCircle,
  Shield,
  Activity,
  ArrowLeft,
  RefreshCcw,
  Loader2,
  X
} from "lucide-react";
import { apiClient } from "@/infra/api/apiClient";
import { toast } from "@/shared/hook/use-toast";
import { format, subDays } from "date-fns";
import { generateInvoicePDF } from "@/shared/util/invoiceGenerator";
import { useNavigate } from "react-router-dom";
import { AdminSkeleton } from "@/feat/admin/components/AdminSkeleton";
import { cn } from "@/lib/utils";
import { NoResultsFound } from "@/feat/admin/components/NoResultsFound";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/Tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/ui/DropdownMenu";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/ui/Dialog";
import { Textarea } from "@/ui/Textarea";
import { Label } from "@/ui/Label";
import { useAdmin } from "@/core/context/AdminContext";
import { StatsCard } from "@/feat/admin/components/StatsCard";

interface Transaction {
  id: string;
  order_number: string;
  total: number;
  payment_status: string;
  order_status: string;
  created_at: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  payment_method?: string;
  payment_id?: string;
  shipping?: number;
  shipping_address?: any;
  items?: any[];
}


interface PayoutRequest {
  id: string;
  seller_id: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  period_start: string;
  period_end: string;
  transaction_id?: string;
  rejection_reason?: string;
  seller?: {
    name: string;
    email: string;
    bankAccount?: string;
    ifsc?: string;
    beneficiaryName?: string;
  };
}


export default function AdminPayments() {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("transactions");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingPayoutCount: 0,
    pendingPayoutAmount: 0,
    successfulTxns: 0,
    refundRate: 0,
    revenueChartData: [] as any[],
    payoutChartData: [] as any[]
  });

  // Rejection/Confirmation States
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [payoutToReject, setPayoutToReject] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: 'refund' | 'payout_complete', id: string } | null>(null);

  // CRITICAL: Authentication check to prevent unauthorized access
  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate("/auth");
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const mapTransaction = (order: any): Transaction => ({
    id: order.id,
    order_number: order.orderNumber,
    total: order.total,
    payment_status: order.paymentStatus?.toLowerCase(),
    order_status: order.status?.toLowerCase(),
    created_at: order.createdAt,
    customer_name: order.customerName,
    customer_email: order.customerEmail,
    customer_phone: order.customerPhone,
    payment_method: order.paymentMethod,
    payment_id: order.stripeIntentId,
    shipping: 0, // Backend doesn't explicitly store shipping separately yet
    shipping_address: {
      address: order.shippingAddress,
      city: order.shippingCity,
      pincode: order.shippingPincode
    },
    items: order.items || []
  });

  const mapPayoutRequest = (payout: any): PayoutRequest => ({
    id: payout.id,
    seller_id: payout.vendorId, // Updated from sellerId
    amount: payout.amount,
    status: payout.status.toLowerCase(),
    created_at: payout.createdAt,
    period_start: payout.periodStart,
    period_end: payout.periodEnd,
    transaction_id: payout.transactionId,
    rejection_reason: payout.rejectionReason,
    seller: payout.vendor ? {
      name: payout.vendor.storeName || payout.vendor.owner?.name,
      email: payout.vendor.owner?.email,
      bankAccount: payout.vendor.bankAccountNumber,
      ifsc: payout.vendor.bankIfscCode,
      beneficiaryName: payout.vendor.beneficiaryName
    } : undefined
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const skip = (currentPage - 1) * itemsPerPage;
      const take = itemsPerPage;

      if (activeTab === "transactions") {
        const response = await apiClient.get(`/orders?skip=${skip}&take=${take}`);
        const mappedData = response.data.data.map(mapTransaction);
        setTransactions(mappedData);
        calculateTransactionStats(mappedData);
        // Note: We need the total count from backend to set total pages correctly
        // Assuming response.data.meta.total exists or similar
      } else {
        const response = await apiClient.get(`/payouts?skip=${skip}&take=${take}`);
        const mappedData = response.data.data.map(mapPayoutRequest);
        setPayoutRequests(mappedData);
        calculatePayoutStats(mappedData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({ title: "Error", description: "Failed to load data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const calculateTransactionStats = (txns: Transaction[]) => {
    const totalRevenue = txns
      .filter(t => t.payment_status === 'paid' || t.payment_status === 'completed')
      .reduce((sum, t) => sum + t.total, 0);
    const successfulTxns = txns.filter(t => t.payment_status === 'paid' || t.payment_status === 'completed').length;
    const refundedTxns = txns.filter(t => t.payment_status === 'refunded').length;
    const refundRate = txns.length > 0 ? (refundedTxns / txns.length) * 100 : 0;

    setStats(prev => ({ ...prev, totalRevenue, successfulTxns, refundRate: isNaN(refundRate) ? 0 : refundRate }));

    // Aggregage data for chart (Last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), i);
      return format(d, 'MMM dd');
    }).reverse();

    const revenueChartData = last7Days.map(dateStr => {
      const dayTotal = txns
        .filter(t => (t.payment_status === 'paid' || t.payment_status === 'completed') && format(new Date(t.created_at), 'MMM dd') === dateStr)
        .reduce((sum, t) => sum + (Number(t.total) || 0), 0);
      return { name: dateStr, amount: dayTotal };
    });

    setStats(prev => ({ ...prev, revenueChartData }));
  };

  const calculatePayoutStats = (requests: PayoutRequest[]) => {
    const pendingRequests = requests.filter(r => r.status === 'pending');
    const pendingPayoutCount = pendingRequests.length;
    const pendingPayoutAmount = pendingRequests.reduce((sum, r) => sum + r.amount, 0);

    // Aggregage data for chart (Last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), i);
      return format(d, 'MMM dd');
    }).reverse();

    const payoutChartData = last7Days.map(dateStr => {
      const dayTotal = requests
        .filter(r => r.status === 'completed' && format(new Date(r.created_at), 'MMM dd') === dateStr)
        .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
      return { name: dateStr, amount: dayTotal };
    });

    setStats(prev => ({ ...prev, pendingPayoutCount, pendingPayoutAmount, payoutChartData }));
  };

  const handleUpdatePayoutStatus = async (payoutId: string, newStatus: string) => {
    // If marking as completed, ask for confirmation
    if (newStatus === 'completed') {
      setConfirmAction({ type: 'payout_complete', id: payoutId });
      setConfirmDialogOpen(true);
      return;
    }

    // If marking as failed, open rejection modal
    if (newStatus === 'failed') {
      setPayoutToReject(payoutId);
      setRejectionModalOpen(true);
      return;
    }

    try {
      await apiClient.patch(`/payouts/${payoutId}/status`, { status: newStatus.toUpperCase() });

      toast({ title: "Status Updated", description: `Payout request marked as ${newStatus}.` });
      fetchData();
    } catch (error) {
      console.error("Error updating payout status:", error);
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
  };

  const handlePayoutReject = async () => {
    if (!payoutToReject || !rejectionReason.trim()) return;

    try {
      await apiClient.patch(`/payouts/${payoutToReject}/status`, {
        status: 'FAILED',
        rejectionReason: rejectionReason
      });

      toast({ title: "Payout Rejected", description: "The seller will be notified of the rejection." });

      setRejectionModalOpen(false);
      setRejectionReason("");
      fetchData();
    } catch (error) {
      console.error("Error rejecting payout:", error);
      toast({ title: "Error", description: "Failed to reject payout", variant: "destructive" });
    }
  };

  const handleIssueRefund = async (transactionId: string) => {
    setConfirmAction({ type: 'refund', id: transactionId });
    setConfirmDialogOpen(true);
  };

  const executeConfirmedAction = async () => {
    if (!confirmAction) return;

    try {
      if (confirmAction.type === 'refund') {
        await apiClient.patch(`/orders/${confirmAction.id}/refund`);

        toast({
          title: "Refund Issued",
          description: "Transaction has been marked as refunded.",
        });

        setTransactions(prev => prev.map(t =>
          t.id === confirmAction.id ? { ...t, payment_status: "refunded" } : t
        ));
      } else if (confirmAction.type === 'payout_complete') {
        await apiClient.patch(`/payouts/${confirmAction.id}/status`, {
          status: 'COMPLETED'
        });

        toast({ title: "Payout Completed", description: "Funds have been marked as transferred." });
      }

      setConfirmDialogOpen(false);
      setConfirmAction(null);
      fetchData();
    } catch (error) {
      console.error("Error executing confirmed action:", error);
      toast({ title: "Error", description: "Action failed", variant: "destructive" });
    }
  };

  const handleDownloadReceipt = async (transaction: Transaction) => {
    try {
      // Calculate values from order data
      const items = transaction.items && Array.isArray(transaction.items) ? transaction.items : [];
      const subtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
      const shipping = transaction.shipping || 0;
      const tax = transaction.total - subtotal - shipping;

      // Prepare invoice data matching user invoice format
      const invoiceData = {
        orderNumber: transaction.order_number,
        orderDate: format(new Date(transaction.created_at), 'dd/MM/yyyy'),
        customerName: transaction.customer_name || 'Customer',
        customerEmail: transaction.customer_email || '',
        customerPhone: transaction.customer_phone || '',
        shippingAddress: transaction.shipping_address || {},
        shippingCity: transaction.shipping_address?.city || '',
        shippingPincode: transaction.shipping_address?.pincode || '',
        items: items.map((item: any) => ({
          title: item.title || 'Product',
          variant: item.selectedSize || item.selectedColor || '-',
          quantity: item.quantity || 1,
          price: item.price || 0
        })),
        subtotal: subtotal,
        tax: Math.max(0, tax),
        shipping: shipping,
        total: transaction.total,
        paymentMethod: transaction.payment_method || 'N/A',
        paymentStatus: transaction.payment_status || 'pending'
      };

      generateInvoicePDF(invoiceData);

      toast({
        title: "Receipt Downloaded",
        description: "Receipt has been saved to your device.",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "Failed to generate receipt",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const normalizedStatus = status?.toLowerCase() || "";
    if (normalizedStatus === "paid" || normalizedStatus === "completed") {
      return <Badge className="bg-emerald-500/10 text-emerald-600 border-none shadow-none font-medium text-xs px-2 py-0.5 rounded-lg">Paid</Badge>;
    } else if (normalizedStatus === "pending") {
      return <Badge className="bg-amber-500/10 text-amber-600 border-none shadow-none font-medium text-xs px-2 py-0.5 rounded-lg">Pending</Badge>;
    } else if (normalizedStatus === "failed") {
      return <Badge className="bg-rose-500/10 text-rose-600 border-none shadow-none font-medium text-xs px-2 py-0.5 rounded-lg">Failed</Badge>;
    } else if (normalizedStatus === "refunded") {
      return <Badge className="bg-blue-500/10 text-blue-600 border-none shadow-none font-medium text-xs px-2 py-0.5 rounded-lg">Refunded</Badge>;
    } else {
      return <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5 rounded-lg">{status.toUpperCase()}</Badge>;
    }
  };

  const getOrderStatusBadge = (status: string) => {
    const normalizedStatus = status?.toLowerCase() || "";
    if (normalizedStatus === "delivered") {
      return <Badge className="bg-green-500 text-white">Delivered</Badge>;
    } else if (normalizedStatus === "cancelled") {
      return <Badge variant="destructive">Cancelled</Badge>;
    } else if (normalizedStatus === "shipped") {
      return <Badge className="bg-purple-500 text-white">Shipped</Badge>;
    } else if (normalizedStatus === "confirmed") {
      return <Badge className="bg-blue-500 text-white">Confirmed</Badge>;
    } else {
      return <Badge className="bg-primary text-primary-foreground">Processing</Badge>;
    }
  };

  const handleRowClick = (trx: Transaction) => {
    setSelectedTransaction(trx);
    setIsSheetOpen(true);
  };

  const filteredTransactions = transactions.filter(t =>
    t.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex flex-col">
      <div className="w-full mx-auto py-3 sm:py-6 lg:py-8 px-2 sm:px-4 lg:px-6 xl:px-8 flex-1 flex flex-col gap-4 sm:gap-6 lg:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Header */}
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
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Payment Management</h1>
                <p className="text-xs sm:text-base text-muted-foreground mt-1">Transaction reconciliation and payout approvals</p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                disabled={loading}
                onClick={() => {
                  fetchData();
                  toast({
                    title: "Ledger Refreshed",
                    description: "Transactions and payout queues are up to date.",
                    className: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800"
                  });
                }}
              >
                <RefreshCcw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} /> Refresh Ledger
              </Button>
              <Button className="flex-1 sm:flex-none h-10 rounded-xl font-bold text-xs bg-primary hover:bg-primary/90 shadow-md shadow-primary/20">
                <Download className="mr-2 h-4 w-4" /> Export Report
              </Button>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <div className="w-full overflow-x-auto scrollbar-none pb-1">
            <TabsList className="flex w-fit bg-card p-1 rounded-xl border border-border/60 gap-1">
              <TabsTrigger value="transactions" className="rounded-lg px-6 sm:px-8 py-2 text-[11px] sm:text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all whitespace-nowrap">Marketplace Transactions</TabsTrigger>
              <TabsTrigger value="payouts" className="rounded-lg px-6 sm:px-8 py-2 text-[11px] sm:text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all whitespace-nowrap">
                Payout Approvals
                {stats.pendingPayoutCount > 0 && (
                  <Badge className="ml-2 bg-red-500 hover:bg-red-500 text-[10px] h-4 min-w-[16px] px-1 justify-center">
                    {stats.pendingPayoutCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Dynamic KPI Stats */}
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
            {activeTab === "transactions" ? (
              <>
                <StatsCard
                  title="Total Order Revenue"
                  value={`₹${stats.totalRevenue.toLocaleString()}`}
                  icon={DollarSign}
                  color="bg-emerald-500"
                  description="Gross marketplace volume"
                  trend={{ value: 20.1, isPositive: true }}
                />
                <StatsCard
                  title="Successful Txns"
                  value={stats.successfulTxns.toString()}
                  icon={CheckCircle2}
                  color="bg-blue-600"
                  description="Verified order flow"
                  trend={{ value: 180.1, isPositive: true }}
                />
                <StatsCard
                  title="Avg. Ticket Size"
                  value={`₹${stats.successfulTxns > 0 ? (stats.totalRevenue / stats.successfulTxns).toFixed(0) : 0}`}
                  icon={TrendingUp}
                  color="bg-violet-600"
                  description="Mean transaction value"
                />
                <StatsCard
                  title="Refund Rate"
                  value={`${stats.refundRate.toFixed(1)}%`}
                  icon={ArrowDownRight}
                  color="bg-rose-500"
                  description="Return to success ratio"
                  trend={{ value: 4, isPositive: false }}
                />
              </>
            ) : (
              <>
                <StatsCard
                  title="Pending Payouts"
                  value={`₹${stats.pendingPayoutAmount.toLocaleString()}`}
                  icon={Wallet}
                  color="bg-amber-500"
                  description="Funds awaiting authorization"
                  trend="Action required"
                />
                <StatsCard
                  title="Awaiting Approval"
                  value={stats.pendingPayoutCount.toString()}
                  icon={Clock}
                  color="bg-blue-600"
                  description="Queued settlement requests"
                />
                <StatsCard
                  title="Avg. Payout"
                  value={`₹${payoutRequests.length > 0 ? (payoutRequests.reduce((s, r) => s + r.amount, 0) / payoutRequests.length).toFixed(0) : 0}`}
                  icon={DollarSign}
                  color="bg-emerald-500"
                  description="Average partner withdrawal"
                />
                <StatsCard
                  title="Processed (MTD)"
                  value={payoutRequests.filter(r => r.status === 'completed').length.toString()}
                  icon={CheckCircle2}
                  color="bg-violet-600"
                  description="Success settlement count"
                />
              </>
            )}
          </div>

          {/* Financial Visualization */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-border/60 bg-card transition-all duration-500 rounded-xl shadow-sm">
              <CardHeader className="p-6 pb-2">
                <CardTitle className="text-sm font-medium">Revenue velocity</CardTitle>
                <CardDescription className="text-xs">Platform transaction volume and flow lifecycle</CardDescription>
              </CardHeader>
              <CardContent className="h-[240px] p-6 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.revenueChartData}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground))" opacity={0.1} />
                    <XAxis
                      dataKey="name"
                      fontSize={11}
                      fontWeight={600}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))', opacity: 0.5 }}
                      dy={10}
                    />
                    <YAxis
                      fontSize={11}
                      fontWeight={600}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))', opacity: 0.5 }}
                      tickFormatter={(value) => `₹${value}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border) / 0.4)',
                        borderRadius: '12px',
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                      }}
                      itemStyle={{ color: '#8884d8', fontWeight: 'bold', fontSize: '12px' }}
                      labelStyle={{ color: 'hsl(var(--muted-foreground))', fontWeight: 'bold', marginBottom: '4px', fontSize: '12px' }}
                      cursor={{ stroke: '#8884d8', strokeWidth: 1, opacity: 0.2 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="#8884d8"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorRev)"
                      animationDuration={1500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card transition-all duration-500 rounded-xl shadow-sm">
              <CardHeader className="p-6 pb-2">
                <CardTitle className="text-sm font-medium">Payout volume trend</CardTitle>
                <CardDescription className="text-xs">rolling 7-day settlement velocity</CardDescription>
              </CardHeader>
              <CardContent className="h-[240px] p-6 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.payoutChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground))" opacity={0.1} />
                    <XAxis
                      dataKey="name"
                      fontSize={11}
                      fontWeight={600}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))', opacity: 0.5 }}
                      dy={10}
                    />
                    <YAxis
                      fontSize={11}
                      fontWeight={600}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))', opacity: 0.5 }}
                    />
                    <Tooltip
                      cursor={{ fill: 'hsl(var(--muted))', opacity: 0.1 }}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border) / 0.4)',
                        borderRadius: '12px',
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                      }}
                      itemStyle={{ color: '#8884d8', fontWeight: 'bold', fontSize: '12px' }}
                      labelStyle={{ color: 'hsl(var(--muted-foreground))', fontWeight: 'bold', marginBottom: '4px', fontSize: '12px' }}
                    />
                    <Bar dataKey="amount" radius={[6, 6, 0, 0]} barSize={20}>
                      {stats.payoutChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.amount > 0 ? "#8884d8" : "hsl(var(--muted) / 0.2)"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <TabsContent value="transactions" className="space-y-4">

            {/* Mobile Card View for Transactions */}
            <div className="space-y-2 sm:hidden">
              {loading ? (
                <AdminSkeleton variant="list" skeletonProps={{ count: 3 }} />
              ) : filteredTransactions.length === 0 ? (
                <NoResultsFound
                  searchTerm={searchQuery}
                  onReset={() => setSearchQuery("")}
                  className="my-8"
                />
              ) : (
                paginatedTransactions.map((trx) => (
                  <Card key={trx.id} className="border-border/60 bg-card overflow-hidden shadow-sm" onClick={() => handleRowClick(trx)}>
                    <CardHeader className="p-3 bg-muted/20 border-b border-border/10 pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-primary">#{trx.order_number}</span>
                          <span className="text-[10px] text-muted-foreground">{format(new Date(trx.created_at), "MMM d, yyyy")}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {trx.payment_status === 'refunded' ? (
                            <Badge variant="outline" className="text-[9px] border-amber-500/30 text-amber-600 bg-amber-500/5 px-2 py-0.5">REFUND</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[9px] border-emerald-500/30 text-emerald-600 bg-emerald-500/5 px-2 py-0.5">SALE</Badge>
                          )}
                          <span className="font-bold text-sm">₹{trx.total.toLocaleString()}</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 pt-3 space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2 max-w-[70%]">
                          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                            {trx.customer_name?.charAt(0) || 'C'}
                          </div>
                          <span className="truncate font-medium">{trx.customer_name}</span>
                        </div>
                        {getStatusBadge(trx.payment_status)}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}

              {/* Mobile Pagination for Transactions */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ArrowLeft className="h-3 w-3" />
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ArrowLeft className="h-3 w-3 rotate-180" />
                  </Button>
                </div>
              )}
            </div>

            <Card className="hidden sm:block border-border/60 bg-card transition-all duration-500 rounded-xl shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/10 border-b border-border/40 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-medium">Transaction Ledger</CardTitle>
                    <CardDescription className="text-xs">Comprehensive history of all marketplace payments</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search Order # or Customer..."
                        className="pl-9 w-[300px] h-10 bg-card border-border/60 rounded-xl focus:ring-primary/20 shadow-sm text-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl border border-border/50 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow className="border-border/40 hover:bg-transparent">
                        <TableHead className="px-6 h-12 text-[11px] font-bold tracking-wider text-muted-foreground/60 normal-case">Order details</TableHead>
                        <TableHead className="text-[11px] font-bold tracking-wider text-muted-foreground/60 normal-case">Date</TableHead>
                        <TableHead className="text-[11px] font-bold tracking-wider text-muted-foreground/60 normal-case">Type</TableHead>
                        <TableHead className="text-[11px] font-bold tracking-wider text-muted-foreground/60 normal-case">Customer</TableHead>
                        <TableHead className="text-[11px] font-bold tracking-wider text-muted-foreground/60 normal-case">Amount</TableHead>
                        <TableHead className="text-[11px] font-bold tracking-wider text-muted-foreground/60 normal-case">Commission</TableHead>
                        <TableHead className="text-[11px] font-bold tracking-wider text-muted-foreground/60 normal-case">Payment</TableHead>
                        <TableHead className="text-[11px] font-bold tracking-wider text-muted-foreground/60 text-right pr-6 normal-case">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={8} className="h-64">
                            <div className="flex flex-col items-center justify-center gap-3">
                              <Loader2 className="h-8 w-8 animate-spin text-primary" />
                              <p className="text-xs font-bold text-muted-foreground animate-pulse">Synchronizing Ledger...</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : transactions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="p-0">
                            <NoResultsFound
                              searchTerm={searchQuery}
                              onReset={() => setSearchQuery("")}
                              className="border-none bg-transparent"
                            />
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedTransactions.map((trx) => (
                          <TableRow key={trx.id} className="cursor-pointer hover:bg-primary/5 transition-colors group" onClick={() => handleRowClick(trx)}>
                            <TableCell className="font-bold flex items-center gap-2">
                              <span className="text-primary group-hover:underline">#{trx.order_number}</span>
                            </TableCell>
                            <TableCell className="text-sm font-medium">{format(new Date(trx.created_at), "MMM d, yyyy")}</TableCell>
                            <TableCell>
                              {trx.payment_status === 'refunded' ? (
                                <Badge variant="outline" className="text-[9px] border-amber-500/30 text-amber-600 bg-amber-500/5">REFUND</Badge>
                              ) : trx.total > 5000 ? (
                                <Badge variant="outline" className="text-[9px] border-indigo-500/30 text-indigo-600 bg-indigo-500/5">SETTLEMENT</Badge>
                              ) : (
                                <Badge variant="outline" className="text-[9px] border-emerald-500/30 text-emerald-600 bg-emerald-500/5">SALE</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-semibold text-sm">{trx.customer_name}</span>
                                <span className="text-[10px] text-muted-foreground">{trx.customer_email}</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-bold text-sm">₹{trx.total.toLocaleString()}</TableCell>
                            <TableCell>
                              <span className="text-[10px] font-bold text-muted-foreground">₹{(trx.total * 0.1).toFixed(0)} (10%)</span>
                            </TableCell>
                            <TableCell>{getStatusBadge(trx.payment_status)}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" className="group-hover:text-primary rounded-full">
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payouts" className="space-y-4">
            {/* Mobile Title for Payouts */}
            <div className="sm:hidden mb-4 px-1">
              <h2 className="text-lg font-bold">Payout Approval Queue</h2>
              <p className="text-xs text-muted-foreground">Review and authorize seller requests</p>
            </div>

            {/* Mobile Card View for Payouts */}
            <div className="space-y-2 sm:hidden">
              {loading ? (
                <AdminSkeleton variant="list" skeletonProps={{ count: 3 }} />
              ) : payoutRequests.length === 0 ? (
                <Card className="border-border/60 bg-card shadow-sm">
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <Wallet className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>No payout requests in queue.</p>
                  </CardContent>
                </Card>
              ) : (
                payoutRequests.map((request) => (
                  <Card key={request.id} className="border-border/60 bg-card overflow-hidden shadow-sm">
                    <CardHeader className="p-3 bg-muted/20 border-b border-border/10 pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-primary">{request.seller?.name || 'Marketplace Seller'}</span>
                          <span className="text-[10px] text-muted-foreground">{format(new Date(request.created_at), "MMM d, p")}</span>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="font-bold text-sm text-emerald-600">₹{request.amount.toLocaleString()}</span>
                          <Badge className={cn(
                            "border-none shadow-none font-bold text-[9px] px-2 py-0.5 rounded-lg h-5",
                            request.status === 'pending' ? "bg-amber-500/10 text-amber-600" :
                              request.status === 'processing' ? "bg-blue-500/10 text-blue-600" :
                                request.status === 'completed' ? "bg-emerald-500/10 text-emerald-600" :
                                  "bg-rose-500/10 text-rose-600"
                          )}>
                            {request.status.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 pt-3 space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] text-muted-foreground font-semibold uppercase">Banking Info</span>
                          <span className="font-mono text-[10px]">{request.seller?.bankAccount ? `****${request.seller.bankAccount.slice(-4)}` : 'UNSET'}</span>
                          <span className="font-mono text-[10px] text-muted-foreground">IFSC: {request.seller?.ifsc || 'N/A'}</span>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-7 text-xs gap-1 px-2 rounded-lg">
                              Actions <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {request.status === 'pending' && (
                              <DropdownMenuItem className="cursor-pointer" onClick={() => handleUpdatePayoutStatus(request.id, 'processing')}>
                                <Clock className="mr-2 h-4 w-4" /> Mark as Processing
                              </DropdownMenuItem>
                            )}
                            {request.status === 'processing' && (
                              <DropdownMenuItem className="cursor-pointer text-emerald-600 focus:text-emerald-600" onClick={() => handleUpdatePayoutStatus(request.id, 'completed')}>
                                <CheckCircle2 className="mr-2 h-4 w-4" /> Confirm Payout (Complete)
                              </DropdownMenuItem>
                            )}
                            {(request.status === 'pending' || request.status === 'processing') && (
                              <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive" onClick={() => handleUpdatePayoutStatus(request.id, 'failed')}>
                                <ArrowDownRight className="mr-2 h-4 w-4" /> Fail/Reject Request
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            <Card className="hidden sm:block border-border/60 bg-card transition-all duration-500 rounded-xl shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/10 border-b border-border/40 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-medium">Payout Approval Queue</CardTitle>
                    <CardDescription className="text-xs">Review and authorize seller withdrawal requests</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl border border-border/50 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow className="border-border/40 hover:bg-transparent">
                        <TableHead className="px-6 h-12 text-[11px] font-bold tracking-wider text-muted-foreground/60 normal-case">Partner</TableHead>
                        <TableHead className="text-[11px] font-bold tracking-wider text-muted-foreground/60 normal-case">Requested amount</TableHead>
                        <TableHead className="text-[11px] font-bold tracking-wider text-muted-foreground/60 normal-case">Banking info</TableHead>
                        <TableHead className="text-[11px] font-bold tracking-wider text-muted-foreground/60 normal-case">Submission</TableHead>
                        <TableHead className="text-[11px] font-bold tracking-wider text-muted-foreground/60 normal-case">Status</TableHead>
                        <TableHead className="text-[11px] font-bold tracking-wider text-muted-foreground/60 text-right pr-6 normal-case">Governance actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-64">
                            <div className="flex flex-col items-center justify-center gap-3">
                              <Loader2 className="h-8 w-8 animate-spin text-primary" />
                              <p className="text-xs font-bold text-muted-foreground animate-pulse">Reconciling Payouts...</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : payoutRequests.length === 0 ? (
                        <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground italic">No payout requests in queue.</TableCell></TableRow>
                      ) : (
                        payoutRequests.map((request) => (
                          <TableRow key={request.id}>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-bold text-sm">{request.seller?.name || 'Marketplace Seller'}</span>
                                <span className="text-[10px] text-muted-foreground">{request.seller?.email}</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-bold text-sm text-emerald-600">₹{request.amount.toLocaleString()}</TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <Badge variant="outline" className="w-fit text-[9px] font-mono py-0">{request.seller?.bankAccount ? `****${request.seller.bankAccount.slice(-4)}` : 'UNSET'}</Badge>
                                <span className="text-[10px] font-mono text-muted-foreground">IFSC: {request.seller?.ifsc || 'N/A'}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs font-medium text-muted-foreground">
                              {format(new Date(request.created_at), "MMM d, p")}
                            </TableCell>
                            <TableCell>
                              <Badge className={cn(
                                "border-none shadow-none font-bold text-[10px] px-2 py-0.5 rounded-lg",
                                request.status === 'pending' ? "bg-amber-500/10 text-amber-600" :
                                  request.status === 'processing' ? "bg-blue-500/10 text-blue-600" :
                                    request.status === 'completed' ? "bg-emerald-500/10 text-emerald-600" :
                                      "bg-rose-500/10 text-rose-600"
                              )}>
                                {request.status.toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 hover:bg-primary/10 hover:text-primary rounded-full">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {request.status === 'pending' && (
                                    <DropdownMenuItem className="cursor-pointer" onClick={() => handleUpdatePayoutStatus(request.id, 'processing')}>
                                      <Clock className="mr-2 h-4 w-4" /> Mark as Processing
                                    </DropdownMenuItem>
                                  )}
                                  {request.status === 'processing' && (
                                    <DropdownMenuItem className="cursor-pointer text-emerald-600 focus:text-emerald-600" onClick={() => handleUpdatePayoutStatus(request.id, 'completed')}>
                                      <CheckCircle2 className="mr-2 h-4 w-4" /> Confirm Payout (Complete)
                                    </DropdownMenuItem>
                                  )}
                                  {(request.status === 'pending' || request.status === 'processing') && (
                                    <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive" onClick={() => handleUpdatePayoutStatus(request.id, 'failed')}>
                                      <ArrowDownRight className="mr-2 h-4 w-4" /> Fail/Reject Request
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Detail Sheets Logic remains the same... */}
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetContent className="w-full sm:max-w-md p-0 flex flex-col border-l border-border/40 bg-card shadow-2xl">
            {selectedTransaction && (
              <>
                {/* Header with gradient */}
                <div className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground p-6 text-center">
                  {/* Accessibility Fix: Hidden Title & Description for Screen Readers/DialogContent compliance */}
                  <SheetHeader className="sr-only">
                    <SheetTitle>Order Details</SheetTitle>
                    <SheetDescription>Detailed view of order #{selectedTransaction.order_number}</SheetDescription>
                  </SheetHeader>
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
                    <Package className="h-7 w-7 text-white" />
                  </div>
                  <h2 className="text-xl font-bold">Order Details</h2>
                  <p className="text-sm opacity-80 font-mono">#{selectedTransaction.order_number?.slice(-8) || selectedTransaction.id.slice(0, 8)}</p>
                </div>

                {/* Status badge */}
                <div className="text-center py-4 border-b">
                  {getOrderStatusBadge(selectedTransaction.order_status || 'processing')}
                  <p className="text-muted-foreground text-sm mt-2">
                    {selectedTransaction.order_status === 'delivered' ? "Package successfully delivered" : "We are processing this order"}
                  </p>
                </div>

                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-6">

                    {/* Order Items */}
                    <div className="space-y-4">
                      <h3 className="font-semibold flex items-center gap-2 text-sm uppercase tracking-wider text-muted-foreground">
                        <ShoppingBag className="h-4 w-4" /> Items Purchased
                      </h3>
                      {selectedTransaction.items && Array.isArray(selectedTransaction.items) && selectedTransaction.items.length > 0 ? (
                        selectedTransaction.items.map((item: any, idx: number) => (
                          <div key={idx} className="bg-muted/30 rounded-xl p-3 border border-border/50 flex gap-4 items-start">
                            <div className="h-16 w-16 rounded-lg bg-white overflow-hidden border shadow-sm shrink-0">
                              {item.product?.variants?.[0]?.images?.[0] || item.image ? (
                                <img
                                  src={item.product?.variants?.[0]?.images?.[0] || item.image}
                                  alt={item.title}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center bg-gray-100">
                                  <ShoppingBag className="h-6 w-6 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm line-clamp-2" title={item.title}>{item.title}</h4>
                              <div className="flex justify-between items-center mt-1">
                                <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                                <p className="font-semibold text-sm">₹{(item.price * item.quantity).toLocaleString()}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground italic">No items details available.</p>
                      )}
                    </div>

                    {/* Payment Details */}
                    <div className="space-y-4">
                      <h3 className="font-semibold flex items-center gap-2 text-sm uppercase tracking-wider text-muted-foreground">
                        <Receipt className="h-4 w-4" /> Payment Info
                      </h3>
                      <Card className="bg-card/50 border-dashed">
                        <CardContent className="p-4 space-y-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Payment ID</span>
                            <span className="font-mono text-xs">{selectedTransaction.payment_id || `TXN-${selectedTransaction.id.slice(0, 8).toUpperCase()}`}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Method</span>
                            <span className="uppercase">{selectedTransaction.payment_method?.replace(/_/g, ' ') || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Status</span>
                            {getStatusBadge(selectedTransaction.payment_status)}
                          </div>
                          <Separator className="my-2" />
                          <div className="flex justify-between font-bold text-base">
                            <span>Total Paid</span>
                            <span className="text-primary">₹{(selectedTransaction.total || 0).toLocaleString()}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Customer Details */}
                    <div className="space-y-4">
                      <h3 className="font-semibold flex items-center gap-2 text-sm uppercase tracking-wider text-muted-foreground">
                        <Truck className="h-4 w-4" /> Customer & Delivery
                      </h3>
                      <div className="flex gap-3 text-sm text-muted-foreground bg-muted/20 p-4 rounded-xl border">
                        <MapPin className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                        <div>
                          <p className="font-medium text-foreground mb-1">{selectedTransaction.customer_name || 'Customer'}</p>
                          <p>{selectedTransaction.customer_email}</p>
                          {selectedTransaction.shipping_address && (
                            <>
                              <p className="mt-2">{selectedTransaction.shipping_address.address_line1}</p>
                              <p>{selectedTransaction.shipping_address.city}, {selectedTransaction.shipping_address.state} {selectedTransaction.shipping_address.pincode}</p>
                            </>
                          )}
                          {selectedTransaction.customer_phone && (
                            <p className="mt-2 text-xs font-mono">Ph: {selectedTransaction.customer_phone}</p>
                          )}
                        </div>
                      </div>
                    </div>

                  </div>
                </ScrollArea>

                {/* Footer Actions */}
                <div className="p-4 border-t bg-muted/30 space-y-3">
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => handleDownloadReceipt(selectedTransaction)}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Receipt
                  </Button>
                  {(selectedTransaction.payment_status === 'paid' || selectedTransaction.payment_status === 'completed') && (
                    <Button
                      className="w-full"
                      variant="destructive"
                      onClick={() => handleIssueRefund(selectedTransaction.id)}
                    >
                      Issue Refund
                    </Button>
                  )}
                  <Button className="w-full shadow-lg shadow-primary/20" size="lg" onClick={() => navigate(`/admin/orders/${selectedTransaction.id}`)}>
                    View Full Order Details <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                  <SheetClose asChild>
                    <Button variant="ghost" className="w-full">Close</Button>
                  </SheetClose>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>

        {/* Payout Rejection Modal */}
        <Dialog open={rejectionModalOpen} onOpenChange={setRejectionModalOpen}>
          <DialogContent className="sm:max-w-md bg-card border-border/60 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                Reject Payout Request
              </DialogTitle>
              <DialogDescription>
                Please provide a clear reason for rejecting this payout. This will be logged in the system and communicated to the seller.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="reason" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Rejection Reason</Label>
                <Textarea
                  id="reason"
                  placeholder="e.g., Banking details mismatch, Suspicious activity detected, Minimum threshold not met..."
                  className="min-h-[100px] bg-muted/20 border-border/40 rounded-xl"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" className="rounded-xl" onClick={() => setRejectionModalOpen(false)}>Cancel</Button>
              <Button
                className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={handlePayoutReject}
                disabled={!rejectionReason.trim()}
              >
                Confirm Rejection
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* High-Risk Action Confirmation Dialog */}
        <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
          <AlertDialogContent className="bg-card border-border/60 rounded-[2rem] p-8 shadow-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-2xl font-bold flex items-center gap-3">
                <Shield className="h-6 w-6 text-primary" />
                Administrative Authorization
              </AlertDialogTitle>
              <AlertDialogDescription className="text-base mt-2">
                {confirmAction?.type === 'refund' ? (
                  <>
                    You are about to issue a <strong>full refund</strong> for this transaction. This action will reverse the payment status and cannot be automatically undone.
                  </>
                ) : (
                  <>
                    You are about to authorize a <strong>payout completion</strong>. Ensure that the banking transfer has been initiated or confirmed externally before proceeding.
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 mt-4">
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <Activity className="h-3 w-3" />
                This action will be tied to your identity and written to the immutable audit registry.
              </p>
            </div>
            <AlertDialogFooter className="mt-8">
              <AlertDialogCancel className="rounded-xl border-border/50">Abort Action</AlertDialogCancel>
              <AlertDialogAction
                className="rounded-xl bg-primary shadow-lg shadow-primary/20"
                onClick={executeConfirmedAction}
              >
                Verify & Authorize
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div >
  );
}

