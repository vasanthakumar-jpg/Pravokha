import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { apiClient } from "@/infra/api/apiClient";
import { Card } from "@/ui/Card";
import { Button } from "@/ui/Button";
import { CheckCircle, Loader2, Package, CreditCard } from "lucide-react";
import { useCart } from "@/core/context/CartContext";

export default function PaymentSuccessPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { clearCart } = useCart();

    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const orderId = searchParams.get("orderNumber") || searchParams.get("order_id");

    useEffect(() => {
        if (orderId) {
            verifyPayment();
        } else {
            setError("Missing order details for confirmation");
            setLoading(false);
        }
    }, [orderId]);

    const verifyPayment = async () => {
        try {
            // Support both internal orderId and orderNumber if needed
            // For now, let's assume orderNumber is passed from CheckoutPage
            const response = await apiClient.get(`/payments/status/${orderId}`);
            const paymentData = response.data;

            setOrder(paymentData);

            // Only clear cart if payment is confirmed as PAID
            if (paymentData.paymentStatus === "PAID") {
                clearCart();
            }
        } catch (error: any) {
            console.error("Failed to verify payment:", error);
            setError(error.response?.data?.message || "Failed to verify payment status");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Verifying your payment...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container max-w-2xl mx-auto p-6 py-12">
                <Card className="p-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
                        <CreditCard className="w-8 h-8 text-destructive" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Verification Error</h1>
                    <p className="text-muted-foreground mb-6">{error}</p>
                    <Button onClick={() => navigate("/user/orders")}>View Orders</Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="container max-w-2xl mx-auto p-6 py-12">
            <Card className="p-8">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 mb-4 animate-bounce">
                        <CheckCircle className="w-12 h-12 text-green-500" />
                    </div>
                    <h1 className="text-4xl font-bold mb-2">Payment Successful!</h1>
                    <p className="text-lg text-muted-foreground">
                        Thank you for your order. Your payment has been processed successfully.
                    </p>
                </div>

                {order && (
                    <div className="space-y-6">
                        <div className="bg-muted/50 rounded-lg p-6 space-y-4">
                            <div className="flex justify-between items-center border-b pb-3">
                                <span className="text-sm text-muted-foreground">Order Number</span>
                                <span className="text-lg font-bold font-mono">{order.orderNumber}</span>
                            </div>

                            <div className="flex justify-between items-center border-b pb-3">
                                <span className="text-sm text-muted-foreground">Total Paid</span>
                                <span className="text-xl font-bold text-green-600">
                                    ₹{order.totalAmount?.toFixed(2) || '0.00'}
                                </span>
                            </div>

                            <div className="flex justify-between items-center border-b pb-3">
                                <span className="text-sm text-muted-foreground">Payment Method</span>
                                <span className="font-semibold capitalize">
                                    {order.paymentMethod || "Card"}
                                </span>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Payment Status</span>
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/10 text-green-700 text-sm font-semibold">
                                    <CheckCircle className="w-4 h-4" />
                                    Paid
                                </span>
                            </div>
                        </div>

                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex items-start gap-3">
                            <Package className="w-5 h-5 text-blue-600 mt-0.5" />
                            <div className="flex-1">
                                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                                    What's Next?
                                </h3>
                                <p className="text-sm text-blue-700 dark:text-blue-200">
                                    We've sent a confirmation email to your inbox. Your order is now being
                                    processed and will be shipped soon.
                                </p>
                            </div>
                        </div>
                    </div>
                )
                }

                <div className="mt-8 flex flex-col sm:flex-row gap-4">
                    <Button onClick={() => navigate("/user/orders")} className="flex-1">
                        <Package className="w-4 h-4 mr-2" />
                        View My Orders
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => navigate("/products")}
                        className="flex-1"
                    >
                        Continue Shopping
                    </Button>
                </div>
            </Card >
        </div >
    );
}
