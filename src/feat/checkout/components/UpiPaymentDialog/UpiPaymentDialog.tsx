import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/Dialog";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { Label } from "@/ui/Label";
import { RadioGroup, RadioGroupItem } from "@/ui/RadioGroup";
import { toast } from "@/shared/hook/use-toast";
import { Smartphone, QrCode, CheckCircle } from "lucide-react";
import paymentQR from "@/assets/payment-qr.png";
import styles from "./UpiPaymentDialog.module.css";
import { cn } from "@/lib/utils";
import { UpiPaymentDialogProps, PaymentDetails } from "./UpiPaymentDialog.types";

const UPI_ID = "vasanthakumar141099@oksbi";
const UPI_NAME = "VasanthaKumar Rajendran";

export function UpiPaymentDialog({
    open,
    onClose,
    amount,
    orderNumber,
    onPaymentComplete
}: UpiPaymentDialogProps) {
    const [step, setStep] = useState<"method" | "upi-id" | "payment" | "verify">("method");
    const [paymentMethod, setPaymentMethod] = useState<"upi" | "qr">("upi");
    const [selectedApp, setSelectedApp] = useState<string>("");
    const [transactionId, setTransactionId] = useState("");

    const upiApps = [
        { id: "gpay", name: "Google Pay", scheme: "gpay://upi/pay" },
        { id: "phonepe", name: "PhonePe", scheme: "phonepe://pay" },
        { id: "paytm", name: "Paytm", scheme: "paytmmp://pay" },
    ];

    const generateUpiUrl = (appScheme: string) => {
        const params = new URLSearchParams({
            pa: UPI_ID,
            pn: UPI_NAME,
            am: amount.toString(),
            cu: "INR",
            tn: `Payment for Order ${orderNumber}`,
        });
        return `${appScheme}?${params.toString()}`;
    };

    const handleMethodSelect = () => {
        if (paymentMethod === "upi") {
            setStep("upi-id");
        } else {
            setStep("payment");
        }
    };

    const handleUpiSubmit = () => {
        if (!selectedApp) {
            toast({
                title: "Select Payment App",
                description: "Please select a UPI app to proceed",
                variant: "destructive",
            });
            return;
        }
        setStep("payment");
    };

    const handlePaymentRedirect = () => {
        if (paymentMethod === "upi" && selectedApp) {
            const app = upiApps.find(a => a.id === selectedApp);
            if (app) {
                const upiUrl = generateUpiUrl(app.scheme);
                window.location.href = upiUrl;

                setTimeout(() => {
                    toast({
                        title: "Opening Payment App",
                        description: `If the app doesn't open, please pay ₹${amount} to ${UPI_ID}`,
                    });
                }, 1000);
            }
        }

        setStep("verify");
    };

    const handleVerifyPayment = () => {
        if (!transactionId || transactionId.length < 8) {
            toast({
                title: "Invalid Transaction ID",
                description: "Please enter a valid transaction ID",
                variant: "destructive",
            });
            return;
        }

        const paymentDetails: PaymentDetails = {
            method: paymentMethod,
            upiId: paymentMethod === "upi" ? UPI_ID : undefined,
            transactionId,
            timestamp: new Date().toISOString(),
        };

        onPaymentComplete(paymentDetails);
        resetDialog();
    };

    const resetDialog = () => {
        setStep("method");
        setPaymentMethod("upi");
        setSelectedApp("");
        setTransactionId("");
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={resetDialog}>
            <DialogContent className={styles.dialogContent}>
                <DialogHeader>
                    <DialogTitle className={styles.title}>Complete Payment - ₹{amount}</DialogTitle>
                </DialogHeader>

                {step === "method" && (
                    <div className={styles.stepContainer}>
                        <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as "upi" | "qr")} className={styles.methodGrid}>
                            <div className={styles.methodCard} onClick={() => setPaymentMethod("upi")}>
                                <RadioGroupItem value="upi" id="upi-method" />
                                <Label htmlFor="upi-method" className={styles.methodLabel}>
                                    <div className="flex items-center gap-3">
                                        <Smartphone className={styles.methodIcon} />
                                        <div>
                                            <p className={styles.methodTitle}>Pay via UPI App</p>
                                            <p className={styles.methodDesc}>Google Pay, PhonePe, Paytm</p>
                                        </div>
                                    </div>
                                </Label>
                            </div>

                            <div className={styles.methodCard} onClick={() => setPaymentMethod("qr")}>
                                <RadioGroupItem value="qr" id="qr-method" />
                                <Label htmlFor="qr-method" className={styles.methodLabel}>
                                    <div className="flex items-center gap-3">
                                        <QrCode className={styles.methodIcon} />
                                        <div>
                                            <p className={styles.methodTitle}>Scan QR Code</p>
                                            <p className={styles.methodDesc}>Scan with any UPI app</p>
                                        </div>
                                    </div>
                                </Label>
                            </div>
                        </RadioGroup>

                        <Button onClick={handleMethodSelect} className="w-full">
                            Continue to Payment
                        </Button>
                    </div>
                )}

                {step === "upi-id" && (
                    <div className={styles.stepContainer}>
                        <div className={styles.appGrid}>
                            <p className="text-sm font-medium mb-2">Select your UPI app:</p>
                            <RadioGroup value={selectedApp} onValueChange={setSelectedApp} className="space-y-2">
                                {upiApps.map((app) => (
                                    <div key={app.id} className={styles.appItem} onClick={() => setSelectedApp(app.id)}>
                                        <RadioGroupItem value={app.id} id={app.id} />
                                        <Label htmlFor={app.id} className="cursor-pointer flex-1 font-medium">
                                            {app.name}
                                        </Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        </div>

                        <div className={cn(styles.infoBox, styles.infoBoxBlue)}>
                            <p className="text-sm font-bold">
                                Amount to Pay: ₹{amount}
                            </p>
                            <p className="text-xs mt-1">
                                You'll be redirected to {selectedApp ? upiApps.find(a => a.id === selectedApp)?.name : "your app"} with payment details pre-filled
                            </p>
                        </div>

                        <div className={styles.buttonGroup}>
                            <Button variant="outline" onClick={() => setStep("method")} className={styles.flex1}>
                                Back
                            </Button>
                            <Button onClick={handleUpiSubmit} className={styles.flex1}>
                                Proceed to Pay
                            </Button>
                        </div>
                    </div>
                )}

                {step === "payment" && (
                    <div className={styles.stepContainer}>
                        {paymentMethod === "qr" ? (
                            <div className={styles.qrContainer}>
                                <p className="font-semibold">Scan QR Code to Pay ₹{amount}</p>
                                <img
                                    src={paymentQR}
                                    alt="Payment QR Code"
                                    className={styles.qrImage}
                                />
                                <div className="text-sm">
                                    <p className="font-medium">{UPI_NAME}</p>
                                    <p className="text-muted-foreground">UPI ID: {UPI_ID}</p>
                                </div>
                            </div>
                        ) : (
                            <div className={cn(styles.infoBox, styles.infoBoxGreen)}>
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                                    <div>
                                        <p className="font-semibold">Ready to Pay</p>
                                        <p className="text-sm mt-1">
                                            Click below to open your UPI app and complete payment of ₹{amount}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className={styles.buttonGroup}>
                            <Button variant="outline" onClick={() => paymentMethod === "upi" ? setStep("upi-id") : setStep("method")} className={styles.flex1}>
                                Back
                            </Button>
                            <Button onClick={handlePaymentRedirect} className={styles.flex1}>
                                {paymentMethod === "upi" ? "Open UPI App" : "I've Paid"}
                            </Button>
                        </div>
                    </div>
                )}

                {step === "verify" && (
                    <div className={styles.stepContainer}>
                        <div className={cn(styles.infoBox, styles.infoBoxBlue)}>
                            <p className="text-sm font-medium">
                                Payment Verification Required
                            </p>
                            <p className="text-xs mt-1">
                                Please enter the transaction ID from your payment app to verify your payment of ₹{amount}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="txn-id">Transaction ID / UPI Reference Number</Label>
                            <Input
                                id="txn-id"
                                placeholder="e.g., 123456789012"
                                value={transactionId}
                                onChange={(e) => setTransactionId(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Found in your payment app's transaction history
                            </p>
                        </div>

                        <div className={styles.buttonGroup}>
                            <Button variant="outline" onClick={() => setStep("payment")} className={styles.flex1}>
                                Back
                            </Button>
                            <Button onClick={handleVerifyPayment} className={styles.flex1}>
                                Confirm Payment
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
