import { useAuth } from "@/contexts/AuthContext";
import { ReactNode, useEffect, useState } from "react";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import styles from "./AuthLoadingGuard.module.css";
import { AlertTriangle, RefreshCw } from "lucide-react";

export function AuthLoadingGuard({ children }: { children: ReactNode }) {
    const { loading, authError } = useAuth();
    const [showSlowLoadingMessage, setShowSlowLoadingMessage] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (loading && !authError) {
                setShowSlowLoadingMessage(true);
            }
        }, 5000);

        return () => clearTimeout(timer);
    }, [loading, authError]);

    if (authError) {
        return (
            <div className={styles.container}>
                <div className="bg-red-50 dark:bg-red-900/10 p-8 rounded-2xl border border-red-100 dark:border-red-900/30 max-w-md w-full text-center space-y-6 shadow-xl animate-in zoom-in-95 duration-300">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-xl font-bold text-red-900 dark:text-red-300">Connection Error</h2>
                        <p className="text-sm text-red-700 dark:text-red-400/80 leading-relaxed">
                            {authError}
                        </p>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-red-600/20 active:scale-95 flex items-center justify-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Retry Connection
                    </button>
                    <p className="text-[10px] text-muted-foreground italic">
                        If the problem persists, please check your internet connection or contact support.
                    </p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className={styles.container}>
                <LoadingSpinner className={styles.spinner} />
                <div className="space-y-4 text-center px-6">
                    <p className={styles.text}>Initializing application...</p>
                    {showSlowLoadingMessage && (
                        <p className={`${styles.slowMessage} animate-pulse`}>
                            Database connection is slow. Please wait...
                        </p>
                    )}
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
