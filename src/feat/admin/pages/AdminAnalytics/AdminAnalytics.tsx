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
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex flex-col">
      <div className="w-full mx-auto py-3 sm:py-6 lg:py-8 px-2 sm:px-4 lg:px-6 xl:px-8 flex-1 flex flex-col gap-3 sm:gap-6 lg:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col gap-3 sm:gap-6 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                className="h-8 sm:h-9 rounded-xl border-border/40 bg-card/40 backdrop-blur-sm gap-2 font-bold text-xs w-fit justify-start"
                onClick={() => navigate("/admin")}
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl lg:text-2xl font-bold">Analytics & Reports</h1>
                <p className="text-xs sm:text-sm lg:text-base text-muted-foreground mt-0.5">Platform performance telemetry and market insights</p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button className="flex-1 sm:flex-none h-8 sm:h-10 rounded-xl font-bold text-xs bg-primary hover:bg-primary/90 shadow-md shadow-primary/20">
                <Download className="mr-2 h-3.5 w-3.5" />
                Export Report
              </Button>
            </div>
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
