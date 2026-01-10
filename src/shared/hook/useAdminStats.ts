import { useState, useEffect } from "react";
import { apiClient } from "@/infra/api/apiClient";
import { useAdmin } from "@/core/context/AdminContext";

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
            const response = await apiClient.get('/admin/stats');
            if (response.data.success) {
                setStats(response.data.stats);
            }
        } catch (error: any) {
            console.error("[useAdminStats] Error fetching admin stats:", error.message);
        } finally {
            setLoading(false);
        }
    };

    return { stats, loading, refetch: fetchStats };
}
