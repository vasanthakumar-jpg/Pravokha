import { AlertCircle, Home, MessageSquare } from "lucide-react";
import { Button } from "@/ui/Button";
import { Card, CardContent } from "@/ui/Card";
import { useNavigate } from "react-router-dom";
import styles from "./AccountSuspendedMessage.module.css";
import { cn } from "@/lib/utils";

interface AccountSuspendedMessageProps {
    userName?: string;
}

export function AccountSuspendedMessage({ userName }: AccountSuspendedMessageProps) {
    const navigate = useNavigate();

    return (
        <div className={styles.container}>
            <Card className={styles.card}>
                <CardContent className={styles.content}>
                    <div className={styles.iconWrapper}>
                        <div className={styles.iconRelative}>
                            <div className={styles.iconGlow} />
                            <div className={styles.iconContainer}>
                                <AlertCircle className={styles.icon} />
                            </div>
                        </div>
                    </div>

                    <h2 className={styles.title}>
                        🔒 Account Suspended
                    </h2>

                    <p className={styles.message}>
                        Your seller account is currently suspended. For assistance or to reactivate your account, please contact support.
                    </p>

                    {userName && (
                        <div className={styles.userInfo}>
                            <p className={styles.userText}>
                                <span className={styles.userLabel}>Account:</span>{" "}
                                <span className={styles.userName}>{userName}</span>
                            </p>
                        </div>
                    )}

                    <div className={styles.buttonGrid}>
                        <Button
                            className={styles.button}
                            size="lg"
                            onClick={() => navigate("/tickets/new")}
                        >
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Submit Appeal
                        </Button>

                        <Button
                            variant="outline"
                            className={styles.button}
                            size="lg"
                            onClick={() => navigate("/support")}
                        >
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Contact Support
                        </Button>

                        <Button
                            variant="outline"
                            className={styles.button}
                            size="lg"
                            onClick={() => navigate("/")}
                        >
                            <Home className="mr-2 h-4 w-4" />
                            Return to Homepage
                        </Button>
                    </div>

                    <p className={styles.footer}>
                        If you believe this is an error, please reach out to our support team for immediate assistance.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
