import { useState, useEffect, FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import { Button } from "@/ui/Button";
import { Card } from "@/ui/Card";
import { Alert, AlertDescription } from "@/ui/Alert";
import { Loader2, CreditCard, Lock } from "lucide-react";

// Initialize Stripe (client-side only)
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || "");

function PaymentForm() {
    const stripe = useStripe();
    const elements = useElements();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [errorMessage, setErrorMessage] = useState<string>("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [isReady, setIsReady] = useState(false);

    const orderId = searchParams.get("order_id");
    const orderNumber = searchParams.get("order_number");
    const amount = searchParams.get("amount");

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setIsProcessing(true);
        setErrorMessage("");

        try {
            const { error } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: `${window.location.origin}/payment/success?order_id=${orderId}`,
                },
            });

            if (error) {
                setErrorMessage(error.message || "Payment failed. Please try again.");
                console.error("Payment error:", error);
            }
        } catch (err: any) {
            setErrorMessage("An unexpected error occurred. Please try again.");
            console.error("Payment exception:", err);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="container max-w-2xl mx-auto p-6 py-12">
            <Card className="p-8">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                        <CreditCard className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold mb-2">Complete Your Payment</h1>
                    <p className="text-muted-foreground">
                        {orderNumber && `Order: ${orderNumber}`}
                    </p>
                    {amount && !isNaN(parseFloat(amount)) ? (
                        <p className="text-2xl font-bold mt-2">₹{parseFloat(amount).toFixed(2)}</p>
                    ) : (
                        <p className="text-2xl font-bold mt-2 text-red-500">Wait... calculating amount</p>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="border rounded-lg p-4 bg-muted/50">
                        <PaymentElement
                            onReady={() => setIsReady(true)}
                            options={{
                                layout: "tabs",
                            }}
                        />
                    </div>

                    {errorMessage && (
                        <Alert variant="destructive">
                            <AlertDescription>{errorMessage}</AlertDescription>
                        </Alert>
                    )}

                    <div className="flex items-center justify-center text-sm text-muted-foreground gap-2 mb-4">
                        <Lock className="w-4 h-4" />
                        <span>Secured by Stripe</span>
                    </div>

                    <Button
                        type="submit"
                        disabled={!stripe || !isReady || isProcessing}
                        className="w-full h-12 text-lg"
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            `Pay ₹${amount && !isNaN(parseFloat(amount)) ? parseFloat(amount).toFixed(2) : "0.00"}`
                        )}
                    </Button>

                    <div className="text-center">
                        <button
                            type="button"
                            onClick={() => navigate("/checkout")}
                            className="text-sm text-muted-foreground hover:text-foreground underline"
                            disabled={isProcessing}
                        >
                            Return to checkout
                        </button>
                    </div>
                </form>

                <div className="mt-6 pt-6 border-t text-xs text-muted-foreground text-center space-y-1">
                    <p>Your payment information is encrypted and secure.</p>
                    <p>By completing this purchase, you agree to our Terms of Service.</p>
                </div>
            </Card>
        </div>
    );
}

export default function PaymentConfirmationPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const clientSecret = searchParams.get("client_secret");
    const orderId = searchParams.get("order_id");

    useEffect(() => {
        if (!clientSecret || !orderId) {
            navigate("/checkout");
        }
    }, [clientSecret, orderId, navigate]);

    if (!clientSecret) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <Elements
            stripe={stripePromise}
            options={{
                clientSecret,
                appearance: {
                    theme: 'stripe',
                },
            }}
        >
            <PaymentForm />
        </Elements>
    );
}
