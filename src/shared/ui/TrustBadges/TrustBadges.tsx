import { Shield, Truck, RefreshCw, CreditCard, Lock, Headset } from "lucide-react";
import styles from "./TrustBadges.module.css";
import { cn } from "@/lib/utils";

export default function TrustBadges() {
    const badges = [
        { icon: Shield, text: "100% Secure Payments", color: "text-success" },
        { icon: Truck, text: "Free Shipping ₹999+", color: "text-primary" },
        { icon: RefreshCw, text: "Easy 7 Day Returns", color: "text-secondary" },
        { icon: CreditCard, text: "COD Available", color: "text-emerald-600 dark:text-emerald-400" },
        { icon: Lock, text: "Privacy Protected", color: "text-muted-foreground" },
        { icon: Headset, text: "Ready Support", color: "text-blue-600 dark:text-blue-400" },
    ];

    return (
        <div className={styles.container}>
            {badges.map((badge, index) => (
                <div key={index} className={styles.badge}>
                    <badge.icon className={cn(styles.icon, badge.color)} />
                    <span className={styles.text}>{badge.text}</span>
                </div>
            ))}
        </div>
    );
}
