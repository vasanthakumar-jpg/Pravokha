import { Package, RotateCcw, Truck, Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";

export function ShippingReturnsPage() {
    return (
        <div className="container py-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold mb-4 text-center">Shipping & Returns</h1>
                <p className="text-muted-foreground text-center mb-12 text-lg">
                    Everything you need to know about our shipping and return policies.
                </p>

                <div className="grid md:grid-cols-2 gap-6 mb-12">
                    <Card>
                        <CardHeader>
                            <Truck className="h-10 w-10 text-primary mb-2" />
                            <CardTitle>Free Shipping</CardTitle>
                            <CardDescription>On orders above ₹999</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">
                                Enjoy free shipping across India on all orders above ₹999. Orders below this amount have a flat shipping fee of ₹99.
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <Package className="h-10 w-10 text-primary mb-2" />
                            <CardTitle>Fast Delivery</CardTitle>
                            <CardDescription>5-7 business days</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">
                                Orders are processed within 1-2 business days and typically delivered within 5-7 business days across India.
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <RotateCcw className="h-10 w-10 text-primary mb-2" />
                            <CardTitle>Easy Returns</CardTitle>
                            <CardDescription>30-day return policy</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">
                                Not satisfied? Return items within 30 days in original condition with tags attached for a full refund or exchange.
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <Shield className="h-10 w-10 text-primary mb-2" />
                            <CardTitle>Secure Packaging</CardTitle>
                            <CardDescription>Quality guaranteed</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">
                                All products are carefully packaged to ensure they reach you in perfect condition. Quality checked before dispatch.
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Shipping Policy</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h3 className="font-semibold mb-2">Processing Time</h3>
                                <p className="text-muted-foreground">
                                    Orders are processed within 1-2 business days (Monday-Friday, excluding public holidays). Orders placed on weekends or holidays will be processed on the next business day.
                                </p>
                            </div>
                            <div>
                                <h3 className="font-semibold mb-2">Delivery Time</h3>
                                <p className="text-muted-foreground">
                                    Standard delivery takes 5-7 business days. Metro cities may receive orders within 3-5 business days. Remote areas may take up to 10 business days.
                                </p>
                            </div>
                            <div>
                                <h3 className="font-semibold mb-2">Shipping Costs</h3>
                                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                                    <li>Free shipping on orders above ₹999</li>
                                    <li>₹99 flat rate on orders below ₹999</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-semibold mb-2">Order Tracking</h3>
                                <p className="text-muted-foreground">
                                    You'll receive a tracking number via email once your order ships. Track your package in real-time on our website or the courier's website.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Return & Exchange Policy</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h3 className="font-semibold mb-2">Return Window</h3>
                                <p className="text-muted-foreground">
                                    Items can be returned within 30 days of delivery. Products must be unused, unwashed, and in original condition with all tags attached.
                                </p>
                            </div>
                            <div>
                                <h3 className="font-semibold mb-2">How to Return</h3>
                                <ol className="list-decimal list-inside text-muted-foreground space-y-1">
                                    <li>Contact our support team with your order number</li>
                                    <li>Pack the item securely in its original packaging</li>
                                    <li>Ship using our prepaid return label</li>
                                    <li>Refund processed within 5-7 business days after receiving the item</li>
                                </ol>
                            </div>
                            <div>
                                <h3 className="font-semibold mb-2">Exchange Policy</h3>
                                <p className="text-muted-foreground">
                                    We offer size and color exchanges subject to availability. Exchanges follow the same process as returns. The replacement item will be shipped once we receive the returned item.
                                </p>
                            </div>
                            <div>
                                <h3 className="font-semibold mb-2">Non-Returnable Items</h3>
                                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                                    <li>Items without original tags</li>
                                    <li>Washed or worn items</li>
                                    <li>Items marked as "Final Sale"</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-semibold mb-2">Return Shipping</h3>
                                <p className="text-muted-foreground">
                                    We provide a prepaid return label for all returns. For exchanges, return shipping is free. For refunds, a ₹99 processing fee may be deducted from your refund.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-muted">
                        <CardContent className="pt-6">
                            <p className="text-center">
                                <strong>Need Help?</strong> Contact our customer support at{" "}
                                <a href="mailto:vasanthakumar141099@gmail.com" className="text-primary hover:underline">
                                    vasanthakumar141099@gmail.com
                                </a>{" "}
                                or call{" "}
                                <a href="tel:+917339232817" className="text-primary hover:underline">
                                    7339232817
                                </a>
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default ShippingReturnsPage;
