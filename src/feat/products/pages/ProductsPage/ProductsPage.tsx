import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { ProductCard } from "@/feat/products/components/ProductCard";
import { ProductGrid } from "@/feat/products/components/ProductGrid";
import { useProducts } from "@/shared/hook/useProducts";
import { supabase } from "@/infra/api/supabase";
import { Button } from "@/ui/Button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/Select";
import { Filter, SlidersHorizontal } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/ui/Sheet";
import { Label } from "@/ui/Label";
import { Checkbox } from "@/ui/Checkbox";
import { Slider } from "@/ui/Slider";
import { useGsapAnimations } from "@/shared/hook/useGsapAnimations";

export function ProductsPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [sortBy, setSortBy] = useState("featured");
    const [priceRange, setPriceRange] = useState([0, 5000]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
    const [tempPriceRange, setTempPriceRange] = useState([0, 5000]);
    const [tempCategories, setTempCategories] = useState<string[]>([]);
    const [tempSubcategories, setTempSubcategories] = useState<string[]>([]);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [dbCategories, setDbCategories] = useState<{ id: string; name: string }[]>([]);
    const [dbSubcategories, setDbSubcategories] = useState<{ id: string; name: string; category_id: string }[]>([]);

    // Fetch categories and subcategories
    useEffect(() => {
        const fetchCategories = async () => {
            const { data } = await supabase
                .from("categories")
                .select("id, name, slug")
                .eq("status", "active")
                .order("display_order");

            if (data) {
                setDbCategories(data.map(c => ({ id: c.slug, name: c.name })));
            }
        };
        fetchCategories();
    }, []);

    // Fetch subcategories based on selected category
    useEffect(() => {
        const fetchSubcategories = async () => {
            if (selectedCategories.length === 0) {
                setDbSubcategories([]);
                return;
            }

            const { data: categoryData } = await supabase
                .from("categories")
                .select("id")
                .in("slug", selectedCategories);

            if (!categoryData) return;

            const categoryIds = categoryData.map(c => c.id);

            const { data } = await supabase
                .from("subcategories")
                .select("id, name, slug, category_id")
                .in("category_id", categoryIds)
                .eq("status", "active")
                .order("display_order");

            if (data) {
                setDbSubcategories(data.map(s => ({ id: s.id, name: s.name, category_id: s.category_id })));
            }
        };
        fetchSubcategories();
    }, [selectedCategories]);

    // Fetch products from database
    const { products, loading, error } = useProducts();

    useGsapAnimations();

    const categoryParam = searchParams.get("category");
    const searchQuery = searchParams.get("search");

    useEffect(() => {
        if (categoryParam && categoryParam !== "all") {
            setSelectedCategories([categoryParam]);
            setTempCategories([categoryParam]);
        }
    }, [categoryParam]);

    let filteredProducts = [...(products || [])];

    // Filter by search query
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredProducts = filteredProducts.filter((p) =>
            p.title.toLowerCase().includes(query) ||
            p.description.toLowerCase().includes(query) ||
            p.category.toLowerCase().includes(query)
        );
    }

    // Filter by category (if no subcategory filter)
    if (selectedCategories.length > 0 && selectedSubcategories.length === 0) {
        filteredProducts = filteredProducts.filter((p) =>
            selectedCategories.includes(p.category)
        );
    }

    // Filter by subcategory (priority over category)
    if (selectedSubcategories.length > 0) {
        filteredProducts = filteredProducts.filter((p) =>
            p.subcategory_id && selectedSubcategories.includes(p.subcategory_id)
        );
    }

    // Filter by price
    filteredProducts = filteredProducts.filter(
        (p) => (p.discountPrice || p.price) >= priceRange[0] && (p.discountPrice || p.price) <= priceRange[1]
    );

    // Sort
    if (sortBy === "price-low") {
        filteredProducts.sort((a, b) => (a.discountPrice || a.price) - (b.discountPrice || b.price));
    } else if (sortBy === "price-high") {
        filteredProducts.sort((a, b) => (b.discountPrice || b.price) - (a.discountPrice || a.price));
    } else if (sortBy === "rating") {
        filteredProducts.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    const toggleTempCategory = (categoryId: string) => {
        setTempCategories((prev) =>
            prev.includes(categoryId)
                ? prev.filter((c) => c !== categoryId)
                : [...prev, categoryId]
        );
    };

    const toggleTempSubcategory = (subcategoryId: string) => {
        setTempSubcategories((prev) =>
            prev.includes(subcategoryId)
                ? prev.filter((s) => s !== subcategoryId)
                : [...prev, subcategoryId]
        );
    };

    const applyFilters = () => {
        setSelectedCategories(tempCategories);
        setSelectedSubcategories(tempSubcategories);
        setPriceRange(tempPriceRange);
        setIsFilterOpen(false);
    };

    const clearFilters = () => {
        setSelectedCategories([]);
        setSelectedSubcategories([]);
        setTempCategories([]);
        setTempSubcategories([]);
        setPriceRange([0, 5000]);
        setTempPriceRange([0, 5000]);
    };

    const FilterContent = ({ isDesktop = false }: { isDesktop?: boolean }) => {
        return (
            <div className="space-y-6">
                <div>
                    <h3 className="font-semibold mb-3 text-base">Categories</h3>
                    <div className="space-y-3">
                        {dbCategories.map((category) => {
                            const isDisabled = false;
                            return (
                                <div key={category.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`${isDesktop ? 'desktop-' : 'mobile-'}${category.id}`}
                                        checked={isDesktop ? selectedCategories.includes(category.id) : tempCategories.includes(category.id)}
                                        onCheckedChange={() => {
                                            if (isDisabled) return;
                                            isDesktop ? setSelectedCategories(prev =>
                                                prev.includes(category.id) ? prev.filter(c => c !== category.id) : [...prev, category.id]
                                            ) : toggleTempCategory(category.id);
                                        }}
                                        disabled={isDisabled}
                                        className={isDisabled ? "opacity-50" : ""}
                                    />
                                    <Label
                                        htmlFor={`${isDesktop ? 'desktop-' : 'mobile-'}${category.id}`}
                                        className={`text-sm font-medium ${isDesktop ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                                    >
                                        {category.name}
                                        {isDisabled && <span className="text-xs ml-2 text-muted-foreground">(Coming Soon)</span>}
                                    </Label>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {dbSubcategories.length > 0 && (
                    <div>
                        <h3 className="font-semibold mb-3 text-base">Subcategories</h3>
                        <div className="space-y-3">
                            {dbSubcategories.map((subcategory) => (
                                <div key={subcategory.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`${isDesktop ? 'desktop-' : 'mobile-'}sub-${subcategory.id}`}
                                        checked={isDesktop ? selectedSubcategories.includes(subcategory.id) : tempSubcategories.includes(subcategory.id)}
                                        onCheckedChange={() => {
                                            isDesktop ? setSelectedSubcategories(prev =>
                                                prev.includes(subcategory.id) ? prev.filter(s => s !== subcategory.id) : [...prev, subcategory.id]
                                            ) : toggleTempSubcategory(subcategory.id);
                                        }}
                                    />
                                    <Label
                                        htmlFor={`${isDesktop ? 'desktop-' : 'mobile-'}sub-${subcategory.id}`}
                                        className="text-sm font-medium cursor-pointer"
                                    >
                                        {subcategory.name}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div>
                    <h3 className="font-semibold mb-3 text-base">Price Range</h3>
                    <div className="space-y-4">
                        <Slider
                            min={0}
                            max={5000}
                            step={100}
                            value={isDesktop ? priceRange : tempPriceRange}
                            onValueChange={isDesktop ? setPriceRange : setTempPriceRange}
                            className="w-full"
                        />
                        <div className="flex items-center justify-between text-sm font-medium">
                            <span>₹{isDesktop ? priceRange[0] : tempPriceRange[0]}</span>
                            <span>₹{isDesktop ? priceRange[1] : tempPriceRange[1]}</span>
                        </div>
                    </div>
                </div>

                {!isDesktop && (
                    <div className="flex gap-2 pt-4">
                        <Button variant="outline" onClick={clearFilters} className="flex-1">
                            Clear All
                        </Button>
                        <Button onClick={applyFilters} className="flex-1 bg-primary hover:bg-primary-hover">
                            Apply Filters
                        </Button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen flex flex-col">
            <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
                {/* Loading State */}
                {loading && (
                    <div className="flex gap-8 animate-pulse">
                        {/* Sidebar Skeleton */}
                        <div className="hidden lg:block w-64 flex-shrink-0 space-y-6">
                            <div className="h-8 w-24 bg-muted rounded mb-6" />
                            <div className="space-y-4">
                                <div className="h-5 w-32 bg-muted rounded" />
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="h-5 w-5 bg-muted rounded" />
                                        <div className="h-4 w-32 bg-muted/60 rounded" />
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-4 mt-8">
                                <div className="h-5 w-32 bg-muted rounded" />
                                <div className="h-6 w-full bg-muted rounded" />
                                <div className="flex justify-between">
                                    <div className="h-4 w-12 bg-muted rounded" />
                                    <div className="h-4 w-12 bg-muted rounded" />
                                </div>
                            </div>
                        </div>

                        {/* Grid Skeleton */}
                        <div className="flex-1 space-y-6">
                            <div className="flex justify-between items-center mb-6">
                                <div className="h-8 w-48 bg-muted rounded" />
                                <div className="hidden md:flex gap-4">
                                    <div className="h-10 w-32 bg-muted rounded" />
                                    <div className="h-10 w-40 bg-muted rounded" />
                                </div>
                            </div>

                            <div className="flex flex-wrap justify-center gap-4 md:gap-6">
                                {[...Array(8)].map((_, i) => (
                                    <div key={i} className="flex-1 min-w-[160px] max-w-[calc(50%-0.5rem)] sm:max-w-[calc(50%-0.75rem)] md:max-w-[calc(33.333%-1rem)] lg:max-w-[calc(25%-1.125rem)] aspect-[3/4] rounded-xl border border-border/40 overflow-hidden space-y-3">
                                        <div className="h-[70%] bg-muted" />
                                        <div className="p-3 space-y-3">
                                            <div className="h-4 w-3/4 bg-muted rounded" />
                                            <div className="h-4 w-1/4 bg-muted rounded" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <div className="text-center py-16">
                        <p className="text-destructive">Error loading products: {error}</p>
                    </div>
                )}

                {/* Products Content */}
                {!loading && !error && (
                    <>
                        {/* Header */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 gsap-fade-in">
                            <div className="flex flex-row sm:flex-col items-baseline justify-between md:justify-start w-full md:w-auto">
                                <h1 className="text-xl font-semibold">All Products</h1>
                                <p className=" text-base sm:text-base text-muted-foreground whitespace-nowrap">
                                    {filteredProducts.length} products found
                                </p>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-2 w-full md:w-auto">
                                <Select
                                    value={selectedCategories.length === 1 ? selectedCategories[0] : "all"}
                                    onValueChange={(value) => {
                                        if (value === "all") {
                                            setSelectedCategories([]);
                                            setTempCategories([]);
                                        } else {
                                            setSelectedCategories([value]);
                                            setTempCategories([value]);
                                        }
                                    }}
                                >
                                    <SelectTrigger className="w-[140px]">
                                        <SelectValue placeholder="Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Categories</SelectItem>
                                        {dbCategories.map((category) => (
                                            <SelectItem
                                                key={category.id}
                                                value={category.id}
                                            >
                                                {category.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select value={sortBy} onValueChange={setSortBy}>
                                    <SelectTrigger className="w-[180px]">
                                        <SlidersHorizontal className="h-4 w-4 mr-2" />
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="featured">Featured</SelectItem>
                                        <SelectItem value="price-low">Price: Low to High</SelectItem>
                                        <SelectItem value="price-high">Price: High to Low</SelectItem>
                                        <SelectItem value="rating">Highest Rated</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                                    <SheetTrigger asChild>
                                        <Button variant="outline" size="icon" className="lg:hidden">
                                            <Filter className="h-4 w-4" />
                                        </Button>
                                    </SheetTrigger>
                                    <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
                                        <SheetHeader>
                                            <SheetTitle className="text-lg font-bold">Filters</SheetTitle>
                                        </SheetHeader>
                                        <div className="mt-6 overflow-y-auto max-h-[calc(85vh-120px)] pb-4">
                                            <FilterContent isDesktop={false} />
                                        </div>
                                    </SheetContent>
                                </Sheet>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex gap-8">
                            <aside className="hidden lg:block w-64 flex-shrink-0 gsap-slide-left">
                                <div className="sticky top-20 space-y-6 p-4 border rounded-lg bg-card">
                                    <div className="flex items-center justify-between">
                                        <h2 className="font-semibold text-lg flex items-center gap-2">
                                            <Filter className="h-5 w-5" />
                                            Filters
                                        </h2>
                                        <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
                                            Clear
                                        </Button>
                                    </div>
                                    <FilterContent isDesktop={true} />
                                </div>
                            </aside>

                            <div className="flex-1 gsap-fade-in">
                                {filteredProducts.length === 0 ? (
                                    <div className="text-center py-16">
                                        <p className="text-muted-foreground">No products found matching your criteria.</p>
                                        <Button
                                            variant="outline"
                                            className="mt-4"
                                            onClick={() => {
                                                setSelectedCategories([]);
                                                setPriceRange([0, 2000]);
                                            }}
                                        >
                                            Clear Filters
                                        </Button>
                                    </div>
                                ) : (
                                    <ProductGrid products={filteredProducts} />
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default ProductsPage;
