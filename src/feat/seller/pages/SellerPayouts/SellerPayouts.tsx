import { useState, useEffect } from "react";
import { useToast } from "@/shared/hook/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/Card";
import { Button } from "@/ui/Button";
import { Badge } from "@/ui/Badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/Table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/Tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/Select";
import { DollarSign, TrendingUp, Clock, CheckCircle, Download, Calendar, Loader2, Wallet, ArrowUpRight, Lock, ShieldAlert, Sparkles, Filter } from "lucide-react";
import { format } from "date-fns";
import { apiClient } from "@/infra/api/apiClient";
import { useAuth } from "@/core/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { MARKETPLACE_FEE_PERCENTAGE } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/ui/Alert";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/ui/Popover";
import { ArrowRight, Calculator, FileCheck } from "lucide-react";
import { useProfile } from "@/shared/hook/useProfile";

interface Payout {
  id: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  period: string;
  date: string;
  transaction_id?: string;
}

interface Transaction {
  id: string;
  order_id: string;
  amount: number;
  commission: number;
  net_amount: number;
  date: string;
  status: string;
}

export default function SellerPayouts() {
  const { user, verificationStatus } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const [loading, setLoading] = useState(true);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { profile } = useProfile(user?.id);

  const [payoutStats, setPayoutStats] = useState({
    pendingBalance: 0,
    nextPayout: 0,
    totalEarnings: 0,
    commissionRate: MARKETPLACE_FEE_PERCENTAGE * 100,
    nextPayoutDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    fetchPayoutData();
  }, [user]);

  const handleWithdrawal = async () => {
    if (!user || payoutStats.pendingBalance < 1000) return;

    try {
      setIsRequesting(true);

      // Attempt to create a standard payout request
      await apiClient.post('/payouts/request', {
        amount: Math.floor(payoutStats.pendingBalance)
      });

      alert("Payout request submitted successfully! 🎉");
      fetchPayoutData();
    } catch (error: any) {
      console.error("Payout failed:", error);
      const msg = error.response?.data?.message || "Payout request failed";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setIsRequesting(false);
    }
  };

  const fetchPayoutData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Fetch Payout History
      const { data: payoutsResponse } = await apiClient.get('/payouts');
      const safePayouts = Array.isArray(payoutsResponse.data) ? payoutsResponse.data : [];
      const transformedPayouts: Payout[] = safePayouts.map((p: any) => ({
        id: p.id,
        amount: p.amount,
        status: p.status.toLowerCase(),
        period: p.periodStart && p.periodEnd ?
          `${format(new Date(p.periodStart), 'MMM dd')} - ${format(new Date(p.periodEnd), 'MMM dd, yyyy')}` :
          format(new Date(p.createdAt || p.created_at), 'MMM dd, yyyy'),
        date: p.createdAt || p.created_at,
        transaction_id: p.transactionId || p.transaction_id,
      }));

      setPayouts(transformedPayouts);

      // 2. Fetch Ledger Transactions
      const { data: transactionsResponse } = await apiClient.get('/payouts/transactions');
      const safeTransactions = Array.isArray(transactionsResponse.data) ? transactionsResponse.data : [];
      const transformedTransactions: Transaction[] = safeTransactions.map((t: any) => ({
        id: t.id,
        order_id: t.order_id,
        amount: t.amount,
        commission: t.commission,
        net_amount: t.net_amount,
        date: t.date,
        status: t.status,
      }));

      setTransactions(transformedTransactions);

      // 3. Fetch Payout Stats (Balance)
      const { data: statsResponse } = await apiClient.get('/payouts/stats');
      const stats = statsResponse.data;

      setPayoutStats({
        pendingBalance: stats.pendingBalance || 0,
        nextPayout: stats.pendingBalance > 1000 ? stats.pendingBalance : 0,
        totalEarnings: stats.totalEarnings || 0,
        commissionRate: 10,
        nextPayoutDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

    } catch (error) {
      console.error('Error fetching payout data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportTransactions = () => {
    if (transactions.length === 0) return;
    const headers = ["Order ID", "Date", "Order Amount", "Marketplace Fee", "Net Earnings", "Status"];
    const rows = transactions.map(t => [
      t.order_id,
      format(new Date(t.date), 'yyyy-MM-dd HH:mm'),
      `INR ${t.amount}`,
      `INR ${t.commission}`,
      `INR ${t.net_amount}`,
      t.status.toUpperCase()
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Pravokha_Statement_${format(new Date(), 'yyyy_MM_dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    toast({ title: "Statement Ready", description: "Standard transaction CSV downloaded." });
  };

  const exportTaxReport = () => {
    if (transactions.length === 0) return;

    const GST_RATE = 0.18;
    const FEE_RATE = MARKETPLACE_FEE_PERCENTAGE;

    const headers = ["Order ID", "Gross Amount", "Marketplace Fee", "GST (18%)", "Net Payout", "Date"];
    const rows = transactions.map(t => {
      const gst = t.amount * GST_RATE;
      const fee = t.commission;
      const net = t.amount - fee - gst;
      return [
        t.order_id,
        t.amount,
        fee,
        gst.toFixed(2),
        net.toFixed(2),
        format(new Date(t.date), 'yyyy-MM-dd')
      ];
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Pravokha_Tax_Report_${format(new Date(), 'yyyy_MM_dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    toast({ title: "Tax Report Exported", description: "Detailed tax and fee breakdown ready." });
  };

  const isVerified = verificationStatus?.toLowerCase() === 'verified';
  const hasTransactions = transactions && transactions.length > 0;

  if (loading) {
    return (
      <div className="container py-8 flex flex-col gap-8 animate-pulse">
        {/* Payouts Header Skeleton */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-muted rounded-lg" />
            <div className="h-4 w-72 bg-muted/60 rounded-lg" />
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <div className="h-12 w-32 bg-muted rounded-xl" />
            <div className="h-12 w-32 bg-muted rounded-xl" />
            <div className="h-12 w-32 bg-muted rounded-xl" />
          </div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-muted/20 rounded-2xl border border-border/40 p-6 space-y-4">
              <div className="flex justify-between items-center">
                <div className="h-4 w-24 bg-muted/60 rounded" />
                <div className="h-9 w-9 bg-muted/40 rounded-xl" />
              </div>
              <div className="h-8 w-32 bg-muted/80 rounded" />
            </div>
          ))}
        </div>

        {/* Tabs & Table Skeleton */}
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-border/20 pb-6 mb-2">
            <div className="h-14 w-full sm:w-[420px] bg-muted/20 rounded-xl" />
            <div className="h-10 w-32 bg-muted/20 rounded-xl" />
          </div>

          <div className="rounded-[32px] border border-border/40 overflow-hidden bg-card/40">
            <Table>
              <TableHeader>
                <TableRow className="border-b-border/40 h-16 bg-muted/10 transition-none">
                  <TableHead className="pl-8"><div className="h-4 w-20 bg-muted/60 rounded" /></TableHead>
                  <TableHead className="text-center"><div className="h-4 w-24 bg-muted/40 rounded mx-auto" /></TableHead>
                  <TableHead className="text-right"><div className="h-4 w-20 bg-muted/40 rounded ml-auto" /></TableHead>
                  <TableHead className="text-right"><div className="h-4 w-16 bg-muted/40 rounded ml-auto" /></TableHead>
                  <TableHead className="text-right"><div className="h-4 w-24 bg-muted/60 rounded ml-auto" /></TableHead>
                  <TableHead className="text-right pr-8"><div className="h-4 w-20 bg-muted/40 rounded ml-auto" /></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[1, 2, 3, 4, 5].map(i => (
                  <TableRow key={i} className="border-b-border/20 h-20 bg-muted/5 transition-none">
                    <TableCell className="pl-8"><div className="h-5 w-32 bg-muted/60 rounded" /></TableCell>
                    <TableCell className="text-center"><div className="h-4 w-24 bg-muted/30 rounded mx-auto" /></TableCell>
                    <TableCell className="text-right"><div className="h-5 w-24 bg-muted/40 rounded ml-auto" /></TableCell>
                    <TableCell className="text-right"><div className="h-4 w-20 bg-muted/40 rounded ml-auto" /></TableCell>
                    <TableCell className="text-right"><div className="h-6 w-28 bg-muted/80 rounded ml-auto" /></TableCell>
                    <TableCell className="text-right pr-8"><div className="h-7 w-20 bg-muted/60 rounded-full ml-auto" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Payouts</h1>
          <p className="text-xs sm:text-base text-muted-foreground mt-1">Manage payouts & settlements</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mt-4 lg:mt-0 sm:ml-auto lg:ml-0">
          <Button
            variant="default"
            className="flex-1 sm:flex-none h-11 sm:h-12 px-6 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm rounded-xl border border-emerald-500/20 transition-all active:scale-95 font-semibold"
            onClick={handleWithdrawal}
            disabled={!isVerified || payoutStats.pendingBalance < 1000 || isRequesting}
          >
            {isRequesting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wallet className="h-4 w-4 mr-2" />}
            Request payout
          </Button>
          <Button
            variant="outline"
            className="flex-1 sm:flex-none h-11 sm:h-12 px-6 border-border/60 rounded-xl hover:bg-muted transition-all active:scale-95 font-semibold"
            disabled={!isVerified || transactions.length === 0}
            onClick={exportTransactions}
          >
            {!isVerified ? <Lock className="h-4 w-4 mr-2" /> : <Download className="h-4 w-4 mr-2" />}
            Statement
          </Button>
          <Button
            variant="outline"
            className="flex-1 sm:flex-none h-11 sm:h-12 px-6 border-indigo-200 bg-indigo-50/50 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-500/20 shadow-sm transition-all active:scale-95 disabled:opacity-40 font-semibold"
            disabled={!isVerified || transactions.length === 0}
            onClick={exportTaxReport}
          >
            <Calculator className="h-4 w-4 mr-2" />
            Tax report
          </Button>
        </div>
      </div>

      {!isVerified && (
        <Alert className="border-amber-200 bg-amber-50 rounded-2xl p-6 overflow-hidden relative shadow-sm">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="bg-amber-100 text-amber-600 p-3 rounded-xl border border-amber-200">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div className="space-y-1 text-center md:text-left flex-1">
              <AlertTitle className="text-lg font-bold text-amber-900">Financial restriction active</AlertTitle>
              <AlertDescription className="text-amber-800/80 text-sm leading-relaxed">
                Your capital flow is currently paused. Please complete the marketplace compliance protocol to enable payouts.
              </AlertDescription>
            </div>
            <Button onClick={() => navigate('/seller/settings')} variant="outline" className="h-10 rounded-xl border-amber-300 text-amber-800 hover:bg-amber-100 font-semibold bg-white/50">
              Verify now <ArrowUpRight className="ml-2 h-3 w-3" />
            </Button>
          </div>
        </Alert>
      )}

      {/* Financial Pulse Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[
          { label: "Pending", val: payoutStats.pendingBalance, icon: Clock, sub: "To be settled", iconBg: "bg-blue-600" },
          { label: "Next Payout", val: payoutStats.nextPayout, icon: Calendar, sub: format(payoutStats.nextPayoutDate, 'MMM dd'), iconBg: "bg-violet-600" },
          { label: "Total Earnings", val: payoutStats.totalEarnings, icon: DollarSign, sub: "Lifetime net", iconBg: "bg-emerald-500" },
          { label: "Commission", val: `${payoutStats.commissionRate.toFixed(1)}%`, icon: TrendingUp, sub: "Platform fee", iconBg: "bg-rose-500" }
        ].map((s, i) => (
          <Card key={i} className="group overflow-hidden border border-border/60 bg-card shadow-sm hover:shadow-md transition-all duration-300 rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-5">
              <CardTitle className="text-sm font-semibold text-muted-foreground">{s.label}</CardTitle>
              <div className={cn("p-2 rounded-lg text-white opacity-80 group-hover:opacity-100 transition-opacity", s.iconBg)}>
                <s.icon className="h-3.5 w-3.5" />
              </div>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <div className="text-2xl font-bold tracking-tight">
                {typeof s.val === 'number' ? `₹${s.val.toLocaleString()}` : s.val}
              </div>
              <p className="text-xs text-muted-foreground mt-1 font-medium">
                {s.sub}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="transactions" className="space-y-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-border/20 pb-6 mb-2">
          <TabsList className="bg-muted/40 p-1 rounded-xl h-14 w-full sm:w-auto border border-border/20">
            <TabsTrigger value="transactions" className="flex-1 sm:flex-none rounded-lg px-4 sm:px-10 h-full font-bold text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-xl data-[state=active]:shadow-primary/5 data-[state=active]:border-border/40 transition-all duration-300">Ledger</TabsTrigger>
            <TabsTrigger value="payouts" className="flex-1 sm:flex-none rounded-lg px-4 sm:px-10 h-full font-bold text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-xl data-[state=active]:shadow-primary/5 data-[state=active]:border-border/40 transition-all duration-300">History</TabsTrigger>
            <TabsTrigger value="settings" className="flex-1 sm:flex-none rounded-lg px-4 sm:px-10 h-full font-bold text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-xl data-[state=active]:shadow-primary/5 data-[state=active]:border-border/40 transition-all duration-300">Banking</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-muted/40 px-4 py-2 rounded-[20px] border border-border/20">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="h-7 border-0 bg-transparent focus:ring-0 focus:ring-offset-0 p-0 text-[10px] font-bold w-[110px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-border/40 backdrop-blur-3xl shadow-2xl">
                  <SelectItem value="all">Full Horizon</SelectItem>
                  <SelectItem value="current">Current Cycle</SelectItem>
                  <SelectItem value="last">Pre-Cycle</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <TabsContent value="transactions" className="animate-in fade-in slide-in-from-top-2 duration-500">
          <Card className="border border-border/60 bg-card shadow-sm rounded-2xl overflow-hidden">
            <CardContent className="p-0">
              {/* Mobile View */}
              <div className="block sm:hidden p-4 space-y-4">
                {transactions.length === 0 ? (
                  <div className="h-40 flex flex-col items-center justify-center text-muted-foreground/30 gap-2 border border-dashed rounded-2xl">
                    <Clock className="h-8 w-8 opacity-20" />
                    <Clock className="h-8 w-8 opacity-20" />
                    <p className="text-sm font-bold">No ledger detected.</p>
                  </div>
                ) : transactions.map((t) => (
                  <div key={t.id} className="p-5 rounded-2xl border border-border/60 bg-background space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Entry id</p>
                        <h4 className="text-sm font-bold">{t.order_id}</h4>
                      </div>
                      <Badge variant={t.status === 'completed' ? 'default' : 'secondary'} className={cn(
                        "text-[10px] font-bold px-2.5 py-0.5 rounded-md",
                        t.status === 'completed' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
                      )}>
                        {t.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-end border-t border-dashed mt-2 pt-3">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Net flow</p>
                        <p className="text-lg font-bold text-emerald-600">₹{t.net_amount.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Gross: ₹{t.amount.toLocaleString()}</p>
                        <p className="text-[10px] font-bold text-muted-foreground">{format(new Date(t.date), 'MMM dd, HH:mm')}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop View */}
              <div className="hidden sm:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b-border/40 h-14 bg-muted/20 transition-none">
                      <TableHead className="font-semibold text-xs uppercase tracking-wider pl-8">Entry id</TableHead>
                      <TableHead className="font-semibold text-xs uppercase tracking-wider text-center">Timestamp</TableHead>
                      <TableHead className="font-semibold text-xs uppercase tracking-wider text-right">Order gross</TableHead>
                      <TableHead className="font-semibold text-xs uppercase tracking-wider text-right text-rose-500">System fee</TableHead>
                      <TableHead className="font-semibold text-xs uppercase tracking-wider text-right text-emerald-600">Net flow</TableHead>
                      <TableHead className="font-semibold text-xs uppercase tracking-wider text-right pr-8">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-40 text-center font-bold text-xs text-muted-foreground/30 italic">
                          No transactions detected in this cycle.
                        </TableCell>
                      </TableRow>
                    ) : transactions.map((t) => (
                      <TableRow key={t.id} className="border-b-border/20 group hover:bg-muted/5 transition-all duration-300 h-16 cursor-help">
                        <TableCell className="font-semibold text-sm pl-8 group-hover:pl-10 transition-all">
                          <Popover>
                            <PopoverTrigger asChild>
                              <span className="cursor-pointer hover:text-emerald-600 underline underline-offset-4 decoration-dotted decoration-border/40 transition-colors">
                                {t.order_id}
                              </span>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 rounded-2xl p-6 border-border/40 shadow-xl bg-card">
                              <div className="space-y-4">
                                <div className="flex items-center gap-3 border-b border-border/20 pb-4">
                                  <div className="p-2.5 bg-emerald-50 rounded-xl">
                                    <FileCheck className="h-5 w-5 text-emerald-600" />
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-sm">Payout audit</h4>
                                    <p className="text-xs text-muted-foreground font-medium">{t.order_id}</p>
                                  </div>
                                </div>

                                <div className="space-y-2.5">
                                  <div className="flex justify-between items-center text-xs font-medium">
                                    <span className="text-muted-foreground">Order Gross</span>
                                    <span className="font-bold">₹{t.amount.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-xs font-medium">
                                    <span className="text-muted-foreground">Marketplace Fee (5%)</span>
                                    <span className="font-bold text-rose-500">-₹{t.commission.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-xs font-medium">
                                    <span className="text-muted-foreground text-[10px] italic">Est. GST (18%)</span>
                                    <span className="font-bold text-rose-400/70">-₹{(t.amount * 0.18).toFixed(2)}</span>
                                  </div>
                                  <div className="pt-2.5 border-t border-border/20 mt-2 flex justify-between items-center">
                                    <span className="font-bold text-sm">Net payout</span>
                                    <span className="text-lg font-bold text-emerald-600">
                                      ₹{(t.amount - t.commission - (t.amount * 0.18)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </TableCell>
                        <TableCell className="text-xs font-medium text-muted-foreground text-center">{format(new Date(t.date), 'MMM dd, HH:mm')}</TableCell>
                        <TableCell className="text-right font-medium text-sm">₹{t.amount.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-medium text-rose-500 text-xs">-₹{t.commission.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-bold text-emerald-600 text-base">₹{t.net_amount.toLocaleString()}</TableCell>
                        <TableCell className="text-right pr-8">
                          <Badge variant={t.status === 'completed' ? 'default' : 'secondary'} className={cn(
                            "text-[10px] font-bold px-3 py-0.5 rounded-full",
                            t.status === 'completed' ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200" : "bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200"
                          )}>
                            {t.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="p-8 bg-muted/10 border-t border-border/40">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center max-w-4xl mx-auto">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-wider">Total Lifecycle Volume</p>
                    <p className="text-xl sm:text-2xl font-bold">₹{transactions.reduce((s, t) => s + t.amount, 0).toLocaleString()}</p>
                  </div>
                  <div className="space-y-1 border-x border-border/40 px-8">
                    <p className="text-[10px] uppercase font-bold text-rose-500/60 tracking-wider">Global Commissions</p>
                    <p className="text-xl sm:text-2xl font-bold text-rose-500">-₹{transactions.reduce((s, t) => s + t.commission, 0).toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-emerald-500/60 tracking-wider">Net Realized Capital</p>
                    <p className="text-xl sm:text-2xl font-bold text-emerald-600">₹{transactions.reduce((s, t) => s + t.net_amount, 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts" className="animate-in fade-in slide-in-from-top-2 duration-500">
          <Card className="border border-border/60 bg-card shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="p-6 pb-4">
              <CardTitle className="text-lg font-bold tracking-tight">Withdrawal Ledger</CardTitle>
              <CardDescription className="text-sm font-medium text-muted-foreground/70">Historical payout requests and settlement status.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {/* Mobile View */}
              <div className="block sm:hidden p-4 space-y-4">
                {payouts.length === 0 ? (
                  <div className="h-40 flex flex-col items-center justify-center text-muted-foreground/30 gap-2 border border-dashed rounded-2xl">
                    <Clock className="h-8 w-8 opacity-20" />
                    <p className="text-xs font-bold">No payouts recorded.</p>
                  </div>
                ) : payouts.map((p) => (
                  <div key={p.id} className="p-5 rounded-2xl border border-border/60 bg-background space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Period block</p>
                        <h4 className="text-sm font-bold">{p.period}</h4>
                      </div>
                      <Badge className={cn(
                        "text-[10px] font-bold px-2.5 py-0.5 rounded-md",
                        p.status === 'completed' ? "bg-emerald-500 text-white" : "bg-blue-500 text-white"
                      )}>
                        {p.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-end border-t border-dashed mt-2 pt-3">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Settlement amount</p>
                        <p className="text-lg font-bold">₹{p.amount.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-muted-foreground leading-none">ID: {p.id.slice(0, 8)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop View */}
              <div className="hidden sm:block overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/10">
                    <TableRow className="border-b-border/40 h-14 bg-muted/20 transition-none">
                      <TableHead className="font-semibold text-xs uppercase tracking-wider pl-8">Period block</TableHead>
                      <TableHead className="font-semibold text-xs uppercase tracking-wider text-right">Settlement amount</TableHead>
                      <TableHead className="font-semibold text-xs uppercase tracking-wider text-right pr-8">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payouts.map(p => (
                      <TableRow key={p.id} className="border-b-border/20 h-16 group hover:bg-muted/5 transition-all duration-300 animate-in fade-in">
                        <TableCell className="font-medium text-sm pl-8 text-muted-foreground group-hover:text-foreground transition-colors">{p.period}</TableCell>
                        <TableCell className="text-right font-bold text-base">₹{p.amount.toLocaleString()}</TableCell>
                        <TableCell className="text-right pr-8">
                          <Badge className={cn(
                            "text-[10px] font-bold px-3 py-1 rounded-full",
                            p.status === 'completed' ? "bg-emerald-500 text-white" : "bg-blue-600 text-white"
                          )}>
                            {p.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border border-border/60 bg-card shadow-sm rounded-2xl overflow-hidden relative group">
              <CardHeader className="p-6 pb-4">
                <CardTitle className="text-lg font-bold flex items-center justify-between">
                  Primary channel
                  <Wallet className="h-6 w-6 text-emerald-500 transition-transform group-hover:scale-110" />
                </CardTitle>
                <CardDescription className="text-sm font-medium text-muted-foreground/70">Designated bank account for instant payouts.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-6 pt-0">
                {isVerified ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted/20 border border-border/40 rounded-xl">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Account holder</p>
                        <p className="text-sm font-bold">{profile?.full_name || 'Verified Merchant'}</p>
                      </div>
                      <CheckCircle className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-muted/20 border border-border/40 rounded-xl">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Bank</p>
                        <p className="text-sm font-bold truncate">{profile?.bankAccount ? 'Linked Bank' : 'No Bank Linked'}</p>
                      </div>
                      <div className="p-4 bg-muted/20 border border-border/40 rounded-xl">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Identifier</p>
                        <p className="text-sm font-bold">****{profile?.bankAccount?.slice(-4) || 'XXXX'}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center gap-4 bg-muted/10 border border-dashed rounded-2xl">
                    <Lock className="h-8 w-8 text-muted-foreground/30" />
                    <p className="text-xs font-bold text-muted-foreground/50">Banking Locked</p>
                    <Button onClick={() => navigate('/seller/settings')} size="sm" variant="outline" className="h-8 rounded-lg text-[10px] font-bold">Unlock</Button>
                  </div>
                )}
                <Button
                  onClick={() => navigate('/seller/settings?tab=payment')}
                  disabled={!isVerified}
                  className="w-full h-11 rounded-xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all font-semibold"
                >
                  Manage channels
                </Button>
              </CardContent>
            </Card>

            <Card className="border border-border/60 bg-card shadow-sm rounded-2xl overflow-hidden relative">
              <CardHeader className="p-6 pb-4">
                <CardTitle className="text-lg font-bold">Schedule matrix</CardTitle>
                <CardDescription className="text-sm font-medium text-muted-foreground/70">Automated settlement frequency and limits.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-6 pt-0">
                <div className="p-6 bg-gradient-to-br from-emerald-50 to-primary/5 border border-emerald-100 rounded-2xl relative overflow-hidden">
                  <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">Cycle frequency</h4>
                  <p className="text-sm font-bold leading-relaxed text-emerald-900">
                    Payouts are audited and cleared bi-monthly on the 1st and 16th.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-muted/20 p-4 rounded-xl border border-border/40">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Burn threshold</span>
                    <span className="text-sm font-bold">₹1,000</span>
                  </div>
                  <div className="flex justify-between items-center bg-muted/20 p-4 rounded-xl border border-border/40">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Audit speed</span>
                    <span className="text-sm font-bold">3-5 Cycles</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div >
  );
}
