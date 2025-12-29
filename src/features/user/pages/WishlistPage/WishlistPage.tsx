import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Trash2, ShoppingCart, Heart } from "lucide-react";
import { products } from "@/data/products";
import { toast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";

export function WishlistPage() {
    const [wishlistItems, setWishlistItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const navigate = useNavigate();
    const { addToCart } = useCart();

    useEffect(() => {
        checkUser();
    }, []);

    const checkUser = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            navigate("/auth");
            return;
        }
        setUser(user);
        await fetchWishlist(user.id);
    };

    const fetchWishlist = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from("wishlist")
                .select("*")
                .eq("user_id", userId);

            if (error) throw error;

            // Match wishlist items with product data
            const itemsWithDetails = data?.map((item) => {
                const product = products.find((p) => p.id === item.product_id);
                return { ...item, product };
            }).filter((item) => item.product);

            setWishlistItems(itemsWithDetails || []);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const removeFromWishlist = async (itemId: string) => {
        try {
            const { error } = await supabase
                .from("wishlist")
                .delete()
                .eq("id", itemId);

            if (error) throw error;

            setWishlistItems(wishlistItems.filter((item) => item.id !== itemId));
            toast({
                title: "Removed from wishlist",
                description: "Item has been removed from your wishlist",
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    const moveToCart = (product: any) => {
        const firstVariant = product.variants[0];
        const firstSize = firstVariant.sizes.find((s: any) => s.stock > 0);

        if (firstSize) {
            addToCart({
                productId: product.id,
                variantId: firstVariant.id,
                title: product.title,
                colorName: firstVariant.colorName,
                colorHex: firstVariant.colorHex,
                size: firstSize.size,
                price: product.discountPrice || product.price,
                image: firstVariant.images[0],
                maxStock: firstSize.stock,
                sellerId: product.sellerId || "",
            });
            toast({
                title: "Added to cart",
                description: `${product.title} has been added to your cart`,
            });
        }
    };

    if (loading) {
        return (
            <div className="container py-16 text-center">
                <p className="text-muted-foreground">Loading...</p>
            </div>
        );
    }

    if (wishlistItems.length === 0) {
        return (
            <div className="container py-16 text-center space-y-4">
                <Heart className="h-16 w-16 mx-auto text-muted-foreground" />
                <h1 className="text-3xl font-bold">Your wishlist is empty</h1>
                <p className="text-muted-foreground">Start adding items you love!</p>
                <Button onClick={() => navigate("/products")}>Browse Products</Button>
            </div>
        );
    }

    const clearAllWishlist = async () => {
        try {
            const { error } = await supabase
                .from("wishlist")
                .delete()
                .eq("user_id", user.id);

            if (error) throw error;

            setWishlistItems([]);
            toast({
                title: "Wishlist cleared",
                description: "All items have been removed from your wishlist",
            });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    return (
        <div className="container py-8">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold">My Wishlist ({wishlistItems.length})</h1>
                {wishlistItems.length > 0 && (
                    <Button variant="destructive" onClick={clearAllWishlist}>
                        Clear All
                    </Button>
                )}
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {wishlistItems.map((item) => (
                    <Card key={item.id} className="p-4">
                        <div className="aspect-square mb-4 overflow-hidden rounded-lg">
                            <img
                                src={item.product.variants[0].images[0]}
                                alt={item.product.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <h3 className="font-semibold mb-2">{item.product.title}</h3>
                        <p className="text-xl font-bold mb-4">
                            ₹{item.product.discountPrice || item.product.price}
                        </p>
                        <div className="flex gap-2">
                            <Button
                                className="flex-1"
                                onClick={() => moveToCart(item.product)}
                            >
                                <ShoppingCart className="h-4 w-4 mr-2" />
                                Add to Cart
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => removeFromWishlist(item.id)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}

export default WishlistPage;
