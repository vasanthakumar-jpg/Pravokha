import { Smartphone } from "lucide-react";
import styles from "./PaymentIcons.module.css";
import { cn } from "@/lib/utils";

const paymentMethods = [
    { name: "UPI", color: "text-green-600 dark:text-green-400" },
    { name: "GPay", color: "text-blue-600 dark:text-blue-400" },
    { name: "PhonePe", color: "text-purple-600 dark:text-purple-400" },
    { name: "Paytm", color: "text-cyan-600 dark:text-cyan-400" },
    { name: "QR", color: "text-orange-600 dark:text-orange-400" },
];

export function AnimatedPaymentIcons() {
    return (
        <div className={styles.animatedFlex}>
            <p className={cn(styles.label, "mr-2")}>We Accept:</p>
            {paymentMethods.map((method) => (
                <div
                    key={method.name}
                    className={styles.animatedItem}
                >
                    <Smartphone className={cn(styles.methodIcon, method.color)} />
                    <span className={styles.methodName}>{method.name}</span>
                </div>
            ))}
        </div>
    );
}
