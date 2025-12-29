import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ShoppingBag, Mail } from "lucide-react";
import styles from "./ComboOfferBanner.module.css";

export function ComboOfferBanner() {
    return (
        <Card className={styles.card}>
            <div className={styles.content}>
                <div className={styles.titleGroup}>
                    <h2 className={styles.title}>
                        Combo Offer! 🎉
                    </h2>
                    <p className={styles.subtitle}>
                        Buy Any 3 Items Just ₹949
                    </p>
                    <p className={styles.description}>
                        Mix and match T-shirts, Track Pants, and Shorts
                    </p>
                </div>

                <div className={styles.buttonGrid}>
                    <Link to="/products?category=t-shirts">
                        <Button size="lg" className="gap-2">
                            <ShoppingBag className="h-5 w-5" />
                            Shop T-shirts
                        </Button>
                    </Link>
                    <Link to="/products?category=track-pants">
                        <Button size="lg" variant="secondary" className="gap-2">
                            <ShoppingBag className="h-5 w-5" />
                            Shop Track Pants
                        </Button>
                    </Link>
                    <Link to="/products?category=shorts">
                        <Button size="lg" variant="outline" className="gap-2">
                            <ShoppingBag className="h-5 w-5" />
                            Shop Shorts
                        </Button>
                    </Link>
                    <Link to="/contact">
                        <Button size="lg" variant="outline" className="gap-2">
                            <Mail className="h-5 w-5" />
                            Bulk Orders
                        </Button>
                    </Link>
                </div>

                <p className={styles.footer}>
                    *Valid on all colors and sizes | Limited time offer
                </p>
            </div>
        </Card>
    );
}

export default ComboOfferBanner;
