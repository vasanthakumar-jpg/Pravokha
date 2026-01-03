import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { HeroCarousel } from "../../components/HeroCarousel";
import { ProductGrid } from "@/features/products/components/ProductGrid";
import { ProductCard } from "@/features/products/components/ProductCard";
import { CategoryCard } from "@/components/category/CategoryCard";
import { CategorySmallCard } from "@/components/category/CategorySmallCard";
import { CategoryCarousel } from "../../components/CategoryCarousel";
import styles from "./HomePage.module.css";
import typography from "@/styles/Typography.module.css";
import layout from "@/styles/Layout.module.css";

import { supabase } from "@/integrations/supabase/client";
import { BottomBannerCarousel } from "@/components/common/BottomBannerCarousel";
import { WhatsAppButton } from "@/components/common/WhatsAppButton";
import { useGsapAnimations } from "@/hooks/useGsapAnimations";
import { ArrowRight, TrendingUp, Zap, Shield, Mail, Info } from "lucide-react";
import categoryMenImg from "@/assets/category-men.jpg";
import categoryWomenImg from "@/assets/category-women.jpg";
import categoryKidsImg from "@/assets/category-kids.jpg";
import tshirtImg from "@/assets/category-tshirts.jpg";
import trackpantsImg from "@/assets/category-trackpants.jpg";
import shortsImg from "@/assets/category-shorts.jpg";
import { Product } from "@/data/products";

interface Category {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    image_url: string | null;
    status: string;
}

// Fallback image logic if DB image is missing
const getFallbackImage = (slug: string) => {
    const images: Record<string, string> = {
        men: categoryMenImg,
        women: categoryWomenImg,
        kids: categoryKidsImg,
        tshirts: tshirtImg,
        trackpants: trackpantsImg,
        shorts: shortsImg,
        "mens-collection": categoryMenImg,
        "womens-collection": categoryWomenImg,
        "kids-collection": categoryKidsImg
    };
    return images[slug] || categoryMenImg; // Default to Men's image if no match found
};

// Helper to determine if category is valid for link
const isCategoryActive = (status: string) => status === 'active';

export function HomePage() {
    useGsapAnimations();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
    const [newArrivals, setNewArrivals] = useState<Product[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(true);

    useEffect(() => {
        fetchCategories();
        fetchHomeProducts();
    }, []);

    const fetchCategories = async () => {
        try {
            const { data, error } = await supabase
                .from("categories")
                .select("*")
                .order("display_order", { ascending: true });

            if (error) throw error;
            setCategories(data || []);
        } catch (error) {
            console.error("Error fetching categories:", error);
        } finally {
            setLoadingCategories(false);
        }
    };

    const fetchHomeProducts = async () => {
        try {
            setLoadingProducts(true);

            const { data, error } = await supabase
                .from("products")
                .select(`
          *,
          product_variants (
            id,
            color_name,
            color_hex,
            images,
            product_sizes (
              size,
              stock
            )
          )
        `)
                .eq("published", true)
                .order("created_at", { ascending: false });

            if (error) throw error;

            if (data) {
                const transformed: Product[] = data.map((p: any) => ({
                    id: p.id,
                    title: p.title,
                    slug: p.slug,
                    description: p.description,
                    price: parseFloat(p.price),
                    discountPrice: p.discount_price ? parseFloat(p.discount_price) : undefined,
                    category: p.category,
                    rating: parseFloat(p.rating || 4.5),
                    reviews: p.reviews || 0,
                    sku: p.sku,
                    is_featured: p.is_featured,
                    is_new: p.is_new,
                    featured: p.is_featured,     // Map for compatibility
                    newArrival: p.is_new,        // Map for compatibility
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

                setFeaturedProducts(transformed.filter(p => p.featured).slice(0, 8));
                setNewArrivals(transformed.filter(p => p.newArrival).slice(0, 8));
            }
        } catch (error) {
            console.error("Error fetching home products:", error);
        } finally {
            setLoadingProducts(false);
        }
    };

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    if (loadingCategories) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-muted-foreground">Loading...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col">
            <HeroCarousel />

            {/* Shop by Category - Universal Carousel */}
            <section className={`${layout.containerResponsive} ${layout.sectionSpacing}`}>
                <h2 className={`${typography.responsiveH2} text-center mb-3 sm:mb-4`}>Shop by Category</h2>
                <p className={`${typography.responsiveBody} text-center mb-6 sm:mb-8 max-w-2xl mx-auto`}>
                    Discover comfortable and stylish wear for every day. From premium tees to active track pants and versatile shorts - find your perfect fit.
                </p>

                {/* Category Carousel with Arrows */}
                <CategoryCarousel
                    categories={categories}
                    getFallbackImage={getFallbackImage}
                    isCategoryActive={isCategoryActive}
                />
            </section>

            {/* Featured Products */}
            <section className={`${layout.containerResponsive} ${layout.sectionSpacing}`}>
                <div className="text-center mb-8 sm:mb-12">
                    <h2 className={`${typography.responsiveH2} mb-3 sm:mb-4`}>Featured Collection</h2>
                    <p className={`${typography.responsiveBody} text-muted-foreground max-w-2xl mx-auto`}>
                        Discover our handpicked selection of premium t-shirts, track pants, and shorts
                    </p>
                </div>
                <ProductGrid products={featuredProducts} />
                <div className="flex justify-center mt-8">
                    <Link to="/products">
                        <Button size="lg" variant="outline" className="group">
                            View All Products
                            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Button>
                    </Link>
                </div>
            </section>

            {/* New Arrivals */}
            <section className={`${layout.containerResponsive} ${layout.sectionSpacing}`}>
                <div className="text-center mb-8 sm:mb-12">
                    <h2 className={`${typography.responsiveH2} mb-3 sm:mb-4`}>New Arrivals</h2>
                    <p className={`${typography.responsiveBody} text-muted-foreground max-w-2xl mx-auto`}>
                        Check out our latest additions to the collection
                    </p>
                </div>
                <ProductGrid products={newArrivals} />
            </section>

            {/* Features */}
            <section className={`${layout.containerResponsive} ${layout.sectionSpacing} bg-muted/30`}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
                    <Card className="p-4 sm:p-6 text-center hover:shadow-xl transition-all duration-300 group h-full flex flex-col justify-center items-center">
                        <TrendingUp className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 mx-auto mb-3 sm:mb-4 text-primary transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" />
                        <h3 className="text-lg sm:text-xl font-semibold mb-2">Latest Trends</h3>
                        <p className="text-sm sm:text-base text-muted-foreground">Stay ahead with our curated collection of the season's hottest styles</p>
                    </Card>
                    <Card className="p-4 sm:p-6 text-center hover:shadow-xl transition-all duration-300 group h-full flex flex-col justify-center items-center">
                        <Zap className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 mx-auto mb-3 sm:mb-4 text-primary transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" />
                        <h3 className="text-lg sm:text-xl font-semibold mb-2">Fast Delivery</h3>
                        <p className="text-sm sm:text-base text-muted-foreground">Lightning-fast shipping to get your order to you in record time</p>
                    </Card>
                    <Card className="p-4 sm:p-6 text-center hover:shadow-xl transition-all duration-300 group h-full flex flex-col justify-center items-center">
                        <Shield className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 mx-auto mb-3 sm:mb-4 text-primary transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" />
                        <h3 className="text-lg sm:text-xl font-semibold mb-2">Quality Assured</h3>
                        <p className="text-sm sm:text-base text-muted-foreground">Premium quality guaranteed on every product with our satisfaction promise</p>
                    </Card>
                </div>
            </section>

            {/* CTA Section */}
            <section className={`${layout.containerResponsive} py-12 sm:py-16 text-center`}>
                <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
                    <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold leading-tight">
                        Ready to Upgrade Your Wardrobe?
                    </h2>
                    <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
                        Join thousands of satisfied customers worldwide and discover your perfect style today
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center pt-4 sm:pt-6 w-full max-w-xs sm:max-w-none mx-auto">
                        <Link to="/products" className="w-full sm:w-auto">
                            <Button size="lg" className="w-full sm:w-[200px] h-11 sm:h-12 text-sm sm:text-base group hover:scale-105 transition-transform">
                                Shop Now
                                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                        <Link to="/learn-more" className="w-full sm:w-auto">
                            <Button size="lg" variant="outline" className="w-full sm:w-[200px] h-11 sm:h-12 text-sm sm:text-base group hover:scale-105 transition-transform">
                                Learn More
                                <Info className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            <WhatsAppButton />
        </div>
    );
}

export default HomePage;
