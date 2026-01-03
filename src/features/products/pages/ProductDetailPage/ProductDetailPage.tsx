import { useState, useEffect } from "react";
import { useParams, Link, Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useCart } from "@/contexts/CartContext";
import { Star, Truck, RefreshCw, Shield, Heart, Minus, Plus, ChevronLeft, ZoomIn } from "lucide-react";
import { Separator } from "@/components/ui/Separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Label } from "@/components/ui/Label";
import { toast } from "@/hooks/use-toast";
import { ImageViewer } from "@/features/products/components/ImageViewer";
import { RelatedProducts } from "@/features/products/components/RelatedProducts";
import { ProductReviews, ReviewStatistics } from "@/features/products/components/ProductReviews";
import { useGsapAnimations } from "@/hooks/useGsapAnimations";
import { supabase } from "@/integrations/supabase/client";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { Product } from "@/data/products";

export function ProductDetailPage() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { addToRecentlyViewed } = useRecentlyViewed();

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);

    useGsapAnimations();

    const [selectedVariant, setSelectedVariant] = useState<any>(null);
    const [selectedSize, setSelectedSize] = useState("");
    const [quantity, setQuantity] = useState(0);
    const [mainImage, setMainImage] = useState(0);
    const [imageViewerOpen, setImageViewerOpen] = useState(false);
    const [isInWishlist, setIsInWishlist] = useState(false);

    // Check wishlist status
    useEffect(() => {
        const checkWishlistStatus = async () => {
            if (!product) return;

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

            if (!error && data) {
                setIsInWishlist(true);
            } else {
                setIsInWishlist(false);
            }
        };

        checkWishlistStatus();
    }, [product]);

    // Fetch product from database
    useEffect(() => {
        const fetchProduct = async () => {
            if (!slug) return;

            try {
                setLoading(true);

                const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(slug);

                let query = supabase
                    .from("products")
                    .select(`
            *,
            product_variants (
              *,
              product_sizes (*)
            )
          `);

                if (isUUID) {
                    query = query.or(`id.eq.${slug},slug.eq.${slug}`);
                } else {
                    query = query.eq("slug", slug);
                }

                const { data: productData, error: productError } = await query.maybeSingle();

                if (productError) throw productError;

                if (!productData) {
                    console.warn(`Product with slug "${slug}" not found`);
                    toast({
                        title: "Product not found",
                        description: "The requested product could not be found.",
                        variant: "destructive",
                    });
                    navigate("/products", { replace: true });
                    return;
                }

                const transformedProduct: Product = {
                    id: productData.id,
                    title: productData.title,
                    slug: productData.slug,
                    description: productData.description,
                    price: parseFloat(String(productData.price)),
                    discountPrice: productData.discount_price ? parseFloat(String(productData.discount_price)) : undefined,
                    category: productData.category,
                    rating: parseFloat(String(productData.rating || 4.5)),
                    reviews: productData.reviews || 0,
                    sku: productData.sku,
                    featured: (productData as any).is_featured || false,
                    newArrival: (productData as any).is_new || false,
                    sellerId: (productData as any).seller_id,
                    variants: (productData.product_variants || []).map((v: any) => ({
                        id: v.id,
                        colorName: v.color_name,
                        colorHex: v.color_hex,
                        images: v.images,
                        sizes: (v.product_sizes || []).map((s: any) => ({
                            size: s.size,
                            stock: s.stock,
                        })),
                    })),
                };

                setProduct(transformedProduct);
                setSelectedVariant(transformedProduct.variants[0]);
                addToRecentlyViewed(transformedProduct);

                // Fetch random recommendations from ALL products
                const { data: relatedData } = await supabase
                    .from("products")
                    .select(`
            *,
            product_variants (
              *,
              product_sizes (*)
            )
          `)
                    .neq("id", productData.id)
                    .eq("published", true)
                    .limit(50); // Broad fetch for randomization

                if (relatedData) {
                    // Randomize and take 8 products for a fuller grid
                    const shuffled = [...relatedData].sort(() => 0.5 - Math.random());
                    const selected = shuffled.slice(0, 8);

                    const transformedRelated: Product[] = selected.map((p: any) => ({
                        id: p.id,
                        title: p.title,
                        slug: p.slug,
                        description: p.description,
                        price: parseFloat(String(p.price)),
                        discountPrice: p.discount_price ? parseFloat(String(p.discount_price)) : undefined,
                        category: p.category,
                        rating: parseFloat(String(p.rating || 4.5)),
                        reviews: p.reviews || 0,
                        sku: p.sku,
                        featured: (p as any).is_featured || false,
                        newArrival: (p as any).is_new || false,
                        variants: (p.product_variants || []).map((v: any) => ({
                            id: v.id,
                            colorName: v.color_name,
                            colorHex: v.color_hex,
                            images: v.images,
                            sizes: (v.product_sizes || []).map((s: any) => ({
                                size: s.size,
                                stock: s.stock,
                            })),
                        })),
                    }));
                    setRelatedProducts(transformedRelated);
                }
            } catch (err: any) {
                console.error("Error fetching product:", err);
                toast({
                    title: "Error",
                    description: "Failed to load product",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [slug]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-muted-foreground">Loading product...</p>
            </div>
        );
    }

    if (!product || !selectedVariant) {
        return <Navigate to="/products" replace />;
    }

    const hasDiscount = product.discountPrice && product.discountPrice < product.price;
    const discountPercent = hasDiscount
        ? Math.round(((product.price - product.discountPrice!) / product.price) * 100)
        : 0;

    const handleAddToCart = () => {
        if (!selectedSize) {
            toast({
                title: "Please select a size",
                description: "You need to select a size before adding to cart",
                variant: "destructive",
            });
            return;
        }

        if (quantity === 0) {
            toast({
                title: "Please select quantity",
                description: "Quantity must be at least 1",
                variant: "destructive",
            });
            return;
        }

        const selectedSizeObj = selectedVariant.sizes.find((s: any) => s.size === selectedSize);
        if (selectedSizeObj && quantity > selectedSizeObj.stock) {
            toast({
                title: "Insufficient stock",
                description: `Only ${selectedSizeObj.stock} ${selectedSizeObj.stock === 1 ? 'item' : 'items'} available in stock for size ${selectedSize}. Please reduce quantity.`,
                variant: "destructive",
            });
            return;
        }

        addToCart({
            productId: product.id,
            variantId: selectedVariant.id,
            title: product.title,
            colorName: selectedVariant.colorName,
            colorHex: selectedVariant.colorHex,
            size: selectedSize,
            price: product.discountPrice || product.price,
            image: selectedVariant.images[mainImage],
            maxStock: selectedSizeObj?.stock || 0,
            sellerId: product.sellerId || "",
        }, quantity);
    };

    const handleBuyNow = () => {
        if (!selectedSize) {
            toast({
                title: "Please select a size",
                description: "You need to select a size before proceeding",
                variant: "destructive",
            });
            return;
        }

        handleAddToCart();
        navigate("/checkout");
    };

    return (
        <div className="min-h-screen flex flex-col">
            <div className="container max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <Link to="/">
                    <Button variant="ghost" className="mb-4">
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Back to Home
                    </Button>
                </Link>

                <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
                    {/* Images */}
                    <div className="space-y-4">
                        <div className="aspect-square overflow-hidden rounded-lg border bg-muted animate-fade-in relative group gsap-fade-in cursor-zoom-in">
                            <div
                                onClick={() => setImageViewerOpen(true)}
                                className="cursor-pointer w-full h-full overflow-hidden"
                            >
                                <img
                                    src={selectedVariant.images[mainImage]}
                                    alt={product.title}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    loading="eager"
                                />
                            </div>
                            <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="hover:scale-105 transition-transform"
                                    onClick={() => setImageViewerOpen(true)}
                                >
                                    <ZoomIn className="h-4 w-4 mr-2 hover:rotate-90 transition-transform duration-300" />
                                    Zoom
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-4">
                            {selectedVariant.images.map((image: string, idx: number) => (
                                <button
                                    key={idx}
                                    onClick={() => setMainImage(idx)}
                                    className={`aspect-square overflow-hidden rounded-lg border-2 transition-all gsap-scale-in ${mainImage === idx ? "border-primary" : "border-border hover:border-primary/50"
                                        }`}
                                >
                                    <img src={image} alt={`${product.title} ${idx + 1}`} className="w-full h-full object-cover" loading="lazy" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-6 animate-fade-up gsap-fade-in">
                        <div>
                            {product.newArrival && (
                                <Badge className="mb-2 bg-secondary text-secondary-foreground">New Arrival</Badge>
                            )}
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">{product.title}</h1>
                            <p className="text-sm sm:text-base text-muted-foreground mt-1">SKU: {product.sku}</p>
                        </div>

                        <button
                            onClick={() => {
                                const reviewsTab = document.querySelector('[value="reviews"]') as HTMLElement;
                                reviewsTab?.click();
                                setTimeout(() => {
                                    const reviewsSection = document.getElementById('reviews-section');
                                    reviewsSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }, 100);
                            }}
                            className="flex items-center gap-4 hover:opacity-80 transition-opacity"
                        >
                            <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        className={`h-5 w-5 ${i < Math.floor(product.rating)
                                            ? "fill-accent text-accent"
                                            : "fill-muted text-muted"
                                            }`}
                                    />
                                ))}
                                <span className="ml-2 font-medium">{product.rating}★</span>
                            </div>
                            <span className="text-muted-foreground underline">({product.reviews} reviews)</span>
                        </button>

                        <div className="flex items-center gap-3">
                            <span className="text-3xl sm:text-4xl lg:text-5xl font-bold">₹{product.discountPrice || product.price}</span>
                            {hasDiscount && (
                                <>
                                    <span className="text-xl sm:text-2xl text-muted-foreground line-through">₹{product.price}</span>
                                    <Badge className="bg-accent text-accent-foreground text-xs sm:text-sm">{discountPercent}% OFF</Badge>
                                </>
                            )}
                        </div>

                        <Separator />

                        {/* Color Selection */}
                        <div>
                            <Label className="text-sm sm:text-base font-semibold mb-3 block">
                                Color: {selectedVariant.colorName}
                            </Label>
                            <div className="flex flex-wrap gap-2 sm:gap-3">
                                {product.variants.map((variant) => (
                                    <button
                                        key={variant.id}
                                        onClick={() => {
                                            setSelectedVariant(variant);
                                            setMainImage(0);
                                            setSelectedSize("");
                                        }}
                                        className={`h-10 w-10 sm:h-12 sm:w-12 rounded-full border-2 transition-all duration-300 hover:scale-125 gsap-scale-in ${selectedVariant.id === variant.id
                                            ? "border-primary scale-110 shadow-lg"
                                            : "border-border hover:scale-105"
                                            }`}
                                        style={{ backgroundColor: variant.colorHex }}
                                        title={variant.colorName}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Size Selection */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <Label className="text-sm sm:text-base font-semibold">Size</Label>
                                <Link to="/size-guide">
                                    <Button variant="link" size="sm" className="h-auto p-0 hover:scale-105 transition-transform">
                                        Size Guide
                                    </Button>
                                </Link>
                            </div>
                            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                                {selectedVariant.sizes.map((sizeOption: any) => {
                                    const isLowStock = sizeOption.stock > 0 && sizeOption.stock < 10;
                                    const isSelected = selectedSize === sizeOption.size;

                                    return (
                                        <div key={sizeOption.size} className="relative">
                                            <Button
                                                variant={isSelected ? "default" : "outline"}
                                                disabled={sizeOption.stock === 0}
                                                onClick={() => setSelectedSize(sizeOption.size)}
                                                className={`w-full text-xs sm:text-sm hover:scale-110 transition-transform gsap-scale-in ${isSelected ? "bg-primary" : ""}`}
                                            >
                                                {sizeOption.size}
                                            </Button>
                                            {isLowStock && (
                                                <Badge
                                                    variant="destructive"
                                                    className="absolute -top-2 -right-2 text-[10px] px-1 py-0 h-4 animate-pulse"
                                                >
                                                    {sizeOption.stock}
                                                </Badge>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {selectedSize && (() => {
                                const selectedSizeObj = selectedVariant.sizes.find((s: any) => s.size === selectedSize);
                                if (selectedSizeObj && selectedSizeObj.stock > 0 && selectedSizeObj.stock < 10) {
                                    return (
                                        <div className="mt-3 p-2 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg">
                                            <p className="text-sm text-orange-700 dark:text-orange-300 font-medium flex items-center gap-2">
                                                <span className="inline-block w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                                                Only {selectedSizeObj.stock} left in stock - Order soon!
                                            </p>
                                        </div>
                                    );
                                }
                                return null;
                            })()}
                        </div>

                        {/* Quantity */}
                        <div>
                            <Label className="text-sm sm:text-base font-semibold mb-3 block">Quantity</Label>
                            <div className="flex items-center border rounded-md w-fit">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="hover:scale-110 transition-transform"
                                    onClick={() => setQuantity(Math.max(0, quantity - 1))}
                                >
                                    <Minus className="h-4 w-4" />
                                </Button>
                                <span className="w-12 text-center font-medium">{quantity}</span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="hover:scale-110 transition-transform"
                                    onClick={() => {
                                        const selectedSizeObj = selectedSize ? selectedVariant.sizes.find((s: any) => s.size === selectedSize) : null;
                                        const maxStock = selectedSizeObj?.stock || 99;
                                        if (quantity < maxStock) {
                                            setQuantity(quantity + 1);
                                        } else {
                                            toast({
                                                title: "Stock limit reached",
                                                description: `Only ${maxStock} ${maxStock === 1 ? 'item is' : 'items are'} available for size ${selectedSize}`,
                                                variant: "destructive",
                                            });
                                        }
                                    }}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-4">
                            <Button
                                size="lg"
                                className="flex-1 gap-2 hover:scale-105 transition-transform gsap-slide-left"
                                onClick={handleAddToCart}
                            >
                                Add to Cart
                            </Button>
                            <Button
                                size="lg"
                                variant="secondary"
                                className="flex-1 hover:scale-105 transition-transform gsap-slide-right"
                                onClick={handleBuyNow}
                            >
                                Buy Now
                            </Button>
                            <Button
                                size="lg"
                                variant={isInWishlist ? "default" : "outline"}
                                className={`gap-2 hover:scale-105 transition-transform group gsap-scale-in ${isInWishlist ? "bg-red-500 hover:bg-red-600 text-white border-red-500" : ""
                                    }`}
                                onClick={async () => {
                                    const { data: { user } } = await supabase.auth.getUser();
                                    if (!user) {
                                        toast({
                                            title: "Please login",
                                            description: "You need to be logged in to manage your wishlist",
                                            variant: "destructive",
                                        });
                                        navigate("/auth");
                                        return;
                                    }

                                    if (isInWishlist) {
                                        const { error } = await supabase
                                            .from("wishlist")
                                            .delete()
                                            .eq("user_id", user.id)
                                            .eq("product_id", product.id);

                                        if (!error) {
                                            setIsInWishlist(false);
                                            toast({
                                                title: "Removed from wishlist",
                                                description: `${product.title} removed from your wishlist`,
                                            });
                                        } else {
                                            toast({
                                                title: "Error",
                                                description: "Failed to remove from wishlist",
                                                variant: "destructive",
                                            });
                                        }
                                    } else {
                                        const { error } = await supabase
                                            .from("wishlist")
                                            .insert({
                                                user_id: user.id,
                                                product_id: product.id,
                                            });

                                        if (error) {
                                            if (error.code === '23505') {
                                                setIsInWishlist(true);
                                                toast({
                                                    title: "Already in wishlist",
                                                    description: "This item is already in your wishlist",
                                                });
                                            } else {
                                                toast({
                                                    title: "Error",
                                                    description: "Failed to add to wishlist",
                                                    variant: "destructive",
                                                });
                                            }
                                        } else {
                                            setIsInWishlist(true);
                                            toast({
                                                title: "Added to wishlist",
                                                description: `${product.title} has been added to your wishlist`,
                                            });
                                        }
                                    }
                                }}
                            >
                                <Heart
                                    className={`h-5 w-5 transition-colors ${isInWishlist
                                        ? "fill-white text-white"
                                        : "group-hover:fill-red-500 group-hover:text-red-500"
                                        }`}
                                />
                                {isInWishlist ? "In Wishlist" : "Wishlist"}
                            </Button>
                        </div>

                        {/* Features */}
                        <div className="space-y-4 pt-6">
                            <div className="flex items-center gap-3">
                                <Truck className="h-5 w-5 text-primary" />
                                <span className="text-sm">Free shipping on orders above ₹999</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <RefreshCw className="h-5 w-5 text-primary" />
                                <span className="text-sm">30-day easy returns</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Shield className="h-5 w-5 text-primary" />
                                <span className="text-sm">100% secure payments</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="description" className="mt-12">
                    <TabsList className="w-full justify-start">
                        <TabsTrigger value="description">Description</TabsTrigger>
                        <TabsTrigger value="reviews">
                            Reviews {product.reviews > 0 && `(${product.reviews})`}
                        </TabsTrigger>
                        <TabsTrigger value="shipping">Shipping & Returns</TabsTrigger>
                    </TabsList>

                    <TabsContent value="description" className="mt-6 space-y-4">
                        <p className="text-muted-foreground leading-relaxed">{product.description}</p>

                        <div className="grid md:grid-cols-2 gap-4 mt-6">
                            <div className="p-4 rounded-lg bg-muted/50">
                                <h4 className="font-semibold mb-2">Material</h4>
                                <p className="text-sm text-muted-foreground">
                                    Premium Cotton Blend (60% Cotton, 40% Polyester) - Breathable, durable, and comfortable for all-day wear
                                </p>
                            </div>
                            <div className="p-4 rounded-lg bg-muted/50">
                                <h4 className="font-semibold mb-2">Best For</h4>
                                <p className="text-sm text-muted-foreground">
                                    Casual wear, sports activities, gym workouts, and everyday comfort
                                </p>
                            </div>
                        </div>

                        <ul className="list-disc list-inside space-y-2 text-muted-foreground mt-4">
                            <li>Premium quality fabric for maximum comfort</li>
                            <li>Breathable and moisture-wicking properties</li>
                            <li>Perfect fit with excellent durability</li>
                            <li>Easy care - machine washable</li>
                            <li>Available in multiple colors and sizes</li>
                        </ul>

                        <div className="p-4 rounded-lg bg-accent/10 border border-accent/20 mt-6">
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                                <RefreshCw className="h-5 w-5 text-accent" />
                                Bulk Order Pricing
                            </h4>
                            <p className="text-sm text-muted-foreground mb-3">
                                Special discounts available for bulk orders! Perfect for teams, events, or businesses.
                            </p>
                            <ul className="text-sm space-y-1">
                                <li>• 50-99 pieces: 10% discount</li>
                                <li>• 100-199 pieces: 15% discount</li>
                                <li>• 200+ pieces: 20% discount</li>
                            </ul>
                            <p className="text-sm text-muted-foreground mt-3">
                                Contact us at bulk@pravokha.com for custom orders and quotes.
                            </p>
                        </div>
                    </TabsContent>

                    <TabsContent value="reviews" className="mt-6" id="reviews-section">
                        <div className="grid md:grid-cols-3 gap-8 mb-8">
                            <div className="md:col-span-1">
                                <ReviewStatistics
                                    rating={product.rating}
                                    totalRatings={3895}
                                    totalReviews={product.reviews}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <ProductReviews productId={product.id} />
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="shipping" className="mt-6 space-y-4">
                        <div>
                            <h3 className="font-semibold mb-2">Shipping Information</h3>
                            <p className="text-muted-foreground">
                                Free standard shipping on orders above ₹999. Express shipping available at checkout.
                                Delivery time: 3-5 business days.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">Return Policy</h3>
                            <p className="text-muted-foreground">
                                30-day return policy. Items must be unworn and in original packaging with tags attached.
                            </p>
                        </div>
                    </TabsContent>
                </Tabs>

                <RelatedProducts
                    products={relatedProducts}
                    title="You May Also Like"
                />
            </div>

            <ImageViewer
                images={selectedVariant.images}
                currentIndex={mainImage}
                open={imageViewerOpen}
                onClose={() => setImageViewerOpen(false)}
            />
        </div>
    );
}

export default ProductDetailPage;
