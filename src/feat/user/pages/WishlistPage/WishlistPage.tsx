import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "@/infra/api/apiClient";
import { useAuth } from "@/core/context/AuthContext";
import { Button } from "@/ui/Button";
import { Card } from "@/ui/Card";
import { Trash2, ShoppingCart, Heart, PackageX, Minus, Plus } from "lucide-react";
import { toast } from "@/shared/hook/use-toast";
import { useCart } from "@/core/context/CartContext";
import { Product } from "@/data/products";

export function WishlistPage() {
    // We store the full extended product object here
    const [wishlistItems, setWishlistItems] = useState<{ id: string; product: Product }[]>([]);
    const [quantities, setQuantities] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const navigate = useNavigate();
    const { addToCart } = useCart();

    useEffect(() => {
        if (user) {
            fetchWishlist();
        }
    }, [user]);

    const fetchWishlist = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/api/wishlist');
            const data = response.data.wishlist.map((item: any) => {
                const p = item.product;
                const transformedProduct: Product = {
                    id: p.id,
                    title: p.title || 'Untitled Product',
                    slug: p.slug,
                    description: p.description || '',
                    price: parseFloat(p.price) || 0,
                    discountPrice: p.discountPrice ? parseFloat(p.discountPrice) : undefined,
                    category: p.category,
                    subcategory_id: p.subcategory_id,
                    rating: Math.min(5, Math.max(0, parseFloat(p.rating) || 0)),
                    reviews: Math.max(0, parseInt(p.reviews) || 0),
                    sku: p.sku,
                    sellerId: p.seller_id,
                    featured: p.isFeatured || false,
                    newArrival: p.isNew || false,
                    variants: (p.variants || []).map((v: any) => ({
                        id: v.id,
                        colorName: v.colorName,
                        colorHex: v.colorHex,
                        images: Array.isArray(v.images) && v.images.length > 0
                            ? v.images
                            : ['https://placehold.co/600x600/e2e8f0/64748b?text=No+Image'],
                        sizes: (v.sizes || []).map((s: any) => ({
                            size: s.size,
                            stock: s.stock,
                        })),
                    })),
                };
                return { id: item.id, product: transformedProduct };
            });

            setWishlistItems(data);

            const initialQuantities: Record<string, number> = {};
            data.forEach((item: any) => {
                initialQuantities[item.id] = 1;
            });
            setQuantities(initialQuantities);
        } catch (error: any) {
            console.error("Error loading wishlist:", error);
            toast({
                title: "Error",
                description: "Failed to load wishlist items.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const removeFromWishlist = async (wishlistId: string) => {
        try {
            await apiClient.delete(`/api/wishlist/${wishlistId}`);
            setWishlistItems(prev => prev.filter(item => item.id !== wishlistId));
            toast({
                title: "Removed",
                description: "Item removed from wishlist",
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: "Could not remove item",
                variant: "destructive",
            });
        }
    };

    const updateQuantity = (id: string, delta: number) => {
        setQuantities(prev => ({
            ...prev,
            [id]: Math.max(1, (prev[id] || 1) + delta)
        }));
    };

    const moveToCart = (product: Product, wishlistId: string) => {
        const qty = quantities[wishlistId] || 1;
        // Find first variant with stock
        const availableVariant = product.variants.find(v => v.sizes.some(s => s.stock > 0));

        if (availableVariant) {
            const sizeObj = availableVariant.sizes.find(s => s.stock > 0);
            addToCart({
                productId: product.id,
                variantId: availableVariant.id,
                title: product.title,
                colorName: availableVariant.colorName,
                colorHex: availableVariant.colorHex,
                size: sizeObj?.size || "M",
                price: product.discountPrice || product.price,
                image: availableVariant.images[0],
                maxStock: sizeObj?.stock || 0,
                sellerId: product.sellerId || "",
            }, qty);
            toast({
                title: "Added to cart",
                description: `${qty} x ${product.title} added to cart`,
            });
        } else {
            toast({
                title: "Out of Stock",
                description: "This item is currently out of stock.",
                variant: "destructive",
            });
        }
    };

    const clearAllWishlist = async () => {
        if (!user) return;
        try {
            await apiClient.delete('/api/wishlist');
            setWishlistItems([]);
            toast({
                title: "Cleared",
                description: "Wishlist has been cleared",
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to clear wishlist",
                variant: "destructive",
            });
        }
    };

    if (loading) {
        return (
            <div className="w-full px-4 sm:px-6 lg:px-8 py-16 text-center animate-pulse">
                <div className="max-w-7xl mx-auto space-y-8">
                    <div className="h-8 w-48 bg-muted rounded mx-auto mb-8" />
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="aspect-square bg-muted rounded-xl" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (wishlistItems.length === 0) {
        return (
            <div className="w-full px-4 sm:px-6 lg:px-8 py-16 text-center space-y-6">
                <div className="bg-muted/50 p-6 rounded-full w-fit mx-auto">
                    <Heart className="h-12 w-12 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">Your wishlist is empty</h1>
                    <p className="text-muted-foreground text-lg">Start saving items you love!</p>
                </div>
                <Button onClick={() => navigate("/products")} size="lg" className="mt-4">
                    Browse Products
                </Button>
            </div>
        );
    }

    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">My Wishlist</h1>
                        <p className="text-muted-foreground mt-1">{wishlistItems.length} items saved</p>
                    </div>
                    {wishlistItems.length > 0 && (
                        <Button variant="outline" onClick={clearAllWishlist} className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Clear All
                        </Button>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {wishlistItems.map(({ id, product }) => {
                        const firstImage = product.variants?.[0]?.images?.[0] || 'https://placehold.co/600x600/e2e8f0/64748b?text=No+Image';

                        return (
                            <Card key={id} className="group overflow-hidden border-border/50 hover:shadow-lg transition-all duration-300">
                                <div className="aspect-[4/5] relative overflow-hidden bg-muted">
                                    <img
                                        src={firstImage}
                                        alt={product.title}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        loading="lazy"
                                        onClick={() => navigate(`/product/${product.slug || product.id}`)}
                                        style={{ cursor: 'pointer' }}
                                    />
                                    <Button
                                        variant="secondary"
                                        size="icon"
                                        className="absolute top-2 right-2 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => removeFromWishlist(id)}
                                        title="Remove from wishlist"
                                    >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                                <div className="p-4 space-y-3">
                                    <div
                                        onClick={() => navigate(`/product/${product.slug || product.id}`)}
                                        className="cursor-pointer"
                                    >
                                        <h3 className="font-semibold text-base line-clamp-1 group-hover:text-primary transition-colors">
                                            {product.title}
                                        </h3>
                                        <div className="flex items-baseline gap-2 mt-1">
                                            <span className="text-lg font-bold">
                                                ₹{product.discountPrice || product.price}
                                            </span>
                                            {product.discountPrice && (
                                                <span className="text-sm text-muted-foreground line-through">
                                                    ₹{product.price}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center justify-between bg-muted/40 rounded-xl p-1 border border-border/40">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 rounded-lg hover:bg-background"
                                                onClick={() => updateQuantity(id, -1)}
                                                disabled={quantities[id] <= 1}
                                            >
                                                <Minus className="h-3 w-3" />
                                            </Button>
                                            <span className="text-sm font-bold w-8 text-center">{quantities[id] || 1}</span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 rounded-lg hover:bg-background"
                                                onClick={() => updateQuantity(id, 1)}
                                            >
                                                <Plus className="h-3 w-3" />
                                            </Button>
                                        </div>

                                        <Button
                                            className="w-full rounded-xl"
                                            onClick={() => moveToCart(product, id)}
                                        >
                                            <ShoppingCart className="h-4 w-4 mr-2" />
                                            Add to Cart
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default WishlistPage;
