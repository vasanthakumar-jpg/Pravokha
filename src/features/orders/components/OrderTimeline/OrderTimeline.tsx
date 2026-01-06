import { CheckCircle2, Clock, Package, Truck, XCircle, Trash2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import styles from "./OrderTimeline.module.css";
import { cn } from "@/lib/utils";

interface TimelineUpdate {
    id?: string;
    status: string;
    timestamp: string;
    message: string;
}

interface OrderTimelineProps {
    status: string;
    trackingUpdates?: TimelineUpdate[];
    createdAt: string;
    onDelete?: (id: string) => void;
}

export function OrderTimeline({ status, trackingUpdates = [], createdAt, onDelete }: OrderTimelineProps) {
    const statuses = [
        { key: "pending", label: "Order Placed", icon: Clock },
        { key: "confirmed", label: "Confirmed", icon: CheckCircle2 },
        { key: "shipped", label: "Shipped", icon: Truck },
        { key: "delivered", label: "Delivered", icon: Package },
    ];

    const getStatusIndex = (statusKey: string) => {
        return statuses.findIndex(s => s.key === statusKey);
    };

    const currentStatusIndex = getStatusIndex(status);
    const isCancelled = status === "cancelled";

    return (
        <div className={styles.container}>
            <div className={cn(styles.header, "flex flex-wrap items-center justify-between gap-2")}>
                <h3 className={cn(styles.title, "text-sm sm:text-base md:text-lg")}>Order Tracking</h3>
                {isCancelled && (
                    <Badge variant="destructive" className="flex items-center gap-1.5 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider shadow-sm animate-pulse border-none">
                        <AlertCircle className="h-3 w-3 sm:h-3.5 sm:3.5" />
                        <span className="hidden sm:inline">Order</span> Cancelled
                    </Badge>
                )}
            </div>

            {!isCancelled && (
                <div className={styles.timeline}>
                    {statuses.map((statusItem, index) => {
                        const Icon = statusItem.icon;
                        const isCompleted = index <= currentStatusIndex;
                        const isActive = index === currentStatusIndex;
                        const update = trackingUpdates.find(u => u.status === statusItem.key);

                        return (
                            <div key={statusItem.key} className={styles.step}>
                                {index < statuses.length - 1 && (
                                    <div
                                        className={cn(
                                            styles.line,
                                            index < currentStatusIndex ? styles.lineCompleted : styles.linePending
                                        )}
                                    />
                                )}

                                <div
                                    className={cn(
                                        styles.iconWrapper,
                                        isCompleted ? styles.iconCompleted : styles.iconPending,
                                        isActive && styles.iconActive
                                    )}
                                >
                                    <Icon className={styles.icon} />
                                </div>

                                <div className={styles.content}>
                                    <div className={styles.contentHeader}>
                                        <div>
                                            <p className={cn(
                                                styles.statusLabel,
                                                isCompleted ? styles.statusCompleted : styles.statusPending
                                            )}>
                                                {statusItem.label}
                                            </p>
                                            {update && (
                                                <p className={styles.timestamp}>
                                                    {format(new Date(update.timestamp), "PPp")}
                                                </p>
                                            )}
                                            {!update && index === 0 && (
                                                <p className={styles.timestamp}>
                                                    {format(new Date(createdAt), "PPp")}
                                                </p>
                                            )}
                                        </div>
                                        {onDelete && update && update.id && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className={styles.deleteButton}
                                                onClick={() => onDelete(update.id!)}
                                                title="Delete this history entry"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {isCancelled && (
                <div className={styles.cancelledCard}>
                    <p className={styles.infoText}>
                        This order has been cancelled. If you paid for this order, a refund will be processed within 3-5 business days.
                    </p>
                </div>
            )}

            <div className={styles.infoCard}>
                <h4 className={styles.infoTitle}>Tracking Information</h4>
                <p className={styles.infoText}>
                    Track your order's journey in real-time from warehouse to doorstep. Estimated delivery: 3-5 business days from confirmation. You'll receive email and SMS updates at each milestone. Questions? Contact support@pravokha.com or WhatsApp +91-XXXXX-XXXXX.
                </p>
                {!isCancelled && currentStatusIndex < statuses.length - 1 && (
                    <p className={styles.nextStep}>
                        Next step: <span className={styles.nextLabel}>{statuses[currentStatusIndex + 1].label}</span>
                    </p>
                )}
            </div>
        </div>
    );
}

export default OrderTimeline;
