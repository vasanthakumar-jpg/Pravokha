import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "@/core/context/AdminContext";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/ui/Card";
import { Button } from "@/ui/Button";
import { Badge } from "@/ui/Badge";
import {
    ShoppingCart,
    Store,
    Clock,
    ArrowUpRight,
    AlertCircle,
    Activity,
    DollarSign,
    TrendingUp,
    Package,
    ChevronRight
} from "lucide-react";
import { useAdminStats } from "@/shared/hook/useAdminStats";
import { StatsCard } from "@/feat/admin/components/StatsCard";
import { SalesChart } from "@/feat/admin/components/SalesChart";
import { AdminSkeleton } from "@/feat/admin/components/AdminSkeleton";

export default function SuperAdminDashboard() {
    const { isAdmin, loading: adminLoading } = useAdmin();
    const navigate = useNavigate();
    const { stats, loading: statsLoading } = useAdminStats();

    if (adminLoading || statsLoading) return <AdminSkeleton variant="dashboard" />;

    const container = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
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
            className="w-full mx-auto py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-6 xl:px-8 flex flex-col gap-6"
        >
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary">Owner's Overview</h1>
                    <p className="text-sm text-muted-foreground mt-1">Full platform telemetry, financials, and governance.</p>
                </div>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 px-3 py-1">
                    <Activity className="w-3 h-3 mr-2 animate-pulse" /> Live System
                </Badge>
            </div>

            {/* Financials & High Level Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <motion.div variants={item}>
                    <StatsCard title="Total Revenue" value={`₹${stats.revenue.toLocaleString()}`} icon={DollarSign} trend={{ value: 12, isPositive: true }} color="bg-rose-500" description="Gross Platform Volume" />
                </motion.div>
                <motion.div variants={item}>
                    <StatsCard title="Total Sales" value={stats.totalSales} icon={ShoppingCart} trend={{ value: 8, isPositive: true }} color="bg-emerald-500" description="Orders Processed" />
                </motion.div>
                <motion.div variants={item}>
                    <StatsCard title="Active Sellers" value={stats.totalSellers} icon={Store} trend="Growing" color="bg-blue-600" description="Verified Partners" />
                </motion.div>
                <motion.div variants={item}>
                    <StatsCard title="Pending Payouts" value={stats.pendingPayouts} icon={Clock} trend="Action Needed" color="bg-amber-500" description="Awaiting Approval" />
                </motion.div>
            </div>

            {/* Charts & Urgency */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <motion.div variants={item} className="xl:col-span-2">
                    <SalesChart data={stats.salesTrend} />
                </motion.div>

                <motion.div variants={item}>
                    <Card className="h-full border-l-4 border-l-red-500 shadow-sm">
                        <CardHeader>
                            <CardTitle>Critical Actions</CardTitle>
                            <CardDescription>Requires Owner Approval</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Button variant="outline" className="w-full justify-between h-auto py-3" onClick={() => navigate('/admin/payments')}>
                                <span className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-amber-500" /> Approve Payouts</span>
                                <Badge>{stats.pendingPayouts}</Badge>
                            </Button>
                            <Button variant="outline" className="w-full justify-between h-auto py-3" onClick={() => navigate('/admin/sellers')}>
                                <span className="flex items-center gap-2"><Store className="w-4 h-4 text-blue-500" /> Verify Sellers</span>
                                <Badge>{stats.pendingVerifications}</Badge>
                            </Button>
                            <Button variant="outline" className="w-full justify-between h-auto py-3" onClick={() => navigate('/admin/tickets')}>
                                <span className="flex items-center gap-2"><AlertCircle className="w-4 h-4 text-red-500" /> Escalated Tickets</span>
                                <Badge variant="destructive">{stats.openTickets}</Badge>
                            </Button>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </motion.div>
    );
}
