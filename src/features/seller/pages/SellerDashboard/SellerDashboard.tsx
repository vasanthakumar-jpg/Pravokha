import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Package, ShoppingCart, TrendingUp, DollarSign, ShieldAlert, AlertCircle, Clock, ArrowUpRight, Zap, RefreshCw, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SalesChart from "@/features/seller/components/SalesChart";
import LowStockAlerts from "@/features/seller/components/LowStockAlerts";
import TopProducts from "@/features/seller/components/TopProducts";
import RecentOrders from "@/features/seller/components/RecentOrders";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/Alert";
import { OnboardingProgress } from "@/features/seller/components/OnboardingProgress";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function SellerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
  });
  const [products, setProducts] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<string>("pending");
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);

  const [salesData, setSalesData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [fullProfile, setFullProfile] = useState<any>(null);

  useEffect(() => {
    fetchSellerData();
  }, [user]);

  const fetchSellerData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      // Simulate a small delay to make the refresh perceptible and show the spinner
      await new Promise(resolve => setTimeout(resolve, 800));

      // 1. Fetch Verification Status from Profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!profileError && profile) {
        setVerificationStatus(profile.verification_status || "pending");
        setRejectionReason(profile.rejection_reason);
        setFullProfile(profile);
      }

      // Fetch seller's products
      const { data: products, error: productsError } = await (supabase as any)
        .from('products')
        .select('*, product_variants(product_sizes(stock))')
        .eq('seller_id', user.id);

      if (productsError) throw productsError;

      const transformedProducts = (products || []).map((product: any) => {
        const totalStock = product.product_variants?.reduce((sum: number, variant: any) => {
          const variantStock = variant.product_sizes?.reduce((s: number, size: any) => s + (size.stock || 0), 0) || 0;
          return sum + variantStock;
        }, 0) || 0;
        return {
          ...product,
          stock_quantity: totalStock
        };
      });

      // 2. Fetch All Seller Orders for Stats
      const { data: sellerOrders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('seller_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      const transformedOrders = (sellerOrders || []).slice(0, 10).map((order: any) => ({
        id: order.id,
        order_number: order.order_number,
        customer_name: order.customer_name,
        total: order.total,
        status: order.order_status,
        created_at: order.created_at,
        items_count: Array.isArray(order.items) ? order.items.length : 0,
      }));

      // 4. Calculate All-Time Stats & 7-Day Trends
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dailySales: Record<string, { date: string, sales: number, orders: number }> = {};

      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayName = days[d.getDay()];
        dailySales[dayName] = { date: dayName, sales: 0, orders: 0 };
      }

      let totalRevenue = 0;
      let pendingOrders = 0;
      const productStats: Record<string, { id: string, title: string, sales: number, revenue: number }> = {};

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      (sellerOrders || []).forEach((order: any) => {
        const orderDate = new Date(order.created_at);
        const orderRev = order.total || 0;

        totalRevenue += orderRev;
        if (order.order_status === 'pending') pendingOrders++;

        const dayName = days[orderDate.getDay()];
        if (orderDate >= sevenDaysAgo && dailySales[dayName]) {
          dailySales[dayName].sales += orderRev;
          dailySales[dayName].orders += 1;
        }

        if (Array.isArray(order.items)) {
          order.items.forEach((item: any) => {
            if (item.sellerId === user.id) {
              if (!productStats[item.id]) {
                productStats[item.id] = { id: item.id, title: item.name || item.info?.title || 'Product', sales: 0, revenue: 0 };
              }
              productStats[item.id].sales += (item.quantity || 1);
              productStats[item.id].revenue += ((item.price || 0) * (item.quantity || 1));
            }
          });
        }
      });

      setSalesData(Object.values(dailySales).reverse());
      setTopProducts(Object.values(productStats).sort((a, b) => b.revenue - a.revenue).slice(0, 5));
      setProducts(transformedProducts);
      setRecentOrders(transformedOrders);
      setStats({
        totalProducts: transformedProducts.length || 0,
        totalOrders: sellerOrders?.length || 0,
        totalRevenue: totalRevenue,
        pendingOrders: pendingOrders,
      });

      if (loading) { // Only show toast if user clicked refresh (loading was already true)
        toast.success("Dashboard refreshed", {
          description: "Your store metrics are now up to date."
        });
      }
    } catch (error) {
      console.error("[SellerDashboard] Error fetching data:", error);
      toast.error("Failed to refresh data");
    } finally {
      setLoading(false);
    }
  };

  const isVerified = verificationStatus === 'verified';

  if (loading) {
    return (
      <div className="container py-8 space-y-10 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-8 w-40 bg-muted rounded-xl" />
            <div className="h-4 w-60 bg-muted/60 rounded-lg" />
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-24 bg-muted rounded-xl" />
            <div className="h-10 w-10 bg-muted rounded-xl" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-8">
            {/* Store Pulse Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-muted/30 rounded-2xl border border-border/40" />
              ))}
            </div>

            {/* Sales Chart Skeleton */}
            <div className="h-[400px] bg-muted/30 rounded-2xl border border-border/40 p-6 space-y-4">
              <div className="flex justify-between">
                <div className="h-6 w-32 bg-muted rounded-lg" />
                <div className="h-8 w-24 bg-muted rounded-lg" />
              </div>
              <div className="h-full w-full bg-muted/20 rounded-lg" />
            </div>
          </div>

          <div className="lg:col-span-4 space-y-8">
            {/* Stock Alerts Skeleton */}
            <div className="h-64 bg-muted/30 rounded-2xl border border-border/40 p-4 space-y-3">
              <div className="h-6 w-40 bg-muted rounded-lg mb-4" />
              <div className="h-12 w-full bg-muted/20 rounded-xl" />
              <div className="h-12 w-full bg-muted/20 rounded-xl" />
              <div className="h-12 w-full bg-muted/20 rounded-xl" />
            </div>

            {/* Recent Orders Skeleton */}
            <div className="h-80 bg-muted/30 rounded-2xl border border-border/40 p-4 space-y-3">
              <div className="h-6 w-40 bg-muted rounded-lg mb-4" />
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex gap-3">
                  <div className="h-10 w-10 bg-muted rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 bg-muted rounded" />
                    <div className="h-3 w-1/2 bg-muted/60 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Premium Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="responsive-h1">Store pulse</h1>
          <p className="responsive-body text-muted-foreground mt-1">Live activity for {user?.email}</p>
        </div>

        <div className="flex items-center gap-3">
          {!isVerified && (
            <Badge variant="outline" className="h-10 px-4 flex items-center gap-2 border-primary/20 bg-primary/5 text-primary rounded-xl shadow-sm">
              <ShieldAlert className="h-4 w-4 animate-bounce" /> {verificationStatus === 'pending' ? 'Verification Pending' : verificationStatus.replace('_', ' ')}
            </Badge>
          )}
          <Button onClick={fetchSellerData} variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-primary/10 dark:text-white dark:hover:bg-primary/20 transition-colors">
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-8">
          {/* VERIFICATION BANNERS - Refined */}
          {verificationStatus === 'pending' && (
            <Alert className="border-primary/20 bg-primary/5 overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
                <Clock className="h-16 w-16" />
              </div>
              <Clock className="h-5 w-5 text-primary" />
              <AlertTitle className="text-primary responsive-h4">Verification under review</AlertTitle>
              <AlertDescription className="responsive-body text-muted-foreground mt-1 pr-12">
                Our compliance team is auditing your business documents. This typically takes 24-48 hours.
                Full marketplace features will unlock automatically upon approval.
              </AlertDescription>
            </Alert>
          )}

          {verificationStatus === 'rejected' && (
            <Alert variant="destructive" className="border-destructive/20 bg-destructive/5 overflow-hidden relative">
              <AlertCircle className="h-5 w-5" />
              <AlertTitle className="responsive-h4">Identity rejected</AlertTitle>
              <AlertDescription className="space-y-3 responsive-body mt-1">
                <p>Action required: Your registration for Pravokha was not approved.</p>
                <div className="p-4 bg-background/50 backdrop-blur rounded-2xl border border-destructive/10 responsive-small italic text-destructive">
                  Reason: {rejectionReason || "Please verify your business documents and contact support."}
                </div>
                <Button variant="destructive" size="sm" onClick={() => navigate('/seller/settings')} className="responsive-button rounded-xl h-8 px-6">
                  Fix now
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Premium Stats Grid */}
          <div className={cn(
            "grid grid-cols-1 md:grid-cols-2 gap-6 transition-all duration-500",
            !isVerified && "opacity-60 grayscale-[0.5] blur-[1px] pointer-events-none"
          )}>
            {[
              { label: "Inventory", val: stats.totalProducts, icon: Package, sub: "Live products", color: "from-blue-600 to-blue-400", iconBg: "bg-blue-600" },
              { label: "Orders", val: stats.totalOrders, icon: ShoppingCart, sub: "Total lifecycle", color: "from-emerald-500 to-emerald-400", iconBg: "bg-emerald-500" },
              { label: "Revenue", val: `₹${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, sub: "Gross earnings", color: "from-rose-500 to-rose-400", iconBg: "bg-rose-500" },
              { label: "Processing", val: stats.pendingOrders, icon: TrendingUp, sub: "Needs attention", color: "from-violet-600 to-violet-400", iconBg: "bg-violet-600" }
            ].map((s, i) => (
              <Card key={i} className="group overflow-hidden border-border/40 bg-card/40 backdrop-blur-xl hover:border-primary/40 transition-all duration-500 rounded-2xl relative shadow-none">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-4 sm:p-6">
                  <CardTitle className="responsive-label">{s.label}</CardTitle>
                  <div className={cn("p-2 rounded-xl text-white shadow-sm transition-transform duration-500 group-hover:scale-110", s.iconBg)}>
                    <s.icon className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="responsive-h2">{s.val}</div>
                  <p className="responsive-small text-muted-foreground mt-1 flex items-center gap-1.5">
                    <span className="h-1 w-1 rounded-full bg-primary/40" />
                    {s.sub}
                  </p>
                </CardContent>
                <div className={cn(
                  "absolute top-0 right-0 w-24 h-24 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-700 blur-2xl rounded-full -mr-12 -mt-12",
                  s.iconBg
                )} />
              </Card>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 sticky top-24">
          <OnboardingProgress profile={fullProfile} productsCount={stats.totalProducts} />
        </div>
      </div>

      {/* Main Content Gating - Enhanced Blur */}
      <div className="relative pt-4">
        {!isVerified && (
          <div className="absolute inset-0 z-10 bg-background/40 backdrop-blur-[6px] rounded-[40px] flex items-center justify-center border border-white/10 shadow-2xl overflow-hidden mt-4">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/80 to-background" />
            <Card className="max-w-md text-center p-10 shadow-2xl border-primary/20 bg-card/80 backdrop-blur-3xl relative z-20 rounded-[32px] scale-in-center">
              <div className="bg-primary/10 w-20 h-20 rounded-[24px] flex items-center justify-center mx-auto mb-6 rotate-12 group-hover:rotate-0 transition-transform">
                <ShieldAlert className="h-10 w-10 text-primary" />
              </div>
              <h3 className="responsive-h1 italic">Full access restricted</h3>
              <p className="responsive-body text-muted-foreground mt-4 leading-relaxed">
                Connect your business identity to unlock deep analytics, order management, and instant payouts.
              </p>
              <Button
                variant="default"
                className="mt-8 h-12 px-8 rounded-2xl responsive-button bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all"
                onClick={() => navigate('/seller/settings?tab=business')}
              >
                Start verification <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-10">
          <div className="bg-card/40 backdrop-blur-xl border border-border/40 rounded-[32px] p-1">
            <SalesChart data={salesData} type="line" className="border-0 shadow-none bg-transparent" />
          </div>
          <div className="bg-card/40 backdrop-blur-xl border border-border/40 rounded-[32px] p-1">
            <LowStockAlerts products={products} isGhost />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 pb-10">
          <div className="xl:col-span-7 bg-card/40 backdrop-blur-xl border border-border/40 rounded-[32px] p-1">
            <RecentOrders orders={recentOrders} isGhost />
          </div>
          <div className="xl:col-span-5 bg-card/40 backdrop-blur-xl border border-border/40 rounded-[32px] p-1">
            <TopProducts products={topProducts} isGhost />
          </div>
        </div>
      </div>
    </div>
  );
}
