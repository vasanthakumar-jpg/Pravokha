export interface PaymentDetails {
    method: "upi" | "qr";
    upiId?: string;
    transactionId: string;
    timestamp: string;
}

export interface UpiPaymentDialogProps {
    open: boolean;
    onClose: () => void;
    amount: number;
    orderNumber: string;
    onPaymentComplete: (paymentDetails: PaymentDetails) => void;
}
