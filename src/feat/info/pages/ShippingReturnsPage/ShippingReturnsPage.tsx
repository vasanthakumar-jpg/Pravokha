import { Package, RotateCcw, Truck, Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/Card";

export function ShippingReturnsPage() {
    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16">
            <div className="max-w-4xl mx-auto space-y-10 sm:space-y-16">
                <div className="text-center space-y-4">
                    <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold tracking-tight">Shipping & Returns</h1>
                    <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
                        Everything you need to know about our seamless delivery and easy return process.
                    </p>
                </div>

                {/* Features Grid */}
                <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
                    {[
                        { icon: Truck, title: "Free Shipping", desc: "On orders above ₹999 across India.", sub: "Flat ₹99 below ₹999" },
                        { icon: Package, title: "Fast Delivery", desc: "Delivered within 5-7 business days.", sub: "1-2 days processing" },
                        { icon: RotateCcw, title: "Easy Returns", desc: "30-day return policy for any reason.", sub: "Original condition required" },
                        { icon: Shield, title: "Safe Arrival", desc: "Quality guaranteed or your money back.", sub: "Premium packaging" }
                    ].map((feature, i) => (
                        <Card key={i} className="border-primary/5 shadow-sm hover:shadow-md transition-all duration-300 group rounded-2xl">
                            <CardHeader className="flex flex-row items-center gap-4 space-y-0 p-4 sm:p-6">
                                <div className="p-3 rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                                    <feature.icon className="h-6 w-6" />
                                </div>
                                <div>
                                    <CardTitle className="text-base sm:text-lg font-bold">{feature.title}</CardTitle>
                                    <CardDescription className="text-xs font-medium text-primary/70">{feature.sub}</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed italic">
                                    {feature.desc}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Detailed Sections */}
                <div className="grid gap-8">
                    <Card className="border-primary/5 shadow-sm rounded-2xl overflow-hidden">
                        <CardHeader className="bg-muted/30">
                            <CardTitle className="text-xl sm:text-2xl font-bold">Shipping Policy</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6 px-4 sm:px-6">
                            {[
                                { h: "Processing Time", p: "Orders are processed within 1-2 business days (Monday-Friday, excluding public holidays). Orders placed on weekends or holidays will be processed on the next business day." },
                                { h: "Delivery Time", p: "Standard delivery takes 5-7 business days. Metro cities may receive orders within 3-5 business days. Remote areas may take up to 10 business days." },
                                { h: "Shipping Costs", list: ["Free shipping on orders above ₹999", "₹99 flat rate on orders below ₹999"] },
                                { h: "Order Tracking", p: "You'll receive a tracking number via email once your order ships. Track your package in real-time on our website or the courier's website." }
                            ].map((sec, i) => (
                                <div key={i} className="space-y-2">
                                    <h3 className="font-bold text-sm sm:text-base text-foreground flex items-center gap-2">
                                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                        {sec.h}
                                    </h3>
                                    {sec.p && <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pl-3.5">{sec.p}</p>}
                                    {sec.list && (
                                        <ul className="space-y-1.5 pl-3.5 pt-1">
                                            {sec.list.map((item, j) => (
                                                <li key={j} className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
                                                    <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="border-primary/5 shadow-sm rounded-2xl overflow-hidden">
                        <CardHeader className="bg-muted/30">
                            <CardTitle className="text-xl sm:text-2xl font-bold">Return & Exchange</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6 px-4 sm:px-6">
                            {[
                                { h: "Return Window", p: "Items can be returned within 30 days of delivery. Products must be unused, unwashed, and in original condition with all tags attached." },
                                { h: "How to Return", list: ["Contact our support team with your order number", "Pack the item securely in its original packaging", "Ship using our prepaid return label", "Refund processed within 5-7 business days"] },
                                { h: "Non-Returnable Items", list: ["Items without original tags", "Washed or worn items", "Items marked as 'Final Sale'"] }
                            ].map((sec, i) => (
                                <div key={i} className="space-y-2">
                                    <h3 className="font-bold text-sm sm:text-base text-foreground flex items-center gap-2">
                                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                        {sec.h}
                                    </h3>
                                    {sec.p && <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pl-3.5">{sec.p}</p>}
                                    {sec.list && (
                                        <ul className="space-y-1.5 pl-3.5 pt-1">
                                            {sec.list.map((item, j) => (
                                                <li key={j} className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
                                                    <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="bg-primary/5 border-primary/10 shadow-none rounded-2xl">
                        <CardContent className="p-4 sm:p-8 text-center">
                            <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                                <span className="text-primary font-bold">Need Help?</span> Contact our customer support at{" "}
                                <a href="mailto:support@pravokha.com" className="text-primary font-black hover:underline px-1">
                                    support@pravokha.com
                                </a>{" "}
                                or call{" "}
                                <a href="tel:+917339232817" className="text-primary font-black hover:underline px-1">
                                    +91 7339232817
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
