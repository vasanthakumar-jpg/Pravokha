import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { ProductGrid } from "@/feat/products/components/ProductGrid";
import { useProducts } from "@/shared/hook/useProducts";
import { apiClient } from "@/infra/api/apiClient";
import { Button } from "@/ui/Button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/Select";
import { Filter, SlidersHorizontal, IndianRupee } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/ui/Sheet";
import { Label } from "@/ui/Label";
import { Checkbox } from "@/ui/Checkbox";
import { Slider } from "@/ui/Slider";
import { RadioGroup, RadioGroupItem } from "@/ui/RadioGroup"; // Assuming RadioGroup is available, or use Checkbox for single select logic
import { useGsapAnimations } from "@/shared/hook/useGsapAnimations";

export function ProductsPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [sortBy, setSortBy] = useState("featured");
    const [priceRange, setPriceRange] = useState([0, 50000]); // Increased max range
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
    const [minDiscount, setMinDiscount] = useState<number>(0); // New Discount State

    // Temp states for mobile filter sheet
    const [tempPriceRange, setTempPriceRange] = useState([0, 50000]);
    const [tempCategories, setTempCategories] = useState<string[]>([]);
    const [tempSubcategories, setTempSubcategories] = useState<string[]>([]);
    const [tempMinDiscount, setTempMinDiscount] = useState<number>(0);

    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [dbCategories, setDbCategories] = useState<{ id: string; name: string }[]>([]);
    const [dbSubcategories, setDbSubcategories] = useState<{ id: string; name: string; category_id: string }[]>([]);

    const categoryParam = searchParams.get("category");
    const subcategoryParam = searchParams.get("subcategory");
    const searchQuery = searchParams.get("search");
    const filterParam = searchParams.get("filter");
    const tagParam = searchParams.get("tag");

    // Fetch categories and subcategories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await apiClient.get('/categories');
                if (response.data.success) {
                    setDbCategories(response.data.categories
                        .filter((c: any) => c.status === 'active')
                        .map((c: any) => ({ id: c.slug, name: c.name })));
                }
            } catch (err) {
                console.error("Error fetching categories:", err);
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

            try {
                const response = await apiClient.get('/categories/subcategories', {
                    params: { category: selectedCategories.length > 0 ? selectedCategories : undefined }
                });

                if (response.data.success) {
                    setDbSubcategories(response.data.subcategories
                        .filter((s: any) => s.status === 'active')
                        .map((s: any) => ({
                            id: s.id, // Use ID (UUID) to match p.subcategory_id
                            name: s.name,
                            category_id: s.categoryId
                        })));
                }
            } catch (err) {
                console.error("Error fetching subcategories:", err);
            }
        };
        fetchSubcategories();
    }, [selectedCategories]);

    // Map sort values to backend expected values
    const getBackendSort = (sort: string) => {
        switch (sort) {
            case "price-low": return "price_asc";
            case "price-high": return "price_desc";
            case "rating": return "rating";
            case "featured": return "featured"; // Matches backend
            default: return "featured";
        }
    };

    // Fetch products from database with server-side filters
    const { products, loading, error } = useProducts({
        search: searchQuery || undefined,
        category: selectedCategories.length > 0 ? selectedCategories[0] : (categoryParam !== "all" ? categoryParam : undefined), // Currently taking first category
        subcategory: selectedSubcategories.length > 0 ? selectedSubcategories[0] : (subcategoryParam || undefined),
        sort: getBackendSort(sortBy),
        minPrice: priceRange[0],
        maxPrice: priceRange[1],
        minDiscount: minDiscount > 0 ? minDiscount : undefined,
        tag: tagParam || (filterParam === "deals" ? "deals" : undefined),
    });

    useGsapAnimations();

    // Variables moved to top to fix ReferenceError

    useEffect(() => {
        if (categoryParam && categoryParam !== "all") {
            const lowerParam = categoryParam.toLowerCase();
            setSelectedCategories([lowerParam]);
            setTempCategories([lowerParam]);
        }
    }, [categoryParam]);

    useEffect(() => {
        if (subcategoryParam) {
            const lowerParam = subcategoryParam.toLowerCase();
            setSelectedSubcategories([lowerParam]);
            setTempSubcategories([lowerParam]);
        }
    }, [subcategoryParam]);

    // Use products directly from hook (server-side filtered)
    const filteredProducts = products;

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
        setMinDiscount(tempMinDiscount);
        setIsFilterOpen(false);
    };

    const clearFilters = () => {
        setSelectedCategories([]);
        setSelectedSubcategories([]);
        setTempCategories([]);
        setTempSubcategories([]);
        setPriceRange([0, 50000]);
        setTempPriceRange([0, 50000]);
        setMinDiscount(0);
        setTempMinDiscount(0);
        setSortBy("featured");
    };

    const FilterContent = ({ isDesktop = false }: { isDesktop?: boolean }) => {
        const currentPriceRange = isDesktop ? priceRange : tempPriceRange;
        const currentMinDiscount = isDesktop ? minDiscount : tempMinDiscount;
        const setDiscount = isDesktop ? setMinDiscount : setTempMinDiscount;

        const discountOptions = [10, 20, 30, 40, 50];

        return (
            <div className="space-y-8">
                {/* Categories */}
                <div>
                    <h3 className="font-bold mb-4 text-sm uppercase tracking-wide text-foreground/80">Categories</h3>
                    <div className="space-y-3">
                        {dbCategories.map((category) => {
                            const isDisabled = false;
                            return (
                                <div key={category.id} className="flex items-center space-x-3">
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
                                        className="text-sm cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        {category.name}
                                        {isDisabled && <span className="text-xs ml-2 text-muted-foreground">(Coming Soon)</span>}
                                    </Label>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Subcategories */}
                {dbSubcategories.length > 0 && (
                    <div>
                        <h3 className="font-bold mb-4 text-sm uppercase tracking-wide text-foreground/80">Subcategories</h3>
                        <div className="space-y-3">
                            {dbSubcategories.map((subcategory) => (
                                <div key={subcategory.id} className="flex items-center space-x-3">
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
                                        className="text-sm cursor-pointer"
                                    >
                                        {subcategory.name}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Price Range */}
                <div>
                    <h3 className="font-bold mb-4 text-sm uppercase tracking-wide text-foreground/80">Price</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm font-semibold mb-2">
                            <span className="flex items-center"><IndianRupee className="h-3 w-3 mr-0.5" /> {currentPriceRange[0]}</span>
                            <span className="flex items-center"><IndianRupee className="h-3 w-3 mr-0.5" /> {currentPriceRange[1]}+</span>
                        </div>
                        <Slider
                            min={0}
                            max={50000}
                            step={100}
                            value={currentPriceRange}
                            onValueChange={isDesktop ? setPriceRange : setTempPriceRange}
                            className="w-full"
                        />
                        <Button
                            variant="link"
                            className="p-0 h-auto text-xs text-primary mt-2"
                            onClick={() => isDesktop ? setPriceRange([0, 50000]) : setTempPriceRange([0, 50000])}
                        >
                            Reset price range
                        </Button>
                    </div>
                </div>

                {/* Discount */}
                <div>
                    <h3 className="font-bold mb-4 text-sm uppercase tracking-wide text-foreground/80">Discount</h3>
                    <RadioGroup
                        value={currentMinDiscount.toString()}
                        onValueChange={(val) => setDiscount(parseInt(val))}
                        className="space-y-3"
                    >
                        {discountOptions.map((option) => (
                            <div key={option} className="flex items-center space-x-3">
                                <RadioGroupItem value={option.toString()} id={`${isDesktop ? 'd-desk-' : 'd-mob-'}${option}`} />
                                <Label htmlFor={`${isDesktop ? 'd-desk-' : 'd-mob-'}${option}`} className="text-sm cursor-pointer">
                                    {option}% Off or more
                                </Label>
                            </div>
                        ))}
                    </RadioGroup>
                </div>

                {!isDesktop && (
                    <div className="flex gap-2 pt-4 sticky bottom-0 bg-background pb-4 border-t mt-4">
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

                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                                {[...Array(8)].map((_, i) => (
                                    <div key={i} className="aspect-[3/4] rounded-xl border border-border/40 overflow-hidden space-y-3 relative">
                                        <div className="absolute inset-0 bg-muted" />
                                        <div className="absolute bottom-0 inset-x-0 p-3 space-y-2 bg-background/50">
                                            <div className="h-4 w-3/4 bg-muted-foreground/20 rounded" />
                                            <div className="h-4 w-1/4 bg-muted-foreground/20 rounded" />
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

                            <div className="grid grid-cols-2 md:flex md:items-center justify-between sm:justify-end gap-2 w-full md:w-auto">
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
                                    <SelectTrigger className="w-full md:w-[140px] whitespace-nowrap text-[10px] sm:text-sm h-8 sm:h-10 px-2 sm:px-3">
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
                                    <SelectTrigger className="w-full md:w-[180px] whitespace-nowrap text-[10px] sm:text-sm h-8 sm:h-10 px-2 sm:px-3">
                                        <SlidersHorizontal className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
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
                                        <Button variant="outline" size="icon" className="col-span-2 w-full md:w-auto md:hidden">
                                            <Filter className="h-4 w-4 mr-2" /> Filters
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
                                <div className="sticky top-20 space-y-6 p-4 border rounded-lg bg-card max-h-[calc(100vh-100px)] overflow-y-auto">
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
                                            onClick={clearFilters}
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
