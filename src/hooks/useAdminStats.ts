import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AdminStats {
    totalProducts: number;
    totalUsers: number;
    totalSellers: number;
    totalSales: number;
    pendingOrders: number;
    revenue: number;
    salesTrend: { date: string; sales: number }[];
    topProducts: { name: string; sales: number }[];
    categoryDistribution: { name: string; value: number }[];
    revenueGrowth: { month: string; revenue: number }[];
}

export function useAdminStats() {
    const [stats, setStats] = useState<AdminStats>({
        totalProducts: 0,
        totalUsers: 0,
        totalSellers: 0,
        totalSales: 0,
        pendingOrders: 0,
        revenue: 0,
        salesTrend: [],
        topProducts: [],
        categoryDistribution: [],
        revenueGrowth: [],
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        // console.log("[useAdminStats] Starting to fetch admin statistics...");
        try {
            setLoading(true);

            // Fetch products count
            // console.log("[useAdminStats] Fetching products count...");
            const { count: productsCount, error: productsError } = await supabase
                .from("products")
                .select("*", { count: "exact", head: true });

            // if (productsError) console.error("[useAdminStats] Products error:", productsError);
            // console.log("[useAdminStats] Products count:", productsCount);

            // Fetch users count
            // console.log("[useAdminStats] Fetching users count...");
            const { count: usersCount, error: usersError } = await supabase
                .from("profiles")
                .select("*", { count: "exact", head: true });

            // if (usersError) console.error("[useAdminStats] Users error:", usersError);
            // console.log("[useAdminStats] Users count:", usersCount);

            // Fetch sellers count
            // console.log("[useAdminStats] Fetching sellers count...");
            const { count: sellersCount, error: sellersError } = await supabase
                .from("user_roles")
                .select("*", { count: "exact", head: true })
                .eq("role", "seller");

            // if (sellersError) console.error("[useAdminStats] Sellers error:", sellersError);
            // console.log("[useAdminStats] Sellers count:", sellersCount);

            // Fetch orders
            // console.log("[useAdminStats] Fetching orders...");
            const { data: orders, error: ordersError } = await supabase
                .from("orders")
                .select("*");

            // if (ordersError) console.error("[useAdminStats] Orders error:", ordersError);
            // console.log("[useAdminStats] Orders count:", orders?.length || 0);

            const totalOrders = orders?.length || 0;
            const pendingOrders = orders?.filter(o => o.order_status === "pending").length || 0;
            const totalRevenue = orders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;

            // Generate sales trend data (last 7 days)
            const salesTrend = generateSalesTrend(orders || []);

            // Calculate top products from orders
            const topProducts = calculateTopProducts(orders || []);

            // Calculate category distribution from orders
            const categoryDistribution = calculateCategoryDistribution(orders || []);

            // Revenue growth (last 6 months)
            const revenueGrowth = generateRevenueGrowth(orders || []);

            const finalStats = {
                totalProducts: productsCount || 0,
                totalUsers: usersCount || 0,
                totalSellers: sellersCount || 0,
                totalSales: totalOrders,
                pendingOrders,
                revenue: totalRevenue,
                salesTrend,
                topProducts,
                categoryDistribution,
                revenueGrowth,
            };

            // console.log("[useAdmin Stats] Final stats:", finalStats);
            setStats(finalStats);
        } catch (error) {
            // console.error("[useAdminStats] Error fetching admin stats:", error);
        } finally {
            setLoading(false);
            // console.log("[useAdminStats] Fetch complete");
        }
    };

    return { stats, loading, refetch: fetchStats };
}

function generateSalesTrend(orders: any[]) {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];

        const dayOrders = orders.filter(o =>
            o.created_at?.startsWith(dateStr)
        ).length;

        last7Days.push({
            date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            sales: dayOrders,
        });
    }
    return last7Days;
}

function generateRevenueGrowth(orders: any[]): { month: string; revenue: number }[] {
    const monthlyRevenue: { [key: string]: number } = {};

    orders.forEach(order => {
        if (order.created_at && order.total) {
            const orderDate = new Date(order.created_at);
            const monthKey = orderDate.toLocaleDateString("en-US", { month: "short", year: "numeric" });
            monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + order.total;
        }
    });

    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
        const monthLabel = date.toLocaleDateString("en-US", { month: "short" });

        last6Months.push({
            month: monthLabel,
            revenue: monthlyRevenue[monthKey] || 0,
        });
    }

    return last6Months;
}

function parseItems(items: any): any[] {
    if (Array.isArray(items)) return items;
    if (typeof items === 'string') {
        try {
            return JSON.parse(items);
        } catch (e) {
            return [];
        }
    }
    return [];
}

function calculateTopProducts(orders: any[]): { name: string; sales: number }[] {
    const productSales: { [key: string]: number } = {};

    orders.forEach(order => {
        const items = parseItems(order.items);
        items.forEach((item: any) => {
            const productName = item.title || "Unknown Product";
            productSales[productName] = (productSales[productName] || 0) + (item.quantity || 1);
        });
    });

    const topProductsArray = Object.entries(productSales)
        .map(([name, sales]) => ({ name, sales }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5);

    return topProductsArray.length > 0 ? topProductsArray : [];
}

function calculateCategoryDistribution(orders: any[]): { name: string; value: number }[] {
    const categoryCounts: { [key: string]: number } = {};

    orders.forEach(order => {
        const items = parseItems(order.items);
        items.forEach((item: any) => {
            const category = item.category || "Uncategorized";
            categoryCounts[category] = (categoryCounts[category] || 0) + (item.quantity || 1);
        });
    });

    const categoryArray = Object.entries(categoryCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    return categoryArray.length > 0 ? categoryArray : [];
}
