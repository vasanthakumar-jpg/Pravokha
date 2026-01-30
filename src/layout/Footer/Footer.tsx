import { useState } from "react";
import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter, Mail, Youtube } from "lucide-react";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { apiClient } from "@/infra/api/apiClient";
import { toast } from "@/shared/hook/use-toast";
import { z } from "zod";
import { useTheme } from "next-themes";
import logoLight from "@/assets/logo-light.png";
import logoDark from "@/assets/logo-dark.png";
import { TrustBadges } from "@/shared/ui/TrustBadges";
import { AnimatedPaymentIcons } from "@/shared/ui/PaymentIcons";
import { useAuth } from "@/core/context/AuthContext";
import { cn } from "@/lib/utils";
import styles from "./Footer.module.css";

const emailSchema = z.string().email("Invalid email address");

export function Footer() {
    const [email, setEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { theme } = useTheme();
    const { user, role } = useAuth();

    const handleNewsletterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            emailSchema.parse(email);
        } catch (error) {
            toast({
                title: "Invalid email",
                description: "Please enter a valid email address.",
                variant: "destructive",
            });
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await apiClient.post("/newsletter/subscribe", { email: email.trim().toLowerCase() });

            if (response.data.success) {
                toast({
                    title: "Subscribed successfully!",
                    description: response.data.message || "Thank you for subscribing to our newsletter.",
                });
                setEmail("");
            } else {
                throw new Error(response.data.message || "Subscription failed");
            }
        } catch (error: any) {
            toast({
                title: "Subscription failed",
                description: error.response?.data?.message || "Something went wrong. Please try again later.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <footer className={styles.footer}>
            <div className={cn("container", styles.trustBadgesContainer)}>
                <TrustBadges />
            </div>

            <div className={styles.mainContent}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 text-sm">
                    {/* About */}
                    <div>
                        <h4 className="font-semibold mb-4 text-muted-foreground uppercase tracking-wider text-xs">About</h4>
                        <ul className="space-y-2 mb-6">
                            <li><Link to="/contact" className="hover:underline hover:text-primary transition-colors">Contact Us</Link></li>
                            <li><Link to="/about" className="hover:underline hover:text-primary transition-colors">About Us</Link></li>
                        </ul>
                        <div className="mt-6">
                            <h4 className="font-semibold mb-2 text-muted-foreground uppercase tracking-wider text-xs">Social:</h4>
                            <div className="flex gap-4">
                                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors"><Facebook className="h-5 w-5" /></a>
                                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors"><Twitter className="h-5 w-5" /></a>
                                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors"><Youtube className="h-5 w-5" /></a>
                                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors"><Instagram className="h-5 w-5" /></a>
                            </div>
                        </div>
                    </div>

                    {/* Help */}
                    <div>
                        <h4 className="font-semibold mb-4 text-muted-foreground uppercase tracking-wider text-xs">Help</h4>
                        <ul className="space-y-2">
                            <li><Link to="/payments-info" className="hover:underline hover:text-primary transition-colors">Payments</Link></li>
                            <li><Link to="/shipping-returns" className="hover:underline hover:text-primary transition-colors">Shipping & Returns</Link></li>
                            <li><Link to="/faq" className="hover:underline hover:text-primary transition-colors">FAQ</Link></li>
                            <li><Link to="/tickets" className="hover:underline hover:text-primary transition-colors">Report</Link></li>
                            <li><Link to="/size-guide" className="hover:underline hover:text-primary transition-colors">Size Guide</Link></li>
                            <li><Link to="/support" className="hover:underline hover:text-primary transition-colors">Support Center</Link></li>
                        </ul>
                    </div>

                    {/* Consumer Policy */}
                    <div>
                        <h4 className="font-semibold mb-4 text-muted-foreground uppercase tracking-wider text-xs">Consumer Policy</h4>
                        <ul className="space-y-2">
                            <li><Link to="/cancellation-returns" className="hover:underline hover:text-primary transition-colors">Cancellation & Returns</Link></li>
                            <li><Link to="/terms" className="hover:underline hover:text-primary transition-colors">Terms of Use</Link></li>
                            <li><Link to="/security" className="hover:underline hover:text-primary transition-colors">Security</Link></li>
                            <li><Link to="/privacy" className="hover:underline hover:text-primary transition-colors">Privacy</Link></li>
                            <li><Link to="/learn-more" className="hover:underline hover:text-primary transition-colors">Learn More</Link></li>
                        </ul>
                    </div>

                    {/* Mail Us */}
                    <div className="lg:col-span-1">
                        <h4 className="font-semibold mb-4 text-muted-foreground uppercase tracking-wider text-xs">Mail Us:</h4>
                        <p className="text-muted-foreground leading-relaxed text-xs">
                            Pravokha Internet Private Limited,<br />
                            12, PN Road,<br />
                            Tiruppur, 641602,<br />
                            Tamil Nadu, India
                        </p>
                    </div>

                    {/* Registered Office */}
                    <div className="lg:col-span-1">
                        <h4 className="font-semibold mb-4 text-muted-foreground uppercase tracking-wider text-xs">Registered Office Address:</h4>
                        <p className="text-muted-foreground leading-relaxed text-xs">
                            Pravokha Internet Private Limited,<br />
                            12, PN Road,<br />
                            Tiruppur, 641602,<br />
                            Tamil Nadu, India<br />
                            CIN : U51109KA2012PTC066107<br />
                            Telephone: 044-45614700 / 044-67415800
                        </p>
                    </div>

                    {/* Newsletter (Keep existing but simplified) */}
                    <div className="lg:col-span-1">
                        <h4 className="font-semibold mb-4 text-muted-foreground uppercase tracking-wider text-xs">Stay Updated</h4>
                        <form onSubmit={handleNewsletterSubmit} className="space-y-2">
                            <Input
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="h-8 text-xs bg-background/50 border border-primary/40 focus-visible:border-primary"
                                required
                            />
                            <Button type="submit" size="sm" className="w-full h-8 text-xs">Subscribe</Button>
                        </form>
                        <div className="mt-4">
                            <AnimatedPaymentIcons />
                        </div>
                    </div>
                </div>

                <div className={styles.copyright}>
                    <p>&copy; 2025 Pravokha. All rights reserved.</p>
                    <div className={styles.legalLinks}>
                        <Link to="/privacy" className={styles.link}>
                            Privacy Policy
                        </Link>
                        <Link to="/terms" className={styles.link}>
                            Terms & Conditions
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
