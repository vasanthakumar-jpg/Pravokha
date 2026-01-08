import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/ui/Card";
import { Button } from "@/ui/Button";
import { useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/Select";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import {
  Download,
  Calendar,
  TrendingUp,
  Users,
  DollarSign,
  ShoppingBag,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeft,
  Filter
} from "lucide-react";
import { Badge } from "@/ui/Badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/Table";
import { supabase } from "@/infra/api/supabase";
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval } from "date-fns";
import { useAdmin } from "@/core/context/AdminContext";

import { AdminSkeleton, AdminHeaderSkeleton } from "@/feat/admin/components/AdminSkeleton";
import { StatsCard } from "@/feat/admin/components/StatsCard";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function AdminReports() {
  const [dateRange, setDateRange] = useState("7d");
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdmin();

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate("/auth");
    }
  }, [isAdmin, adminLoading, navigate]);

  const [stats, setStats] = useState({
    revenue: 0,
    orders: 0,
    activeSellers: 0,
    conversionRate: 3.2 // Mocked for now as we don't track visits yet
  });
  const [salesData, setSalesData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [productFilter, setProductFilter] = useState<string>("all");
  const [currentProductPage, setCurrentProductPage] = useState(1);
  const [productsPerPage] = useState(5);

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Calculate Date Range
      const now = new Date();
      let startDate = subDays(now, 7);

      if (dateRange === '24h') startDate = subDays(now, 1);
      if (dateRange === '30d') startDate = subDays(now, 30);
      if (dateRange === '90d') startDate = subDays(now, 90);
      if (dateRange === '1y') startDate = subDays(now, 365);

      // 2. Fetch Orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (ordersError) throw ordersError;

      // 3. Calculate KPI Stats
      const revenue = orders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;
      const orderCount = orders?.length || 0;

      // 4. Fetch Active Sellers (Mock logic: count unique sellers from products)
      // Since we don't have a direct link in orders to sellers easily without joins, 
      // we'll fetch from profiles where role is seller
      const { count: sellerCount } = await supabase
        .from("users")
        .select('*', { count: 'exact', head: true })
        .eq('role', 'seller');

      setStats(prev => ({
        ...prev,
        revenue,
        orders: orderCount,
        activeSellers: sellerCount || 0
      }));

      // 5. Prepare Chart Data (Sales over time)
      const days = eachDayOfInterval({ start: startDate, end: now });
      const chartData = days.map(day => {
        const dayStr = format(day, 'MMM dd');
        const dayOrders = orders?.filter(o =>
          format(new Date(o.created_at), 'MMM dd') === dayStr
        );
        const dayRevenue = dayOrders?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;
        return {
          name: dayStr,
          revenue: dayRevenue,
          orders: dayOrders?.length || 0
        };
      });
      setSalesData(chartData);

      // 6. Calculate Category Data from real orders
      const categoryCounts: { [key: string]: number } = {};
      orders?.forEach(order => {
        if (Array.isArray(order.items)) {
          order.items.forEach((item: any) => {
            const category = item.category || "Uncategorized";
            categoryCounts[category] = (categoryCounts[category] || 0) + (item.quantity || 1);
          });
        }
      });

      const categoryArray = Object.entries(categoryCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      setCategoryData(categoryArray.length > 0 ? categoryArray : []);

      // 7. Calculate Top Products from real orders
      const productStats: {
        [key: string]: {
          name: string;
          sales: number;
          revenue: number;
        }
      } = {};

      orders?.forEach(order => {
        if (Array.isArray(order.items)) {
          order.items.forEach((item: any) => {
            const productName = item.title || "Unknown Product";
            if (!productStats[productName]) {
              productStats[productName] = { name: productName, sales: 0, revenue: 0 };
            }
            productStats[productName].sales += (item.quantity || 1);
            productStats[productName].revenue += (item.price || 0) * (item.quantity || 1);
          });
        }
      });

      const topProductsArray = Object.values(productStats)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)
        .map((product, index) => ({
          id: index + 1,
          name: product.name,
          sales: product.sales,
          revenue: `₹${product.revenue.toLocaleString()}`,
          growth: "+0%" // Growth calculation would require historical data comparison
        }));

      setTopProducts(topProductsArray.length > 0 ? topProductsArray : []);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (adminLoading || loading) {
    return (
      <div className="container max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
        <AdminHeaderSkeleton showBack={true} showTitle={true} showDescription={true} showActions={true} />
        <AdminSkeleton variant="reports" />
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto py-8 px-4 sm:px-6 lg:px-8 flex flex-col gap-8 animate-in fade-in duration-500 pb-10">
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
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Reports & Analytics</h1>
            <p className="text-xs sm:text-base text-muted-foreground mt-1">
              Comprehensive telemetry of platform operations and financial growth
            </p>
          </div>
        </div>
        <div className="flex flex-wrap lg:flex-nowrap items-center gap-3 w-full lg:w-auto mt-4 lg:mt-0">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="flex-1 sm:flex-none w-full sm:w-[180px] h-10 rounded-xl border-border/60 bg-card font-medium text-sm shadow-sm">
              <Calendar className="mr-2 h-4 w-4 text-primary" />
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/60 bg-card shadow-lg">
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="flex-1 sm:flex-none h-10 rounded-xl border-border/60 bg-card font-medium text-xs shadow-sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Cards - Fully Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <StatsCard
          title="Total Platform Revenue"
          value={`₹${stats.revenue.toLocaleString()}`}
          trend={{ value: 20.1, isPositive: true }}
          color="bg-rose-500"
          icon={DollarSign}
          description="Gross merchandise volume"
        />
        <StatsCard
          title="Transaction Count"
          value={stats.orders.toString()}
          trend={{ value: 180.1, isPositive: true }}
          color="bg-emerald-500"
          icon={ShoppingBag}
          description="Successful order flow"
        />
        <StatsCard
          title="Governance Reach"
          value={stats.activeSellers.toString()}
          trend={{ value: 19, isPositive: true }}
          color="bg-blue-600"
          icon={Users}
          description="Verified active partners"
        />
        <StatsCard
          title="Conversion Efficiency"
          value={`${stats.conversionRate}%`}
          trend={{ value: 4, isPositive: false }}
          color="bg-violet-600"
          icon={TrendingUp}
          description="Session to success ratio"
        />
      </div>

      {/* Charts Section - Responsive Layout */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 xl:grid-cols-7">
        <Card className="col-span-1 lg:col-span-4 border-border/60 bg-card transition-all duration-500 rounded-xl shadow-sm">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-sm font-medium">Revenue velocity</CardTitle>
            <CardDescription className="text-xs">
              Platform transaction volume and flow lifecycle
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-2">
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} opacity={0.3} />
                  <XAxis
                    dataKey="name"
                    stroke="#888888"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    fontWeight={600}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    fontWeight={600}
                    tickFormatter={(value) => `₹${value}`}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    itemStyle={{ color: 'hsl(var(--popover-foreground))', fontWeight: 600, fontSize: '12px' }}
                    labelStyle={{ fontWeight: 700, marginBottom: '4px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#8884d8"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 lg:col-span-3 border-border/60 bg-card transition-all duration-500 rounded-xl shadow-sm">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-sm font-medium">Sales by category</CardTitle>
            <CardDescription className="text-xs">
              Distribution of sales across top categories
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-2">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    fill="#8884d8"
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '12px' }}
                    itemStyle={{ color: 'hsl(var(--popover-foreground))', fontWeight: 600 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-8">
              {categoryData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-[11px] font-bold text-muted-foreground truncate">{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Product Performance Table */}
      <Card className="border-border/60 bg-card transition-all duration-500 rounded-xl shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 gap-4">
          <div>
            <CardTitle className="text-sm font-medium">Top performing products</CardTitle>
            <CardDescription className="text-xs">
              Products with the highest sales volume
            </CardDescription>
          </div>
          <div className="flex-shrink-0 w-full sm:w-auto">
            <Select value={productFilter} onValueChange={setProductFilter}>
              <SelectTrigger className="w-full sm:w-[220px] h-10 rounded-xl border-border/60 bg-card font-medium text-sm shadow-sm">
                <Filter className="mr-2 h-4 w-4 text-primary" />
                <SelectValue placeholder="All products" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/60 bg-card shadow-lg">
                <SelectItem value="all">All products</SelectItem>
                <SelectItem value="high-sales">High sales (&gt;10)</SelectItem>
                <SelectItem value="top-revenue">Top revenue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-border/40">
                <TableHead className="px-6 h-12 text-[11px] font-bold tracking-wider text-muted-foreground/60 normal-case">Product Name</TableHead>
                <TableHead className="text-right text-[11px] font-bold tracking-wider text-muted-foreground/60 normal-case">Sales</TableHead>
                <TableHead className="text-right text-[11px] font-bold tracking-wider text-muted-foreground/60 normal-case">Revenue</TableHead>
                <TableHead className="text-right pr-10 text-[11px] font-bold tracking-wider text-muted-foreground/60 normal-case">Growth</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topProducts
                .filter(product => {
                  if (productFilter === "all") return true;
                  if (productFilter === "high-sales") return product.sales > 10;
                  if (productFilter === "top-revenue") {
                    const revenue = parseInt(product.revenue.replace(/[^0-9]/g, ''));
                    return revenue > 5000;
                  }
                  return true;
                })
                .map((product) => (
                  <TableRow key={product.id} className="hover:bg-primary/5 transition-colors border-border/40">
                    <TableCell className="px-6 py-4 font-bold text-sm tracking-tight">{product.name}</TableCell>
                    <TableCell className="text-right font-bold text-sm">{product.sales}</TableCell>
                    <TableCell className="text-right font-bold text-sm">{product.revenue}</TableCell>
                    <TableCell className="text-right pr-10">
                      <Badge variant={product.growth.startsWith('+') ? 'default' : 'destructive'} className="bg-emerald-500/10 text-emerald-600 border-none shadow-none font-bold text-[10px] px-2 py-0.5 rounded-lg">
                        {product.growth}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
          {topProducts.length === 0 && (
            <div className="py-20 text-center">
              <ShoppingBag className="h-10 w-10 mx-auto mb-4 opacity-10" />
              <p className="font-bold text-muted-foreground/30 text-sm">No transaction telemetry found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

