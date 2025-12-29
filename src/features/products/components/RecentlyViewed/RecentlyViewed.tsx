import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { ArrowRight } from "lucide-react";
import { RelatedProducts } from "@/features/products/components/RelatedProducts";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import styles from "./RecentlyViewed.module.css";
import { cn } from "@/lib/utils";

export function RecentlyViewed() {
    const { recentlyViewed } = useRecentlyViewed();

    if (recentlyViewed.length === 0) return null;

    return (
        <div className={styles.container}>
            <RelatedProducts products={recentlyViewed} title="Recently Viewed" />
            <div className={cn("container", styles.buttonWrapper)}>
                <Link to="/products">
                    <Button variant="outline" size="lg" className={styles.button}>
                        View All Products
                        <ArrowRight className={styles.icon} />
                    </Button>
                </Link>
            </div>
        </div>
    );
}

export default RecentlyViewed;
