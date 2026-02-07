import React, { useState } from "react";
import { Check, Clock, Package, Truck, ShoppingBag, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import styles from "./VerticalOrderTracker.module.css";

interface VerticalOrderTrackerProps {
    status: string;
    createdAt: string;
    trackingUpdates?: any[];
}

const steps = [
    { key: "pending", label: "Order Placed", icon: Clock },
    { key: "confirmed", label: "Order Confirmed", icon: Check },
    { key: "packed", label: "Packed & Ready", icon: Package },
    { key: "shipped", label: "On the Way", icon: Truck },
    { key: "delivered", label: "Delivered", icon: ShoppingBag },
];

export const VerticalOrderTracker = ({ status, createdAt, trackingUpdates = [] }: VerticalOrderTrackerProps) => {
    const currentStatus = status.toLowerCase();
    const isCancelled = currentStatus === "cancelled";
    const [expandedStep, setExpandedStep] = useState<string | null>(status.toLowerCase());

    const getStatusIndex = (key: string) => steps.findIndex(s => s.key === key);
    const currentIndex = getStatusIndex(currentStatus);

    const toggleStep = (key: string) => {
        setExpandedStep(expandedStep === key ? null : key);
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
            {isCancelled ? (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-4 p-5 bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-100 dark:border-red-900/30"
                >
                    <div className="p-3 bg-red-100 dark:bg-red-900/50 rounded-full text-red-600 dark:text-red-400">
                        <AlertCircle className="h-6 w-6" />
                    </div>
                    <div>
                        <h4 className="font-bold text-red-700 dark:text-red-400">Order Cancelled</h4>
                        <p className="text-sm text-red-600/80 dark:text-red-400/60">This order has been cancelled. Refunds usually take 3-5 business days.</p>
                    </div>
                </motion.div>
            ) : (
                <div className={styles.timeline}>
                    {steps.map((step, index) => {
                        const Icon = step.icon;
                        const isCompleted = index <= currentIndex;
                        const isActive = index === currentIndex;
                        const isExpanded = expandedStep === step.key;
                        const isLast = index === steps.length - 1;

                        const update = trackingUpdates.find(u => u.status?.toLowerCase() === step.key.toLowerCase());
                        const displayDate = update ? format(new Date(update.timestamp), "MMM d, yyyy, h:mm a") :
                            (step.key === 'pending' && createdAt ? format(new Date(createdAt), "MMM d, yyyy, h:mm a") : "");

                        return (
                            <motion.div
                                key={step.key}
                                className={cn(styles.stepWrapper, isActive && styles.activeStepWrapper, isCompleted && styles.completedStepWrapper)}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1, duration: 0.5 }}
                            >
                                {/* Left Side: Icon and Line */}
                                <div className={styles.indicatorColumn}>
                                    <motion.div
                                        className={cn(
                                            styles.iconBox,
                                            isCompleted ? styles.completedIcon : styles.pendingIcon,
                                            isActive && styles.activeIcon,
                                            isExpanded && styles.expandedIcon
                                        )}
                                        onClick={() => toggleStep(step.key)}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <Icon className={cn(styles.icon, isCompleted ? styles.iconWhite : styles.iconMuted)} />
                                        {isActive && (
                                            <div className={styles.activeGlow} />
                                        )}
                                    </motion.div>
                                    {!isLast && (
                                        <div className={styles.lineBase}>
                                            <motion.div
                                                className={cn(styles.lineInner, isCompleted && index < currentIndex && styles.completedLine)}
                                                initial={{ height: 0 }}
                                                animate={{ height: "100%" }}
                                                transition={{
                                                    delay: index * 0.2 + 0.3,
                                                    duration: 0.8,
                                                    ease: "easeInOut"
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Right Side: Content */}
                                <div className={styles.contentColumn}>
                                    <div
                                        className={styles.header}
                                        onClick={() => toggleStep(step.key)}
                                        role="button"
                                        tabIndex={0}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <h4 className={cn(
                                                styles.label,
                                                isCompleted ? styles.labelCompleted : styles.labelPending,
                                                isActive && styles.labelActive
                                            )}>
                                                {step.label}
                                            </h4>
                                            {displayDate && isCompleted && (
                                                <p className={styles.dateText}>{displayDate}</p>
                                            )}
                                        </div>
                                    </div>

                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className={styles.detailsExpansion}
                                                transition={{ duration: 0.3, ease: "easeOut" }}
                                            >
                                                <div className={styles.detailsCard}>
                                                    <p className={styles.detailsText}>{getStepDetails(step.key)}</p>
                                                    {update?.message && update.message !== step.label && (
                                                        <p className={styles.updateMessage}>{update.message}</p>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
