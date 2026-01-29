import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAdmin } from "@/core/context/AdminContext";
import { cn } from "@/lib/utils";
import { apiClient } from "@/infra/api/apiClient";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/ui/Card";
import { Button } from "@/ui/Button";
import { Badge } from "@/ui/Badge";
import {
  Package,
  Users,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Store,
  Shield,
  Clock,
  ArrowUpRight,
  AlertCircle,
  CheckCircle2,
  Activity,
  ChevronRight,
} from "lucide-react";
import { useAdminStats } from "@/shared/hook/useAdminStats";
import { StatsCard } from "@/feat/admin/components/StatsCard";
import { SalesChart } from "@/feat/admin/components/SalesChart";
import { RevenueChart } from "@/feat/admin/components/RevenueChart";
import { format } from "date-fns";

import { AdminSkeleton } from "@/feat/admin/components/AdminSkeleton";

export default function AdminDashboard() {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const { stats, loading: statsLoading, refetch: refetchStats } = useAdminStats();
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [systemHealth, setSystemHealth] = useState<'optimal' | 'degraded' | 'checking'>('checking');
  const [alerts, setAlerts] = useState<{ type: 'info' | 'warning' | 'error', message: string }[]>([]);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate("/auth");
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    const fetchRecentLogs = async () => {
      try {
        const response = await apiClient.get('/audit?limit=8');
        const logs = (response.data.data || []).map((log: any) => ({
          ...log,
          createdAt: log.createdAt || log.created_at || new Date().toISOString()
        }));
        setRecentLogs(logs);
      } catch (err) {
        console.error("[AdminDashboard] Error fetching recent logs:", err);
      }
    };

    const checkSystemHealth = async () => {
      try {
        // Use stats refetch as a health check
        await refetchStats();
        setSystemHealth('optimal');
      } catch (e) {
        console.warn("[AdminDashboard] System health check failed");
        setSystemHealth('degraded');
      }
    };

    if (isAdmin) {
      fetchRecentLogs();
      checkSystemHealth();
    }
  }, [isAdmin]);

  // Soft Rate Awareness logic
  useEffect(() => {
    if (recentLogs.length > 0) {
      const recentCount = recentLogs.filter(l => {
        const logDate = new Date(l.createdAt);
        const now = new Date();
        return (now.getTime() - logDate.getTime()) < 1000 * 60 * 5; // Last 5 mins
      }).length;

      const newAlerts = [];
      if (recentCount > 5) {
        newAlerts.push({ type: 'info', message: 'High administrative activity detected' });
      }

      const failedPayouts = recentLogs.filter(l => (l.actionType || l.action_type) === 'payout_rejected').length;
      if (failedPayouts > 1) {
        newAlerts.push({ type: 'warning', message: 'Spike in payout rejections detected' });
      }

      setAlerts(newAlerts as any);
    }
  }, [recentLogs]);

  if (adminLoading || statsLoading) {
    return <AdminSkeleton variant="dashboard" />;
  }

  if (!isAdmin) return null;

  const urgentTasks = [
    { title: "Pending Seller Verifications", count: stats.pendingVerifications, path: "/admin/users", type: "verification", color: "text-amber-500", icon: Store },
    { title: "Payout Requests", count: stats.pendingPayouts, path: "/admin/payments", type: "payout", color: "text-blue-500", icon: DollarSign },
    { title: "Open Support Tickets", count: stats.openTickets, path: "/admin/tickets", type: "support", color: "text-red-500", icon: AlertCircle },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="w-full mx-auto py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-6 xl:px-8 flex flex-col gap-4 sm:gap-6 lg:gap-8 pb-6 sm:pb-8 lg:pb-10"
    >
      {/* Header with Welcome Stats */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-xs sm:text-base text-muted-foreground mt-1">Platform performance and governance oversight</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className={cn(
            "flex items-center gap-2 px-4 py-2 border rounded-xl transition-colors",
            systemHealth === 'optimal' ? "bg-emerald-50 border-emerald-500/20 text-emerald-600 shadow-sm" :
              systemHealth === 'degraded' ? "bg-rose-50 border-rose-500/20 text-rose-600 shadow-sm" :
                "bg-muted border-border/20 text-muted-foreground shadow-sm"
          )}>
            <Activity className={cn("h-4 w-4", systemHealth === 'optimal' && "animate-pulse")} />
            <span className="text-sm font-semibold capitalize">System Health: {systemHealth}</span>
          </div>

          <AnimatePresence>
            {alerts.map((alert, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium shadow-sm transition-all hover:scale-105",
                  alert.type === 'warning' ? "bg-amber-50 border-amber-500/30 text-amber-600" : "bg-blue-50 border-blue-500/30 text-blue-600"
                )}
              >
                <AlertCircle className="h-3 w-3" />
                <span className="first-letter:uppercase">{alert.message}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Primary KPI Grid - Fully Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <motion.div variants={item} onClick={() => navigate('/admin/orders')} className="cursor-pointer">
          <StatsCard
            title="Total marketplace sales"
            value={stats.totalSales}
            icon={ShoppingCart}
            trend={{ value: 12, isPositive: true }}
            color="bg-emerald-500"
            description="Across all categories"
          />
        </motion.div>
        <motion.div variants={item} onClick={() => navigate('/admin/orders?status=pending')} className="cursor-pointer">
          <StatsCard
            title="Pending orders"
            value={stats.pendingOrders}
            icon={Clock}
            trend="Needs attention"
            color="bg-amber-500"
            description="Awaiting processing"
          />
        </motion.div>
        <motion.div variants={item} onClick={() => navigate('/admin/sellers')} className="cursor-pointer">
          <StatsCard
            title="Verified sellers"
            value={stats.totalSellers}
            icon={Store}
            trend="Stable capacity"
            color="bg-blue-600"
            description="Active marketplace partners"
          />
        </motion.div>
        <motion.div variants={item} onClick={() => navigate('/admin/payments')} className="cursor-pointer">
          <StatsCard
            title="Platform revenue"
            value={`₹${stats.revenue.toLocaleString()}`}
            icon={DollarSign}
            trend={{ value: 8.4, isPositive: true }}
            color="bg-rose-500"
            description="Gross merchandise value"
          />
        </motion.div>
      </div>

      {/* Top Section - Sales Chart + Urgent Actions */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Sales Chart - 2/3 width on desktop */}
        <motion.div variants={item} className="xl:col-span-2">
          <SalesChart data={stats.salesTrend} />
        </motion.div>

        {/* Urgent Action Center - 1/3 width on desktop */}
        <motion.div variants={item}>
          <Card className="border-primary/20 bg-primary/10 transition-all duration-500 rounded-xl relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 p-4">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            </div>
            <CardHeader className="p-6">
              <CardTitle className="text-sm font-medium">Urgent action center</CardTitle>
              <CardDescription className="text-xs">High-priority tasks requiring oversight</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-6 pt-0">
              {urgentTasks.map((task, idx) => (
                <div
                  key={idx}
                  onClick={() => navigate(task.path)}
                  className="flex items-center justify-between p-3 rounded-xl bg-background border border-border/60 shadow-sm transition-all hover:translate-x-1 cursor-pointer active:scale-95"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg bg-background border", task.color)}>
                      <task.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{task.title}</p>
                      <p className="text-[10px] text-muted-foreground">Action required now</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="font-semibold text-xs rounded-lg">
                    {task.count}
                  </Badge>
                </div>
              ))}
              <Button className="w-full mt-2 group shadow-lg shadow-primary/20 rounded-xl h-11" onClick={() => navigate("/admin/orders")}>
                Start Operations <ArrowUpRight className="ml-2 h-4 w-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Governance Feed - Full Width Row */}
      <motion.div variants={item}>
        <Card className="border-border/60 bg-card transition-all duration-500 rounded-xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between p-6">
            <div>
              <CardTitle className="text-sm font-medium">Governance feed</CardTitle>
              <CardDescription className="text-xs">Real-time audit telemetry</CardDescription>
            </div>
            <Shield className="h-5 w-5 text-muted-foreground/30" />
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {recentLogs.length > 0 ? (
                recentLogs.slice(0, 8).map((log) => (
                  <div key={log.id} className="relative pl-6 before:absolute before:left-0 before:top-1.5 before:bottom-0 before:w-[2px] before:bg-muted">
                    <div className="absolute left-[-4px] top-1.5 h-2 w-2 rounded-full border-2 border-background bg-primary" />
                    <p className="text-xs font-medium text-muted-foreground">
                      {format(new Date(log.createdAt), "h:mm a · MMM d")}
                    </p>
                    <p className="text-sm font-medium mt-1 line-clamp-2">
                      {log.description.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, 'User')}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-[9px] font-medium h-4 px-1 rounded-sm">
                        {(log.actionType || log.action_type || "").replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center py-10 text-center opacity-30">
                  <Shield className="h-10 w-10 mb-2" />
                  <p className="text-xs font-bold">No Recent Telemetry</p>
                </div>
              )}
            </div>
            <Button variant="outline" className="w-full mt-6 text-xs font-bold border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 transition-all" onClick={() => navigate("/admin/audit-logs")}>
              View Detailed Logs <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
          </CardContent>
        </Card>
      </motion.div>


      {/* Bottom Row - Inventory Health, Marketplace Reach, Top Performers */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Inventory Health */}
        <Card className="border-border/60 bg-card transition-all duration-500 rounded-xl shadow-sm">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-sm font-medium">Inventory health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6 pt-0">
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">Total Products</span>
              </div>
              <span className="text-lg font-semibold">{stats.totalProducts}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-orange-500/5 text-orange-600 border border-orange-500/10">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm font-medium">Low Stock Items</span>
              </div>
              <span className="text-lg font-semibold">{stats.lowStockItems}</span>
            </div>
            <Button variant="outline" className="w-full text-xs border-orange-200 hover:bg-orange-50" onClick={() => navigate("/admin/products/manage")}>
              Manage Inventory <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
          </CardContent>
        </Card>

        {/* Marketplace Reach */}
        <Card className="border-border/60 bg-card transition-all duration-500 rounded-xl shadow-sm">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-sm font-medium">Marketplace reach</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6 pt-0">
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
              <div className="flex items-center gap-3">
                <Store className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">Verified Sellers</span>
              </div>
              <span className="text-lg font-semibold">{stats.totalSellers}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-blue-500/5 text-blue-600 border border-blue-500/10">
              <div className="flex items-center gap-3">
                <ShoppingCart className="h-5 w-5" />
                <span className="text-sm font-medium">Active Orders</span>
              </div>
              <span className="text-lg font-semibold">{stats.pendingOrders}</span>
            </div>
            <Button variant="outline" className="w-full text-xs border-blue-200 hover:bg-blue-50" onClick={() => navigate("/admin/sellers")}>
              Manage Partners <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card className="border-border/60 bg-card transition-all duration-500 rounded-xl shadow-sm sm:col-span-2 xl:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between p-6">
            <div>
              <CardTitle className="text-sm font-medium">Top performers</CardTitle>
              <CardDescription className="text-xs">Highest velocity listings</CardDescription>
            </div>
            <TrendingUp className="h-5 w-5 text-emerald-500/50" />
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="space-y-4">
              {stats.topProducts.slice(0, 3).map((product, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50">
                  <div className="flex items-center gap-3">
                    <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold",
                      i === 0 ? "bg-blue-500" : i === 1 ? "bg-emerald-500" : "bg-purple-500"
                    )}>
                      {product.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold truncate max-w-[120px]">{product.name}</p>
                      <p className="text-[10px] text-muted-foreground font-medium">{product.sales} units sold</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-emerald-500 bg-emerald-500/5 border-emerald-500/10 text-[10px] font-semibold rounded-lg">
                    +{Math.floor(Math.random() * 20) + 5}%
                  </Badge>
                </div>
              ))}
              <Button variant="outline" className="w-full text-xs font-bold mt-2 border-emerald-200 hover:bg-emerald-50" onClick={() => navigate("/admin/products/manage")}>
                Full Product Analytics <ChevronRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
