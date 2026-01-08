import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "@/core/context/AdminContext";

import { Card, CardContent, CardHeader, CardTitle } from "@/ui/Card";
import { Button } from "@/ui/Button";
import { ArrowLeft, TrendingUp, Users, ShoppingBag, DollarSign, Download } from "lucide-react";
import { useAdminStats } from "@/shared/hook/useAdminStats";
import { StatsCard } from "@/feat/admin/components/StatsCard";
import { SalesChart } from "@/feat/admin/components/SalesChart";
import { RevenueChart } from "@/feat/admin/components/RevenueChart";
import { TopProductsChart } from "@/feat/admin/components/TopProductsChart";
import { CategoryDistribution } from "@/feat/admin/components/CategoryDistribution";

import { AdminSkeleton, AdminHeaderSkeleton } from "@/feat/admin/components/AdminSkeleton";

export default function AdminAnalytics() {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const { stats, loading: statsLoading } = useAdminStats();

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate("/auth");
    }
  }, [isAdmin, adminLoading, navigate]);

  if (adminLoading || statsLoading) {
    return (
      <div className="container max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
        <AdminHeaderSkeleton showBack={true} showTitle={true} showDescription={true} />
        <AdminSkeleton variant="analytics" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="w-full mx-auto py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-6 xl:px-8 flex-1 flex flex-col gap-4 sm:gap-6 lg:gap-8 pb-6 sm:pb-8 lg:pb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              className="h-10 w-10 rounded-xl border-border/60 bg-card p-0 flex items-center justify-center shadow-sm hover:bg-accent transition-colors"
              onClick={() => navigate("/admin")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Analytics & Reports</h1>
              <p className="text-xs sm:text-base text-muted-foreground mt-1">Platform performance insights</p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Button className="flex-1 md:flex-none h-10 rounded-xl font-bold text-xs bg-primary hover:bg-primary/90 shadow-md shadow-primary/20 border-0">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>

        {/* KPI Stats Grid - Fully Responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
          <StatsCard
            title="Total Marketplace Sales"
            value={stats.totalSales}
            icon={ShoppingBag}
            trend={{ value: 12, isPositive: true }}
            color="bg-emerald-500"
            description="Across all categories"
          />
          <StatsCard
            title="Total Platform Revenue"
            value={`₹${stats.revenue.toLocaleString()}`}
            icon={DollarSign}
            trend={{ value: 8.4, isPositive: true }}
            color="bg-rose-500"
            description="Gross merchandise value"
          />
          <StatsCard
            title="Community growth"
            value={stats.totalUsers}
            icon={Users}
            trend="+5.2%"
            color="bg-blue-600"
            description="New active participants"
          />
          <StatsCard
            title="Operational Load"
            value={stats.pendingOrders}
            icon={TrendingUp}
            trend="Needs attention"
            color="bg-amber-500"
            description="Awaiting processing"
          />
        </div>

        {/* Charts Grid - Responsive */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
          <SalesChart data={stats.salesTrend} />
          <RevenueChart data={stats.revenueGrowth} />
        </div>

        {/* Bottom Charts Grid - Responsive */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6 lg:gap-8 mb-6 sm:mb-8">
          <TopProductsChart data={stats.topProducts} />
          <CategoryDistribution data={stats.categoryDistribution} />
        </div>
      </div>
    </div>
  );
}
