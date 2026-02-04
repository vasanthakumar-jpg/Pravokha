import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/core/context/AuthContext";
import { useCart } from "@/core/context/CartContext";
import { apiClient } from "@/infra/api/apiClient";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { Label } from "@/ui/Label";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/Card";
import { Separator } from "@/ui/Separator";
import { PaymentMethods } from "@/feat/checkout/components/PaymentMethods";

import { ProcessingOverlay } from "@/feat/checkout/components/ProcessingOverlay";
import { toast } from "@/shared/hook/use-toast";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { emailClient } from "@/lib/services/email/EmailClient";
import { Shield } from "lucide-react";

const checkoutSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters"),
    email: z.string().email("Invalid email address").max(255, "Email must be less than 255 characters"),
    phone: z.string().regex(/^[6-9]\d{9}$/, "Phone must be a valid 10-digit Indian number"),
    address: z.string().min(10, "Address must be at least 10 characters").max(500, "Address must be less than 500 characters"),
    city: z.string().min(2, "City must be at least 2 characters").max(100, "City must be less than 100 characters"),
    pincode: z.string().regex(/^[1-9]\d{5}$/, "Pincode must be a valid 6-digit Indian pincode"),
});

export function CheckoutPage() {
    const navigate = useNavigate();
    const { user, isSuspended } = useAuth();
    const { items, cartTotal, clearCart } = useCart();
    const [paymentMethod, setPaymentMethod] = useState("upi");
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showPaymentDialog, setShowPaymentDialog] = useState(false);
    const [orderNumber, setOrderNumber] = useState("");
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        pincode: "",
    });

    const [paymentDetails, setPaymentDetails] = useState({
        bankName: "",
        upiId: "",
    });

    const [isProcessing, setIsProcessing] = useState(false);
    const [processingStep, setProcessingStep] = useState<'contacting' | 'verifying' | 'confirming' | 'success'>('contacting');
    const [settings, setSettings] = useState({ taxRate: 18, shippingFee: 50 });
    const [orderCount, setOrderCount] = useState(0);

    useEffect(() => {
        fetchSettings();
        fetchOrderCount();
    }, []);

    const fetchOrderCount = async () => {
        try {
            const response = await apiClient.get('/orders', { params: { limit: 1 } });
            if (response.data.success) {
                setOrderCount(response.data.meta.total);
            }
        } catch (error) {
            console.error("Failed to fetch order count:", error);
        }
    };

    const fetchSettings = async () => {
        try {
            const response = await apiClient.get('/payments/settings');
            if (response.data.success) {
                setSettings({
                    taxRate: response.data.settings.taxRate,
                    shippingFee: response.data.settings.shippingFee
                });
            }
        } catch (error) {
            console.error("Failed to fetch settings:", error);
        }
    };

    useEffect(() => {
        checkUser();
    }, []);

    const checkUser = async () => {
        // User is already checked by AuthContext, just verify we have a user
        if (!user) {
            toast({
                title: "Login Required",
                description: "Please login to continue with checkout",
                variant: "destructive",
            });
            navigate("/auth");
            return;
        }
        setLoading(false);
    };

    const tshirtItems = items.filter(item => item.price === 325);
    const tshirtCount = tshirtItems.reduce((sum, item) => sum + item.quantity, 0);
    const comboSets = Math.floor(tshirtCount / 3);
    const hasComboOffer = comboSets > 0;

    // rawSubtotal is the price before any combo discounts
    const rawSubtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const comboSavings = comboSets * (3 * 325 - 949);

    // actualSubtotal matches what the backend will calculate
    const actualSubtotal = rawSubtotal - comboSavings;

    const isEligibleForFreeShipping = user && orderCount < 3;
    const shipping = isEligibleForFreeShipping ? 0 : 50;
    const tax = Math.round((actualSubtotal + shipping) * (settings.taxRate / 100));
    const total = actualSubtotal + shipping + tax;
    const discountedTotal = total; // For clarity in handlePaymentComplete if needed

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        if (errors[name]) {
            setErrors({ ...errors, [name]: "" });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            checkoutSchema.parse(formData);
            setErrors({});
        } catch (error) {
            if (error instanceof z.ZodError) {
                const newErrors: Record<string, string> = {};
                error.errors.forEach((err) => {
                    if (err.path[0]) {
                        newErrors[err.path[0].toString()] = err.message;
                    }
                });
                setErrors(newErrors);
                return;
            }
        }

        if (!user) {
            toast({ title: "Error", description: "Please login to place an order", variant: "destructive" });
            return;
        }

        if (isSuspended) {
            toast({
                title: "Account Restricted",
                description: "Your account is currently under compliance review and cannot place new orders.",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);

        try {
            const sanitizedItems = items.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                variantId: item.variantId,
                color: item.colorName,
                size: item.size,
            }));

            // Call Stripe payment intent creation endpoint
            const response = await apiClient.post('/payments/create-intent', {
                items: sanitizedItems,
                shippingAddress: {
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    address: formData.address,
                    city: formData.city,
                    pincode: formData.pincode,
                },
            });

            const { clientSecret, orderId, orderNumber, amount, orders } = response.data;

            // Navigate to payment confirmation page
            navigate(`/payment/confirm?client_secret=${clientSecret}&order_id=${orderId}&order_number=${orderNumber}&amount=${amount}`);
        } catch (error: any) {
            console.error('Payment intent creation failed:', error);
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to initialize payment. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handlePaymentComplete = async (paymentDetails: any, orderId: string) => {
        try {
            if (isSuspended) {
                throw new Error("TRANSACTION_BLOCKED: Your account is suspended.");
            }

            const sanitizedItems = items.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                variantId: item.variantId,
                color: item.colorName,
                size: item.size,
            }));

            const orderData = {
                orderNumber: orderId,
                customerName: formData.name,
                customerEmail: formData.email,
                customerPhone: formData.phone,
                shippingAddress: formData.address,
                shippingCity: formData.city,
                shippingPincode: formData.pincode,
                items: sanitizedItems,
                total: total,
                paymentMethod: paymentDetails.method,
                stripeIntentId: paymentDetails.transactionId,
                status: "CONFIRMED",
                paymentStatus: paymentDetails.method === 'cod' ? 'PENDING' : 'PAID',
            };

            const response = await apiClient.post("/orders", orderData);

            if (!response.data.success) throw new Error("Backend failed to create order.");

            const confirmedOrder = response.data.data.order;

            // Send confirmation email (don't let it crash the success flow)
            try {
                await emailClient.sendOrderConfirmation(formData.email, confirmedOrder);
            } catch (emailErr) {
                console.error("Email confirmation failed:", emailErr);
            }

            toast({
                title: "Order Placed Successfully",
                description: `Your order #${confirmedOrder.orderNumber} has been confirmed.`,
            });

            clearCart();
            setShowPaymentDialog(false);
            setTimeout(() => navigate("/orders"), 1000);
        } catch (error: any) {
            console.error("Error placing order:", error);
            setIsProcessing(false);
            const errorMessage = error.message || "Failed to place order. Please try again.";
            toast({
                title: "Order Failed",
                description: errorMessage,
                variant: "destructive",
            });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-muted-foreground">Loading checkout...</p>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="w-full px-4 sm:px-6 lg:px-8 py-16 text-center">
                <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
                <Button onClick={() => navigate("/products")}>Continue Shopping</Button>
            </div>
        );
    }

    return (
        <div className="w-full max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl sm:text-3xl font-bold mb-8">Checkout</h1>

            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    {/* Shipping Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl sm:text-2xl">Shipping Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="name">Full Name *</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="John Doe"
                                        className={cn(errors.name && "border-red-500")}
                                        required
                                    />
                                    {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="phone">Phone *</Label>
                                    <Input
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        placeholder="+91 9876543210"
                                        className={cn(errors.phone && "border-red-500")}
                                        required
                                    />
                                    {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="email">Email *</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder="john@example.com"
                                    className={cn(errors.email && "border-red-500")}
                                    required
                                />
                                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                            </div>
                            <div>
                                <Label htmlFor="address">Address *</Label>
                                <Input
                                    id="address"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    placeholder="Street address"
                                    className={cn(errors.address && "border-red-500")}
                                    required
                                />
                                {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="city">City *</Label>
                                    <Input
                                        id="city"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleInputChange}
                                        placeholder="Mumbai"
                                        className={cn(errors.city && "border-red-500")}
                                        required
                                    />
                                    {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="pincode">Pincode *</Label>
                                    <Input
                                        id="pincode"
                                        name="pincode"
                                        value={formData.pincode}
                                        onChange={handleInputChange}
                                        placeholder="400001"
                                        className={cn(errors.pincode && "border-red-500")}
                                        required
                                    />
                                    {errors.pincode && <p className="text-xs text-red-500 mt-1">{errors.pincode}</p>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <PaymentMethods
                        value={paymentMethod}
                        onChange={setPaymentMethod}
                        details={paymentDetails}
                        onDetailsChange={setPaymentDetails}
                    />
                </div>

                {/* Order Summary */}
                <div>
                    <Card className="sticky top-20">
                        <CardHeader>
                            <CardTitle>Order Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                {items.map((item) => (
                                    <div
                                        key={`${item.productId}-${item.variantId}-${item.size}`}
                                        className="flex gap-3 cursor-pointer group hover:bg-muted/30 p-1.5 rounded-lg transition-colors"
                                        onClick={() => navigate(`/product/${item.productId}`)}
                                    >
                                        <img
                                            src={item.image}
                                            alt={item.title}
                                            className="w-16 h-16 object-cover rounded border group-hover:scale-105 transition-transform"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">{item.title}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {item.colorName} • {item.size} • Qty: {item.quantity}
                                            </p>
                                            <div className="flex justify-between items-center mt-1">
                                                <p className="text-sm font-semibold">₹{item.price * item.quantity}</p>
                                                <span className="text-[9px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">VIEW</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <Separator />

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Subtotal</span>
                                    <span>₹{rawSubtotal}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Shipping</span>
                                    <span>₹{shipping}</span>
                                </div>
                                {hasComboOffer && (
                                    <div className="flex justify-between text-sm text-accent font-semibold">
                                        <span>🎉 Combo Offer Savings</span>
                                        <span>-₹{comboSavings}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-sm">
                                    <span>Tax ({settings.taxRate}%)</span>
                                    <span>₹{tax}</span>
                                </div>
                                {isEligibleForFreeShipping && (
                                    <p className="text-[10px] text-green-600 font-bold text-center">
                                        🎉 Free shipping on your first 3 orders!
                                    </p>
                                )}
                                <Separator />
                                <div className="flex justify-between font-bold text-lg">
                                    <span>Total</span>
                                    <span>₹{total}</span>
                                </div>

                                {isSuspended && (
                                    <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-4 rounded-md text-sm mt-4 shadow-sm">
                                        <div className="flex items-center gap-2 font-bold mb-2">
                                            <Shield className="h-4 w-4" />
                                            Account Restricted
                                        </div>
                                        <p className="opacity-90 leading-relaxed mb-3">
                                            Your account is currently under compliance review and cannot place new orders at this time.
                                        </p>
                                        <Button
                                            variant="link"
                                            className="text-destructive p-0 h-auto font-bold underline"
                                            onClick={() => navigate("/support")}
                                        >
                                            Contact Support for Resolution
                                        </Button>
                                    </div>
                                )}

                                {items.some(item => user && item.sellerId === user.id) && (
                                    <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md text-sm font-medium mt-4">
                                        <p className="font-bold mb-1">Action Required</p>
                                        <p>You cannot purchase your own products. Please remove the following items to proceed:</p>
                                        <ul className="list-disc list-inside mt-1 space-y-0.5 text-xs opacity-90">
                                            {items.filter(item => user && item.sellerId === user.id).map((item, idx) => (
                                                <li key={idx}>{item.title}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {hasComboOffer && (
                                    <p className="text-xs text-accent font-medium text-center pt-2">
                                        You saved ₹{comboSavings} with our 3 T-shirts combo offer!
                                    </p>
                                )}
                            </div>

                            <Button
                                className="w-full bg-primary hover:bg-primary-hover text-lg h-12"
                                onClick={handleSubmit}
                                disabled={items.some(item => user && item.sellerId === user.id) || loading || isSuspended}
                            >
                                {isSuspended
                                    ? "Account Restricted"
                                    : items.some(item => user && item.sellerId === user.id)
                                        ? "Remove Own Items to Proceed"
                                        : "Proceed to Payment"}
                            </Button>

                            <p className="text-xs text-muted-foreground text-center">
                                By placing this order, you agree to our Terms & Conditions
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>



            <ProcessingOverlay
                isOpen={isProcessing}
                step={processingStep}
                paymentMethod={paymentMethod}
                bankName={paymentDetails.bankName}
            />
        </div>
    );
}

export default CheckoutPage;
