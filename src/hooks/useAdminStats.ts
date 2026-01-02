import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/contexts/AdminContext";

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
    const { isAdmin, loading: adminLoading } = useAdmin();
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
        if (isAdmin) {
            fetchStats();
        } else if (!adminLoading) {
            setLoading(false);
        }
    }, [isAdmin, adminLoading]);

    const fetchStats = async () => {
        if (!isAdmin) return;
        try {
            setLoading(true);

            const timeoutMs = 25000;
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Request timed out')), timeoutMs)
            );

            // Fetch all stats in parallel for efficiency
            const fetchPromise = Promise.all([
                // 1. Products count
                supabase.from("products").select("*", { count: "exact", head: true }),
                // 2. Users count
                supabase.from("profiles").select("*", { count: "exact", head: true }),
                // 3. Sellers count
                supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "seller"),
                // 4. Orders
                supabase.from("orders").select("*")
            ]);

            const results: any[] = await Promise.race([
                fetchPromise,
                timeoutPromise
            ]) as any;

            const [productsRes, usersRes, sellersRes, ordersRes] = results;

            if (productsRes.error) console.error("[useAdminStats] Products count error:", productsRes.error);
            if (usersRes.error) console.error("[useAdminStats] Users count error:", usersRes.error);
            if (sellersRes.error) console.error("[useAdminStats] Sellers count error:", sellersRes.error);
            if (ordersRes.error) console.error("[useAdminStats] Orders fetch error:", ordersRes.error);

            const productsCount = productsRes.count || 0;
            const usersCount = usersRes.count || 0;
            const sellersCount = sellersRes.count || 0;
            const orders = ordersRes.data || [];

            const totalOrders = orders.length;
            const pendingOrders = orders.filter((o: any) => o.order_status === "pending").length;
            const totalRevenue = orders.reduce((sum: number, order: any) => sum + (order.total || 0), 0);

            // Generate derived data
            const salesTrend = generateSalesTrend(orders);
            const topProducts = calculateTopProducts(orders);
            const categoryDistribution = calculateCategoryDistribution(orders);
            const revenueGrowth = generateRevenueGrowth(orders);

            setStats({
                totalProducts: productsCount,
                totalUsers: usersCount,
                totalSellers: sellersCount,
                totalSales: totalOrders,
                pendingOrders,
                revenue: totalRevenue,
                salesTrend,
                topProducts,
                categoryDistribution,
                revenueGrowth,
            });
        } catch (error: any) {
            console.error("[useAdminStats] Error fetching admin stats:", error.message);
        } finally {
            setLoading(false);
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
