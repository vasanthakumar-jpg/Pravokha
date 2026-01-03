import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Star, ShoppingCart, ShieldCheck } from "lucide-react";
import { TbHeartPlus } from "react-icons/tb";
import { CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/contexts/CartContext";
import { Product } from "@/data/products";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import styles from "./ProductCard.module.css";
import { cn } from "@/lib/utils";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { Eye } from "lucide-react";

interface ProductCardProps {
    product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
    const { addToCart } = useCart();
    const navigate = useNavigate();
    const [isInWishlist, setIsInWishlist] = useState(false);
    const [, setUser] = useState<any>(null);
    const [isTogglingWishlist, setIsTogglingWishlist] = useState(false);
    const [showBlinkAnimation, setShowBlinkAnimation] = useState(false);
    const { recentlyViewed } = useRecentlyViewed();
    const isRecentlyViewed = recentlyViewed.some(p => p.id === product.id);

    useEffect(() => {
        checkWishlistStatus();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            checkWishlistStatus();
        });

        return () => subscription.unsubscribe();
    }, [product.id]);

    const checkWishlistStatus = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setIsInWishlist(false);
            return;
        }

        const { data, error } = await supabase
            .from("wishlist")
            .select("id")
            .eq("user_id", user.id)
            .eq("product_id", product.id)
            .maybeSingle();

        if (error && error.code !== 'PGRST116') {
            console.warn("Error checking wishlist status:", error);
        }

        setIsInWishlist(!!data);
    };

    const handleToggleWishlist = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            navigate("/auth");
            return;
        }

        setShowBlinkAnimation(true);
        setTimeout(() => setShowBlinkAnimation(false), 600);

        const previousState = isInWishlist;
        setIsInWishlist(!isInWishlist);
        setIsTogglingWishlist(true);

        try {
            if (previousState) {
                const { error } = await supabase
                    .from("wishlist")
                    .delete()
                    .eq("user_id", user.id)
                    .eq("product_id", product.id);

                if (error) throw error;

                toast({
                    title: "Removed from wishlist",
                    description: `${product.title} has been removed from your wishlist`,
                });
            } else {
                const { error } = await supabase
                    .from("wishlist")
                    .insert([{ user_id: user.id, product_id: product.id }]);

                if (error) throw error;

                toast({
                    title: "Added to wishlist",
                    description: `${product.title} has been added to your wishlist`,
                });
            }
        } catch (error) {
            setIsInWishlist(previousState);
            toast({
                title: "Error",
                description: "Failed to update wishlist. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsTogglingWishlist(false);
        }
    };

    const firstVariant = product.variants[0];
    const [selectedVariant] = useState(firstVariant);
    const hasDiscount = product.discountPrice && product.discountPrice < product.price;
    const discountPercent = hasDiscount
        ? Math.round(((product.price - product.discountPrice!) / product.price) * 100)
        : 0;

    const handleQuickAdd = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const firstAvailableSize = firstVariant.sizes.find((s) => s.stock > 0);
        if (firstAvailableSize) {
            addToCart({
                productId: product.id,
                variantId: firstVariant.id,
                title: product.title,
                colorName: firstVariant.colorName,
                colorHex: firstVariant.colorHex,
                size: firstAvailableSize.size,
                price: product.discountPrice || product.price,
                image: firstVariant.images[0],
                maxStock: firstAvailableSize.stock,
                sellerId: product.sellerId,
            });
            toast({
                title: "Added to cart",
                description: `${product.title} has been added to your cart`,
            });
        }
    };

    const p = product as any;
    const isFeatured = p.featured || p.is_featured;
    const isNew = p.newArrival || p.is_new;
    const isVerified = p.is_verified;

    return (
        <div
            onClick={() => navigate(`/product/${product.slug}`)}
            className={styles.card}
        >
            <div className={styles.imageContainer}>
                <img
                    src={selectedVariant.images[0]}
                    alt={product.title}
                    className={styles.image}
                    loading="lazy"
                />
                <div className={styles.badges}>
                    {isFeatured && (
                        <Badge className={styles.badgeFeatured}>
                            Featured
                        </Badge>
                    )}
                    {isNew && (
                        <Badge className={styles.badgeNew}>
                            New
                        </Badge>
                    )}
                    {isVerified && (
                        <Badge className={styles.badgeVerified}>
                            <ShieldCheck className="h-2 w-2" /> Verified
                        </Badge>
                    )}
                </div>

                <button
                    onClick={handleToggleWishlist}
                    className={cn(
                        styles.wishlistButton,
                        showBlinkAnimation && "animate-ping-once",
                        isInWishlist && styles.wishlistActive
                    )}
                >
                    <TbHeartPlus
                        className={cn(
                            styles.wishlistIcon,
                            isInWishlist && styles.wishlistIconActive,
                            isTogglingWishlist && "animate-pulse"
                        )}
                    />
                </button>

                {isRecentlyViewed && (
                    <div className={styles.recentlyViewed} title="You viewed this product recently">
                        <Eye className={styles.recentlyViewedIcon} />
                        <span>Viewed</span>
                    </div>
                )}
            </div>

            <CardContent className={styles.content}>
                <div>
                    <h3 className={styles.title}>
                        {product.title}
                    </h3>
                    <p className={styles.description}>
                        {product.description}
                    </p>
                    <div className={styles.rating}>
                        <div className={styles.stars}>
                            {[...Array(5)].map((_, i) => (
                                <Star
                                    key={i}
                                    className={cn(
                                        styles.star,
                                        i < Math.floor(product.rating)
                                            ? "fill-yellow-400 text-yellow-400"
                                            : "fill-muted text-muted"
                                    )}
                                />
                            ))}
                        </div>
                        <span className={styles.reviewCount}>({product.reviews})</span>
                    </div>
                </div>

                <div className={styles.footer}>
                    <div className={styles.priceGroup}>
                        <div className={styles.priceRow}>
                            <span className={styles.currentPrice}>
                                ₹{product.discountPrice || product.price}
                            </span>
                            {hasDiscount && (
                                <>
                                    <span className={styles.originalPrice}>
                                        ₹{product.price}
                                    </span>
                                    <Badge variant="destructive" className="text-[10px] px-1 py-0 h-4 sm:h-5">
                                        {discountPercent}% OFF
                                    </Badge>
                                </>
                            )}
                        </div>

                        {(() => {
                            const totalStock = product.variants.reduce((acc, variant) => acc + variant.sizes.reduce((sAcc, size) => sAcc + size.stock, 0), 0);

                            if (totalStock === 0) {
                                return (
                                    <p className={cn(styles.stock, styles.stockOut)}>
                                        Out of Stock
                                    </p>
                                );
                            }

                            if (totalStock < 10) {
                                return (
                                    <p className={cn(styles.stock, styles.stockLow, "animate-pulse")}>
                                        Only {totalStock} left
                                    </p>
                                );
                            }

                            return null;
                        })()}
                    </div>

                    <Button
                        size="icon"
                        className={styles.cartButton}
                        onClick={handleQuickAdd}
                        disabled={product.variants.every(v => v.sizes.every(s => s.stock === 0))}
                    >
                        <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                </div>
            </CardContent>
        </div>
    );
}

export default ProductCard;
