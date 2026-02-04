import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/ui/Button";
import { Card } from "@/ui/Card";
import { Alert, AlertDescription } from "@/ui/Alert";
import { XCircle, AlertCircle, RefreshCcw, HeadphonesIcon } from "lucide-react";

export default function PaymentFailedPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const errorMessage = searchParams.get("error");
    const orderId = searchParams.get("order_id");
    const paymentIntentClientSecret = searchParams.get("payment_intent_client_secret");

    const defaultError = "We couldn't process your payment. Please check your payment details and try again.";

    return (
        <div className="container max-w-2xl mx-auto p-6 py-12">
            <Card className="p-8">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-destructive/10 mb-4">
                        <XCircle className="w-12 h-12 text-destructive" />
                    </div>
                    <h1 className="text-4xl font-bold mb-2">Payment Failed</h1>
                    <p className="text-lg text-muted-foreground">
                        Unfortunately, we couldn't complete your transaction
                    </p>
                </div>

                <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        {errorMessage || defaultError}
                    </AlertDescription>
                </Alert>

                <div className="bg-muted/50 rounded-lg p-6 mb-6">
                    <h3 className="font-semibold mb-3">Common reasons for payment failure:</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-start gap-2">
                            <span className="text-destructive mt-0.5">•</span>
                            <span>Insufficient funds in your account</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-destructive mt-0.5">•</span>
                            <span>Incorrect card details or expired card</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-destructive mt-0.5">•</span>
                            <span>Your bank declined the transaction</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-destructive mt-0.5">•</span>
                            <span>Network connectivity issues</span>
                        </li>
                    </ul>
                </div>

                <div className="space-y-3">
                    <Button
                        onClick={() => {
                            if (paymentIntentClientSecret && orderId) {
                                // Retry payment with same intent
                                navigate(`/payment/confirm?client_secret=${paymentIntentClientSecret}&order_id=${orderId}`);
                            } else {
                                navigate("/checkout");
                            }
                        }}
                        className="w-full"
                    >
                        <RefreshCcw className="w-4 h-4 mr-2" />
                        Try Again
                    </Button>

                    <Button
                        variant="outline"
                        onClick={() => navigate("/checkout")}
                        className="w-full"
                    >
                        Return to Checkout
                    </Button>

                    <Button
                        variant="ghost"
                        onClick={() => navigate("/support")}
                        className="w-full"
                    >
                        <HeadphonesIcon className="w-4 h-4 mr-2" />
                        Contact Support
                    </Button>
                </div>

                <div className="mt-6 pt-6 border-t text-center">
                    <p className="text-sm text-muted-foreground">
                        Need help? Our support team is available to assist you.
                    </p>
                </div>
            </Card>
        </div>
    );
}
