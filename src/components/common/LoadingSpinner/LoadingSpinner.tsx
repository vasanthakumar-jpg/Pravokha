import { Loader2 } from "lucide-react";
import styles from "./LoadingSpinner.module.css";
import { cn } from "@/lib/utils";

export const LoadingSpinner = ({ className, fullScreen = false }: { className?: string, fullScreen?: boolean }) => {
    return (
        <div className={cn(styles.container, fullScreen && styles.fullscreen, className)}>
            <div className={styles.content}>
                <Loader2 className={styles.spinner} />
                {fullScreen && <p className={styles.text}>Loading...</p>}
            </div>
        </div>
    );
};
