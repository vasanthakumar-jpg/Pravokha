import { CheckCircle2, XCircle, AlertCircle, Info, Heart, ShoppingCart } from "lucide-react";
import { toast as sonnerToast, Toaster } from "sonner";
import styles from "./CustomToast.module.css";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "warning" | "info" | "wishlist" | "cart";

interface CustomToastOptions {
    title: string;
    description?: string;
    type?: ToastType;
    duration?: number;
}

const toastIcons = {
    success: CheckCircle2,
    error: XCircle,
    warning: AlertCircle,
    info: Info,
    wishlist: Heart,
    cart: ShoppingCart,
};

const toastStyles = {
    success: styles.success,
    error: styles.error,
    warning: styles.warning,
    info: styles.info,
    wishlist: styles.wishlist,
    cart: styles.cart,
};

export function showToast({ title, description, type = "info", duration = 3000 }: CustomToastOptions) {
    const Icon = toastIcons[type];
    const iconClass = toastStyles[type];

    sonnerToast.custom(
        () => (
            <div className={styles.toastContainer}>
                <Icon className={cn(styles.icon, iconClass)} />
                <div className={styles.content}>
                    <p className={styles.title}>{title}</p>
                    {description && (
                        <p className={styles.description}>{description}</p>
                    )}
                </div>
            </div>
        ),
        { duration }
    );
}

export { Toaster as CustomToaster };
