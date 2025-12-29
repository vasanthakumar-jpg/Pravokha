import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/Select";
import { AlertCircle } from "lucide-react";
import styles from "./OrderCancellationReasonDialog.module.css";
import { cn } from "@/lib/utils";

interface OrderCancellationReasonDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (reason: string, comments: string) => void;
    orderNumber: string;
    orderAmount: number;
    isPrepaid: boolean;
}

const CANCELLATION_REASONS = [
    "Ordered by mistake",
    "Delivery taking too long",
    "Found better price elsewhere",
    "Changed my mind",
    "Product no longer needed",
    "Ordering duplicate item",
    "Other"
];

export function OrderCancellationReasonDialog({
    open,
    onOpenChange,
    onConfirm,
    orderNumber,
    orderAmount,
    isPrepaid
}: OrderCancellationReasonDialogProps) {
    const [reason, setReason] = useState("");
    const [comments, setComments] = useState("");

    const handleConfirm = () => {
        if (!reason) return;
        onConfirm(reason, comments);
        setReason("");
        setComments("");
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Cancel Order #{orderNumber}</DialogTitle>
                    <DialogDescription>
                        Please tell us why you want to cancel this order
                    </DialogDescription>
                </DialogHeader>

                <div className={styles.formGrid}>
                    <div className={styles.warningAlert}>
                        <AlertCircle className={styles.warningIcon} />
                        <div className={styles.alertContent}>
                            <p className={styles.alertTitle}>Important</p>
                            <p>Once cancelled, this action cannot be undone.</p>
                        </div>
                    </div>

                    <div className={styles.field}>
                        <Label htmlFor="reason">Reason for Cancellation *</Label>
                        <Select value={reason} onValueChange={setReason}>
                            <SelectTrigger id="reason">
                                <SelectValue placeholder="Select a reason" />
                            </SelectTrigger>
                            <SelectContent>
                                {CANCELLATION_REASONS.map((r) => (
                                    <SelectItem key={r} value={r}>
                                        {r}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className={styles.field}>
                        <Label htmlFor="comments">
                            Additional Comments {reason === "Other" ? "*" : "(Optional)"}
                        </Label>
                        <Textarea
                            id="comments"
                            placeholder={reason === "Other" ? "Please specify the reason..." : "Tell us more about your reason..."}
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            rows={3}
                            maxLength={500}
                            className={styles.textarea}
                        />
                        <p className={styles.charCount}>
                            {comments.length}/500 characters
                        </p>
                    </div>

                    {isPrepaid && (
                        <div className={styles.refundInfo}>
                            <p className={styles.refundTitle}>Refund Information</p>
                            <p className={styles.refundText}>
                                Your refund of ₹{orderAmount} will be processed within 3-5 business days to your original payment method.
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter className={styles.footer}>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Keep Order
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={handleConfirm}
                        disabled={!reason || (reason === "Other" && !comments.trim())}
                    >
                        Confirm Cancellation
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default OrderCancellationReasonDialog;
