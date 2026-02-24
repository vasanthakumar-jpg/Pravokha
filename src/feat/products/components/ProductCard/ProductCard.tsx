import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Star, ShoppingCart, Shield, Eye, Share2 } from "lucide-react";
import { TbHeartPlus } from "react-icons/tb";
import { CardContent } from "@/ui/Card";
import { Badge } from "@/ui/Badge";
import { Button } from "@/ui/Button";
import { useCart } from "@/core/context/CartContext";
import { Product } from "@/data/products";
import { apiClient } from "@/infra/api/apiClient";
import { toast } from "@/shared/hook/use-toast";
import styles from "./ProductCard.module.css";
import { cn, getMediaUrl } from "@/lib/utils";
import { useAuth } from "@/core/context/AuthContext";
import { useRecentlyViewed } from "@/shared/hook/useRecentlyViewed";
import { InteractiveStarRating } from "@/shared/ui/InteractiveStarRating";

interface ProductCardProps {
    product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
    const { addToCart } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isInWishlist, setIsInWishlist] = useState(false);
    const [isTogglingWishlist, setIsTogglingWishlist] = useState(false);
    const [showBlinkAnimation, setShowBlinkAnimation] = useState(false);
    const { recentlyViewed, addToRecentlyViewed } = useRecentlyViewed();
    const isRecentlyViewed = recentlyViewed.some(p => p.id === product.id);

    useEffect(() => {
        if (user) {
            checkWishlistStatus();
        } else {
            setIsInWishlist(false);
        }
    }, [product.id, user]);

    const checkWishlistStatus = async () => {
        try {
            const response = await apiClient.get(`/wishlist/check/${product.id}`);
            if (response.data.success) {
                setIsInWishlist(response.data.inWishlist);
            }
        } catch (error) {
            // User not logged in or error occurred
            setIsInWishlist(false);
        }
    };

    const handleShareClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const productPath = product.slug ? `/product/${product.slug}` : `/product/${product.id}`;
        const url = `${window.location.origin}${productPath}`;

        const shareData = {
            title: product.title,
            text: product.description || product.title,
            url,
        };

        try {
            if ((navigator as any).share) {
                await (navigator as any).share(shareData);
                toast({ title: "Shared", description: "Product shared successfully." });
                return;
            }

            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(url);
                toast({ title: "Link copied", description: "Product link copied to clipboard." });
                return;
            }

            // Last-resort fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = url;
            textarea.style.position = 'fixed';
            textarea.style.left = '-9999px';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            toast({ title: "Link copied", description: "Product link copied to clipboard." });
        } catch (error: any) {
            toast({ title: "Could not share", description: error?.message || "Please try copying the link manually.", variant: "destructive" });
        }
    };

    const handleToggleWishlist = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        setShowBlinkAnimation(true);
        setTimeout(() => setShowBlinkAnimation(false), 600);

        const previousState = isInWishlist;
        setIsInWishlist(!isInWishlist);
        setIsTogglingWishlist(true);

        try {
            if (previousState) {
                // Remove from wishlist
                const response = await apiClient.delete(`/wishlist/${product.id}`);
                if (!response.data.success) throw new Error('Failed to remove from wishlist');

                toast({
                    title: "Removed from wishlist",
                    description: `${product.title} has been removed from your wishlist`,
                });
            } else {
                // Add to wishlist
                const response = await apiClient.post('/wishlist', { productId: product.id });
                if (!response.data.success) throw new Error('Failed to add to wishlist');

                toast({
                    title: "Added to wishlist",
                    description: `${product.title} has been added to your wishlist`,
                });
            }
        } catch (error: any) {
            setIsInWishlist(previousState);
            if (error.response?.status === 401) {
                navigate("/auth");
                return;
            }
            toast({
                title: "Error",
                description: error.message || "Failed to update wishlist. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsTogglingWishlist(false);
        }
    };

    const firstVariant = product.variants?.[0] || { id: 'none', colorName: 'None', colorHex: '#ccc', images: ['https://placehold.co/600x600/e2e8f0/64748b?text=No+Image'], sizes: [] };
    const [selectedVariant] = useState(firstVariant);
    const hasDiscount = product.discountPrice && product.discountPrice < product.price;
    const discountPercent = hasDiscount
        ? Math.round(((product.price - product.discountPrice!) / product.price) * 100)
        : 0;

    const handleQuickAdd = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const firstAvailableSize = firstVariant?.sizes?.find((s: any) => s.stock > 0);
        if (firstAvailableSize && firstVariant.id !== 'none') {
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
        } else {
            toast({
                title: "Unavailable",
                description: "This product variant is currently unavailable.",
                variant: "destructive"
            });
        }
    };

    const p = product as any;
    const isVerified = p.isVerified || p.is_verified;

    return (
        <div
            onClick={(e) => {
                // Prevent navigation if clicking on buttons/badges logic handled inside buttons
                // But this div wraps everything. 
                // Ensure we have a valid slug.
                if (product.slug) {
                    navigate(`/product/${product.slug}`);
                } else {
                    console.error("Product has no slug:", product);
                    // Fallback to ID if slug missing? or prevent nav
                    if (product.id) navigate(`/product/${product.id}`);
                }
            }}
            className={styles.card}
        >
            <div className={styles.imageContainer}>
                <img
                    src={getMediaUrl(selectedVariant.images[0])}
                    alt={product.title}
                    className={styles.image}
                    loading="lazy"
                />
                <div className={styles.badges}>
                    {isVerified && (
                        <Badge className={styles.badgeVerified}>
                            <Shield className="h-2 w-2" /> Verified
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
                        <span className={styles.recentlyViewedSpan}>Viewed</span>
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
                    {product.rating > 0 && (
                        <div
                            className={cn(styles.rating, "flex items-center gap-1 sm:gap-2 cursor-pointer hover:opacity-80 transition-opacity")}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (product.slug) {
                                    navigate(`/product/${product.slug}?tab=reviews`);
                                }
                            }}
                        >
                            <InteractiveStarRating
                                rating={product.rating}
                                readOnly
                                size="sm"
                                showQuotes={false}
                            />
                            <span className={cn(styles.reviewCount, "text-[10px] sm:text-xs whitespace-nowrap overflow-hidden text-ellipsis hidden sm:block")}>
                                ({product.reviews})
                            </span>
                        </div>
                    )}
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
                            const totalStock = (product.variants || []).reduce((acc, variant) => acc + (variant.sizes || []).reduce((sAcc, size) => sAcc + (size.stock || 0), 0), 0);

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

                    <div className={styles.actionGroup}>
                        <Button
                            size="icon"
                            className={styles.shareButton}
                            onClick={handleShareClick}
                            aria-label="Share product"
                        >
                            <Share2 className="h-4 w-4 sm:h-5 sm:w-5" />
                        </Button>

                        <Button
                            size="icon"
                            className={styles.cartButton}
                            onClick={handleQuickAdd}
                            disabled={!product.variants || product.variants.length === 0 || product.variants.every(v => !v.sizes || v.sizes.every(s => s.stock === 0))}
                        >
                            <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </div>
    );
}

export default ProductCard;
