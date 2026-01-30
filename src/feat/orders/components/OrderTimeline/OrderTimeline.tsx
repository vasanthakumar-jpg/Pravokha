import { CheckCircle2, Clock, Package, Truck, XCircle, Trash2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/ui/Button";
import { Badge } from "@/ui/Badge";
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
        { key: "packed", label: "Packed", icon: Package },
        { key: "shipped", label: "Shipped", icon: Truck },
        { key: "delivered", label: "Delivered", icon: CheckCircle2 },
    ];

    const getStatusIndex = (statusKey: string) => {
        if (!statusKey) return -1;
        return statuses.findIndex(s => s.key === statusKey.toLowerCase());
    };

    const currentStatusIndex = getStatusIndex(status);
    const isCancelled = status === "cancelled";

    const [expandedStep, setExpandedStep] = useState<string | null>(null);

    const toggleStep = (key: string) => {
        if (expandedStep === key) {
            setExpandedStep(null);
        } else {
            setExpandedStep(key);
        }
    };

    const getStepDetails = (key: string) => {
        switch (key) {
            case 'pending':
                return "Your order has been successfully placed and is awaiting confirmation. We'll verify the details shortly.";
            case 'confirmed':
                return "Good news! Your order has been verified and confirmed. We are now preparing your items for shipment.";
            case 'packed':
                return "Carefully packed with love! Your items are secure and labeled, ready to be handed over to our delivery partner.";
            case 'shipped':
                return "On the move! Your package has left our facility and is making its way to you. Track its journey here.";
            case 'delivered':
                return "Joy delivered! Your package has arrived. We hope you love your purchase. Don't forget to leave a review!";
            default:
                return "Status details unavailable.";
        }
    };

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
                        const isExpanded = expandedStep === statusItem.key;

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
                                        isActive && styles.iconActive,
                                        "cursor-pointer hover:scale-110 transition-transform"
                                    )}
                                    onClick={() => toggleStep(statusItem.key)}
                                >
                                    <Icon className={styles.icon} />
                                </div>

                                <div className={styles.content}>
                                    <div className={styles.contentHeader} onClick={() => toggleStep(statusItem.key)} role="button" tabIndex={0}>
                                        <div className="flex-1">
                                            <p className={cn(
                                                styles.statusLabel,
                                                isCompleted ? styles.statusCompleted : styles.statusPending,
                                                "cursor-pointer hover:text-primary transition-colors"
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
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDelete(update.id!);
                                                }}
                                                title="Delete this history entry"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>

                                    {/* Professional Content Toggle */}
                                    {isExpanded && (
                                        <div className="mt-2 p-3 bg-muted/30 rounded-lg border border-border/50 animate-in slide-in-from-top-2 fade-in duration-200">
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                {getStepDetails(statusItem.key)}
                                            </p>
                                        </div>
                                    )}
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
                    Track your order's journey in real-time from warehouse to doorstep. Estimated delivery: 3-5 business days from confirmation. You'll receive email and SMS updates at each milestone. Questions? Contact support@pravokha.com.
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
