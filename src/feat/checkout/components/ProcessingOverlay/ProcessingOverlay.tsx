import { Loader2, Shield, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { Progress } from "@/ui/Progress";
import styles from "./ProcessingOverlay.module.css";
import { cn } from "@/lib/utils";

interface ProcessingOverlayProps {
    isOpen: boolean;
    step: 'contacting' | 'verifying' | 'confirming' | 'success';
    paymentMethod: string;
    bankName?: string;
    onComplete?: () => void;
}

export function ProcessingOverlay({
    isOpen,
    step,
    paymentMethod,
    bankName,
    onComplete
}: ProcessingOverlayProps) {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (!isOpen) {
            setProgress(0);
            return;
        }

        let targetProgress = 0;
        if (step === 'contacting') targetProgress = 35;
        if (step === 'verifying') targetProgress = 70;
        if (step === 'confirming') targetProgress = 90;
        if (step === 'success') targetProgress = 100;

        const timer = setTimeout(() => {
            setProgress(targetProgress);
        }, 100);

        return () => clearTimeout(timer);
    }, [isOpen, step]);

    if (!isOpen) return null;

    const getMessage = () => {
        if (step === 'success') return "Payment Successful!";

        switch (paymentMethod) {
            case 'netbanking':
                if (step === 'contacting') return `Connecting to ${bankName || 'Bank'}...`;
                if (step === 'verifying') return "Verifying credentials...";
                return "Processing transaction...";
            case 'upi':
                if (step === 'contacting') return "Waiting for UPI App...";
                if (step === 'verifying') return "Verifying payment status...";
                return "Confirming order...";
            case 'card':
                return "Contacting Card Gateway...";
            case 'cod':
                return "Start processing order...";
            default:
                return "Processing payment...";
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={cn(styles.content, "animate-in fade-in zoom-in duration-300")}>

                <div className={styles.iconWrapper}>
                    {step === 'success' ? (
                        <div className={cn(styles.successIcon, "animate-in scale-in duration-300")}>
                            <Shield className="w-12 h-12" />
                        </div>
                    ) : (
                        <>
                            <div className={styles.spinnerBg}></div>
                            <div className={styles.spinner}></div>
                            <Lock className={styles.lockIcon} />
                        </>
                    )}
                </div>

                <div className={styles.textContainer}>
                    <h2 className={styles.title}>{getMessage()}</h2>
                    <p className={styles.description}>
                        Please do not close this window or press back.
                    </p>
                </div>

                <div className={styles.progressContainer}>
                    <Progress value={progress} className="h-2 transition-all duration-1000" />
                    <div className={styles.progressLabel}>
                        <span>Secure Connection</span>
                        <span>{progress}%</span>
                    </div>
                </div>

                <div className={styles.footer}>
                    <Shield className="w-3 h-3" />
                    <span>256-bit AES Encryption</span>
                </div>
            </div>
        </div>
    );
}
