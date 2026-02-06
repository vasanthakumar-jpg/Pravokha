import { CheckCircle2, Clock, Package, Truck, XCircle, Trash2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/ui/Button";
import { Badge } from "@/ui/Badge";
import styles from "./OrderTimeline.module.css";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface TimelineUpdate {
    id?: string;
    status: string;
    timestamp: string;
    message: string;
    color?: string;
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
                <div className={cn(styles.timeline, "space-y-4 sm:space-y-0")}>
                    <AnimatePresence>
                        {statuses.map((statusItem, index) => {
                            const Icon = statusItem.icon;
                            // For completed steps, find the specific update to get its color
                            // If it's a past step that doesn't have a direct update record (rare), fallback to standard active color
                            const update = trackingUpdates.find(u => u.status?.toLowerCase() === statusItem.key.toLowerCase());
                            const colorClass = update?.color || "bg-primary/10 text-primary";

                            const isCompleted = index <= currentStatusIndex;
                            const isActive = index === currentStatusIndex;
                            const isExpanded = expandedStep === statusItem.key;

                            return (
                                <motion.div
                                    layout
                                    key={statusItem.key}
                                    className={styles.step}
                                    initial={{ opacity: 0, x: -30 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{
                                        layout: { duration: 0.3 },
                                        opacity: { duration: 0.4 }
                                    }}
                                >
                                    {index < statuses.length - 1 && (
                                        <motion.div
                                            className={cn(
                                                styles.line,
                                                index < currentStatusIndex ? "bg-primary" : styles.linePending
                                            )}
                                            initial={{ scaleY: 0, opacity: 0 }}
                                            animate={{ scaleY: 1, opacity: 1 }}
                                            transition={{ duration: 0.5 }}
                                        />
                                    )}

                                    <motion.div
                                        layout
                                        className={cn(
                                            styles.iconWrapper,
                                            isCompleted ? colorClass : styles.iconPending,
                                            isActive && "ring-2 ring-primary ring-offset-2",
                                            "cursor-pointer"
                                        )}
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        whileHover={{ scale: 1.1 }}
                                        transition={{
                                            delay: index * 0.15 + 0.1,
                                            type: "spring",
                                            stiffness: 200,
                                            damping: 15
                                        }}
                                        onClick={() => toggleStep(statusItem.key)}
                                    >
                                        <Icon className={cn(styles.icon, isCompleted && "text-current")} />
                                        {isActive && (
                                            <motion.div
                                                className="absolute inset-0 rounded-full border-2 border-primary"
                                                initial={{ scale: 1, opacity: 0.8 }}
                                                animate={{ scale: 1.3, opacity: 0 }}
                                                transition={{
                                                    repeat: Infinity,
                                                    duration: 1.5,
                                                    ease: "easeOut"
                                                }}
                                            />
                                        )}
                                    </motion.div>

                                    <div className={styles.content}>
                                        <div className={styles.contentHeader} onClick={() => toggleStep(statusItem.key)} role="button" tabIndex={0}>
                                            <div className="flex-1">
                                                <p className={cn(
                                                    styles.statusLabel,
                                                    isCompleted ? "text-foreground font-bold" : styles.statusPending,
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

                                        <AnimatePresence>
                                            {isExpanded && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="mt-2 p-3 bg-muted/30 rounded-lg border border-border/50 overflow-hidden"
                                                >
                                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                                        {getStepDetails(statusItem.key)}
                                                    </p>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}

            {isCancelled && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={styles.cancelledCard}
                >
                    <p className={styles.infoText}>
                        This order has been cancelled. If you paid for this order, a refund will be processed within 3-5 business days.
                    </p>
                </motion.div>
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
