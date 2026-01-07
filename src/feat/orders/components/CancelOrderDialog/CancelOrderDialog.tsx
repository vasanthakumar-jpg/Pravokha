import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/ui/AlertDialog";
import styles from "./CancelOrderDialog.module.css";
import { cn } from "@/lib/utils";

interface CancelOrderDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    orderAmount: number;
    paymentStatus: string;
}

export function CancelOrderDialog({ open, onOpenChange, onConfirm, orderAmount, paymentStatus }: CancelOrderDialogProps) {
    const getPaymentMessage = () => {
        if (paymentStatus === "completed" || paymentStatus === "success") {
            return (
                <>
                    <p className={styles.paymentTitle}>Payment Completed</p>
                    <p>The payment of ₹{orderAmount} will be refunded to your original payment method.</p>
                    <p className={styles.timelineText}>
                        <strong className={styles.bold}>Refund Timeline:</strong> 3–5 business days. You'll receive confirmation once processed.
                    </p>
                </>
            );
        } else {
            return (
                <>
                    <p className={styles.paymentTitle}>Payment Pending</p>
                    <p>No refund process initiated as payment is still pending.</p>
                    <p className={styles.timelineText}>
                        If payment completes later, refund timelines (3–5 business days) will be communicated.
                    </p>
                </>
            );
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Order Confirmation</AlertDialogTitle>
                    <AlertDialogDescription className={styles.description}>
                        <p className="font-medium text-foreground">Are you sure you want to cancel your order?</p>
                        {getPaymentMessage()}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Keep Order</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        className={styles.confirmButton}
                    >
                        Confirm Cancellation
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export default CancelOrderDialog;
