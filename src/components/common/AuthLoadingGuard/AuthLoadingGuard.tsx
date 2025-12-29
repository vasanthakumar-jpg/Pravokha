import { useAuth } from "@/contexts/AuthContext";
import { ReactNode, useEffect, useState } from "react";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import styles from "./AuthLoadingGuard.module.css";

export function AuthLoadingGuard({ children }: { children: ReactNode }) {
    const { loading } = useAuth();
    const [showSlowLoadingMessage, setShowSlowLoadingMessage] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (loading) {
                setShowSlowLoadingMessage(true);
            }
        }, 3000);

        return () => clearTimeout(timer);
    }, [loading]);

    if (loading) {
        return (
            <div className={styles.container}>
                <LoadingSpinner className={styles.spinner} />
                <p className={styles.text}>Initializing application...</p>

                {showSlowLoadingMessage && (
                    <p className={styles.slowMessage}>
                        This is taking longer than usual. Please wait...
                    </p>
                )}
            </div>
        );
    }

    return <>{children}</>;
}
