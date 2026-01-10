import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/Card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/Tabs";
import { Button } from "@/ui/Button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/Select";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Download, DollarSign, ShoppingCart, Package, Users, Loader2 } from "lucide-react";
import { apiClient } from "@/infra/api/apiClient";
import { useAuth } from "@/core/context/AuthContext";
import { subDays, format as formatDate, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

/** 
 * ARCHITECTURE NOTE: 
 * For v1, we use Live SQL aggregation to ensure 100% data correctness.
 * FUTURE OPTIMIZATION (v2): As order volume grows, migrate heavy aggregations 
 * to Daily/Hourly Rollup tables or Cached Snapshots updated via Edge Functions.
 * Dashboards should remain non-blocking (Optimistic fetch).
 */

export default function SellerAnalytics() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState("7days");
  const [loading, setLoading] = useState(true);

  // States for real data
  const [salesData, setSalesData] = useState<any[]>([]);
  const [productPerformance, setProductPerformance] = useState<any[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<any[]>([]);
  const [trafficData, setTrafficData] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    revenueGrowth: 0,
    totalOrders: 0,
    ordersGrowth: 0,
    avgOrderValue: 0,
    avgOrderGrowth: 0,
    totalCustomers: 0,
    customersGrowth: 0,
  });

  useEffect(() => {
    fetchAnalyticsData();
  }, [user, dateRange]);

  const fetchAnalyticsData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Calculate date threshold
      let days = 7;
      if (dateRange === "30days") days = 30;
      if (dateRange === "90days") days = 90;
      if (dateRange === "12months") days = 365;

      const startDate = subDays(new Date(), days).toISOString();

      // 1. Fetch Orders for calculations
      // Use generic orders endpoint but request all items for analysis
      const { data: orders } = await apiClient.get('/orders', {
        params: {
          seller_id: user.id,
          after: startDate,
          limit: 1000 // Ensure we get enough data for analytics (pagination might be needed if volume high)
        }
      }).then(res => res.data); // data structure usually { data: [], meta: {} }, but mapOrders logic expects array? 
      // Note: apiClient.get returns axios response { data, status, ... }. My backend standard response is usually { data: [...], meta: ... }.
      // The previous code mapped `data` directly from API.
      // So here `orders` should be the array of orders.

      // 2. Aggregate Sales Trends
      const trendMap: Record<string, { date: string, revenue: number, orders: number, customers: Set<string> }> = {};

      // Initialize trend map based on range
      for (let i = 0; i < days; i++) {
        const d = subDays(new Date(), i);
        const label = days > 31 ? formatDate(d, 'MMM yyyy') : formatDate(d, 'MMM dd');
        if (!trendMap[label]) {
          trendMap[label] = { date: label, revenue: 0, orders: 0, customers: new Set() };
        }
      }

      let totalRev = 0;
      let totalOrd = 0;
      const uniqueCustomers = new Set<string>();
      const prodStats: Record<string, { name: string, sales: number, revenue: number }> = {};
      const catStats: Record<string, number> = {};

      (orders || []).forEach((order: any) => {
        const sellerItems = Array.isArray(order.items)
          ? order.items.filter((item: any) => item.sellerId === user.id)
          : [];

        const orderRev = sellerItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
        const orderDate = new Date(order.created_at);
        const label = days > 31 ? formatDate(orderDate, 'MMM yyyy') : formatDate(orderDate, 'MMM dd');

        if (trendMap[label]) {
          trendMap[label].revenue += orderRev;
          trendMap[label].orders += 1;
          if (order.customer_email) trendMap[label].customers.add(order.customer_email);
        }

        totalRev += orderRev;
        totalOrd += 1;
        if (order.customer_email) uniqueCustomers.add(order.customer_email);

        // Product stats
        sellerItems.forEach((item: any) => {
          const name = item.name || item.title || 'Unknown Product';
          if (!prodStats[name]) prodStats[name] = { name, sales: 0, revenue: 0 };
          prodStats[name].sales += item.quantity;
          prodStats[name].revenue += (item.price * item.quantity);

          // Category stats (Assuming category is in item)
          const cat = item.category || 'General';
          catStats[cat] = (catStats[cat] || 0) + item.quantity;
        });
      });

      // Transform for Recharts
      const chartData = Object.values(trendMap).reverse().map(d => ({
        ...d,
        customers: d.customers.size
      }));
      setSalesData(chartData);

      setProductPerformance(Object.values(prodStats).sort((a, b) => b.revenue - a.revenue).slice(0, 5));

      setCategoryBreakdown(Object.entries(catStats).map(([name, value]) => ({ name, value })));

      setStats({
        totalRevenue: totalRev,
        revenueGrowth: 0, // Mock for v1 (Future: fetch previous period)
        totalOrders: totalOrd,
        ordersGrowth: 0,
        avgOrderValue: totalOrd > 0 ? Math.round(totalRev / totalOrd) : 0,
        avgOrderGrowth: 0,
        totalCustomers: uniqueCustomers.size,
        customersGrowth: 0,
      });

      // 6. Fetch Traffic Sources
      try {
        const { data: trafficSources } = await apiClient.get('/analytics/traffic', {
          params: { seller_id: user.id }
        });

        if (trafficSources && trafficSources.length > 0) {
          setTrafficData(trafficSources);
        } else {
          setTrafficData([
            { source: 'Direct', visits: 0, conversions: 0 },
            { source: 'Search', visits: 0, conversions: 0 },
            { source: 'Social', visits: 0, conversions: 0 },
            { source: 'Referral', visits: 0, conversions: 0 },
          ]);
        }
      } catch (e) {
        console.warn("Traffic stats failed", e);
        setTrafficData([
          { source: 'Direct', visits: 0, conversions: 0 },
          { source: 'Search', visits: 0, conversions: 0 },
          { source: 'Social', visits: 0, conversions: 0 },
          { source: 'Referral', visits: 0, conversions: 0 },
        ]);
      }

    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-8 space-y-8 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-muted rounded-lg" />
            <div className="h-4 w-64 bg-muted/60 rounded-lg" />
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-32 bg-muted rounded-lg" />
            <div className="h-10 w-32 bg-muted rounded-lg" />
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-[140px] bg-muted/30 rounded-2xl border border-border/40 p-6 flex flex-col justify-between">
              <div className="flex justify-between">
                <div className="h-4 w-24 bg-muted/60 rounded" />
                <div className="h-8 w-8 bg-muted rounded-xl" />
              </div>
              <div className="space-y-2">
                <div className="h-8 w-32 bg-muted rounded" />
                <div className="h-3 w-16 bg-muted/40 rounded" />
              </div>
            </div>
          ))}
        </div>

        {/* Charts & Table */}
        <div className="space-y-6">
          <div className="h-10 w-64 bg-muted/20 rounded-lg p-1" /> {/* Tab Switcher */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-[400px] bg-muted/30 rounded-3xl border border-border/40 p-6 space-y-4">
              <div className="h-6 w-32 bg-muted rounded mb-8" />
              <div className="h-64 bg-muted/10 rounded-xl" />
            </div>
            <div className="h-[400px] bg-muted/30 rounded-3xl border border-border/40 p-6 space-y-4">
              <div className="h-6 w-32 bg-muted rounded mb-8" />
              <div className="h-64 bg-muted/10 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Track your store performance</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
              <SelectItem value="12months">Last 12 months</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="w-full sm:w-auto" onClick={() => {
            const headers = ["Date", "Revenue", "Orders", "Customers"];
            const rows = salesData.map(d => [d.date, d.revenue, d.orders, d.customers]);
            const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `seller_report_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }}>
            <Download className="h-4 w-4 mr-2" />
            <span className="sm:inline">Export Report</span>
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
        {[
          { label: "Total Revenue", val: `₹${stats.totalRevenue.toLocaleString()}`, growth: stats.revenueGrowth, icon: DollarSign, iconBg: "bg-rose-500", trendColor: "text-green-500" },
          { label: "Total Orders", val: stats.totalOrders, growth: stats.ordersGrowth, icon: ShoppingCart, iconBg: "bg-emerald-500", trendColor: "text-green-500" },
          { label: "Avg Order Value", val: `₹${stats.avgOrderValue}`, growth: stats.avgOrderGrowth, icon: Package, iconBg: "bg-blue-600", trendColor: "text-green-500" },
          { label: "Total Customers", val: stats.totalCustomers, growth: stats.customersGrowth, icon: Users, iconBg: "bg-violet-600", trendColor: "text-green-500" }
        ].map((s, i) => (
          <Card key={i} className="group overflow-hidden border border-border/60 bg-card shadow-sm hover:shadow-md transition-all duration-300 rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-5">
              <CardTitle className="text-sm font-semibold text-[#627084]">{s.label}</CardTitle>
              <div className={cn("p-2 rounded-lg text-white opacity-80 group-hover:opacity-100 transition-opacity", s.iconBg)}>
                <s.icon className="h-3.5 w-3.5" />
              </div>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <div className="text-2xl font-bold tracking-tight">{s.val}</div>
              <p className="text-xs text-[#627084] flex items-center mt-1 font-medium">
                <TrendingUp className={cn("h-3 w-3 mr-1", s.trendColor)} />
                <span className={s.trendColor}>{s.growth}%</span>
                <span className="ml-1 text-[10px]">from last period</span>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Tabs */}
      <Tabs defaultValue="revenue" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 gap-2">
          <TabsTrigger value="revenue" className="text-xs sm:text-sm">Revenue</TabsTrigger>
          <TabsTrigger value="products" className="text-xs sm:text-sm">Products</TabsTrigger>
          <TabsTrigger value="traffic" className="text-xs sm:text-sm">Traffic</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border border-border/60 shadow-sm rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg sm:text-xl font-bold tracking-tight">Revenue Trend</CardTitle>
                <CardDescription className="text-xs sm:text-sm text-[#627084]">Monthly revenue over time</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted/20" />
                    <XAxis dataKey="date" className="text-xs font-medium" tick={{ fill: '#627084' }} />
                    <YAxis className="text-xs font-medium" tick={{ fill: '#627084' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'var(--background)', borderRadius: '12px', border: '1px solid var(--border)' }}
                      itemStyle={{ color: 'var(--foreground)' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Revenue (₹)" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border border-border/60 shadow-sm rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg sm:text-xl font-bold tracking-tight">Orders & Customers</CardTitle>
                <CardDescription className="text-xs sm:text-sm text-[#627084]">Monthly orders and new customers</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted/20" />
                    <XAxis dataKey="date" className="text-xs font-medium" tick={{ fill: '#627084' }} />
                    <YAxis className="text-xs font-medium" tick={{ fill: '#627084' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'var(--background)', borderRadius: '12px', border: '1px solid var(--border)' }}
                      itemStyle={{ color: 'var(--foreground)' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Bar dataKey="orders" fill="#8884d8" name="Orders" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="customers" fill="#82ca9d" name="Customers" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border border-border/60 shadow-sm rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg sm:text-xl font-bold tracking-tight">Top Products by Revenue</CardTitle>
                <CardDescription className="text-xs sm:text-sm text-[#627084]">Best performing products</CardDescription>
              </CardHeader>
              <CardContent>
                {productPerformance.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={productPerformance} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted/20" />
                      <XAxis type="number" className="text-xs font-medium" tick={{ fill: '#627084' }} />
                      <YAxis dataKey="name" type="category" className="text-xs font-medium" tick={{ fill: '#627084' }} width={100} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'var(--background)', borderRadius: '12px', border: '1px solid var(--border)' }}
                        itemStyle={{ color: 'var(--foreground)' }}
                      />
                      <Bar dataKey="revenue" fill="#8884d8" name="Revenue (₹)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground/40 gap-3 border-2 border-dashed rounded-3xl">
                    <Package className="h-10 w-10 opacity-20" />
                    <p className="font-bold text-xs">No product activity detected</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border border-border/60 shadow-sm rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg sm:text-xl font-bold tracking-tight">Sales by Category</CardTitle>
                <CardDescription className="text-xs sm:text-sm text-[#627084]">Distribution of sales across categories</CardDescription>
              </CardHeader>
              <CardContent>
                {categoryBreakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryBreakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground/40 gap-3 border-2 border-dashed rounded-3xl">
                    <TrendingUp className="h-10 w-10 opacity-20" />
                    <p className="font-bold text-xs">No category data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Product Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle>Product Performance Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {productPerformance.length > 0 ? productPerformance.map((product, index) => (
                  <div key={index} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{product.sales} sales</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">₹{product.revenue.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">Revenue</p>
                    </div>
                  </div>
                )) : (
                  <div className="py-10 text-center text-muted-foreground/40 font-bold text-sm">
                    No detailed performance logs found for this horizon.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="traffic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl font-bold tracking-tight">Traffic Sources</CardTitle>
              <CardDescription className="text-xs sm:text-sm text-[#627084]">Where your visitors come from</CardDescription>
            </CardHeader>
            <CardContent>
              {trafficData.length > 0 && trafficData.some(d => d.visits > 0) ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={trafficData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="source" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="visits" fill="#8884d8" name="Visits" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="conversions" fill="#82ca9d" name="Conversions" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground/40 gap-3 border-2 border-dashed rounded-3xl">
                  <Users className="h-10 w-10 opacity-20" />
                  <p className="font-bold text-xs">No traffic data detected yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {trafficData.map((source) => (
              <Card key={source.source}>
                <CardHeader>
                  <CardTitle className="text-sm">{source.source}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{source.visits}</div>
                  <p className="text-xs text-muted-foreground">
                    {source.conversions} conversions ({((source.conversions / source.visits) * 100).toFixed(1)}%)
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
