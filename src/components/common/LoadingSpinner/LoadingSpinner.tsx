import { Loader2 } from "lucide-react";
import styles from "./LoadingSpinner.module.css";
import { cn } from "@/lib/utils";

export const LoadingSpinner = ({ className }: { className?: string }) => {
    return (
        <div className={cn(styles.container, className)}>
            <div className={styles.content}>
                <Loader2 className={styles.spinner} />
                <p className={styles.text}>Loading...</p>
            </div>
        </div>
    );
};
