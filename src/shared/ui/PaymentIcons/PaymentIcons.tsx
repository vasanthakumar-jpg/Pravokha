import { CreditCard } from "lucide-react";
import styles from "./PaymentIcons.module.css";
import { cn } from "@/lib/utils";

export function PaymentIcons() {
    return (
        <div className={styles.flex}>
            <span className={styles.label}>We Accept:</span>
            <div className={styles.iconGrid}>
                <div className={cn(styles.badge, styles.upi)}>
                    UPI
                </div>
                <div className={cn(styles.badge, styles.visa)}>
                    VISA
                </div>
                <div className={cn(styles.badge, styles.mc)}>
                    MC
                </div>
                <div className={cn(styles.badge, styles.rupay)}>
                    RuPay
                </div>
                <div className={cn(styles.badge, styles.paytm)}>
                    Paytm
                </div>
                <div className={cn(styles.badge, styles.cod)}>
                    <CreditCard className="h-3 w-3" />
                    COD
                </div>
            </div>
        </div>
    );
}

export default PaymentIcons;
