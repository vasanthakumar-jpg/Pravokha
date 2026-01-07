import { useState } from "react";
import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter, Mail, Youtube } from "lucide-react";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { supabase } from "@/infra/api/supabase";
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
            const { error } = await supabase
                .from("newsletter_subscriptions")
                .insert([{ email: email.trim().toLowerCase() }]);

            if (error) {
                if (error.code === "23505") {
                    toast({
                        title: "Already subscribed",
                        description: "This email is already subscribed to our newsletter.",
                    });
                } else {
                    throw error;
                }
            } else {
                toast({
                    title: "Subscribed successfully!",
                    description: "Thank you for subscribing to our newsletter.",
                });
                setEmail("");
            }
        } catch (error: any) {
            toast({
                title: "Subscription failed",
                description: "Something went wrong. Please try again later.",
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
                <div className={styles.grid}>
                    {/* Company Info */}
                    <div className={styles.brandColumn}>
                        <Link to="/" className={styles.logoLink}>
                            <img
                                src={theme === "dark" ? logoDark : logoLight}
                                alt="PRAVOKHA Logo"
                                className={styles.logo}
                            />
                        </Link>
                        <p className={styles.tagline}>
                            Premium quality sportswear for your active lifestyle. Comfort meets style.
                        </p>
                        <div className={styles.socialLinks}>
                            <Button size="icon" variant="ghost" className="h-8 w-8 sm:h-9 sm:w-9" asChild>
                                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                                    <Facebook className={styles.socialIcon} />
                                </a>
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 sm:h-9 sm:w-9" asChild>
                                <a href="https://www.instagram.com/vasanth_vasu_vv/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                                    <Instagram className={styles.socialIcon} />
                                </a>
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 sm:h-9 sm:w-9" asChild>
                                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                                    <Youtube className={styles.socialIcon} />
                                </a>
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 sm:h-9 sm:w-9" asChild>
                                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                                    <Twitter className={styles.socialIcon} />
                                </a>
                            </Button>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className={styles.sectionTitle}>Shop</h4>
                        <ul className={styles.linkList}>
                            <li>
                                <Link to="/products" className={styles.link}>
                                    All Products
                                </Link>
                            </li>
                            <li>
                                <Link to="/products?category=t-shirts" className={styles.link}>
                                    T-Shirts
                                </Link>
                            </li>
                            <li>
                                <Link to="/products?category=track-pants" className={styles.link}>
                                    Track Pants
                                </Link>
                            </li>
                            <li>
                                <Link to="/products?category=shorts" className={styles.link}>
                                    Shorts
                                </Link>
                            </li>
                            <li>
                                <Link to="/products?category=womens" className={styles.link}>
                                    Womens
                                </Link>
                            </li>
                            <li>
                                <Link to="/products?category=mens" className={styles.link}>
                                    Mens
                                </Link>
                            </li>
                            <li>
                                <Link to="/products?category=kids" className={styles.link}>
                                    Kids
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Customer Service / Admin */}
                    <div>
                        {role === "admin" ? (
                            <>
                                <h4 className={styles.sectionTitle}>Admin</h4>
                                <ul className={styles.linkList}>
                                    <li>
                                        <Link to="/admin" className={styles.link}>
                                            Admin Home
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to="/admin/products" className={styles.link}>
                                            Manage Products
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to="/admin/orders" className={styles.link}>
                                            Orders
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to="/admin/users" className={styles.link}>
                                            Users
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to="/admin/tickets" className={styles.link}>
                                            Support Registry
                                        </Link>
                                    </li>
                                </ul>
                            </>
                        ) : (
                            <>
                                <h4 className={styles.sectionTitle}>Support</h4>
                                <ul className={styles.linkList}>
                                    <li>
                                        <Link to="/contact" className={styles.link}>
                                            Contact Us
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to="/tickets" className={cn(styles.link, "font-medium")}>
                                            Support Tickets
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to="/shipping-returns" className={styles.link}>
                                            Shipping & Returns
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to="/learn-more" className={styles.link}>
                                            Learn More
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to="/faq" className={styles.link}>
                                            FAQ
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to="/size-guide" className={styles.link}>
                                            Size Guide
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to="/support" className={styles.link}>
                                            Support Center
                                        </Link>
                                    </li>
                                </ul>
                            </>
                        )}
                    </div>

                    {/* Newsletter */}
                    <div className="text-center">
                        <h4 className={styles.sectionTitle}>Stay Updated</h4>
                        <p className={styles.newsletterText}>
                            Subscribe to get special offers and updates
                        </p>
                        <form onSubmit={handleNewsletterSubmit} className={styles.newsletterForm}>
                            <Input
                                type="email"
                                placeholder="Your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={styles.newsletterInput}
                                required
                                disabled={isSubmitting}
                            />
                            <Button
                                type="submit"
                                className={cn("bg-primary hover:bg-primary-hover", styles.newsletterButton)}
                                disabled={isSubmitting}
                            >
                                <Mail className={styles.socialIcon} />
                            </Button>
                        </form>
                        <div className="mt-3 sm:mt-4">
                            <AnimatedPaymentIcons />
                        </div>
                    </div>
                </div>

                <div className={styles.copyright}>
                    <p>&copy; 2025 Pravokha. All rights reserved.</p>
                    <div className={styles.legalLinks}>
                        <a href="#" className={styles.link}>
                            Privacy Policy
                        </a>
                        <a href="#" className={styles.link}>
                            Terms & Conditions
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
