import { Card, CardContent } from "@/ui/Card";
import { Package, CheckCircle2, AlertCircle, DollarSign, Database } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductStatsProps {
    total: number;
    active: number;
    lowStock: number;
    revenue: number;
    role: 'ADMIN' | 'DEALER' | 'USER' | 'admin' | 'seller';
}

export function ProductStats({ total, active, lowStock, revenue, role }: ProductStatsProps) {
    const stats = [
        { label: "Total Products", value: total, icon: Package, color: "text-primary", bg: "bg-primary/10", role: 'all' },
        { label: "Active Listings", value: active, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-100", role: 'all' },
        { label: "Low Stock", value: lowStock, icon: AlertCircle, color: "text-orange-600", bg: "bg-orange-100", role: 'all' },
        {
            label: "Total Revenue",
            value: `₹${revenue.toLocaleString()}`,
            icon: (role === 'ADMIN' || role === 'admin') ? DollarSign : Database,
            color: (role === 'ADMIN' || role === 'admin') ? "text-blue-600" : "text-white",
            bg: (role === 'ADMIN' || role === 'admin') ? "bg-blue-100" : "bg-purple-500",
            role: 'all'
        }
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {stats.map((stat, i) => (
                <Card key={i} className="overflow-hidden">
                    <CardContent className="p-4 sm:p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs sm:text-sm text-muted-foreground">{stat.label}</p>
                                <p className="text-xl sm:text-2xl font-bold">{stat.value}</p>
                            </div>
                            <div className={cn("h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center shrink-0", stat.bg)}>
                                <stat.icon className={cn("h-4 w-4 sm:h-5 sm:w-5", stat.color)} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
