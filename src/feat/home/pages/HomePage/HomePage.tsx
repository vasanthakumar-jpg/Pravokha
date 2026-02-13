import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/ui/Button";
import { Card } from "@/ui/Card";
import { Badge } from "@/ui/Badge";
import { HeroCarousel } from "../../components/HeroCarousel";
import { ProductGrid } from "@/feat/products/components/ProductGrid";
import { ProductCard } from "@/feat/products/components/ProductCard";
import { CategoryCard } from "@/feat/products/components/CategoryCard";
import { CategorySmallCard } from "@/feat/products/components/CategorySmallCard";
import { CategoryCarousel } from "../../components/CategoryCarousel";
import styles from "./HomePage.module.css";
import typography from "@/styles/Typography.module.css";
import layout from "@/styles/Layout.module.css";

import { apiClient } from "@/infra/api/apiClient";
import { BottomBannerCarousel } from "@/shared/ui/BottomBannerCarousel";

import { useGsapAnimations } from "@/shared/hook/useGsapAnimations";
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
    image: string | null;
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
    const [products, setProducts] = useState<Product[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(true);

    useEffect(() => {
        fetchCategories();
        fetchHomeProducts();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await apiClient.get('/categories');
            if (response.data.success) {
                const sortedCategories = (response.data.categories || []).sort((a: Category, b: Category) => {
                    if (a.status === 'active' && b.status !== 'active') return -1;
                    if (a.status !== 'active' && b.status === 'active') return 1;
                    return 0;
                });
                setCategories(sortedCategories);
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
        } finally {
            setLoadingCategories(false);
        }
    };

    const fetchHomeProducts = async () => {
        try {
            setLoadingProducts(true);

            const response = await apiClient.get('/products', { params: { limit: 12, sort: 'newest' } });

            if (response.data.success) {
                const data = response.data.products;
                const transformed: Product[] = data.map((p: any) => ({
                    id: p.id,
                    title: p.title,
                    slug: p.slug,
                    description: p.description,
                    price: parseFloat(String(p.price)),
                    compareAtPrice: p.compareAtPrice ? parseFloat(String(p.compareAtPrice)) : undefined,
                    category: p.category?.name || p.category,
                    rating: parseFloat(String(p.rating || 4.5)),
                    reviews: p.reviews || 0,
                    sku: p.sku,
                    variants: (p.variants || []).map((v: any) => ({
                        id: v.id,
                        colorName: v.colorName,
                        colorHex: v.colorHex,
                        images: v.images,
                        sizes: (v.sizes || []).map((s: any) => ({
                            size: s.size,
                            stock: s.stock,
                        })),
                    })),
                }));

                setProducts(transformed);
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

    if (loadingCategories || loadingProducts) {
        return (
            <div className="min-h-screen flex flex-col bg-background">
                {/* 1. Header Navigation Skeleton (Shadow simulation for visual anchor) */}
                <div className="w-full h-16 sm:h-20 border-b border-border/40 flex items-center justify-between px-4 sm:px-6 lg:px-8 bg-background/95 backdrop-blur-sm sticky top-0 z-50">
                    <div className="flex items-center gap-4 sm:gap-8">
                        {/* Logo Placeholder */}
                        <div className="h-6 w-24 sm:h-8 sm:w-32 bg-muted/20 rounded-lg animate-pulse" />

                        {/* Nav Links Placeholder (Desktop) */}
                        <div className="hidden lg:flex items-center gap-6">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-3 w-12 bg-muted/10 rounded animate-pulse" />
                            ))}
                        </div>
                    </div>

                    {/* Action Icons Placeholder */}
                    <div className="flex items-center gap-3 sm:gap-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-muted/10 animate-pulse" />
                        ))}
                    </div>
                </div>

                {/* 2. Hero Banner Skeleton - Precise Height Matching */}
                <div className="w-full h-[400px] sm:h-[500px] lg:h-[600px] bg-muted/10 relative animate-pulse mb-8 overflow-hidden">
                    <div className="absolute inset-x-0 bottom-8 flex justify-center gap-2">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-1 w-3 sm:h-1.5 sm:w-6 rounded-full bg-white/10" />
                        ))}
                    </div>
                    {/* Dark gradient overlay simulation */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />
                </div>

                {/* 3. "Shop by Category" Section Skeleton - Aspect Ratio Mirrored */}
                <section className={`w-full ${layout.sectionSpacing} mb-12`}>
                    <div className="px-4 sm:px-6 lg:px-8 space-y-8">
                        <div className="space-y-3 text-center">
                            <div className="h-8 w-48 sm:h-10 sm:w-64 bg-muted/40 rounded-xl mx-auto animate-pulse" />
                            <div className="h-4 w-5/6 sm:w-1/2 bg-muted/20 rounded-lg mx-auto animate-pulse max-w-2xl" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-7xl mx-auto">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="space-y-4">
                                    <div className="aspect-[3/4] rounded-2xl bg-muted/10 animate-pulse relative overflow-hidden group">
                                        <div className="absolute inset-x-6 bottom-8 space-y-3">
                                            <div className="h-7 w-3/4 bg-white/10 rounded-lg" />
                                            <div className="h-4 w-1/2 bg-white/5 rounded-md" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* 4. "Explore Our Collection" Product Grid Skeleton */}
                <section className={`w-full ${layout.sectionSpacing} px-4 sm:px-6 lg:px-8 mb-20`}>
                    <div className="space-y-4 text-center mb-12">
                        <div className="h-8 w-56 sm:h-10 sm:w-72 bg-muted/40 rounded-xl mx-auto animate-pulse" />
                        <div className="h-4 w-2/3 sm:w-1/3 bg-muted/20 rounded-lg mx-auto animate-pulse max-w-xl" />
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 max-w-7xl mx-auto">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                            <div key={i} className="flex flex-col gap-4 border border-border/20 rounded-2xl p-2 sm:p-3 h-full">
                                {/* Image Placeholder */}
                                <div className="aspect-square rounded-xl bg-muted/20 animate-pulse" />

                                {/* Content Placeholder */}
                                <div className="space-y-3 px-1 pb-2 flex-1 flex flex-col">
                                    <div className="space-y-2">
                                        <div className="h-3 sm:h-4 w-full bg-muted/30 rounded animate-pulse" />
                                        <div className="h-3 w-2/3 bg-muted/10 rounded animate-pulse" />
                                    </div>

                                    <div className="flex items-center gap-1 mt-2">
                                        {[1, 2, 3, 4, 5].map(s => (
                                            <div key={s} className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-muted/10" />
                                        ))}
                                    </div>

                                    <div className="mt-auto flex justify-between items-end pt-4">
                                        <div className="space-y-1.5">
                                            <div className="h-5 w-16 sm:w-24 bg-muted/30 rounded animate-pulse" />
                                            <div className="h-3 w-10 sm:w-12 bg-muted/10 rounded animate-pulse" />
                                        </div>
                                        <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-muted/20 animate-pulse" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        );
    }


    return (
        <div className="min-h-screen flex flex-col">
            <HeroCarousel />

            {/* Shop by Category - Universal Carousel */}
            <section className={`w-full ${layout.sectionSpacing}`}>
                <h2 className={`${typography.responsiveH2} text-center mb-3 sm:mb-4`}>Shop by Category</h2>
                <p className={`${typography.responsiveBody} text-center mb-6 sm:mb-8 max-w-2xl mx-auto px-4`}>
                    Discover comfortable and stylish wear for every day. From premium tees to active track pants and versatile shorts - find your perfect fit.
                </p>

                {/* Category Carousel with Arrows */}
                <CategoryCarousel
                    categories={categories}
                    getFallbackImage={getFallbackImage}
                    isCategoryActive={isCategoryActive}
                />
            </section>

            {/* Explore Our Collection */}
            <section className={`w-full ${layout.sectionSpacing} px-0`}>
                <div className="text-center mb-8 sm:mb-12 px-4">
                    <h2 className={`${typography.responsiveH2} mb-3 sm:mb-4`}>Explore Our Collection</h2>
                    <p className={`${typography.responsiveBody} text-muted-foreground max-w-2xl mx-auto`}>
                        Premium t-shirts, track pants, and shorts designed for comfort and style
                    </p>
                </div>
                <div className="px-4 sm:px-6 lg:px-8">
                    <ProductGrid products={products} />
                </div>
                <div className="flex justify-center mt-12">
                    <Link to="/products">
                        <Button size="lg" className="group px-8 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-all">
                            View All Products
                            <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                        </Button>
                    </Link>
                </div>
            </section>

            {/* Features */}
            <section className={`w-full ${layout.sectionSpacing} bg-muted/30 px-4 sm:px-6 lg:px-8`}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 w-full mx-auto">
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
            <section className={`w-full py-12 sm:py-16 text-center px-4 sm:px-6 lg:px-8`}>
                <div className="w-full mx-auto space-y-4 sm:space-y-6">
                    <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold leading-tight">
                        Ready to Upgrade Your Wardrobe?
                    </h2>
                    <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-4xl mx-auto px-4">
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


        </div>
    );
}

export default HomePage;
