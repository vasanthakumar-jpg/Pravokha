import { useEffect, ReactNode } from "react";
import { useLocation, Link } from "react-router-dom";
import { Button } from "@/ui/Button";
import {
    ArrowLeft, Shield, FileText, RefreshCw, CreditCard,
    Lock, CheckCircle, Truck, AlertCircle,
    Info, Calendar, Phone, Mail, MapPin, Briefcase
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PolicyPageProps {
    type: "privacy" | "terms" | "security" | "cancellation" | "shipping" | "sitemap" | "grievance" | "epr" | "infringement" | "payments" | "corporate" | "press" | "stories" | "careers";
}

interface PolicySection {
    icon?: ReactNode;
    title: string;
    content: ReactNode;
}

export default function PolicyPage({ type }: PolicyPageProps) {
    const { pathname } = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    const getContent = () => {
        switch (type) {
            case "privacy":
                return {
                    title: "Privacy Policy",
                    subtitle: "Your data privacy is our top priority.",
                    icon: <Lock className="h-8 w-8 sm:h-12 sm:w-12 text-primary" />,
                    sections: [
                        {
                            title: "Information Collection",
                            icon: <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />,
                            content: (
                                <p>We collect information you provide directly to us, such as when you create or modify your account, request on-demand services, contact customer support, or otherwise communicate with us. This information may include: name, email, phone number, postal address, profile picture, payment method, items requested (for delivery services), delivery notes, and other information you choose to provide.</p>
                            )
                        },
                        {
                            title: "Use of Information",
                            icon: <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />,
                            content: (
                                <ul className="list-disc list-inside space-y-2">
                                    <li>Provide, maintain, and improve our Services.</li>
                                    <li>Process payments and send related receipts.</li>
                                    <li>Send you technical notices, updates, security alerts, and support messages.</li>
                                    <li>Respond to your comments, questions, and requests.</li>
                                </ul>
                            )
                        },
                        {
                            title: "Data Security",
                            icon: <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />,
                            content: (
                                <p>We implement appropriate technical and organizational measures to protect specific personal data against unauthorized or unlawful processing and against accidental loss, destruction, damage, alteration or disclosure.</p>
                            )
                        }
                    ]
                };
            case "terms":
                return {
                    title: "Terms of Use",
                    subtitle: "Please read these terms carefully before using our services.",
                    icon: <FileText className="h-8 w-8 sm:h-12 sm:w-12 text-primary" />,
                    sections: [
                        {
                            title: "Acceptance of Terms",
                            content: "By accessing or using our website, mobile application, or any other services we provide, you agree to be bound by these Terms of Use and our Privacy Policy."
                        },
                        {
                            title: "User Accounts",
                            content: "You may need to register for an account to access certain features. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete."
                        },
                        {
                            title: "Product Information",
                            content: "We attempt to be as accurate as possible. However, we do not warrant that product descriptions or other content of this site is accurate, complete, reliable, current, or error-free."
                        }
                    ]
                };
            case "cancellation":
                return {
                    title: "Cancellation & Returns",
                    subtitle: "Hassle-free returns and easy cancellations.",
                    icon: <RefreshCw className="h-8 w-8 sm:h-12 sm:w-12 text-primary" />,
                    sections: [
                        {
                            title: "Cancellation Policy",
                            icon: <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />,
                            content: (
                                <div className="space-y-3 text-sm sm:text-base">
                                    <p>At Pravokha, we understand that plans can change. You can cancel your order easily through your account dashboard or by contacting our support team.</p>
                                    <div className="bg-primary/5 p-3 sm:p-4 rounded-lg border border-primary/10">
                                        <h4 className="font-semibold mb-2 text-sm sm:text-base">Cancellation Rules:</h4>
                                        <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm">
                                            <li><strong>Before Shipment:</strong> You can cancel your order anytime before it has been shipped for a full refund.</li>
                                            <li><strong>After Shipment:</strong> Once shipped, the order cannot be cancelled. However, you can choose to refuse delivery or return it after receiving.</li>
                                        </ul>
                                    </div>
                                    <p className="text-xs sm:text-sm text-muted-foreground mt-2">Refunds for prepaid orders will be initiated immediately upon cancellation and credited within 5-7 business days.</p>
                                </div>
                            )
                        },
                        {
                            title: "Return & Exchange Policy",
                            icon: <Truck className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />,
                            content: (
                                <div className="space-y-4 text-sm sm:text-base">
                                    <p>We offer a <strong>7-Day "No Questions Asked" Return Policy</strong> for most items. If you are not satisfied with your purchase, you can return it for a refund or exchange.</p>

                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div className="bg-muted p-3 sm:p-4 rounded-lg">
                                            <h4 className="font-semibold mb-2 text-sm">Eligibility:</h4>
                                            <ul className="list-disc list-inside text-xs space-y-1">
                                                <li>Item must be unused & unwashed.</li>
                                                <li>Original tags must be intact.</li>
                                                <li>Original packaging required.</li>
                                                <li>Request raised within 7 days of delivery.</li>
                                            </ul>
                                        </div>
                                        <div className="bg-muted p-3 sm:p-4 rounded-lg">
                                            <h4 className="font-semibold mb-2 text-sm">Non-Returnable:</h4>
                                            <ul className="list-disc list-inside text-xs space-y-1">
                                                <li>Innerwear / Lingerie</li>
                                                <li>Socks & Swimwear</li>
                                                <li>Personal Care items</li>
                                                <li>Free Gifts / Promotional items</li>
                                            </ul>
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <h4 className="font-semibold mb-2 text-sm sm:text-base">How to Return:</h4>
                                        <ol className="list-decimal list-inside text-xs sm:text-sm space-y-1">
                                            <li>Go to 'My Orders' and select the item to return.</li>
                                            <li>Choose reason and select 'Return' or 'Exchange'.</li>
                                            <li>Our courier partner will pick up the item within 2-3 business days.</li>
                                            <li>Refund/Exchange initiated after quality check (usually within 24 hours of pickup).</li>
                                        </ol>
                                    </div>
                                </div>
                            )
                        }
                    ]
                };
            case "shipping":
                return {
                    title: "Shipping & Delivery",
                    subtitle: "Fast, reliable, and trackable shipping.",
                    icon: <Truck className="h-8 w-8 sm:h-12 sm:w-12 text-primary" />,
                    sections: [
                        {
                            title: "Shipping Policy",
                            content: (
                                <div className="space-y-3 text-sm sm:text-base">
                                    <p>We partner with top logistics providers like BlueDart, Delhivery, and XpressBees to ensure your order reaches you safely and on time.</p>
                                    <ul className="list-disc list-inside space-y-2">
                                        <li><strong>Dispatch Time:</strong> Orders are typically processed and dispatched within 24 hours of placement.</li>
                                        <li><strong>Delivery Time:</strong> Standard delivery takes 3-7 business days depending on your location.</li>
                                        <li><strong>Shipping Charges:</strong> Free shipping on all prepaid orders. A nominal fee of ₹50 is applicable for Cash on Delivery orders below ₹999.</li>
                                    </ul>
                                </div>
                            )
                        },
                        {
                            title: "Order Tracking",
                            icon: <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />,
                            content: "Once your order is shipped, you will receive a tracking link via SMS and Email. You can also track your order status in real-time from the 'My Orders' section of your account."
                        }
                    ]
                };
            case "payments":
                return {
                    title: "Payments & Pricing",
                    subtitle: "Secure and flexible payment options.",
                    icon: <CreditCard className="h-8 w-8 sm:h-12 sm:w-12 text-primary" />,
                    sections: [
                        {
                            title: "Accepted Payment Methods",
                            content: (
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm">
                                    <div className="flex items-center gap-2 p-3 border rounded-lg hover:border-primary/50 transition-colors"><CreditCard className="h-4 w-4 text-primary" /> Credit/Debit Cards</div>
                                    <div className="flex items-center gap-2 p-3 border rounded-lg hover:border-primary/50 transition-colors"><Shield className="h-4 w-4 text-primary" /> Net Banking</div>
                                    <div className="flex items-center gap-2 p-3 border rounded-lg hover:border-primary/50 transition-colors"><CheckCircle className="h-4 w-4 text-primary" /> UPI (GPay, PhonePe)</div>
                                    <div className="flex items-center gap-2 p-3 border rounded-lg hover:border-primary/50 transition-colors"><FileText className="h-4 w-4 text-primary" /> Cash on Delivery</div>
                                </div>
                            )
                        },
                        {
                            title: "Secure Transactions",
                            icon: <Lock className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />,
                            content: "All online transactions are protected by industry-standard 128-bit SSL encryption. We do not save your card details on our servers."
                        }
                    ]
                };
            case "careers":
                // Although removed from footer, keeping dynamic page just in case linked elsewhere or direct access
                return {
                    title: "Join Our Team",
                    subtitle: "Build the future of sportswear with us.",
                    icon: <Briefcase className="h-8 w-8 sm:h-12 sm:w-12 text-primary" />,
                    sections: [
                        {
                            title: "Why Pravokha?",
                            content: "We are a fast-growing team passionate about fitness, fashion, and technology. We offer a collaborative environment, competitive compensation, and opportunities for growth."
                        },
                        {
                            title: "Current Openings",
                            content: (
                                <div className="space-y-4">
                                    <p className="text-sm">We are currently not hiring. Please check back later.</p>
                                </div>
                            )
                        }
                    ]
                };

            // Default generic fallback
            default:
                return {
                    title: type.charAt(0).toUpperCase() + type.slice(1).replace("-", " "),
                    subtitle: "Information regarding " + type.replace("-", " "),
                    sections: [
                        {
                            title: "Details",
                            content: "Content is currently being updated for this section. Please check back shortly."
                        },
                        {
                            title: "Contact Us",
                            content: "For immediate queries, please reach out to our support team."
                        }
                    ]
                };
        }
    };

    const data = getContent();

    return (
        <div className="min-h-screen bg-background">
            {/* Hero Section */}
            <div className="bg-muted py-8 sm:py-12 border-b">
                <div className="container px-4 mx-auto max-w-4xl text-center space-y-3 sm:space-y-4">
                    <div className="flex justify-center mb-4 sm:mb-6">
                        <div className="p-3 sm:p-4 bg-background rounded-full shadow-sm">
                            {data.icon || <Info className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />}
                        </div>
                    </div>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">{data.title}</h1>
                    <p className="text-sm sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">{data.subtitle}</p>
                </div>
            </div>

            <div className="container px-4 mx-auto py-8 sm:py-12 max-w-4xl">
                <Button variant="ghost" asChild className="mb-6 sm:mb-8 pl-0 hover:bg-transparent hover:text-primary">
                    <Link to="/" className="flex items-center gap-2 text-sm sm:text-base">
                        <ArrowLeft className="h-4 w-4" /> Back to Home
                    </Link>
                </Button>

                <div className="grid gap-6 sm:gap-8">
                    {data.sections.map((section, idx) => (
                        <div key={idx} className="bg-card border rounded-xl p-5 sm:p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-start gap-3 sm:gap-4">
                                {section.icon && (
                                    <div className="mt-1 p-2 bg-primary/10 rounded-lg text-primary flex-shrink-0">
                                        {section.icon}
                                    </div>
                                )}
                                <div className="space-y-2 sm:space-y-4 flex-1 min-w-0">
                                    <h2 className="text-lg sm:text-xl font-semibold">{section.title}</h2>
                                    <div className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                                        {section.content}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 sm:mt-12 text-center text-xs sm:text-sm text-muted-foreground">
                    <p>Last updated: January 2025</p>
                    <p className="mt-2">
                        Questions? <Link to="/support" className="text-primary hover:underline">Contact Support</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
