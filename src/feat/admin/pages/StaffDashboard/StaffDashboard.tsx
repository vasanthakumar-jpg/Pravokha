import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "@/core/context/AdminContext";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/ui/Card";
import { Button } from "@/ui/Button";
import { Badge } from "@/ui/Badge";
import {
    ClipboardList,
    MessageSquare,
    Package,
    Users,
    AlertCircle,
    Truck,
    CheckCircle2,
    Search
} from "lucide-react";
import { useAdminStats } from "@/shared/hook/useAdminStats";
import { AdminSkeleton } from "@/feat/admin/components/AdminSkeleton";

export default function StaffDashboard() {
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
            className="w-full mx-auto py-4 sm:py-6 px-3 sm:px-4 flex flex-col gap-6"
        >
            {/* Staff Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Staff Workspace</h1>
                <p className="text-sm text-muted-foreground">Manage orders, support, and inventory.</p>
            </div>

            {/* Quick Action Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <motion.div variants={item} onClick={() => navigate('/admin/orders')} className="cursor-pointer">
                    <Card className="hover:bg-accent/50 transition-colors cursor-pointer border-l-4 border-l-blue-500">
                        <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                            <ClipboardList className="w-6 h-6 text-blue-500" />
                            <span className="text-sm font-semibold">Manage Orders</span>
                        </CardContent>
                    </Card>
                </motion.div>
                <motion.div variants={item} onClick={() => navigate('/admin/tickets')} className="cursor-pointer">
                    <Card className="hover:bg-accent/50 transition-colors cursor-pointer border-l-4 border-l-rose-500">
                        <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                            <MessageSquare className="w-6 h-6 text-rose-500" />
                            <span className="text-sm font-semibold">Support Tickets</span>
                            {stats.openTickets > 0 && <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">{stats.openTickets}</Badge>}
                        </CardContent>
                    </Card>
                </motion.div>
                <motion.div variants={item} onClick={() => navigate('/admin/products/manage')} className="cursor-pointer">
                    <Card className="hover:bg-accent/50 transition-colors cursor-pointer border-l-4 border-l-amber-500">
                        <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                            <Package className="w-6 h-6 text-amber-500" />
                            <span className="text-sm font-semibold">Inventory</span>
                        </CardContent>
                    </Card>
                </motion.div>
                <motion.div variants={item} onClick={() => navigate('/admin/customers')} className="cursor-pointer">
                    <Card className="hover:bg-accent/50 transition-colors cursor-pointer border-l-4 border-l-emerald-500">
                        <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                            <Users className="w-6 h-6 text-emerald-500" />
                            <span className="text-sm font-semibold">Customers</span>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Task List */}
            <motion.div variants={item}>
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Work Queue</CardTitle>
                        <CardDescription>Items needing attention</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Pending Orders */}
                        <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors" onClick={() => navigate('/admin/orders?status=pending')}>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600"><Truck className="w-4 h-4" /></div>
                                <div>
                                    <p className="font-medium text-sm">Pending Orders</p>
                                    <p className="text-xs text-muted-foreground">{stats.pendingOrders} orders to process</p>
                                </div>
                            </div>
                            <Button size="sm" variant="outline">View</Button>
                        </div>

                        {/* Low Stock */}
                        <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors" onClick={() => navigate('/admin/products/manage?filter=low_stock')}>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600"><AlertCircle className="w-4 h-4" /></div>
                                <div>
                                    <p className="font-medium text-sm">Low Stock Alerts</p>
                                    <p className="text-xs text-muted-foreground">{stats.lowStockItems} items running low</p>
                                </div>
                            </div>
                            <Button size="sm" variant="outline">Check</Button>
                        </div>

                        {/* Tickets */}
                        <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors" onClick={() => navigate('/admin/tickets')}>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-lg text-rose-600"><MessageSquare className="w-4 h-4" /></div>
                                <div>
                                    <p className="font-medium text-sm">Customer Inquiries</p>
                                    <p className="text-xs text-muted-foreground">{stats.openTickets} active conversations</p>
                                </div>
                            </div>
                            <Button size="sm" variant="outline">Reply</Button>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    );
}
