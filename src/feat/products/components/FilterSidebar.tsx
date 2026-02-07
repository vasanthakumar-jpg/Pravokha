import { Button } from "@/ui/Button";
import { Checkbox } from "@/ui/Checkbox";
import { Label } from "@/ui/Label";
import { RadioGroup, RadioGroupItem } from "@/ui/RadioGroup";
import { Slider } from "@/ui/Slider";
import { IndianRupee } from "lucide-react";

interface FilterSidebarProps {
    isDesktop?: boolean;
    priceRange: number[];
    setPriceRange: (range: number[]) => void;
    minDiscount: number;
    setMinDiscount: (discount: number) => void;
    minRating: number;
    setMinRating: (rating: number) => void;
    selectedCategories: string[];
    setSelectedCategories: (categories: string[]) => void; // Expects simplified setter or wrapper
    selectedSubcategories: string[];
    setSelectedSubcategories: (subcategories: string[]) => void; // Expects simplified setter or wrapper
    dbCategories: { id: string; name: string }[];
    dbSubcategories: { id: string; name: string; category_id: string }[];
    onApply?: () => void;
    onClear: () => void;
    toggleCategory: (id: string, isDesktop: boolean) => void; // Helper to handle toggling logic
    toggleSubcategory: (id: string, isDesktop: boolean) => void; // Helper to handle toggling logic
}

export function FilterSidebar({
    isDesktop = false,
    priceRange,
    setPriceRange,
    minDiscount,
    setMinDiscount,
    minRating,
    setMinRating,
    selectedCategories,
    selectedSubcategories,
    dbCategories,
    dbSubcategories,
    onApply,
    onClear,
    toggleCategory,
    toggleSubcategory
}: FilterSidebarProps) {
    const discountOptions = [10, 20, 30, 40, 50];

    return (
        <div className="space-y-8">
            {/* Categories */}
            <div>
                <h3 className="font-bold mb-4 text-sm uppercase tracking-wide text-foreground/80">Categories</h3>
                <div className="space-y-3">
                    {dbCategories.map((category) => (
                        <div key={category.id} className="flex items-center space-x-3">
                            <Checkbox
                                id={`${isDesktop ? 'desktop-' : 'mobile-'}${category.id}`}
                                checked={selectedCategories.includes(category.id)}
                                onCheckedChange={() => toggleCategory(category.id, isDesktop)}
                            />
                            <Label
                                htmlFor={`${isDesktop ? 'desktop-' : 'mobile-'}${category.id}`}
                                className="text-sm cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                {category.name}
                            </Label>
                        </div>
                    ))}
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
                                    checked={selectedSubcategories.includes(subcategory.id)}
                                    onCheckedChange={() => toggleSubcategory(subcategory.id, isDesktop)}
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
                        <span className="flex items-center"><IndianRupee className="h-3 w-3 mr-0.5" /> {priceRange[0]}</span>
                        <span className="flex items-center"><IndianRupee className="h-3 w-3 mr-0.5" /> {priceRange[1]}+</span>
                    </div>
                    <Slider
                        min={0}
                        max={50000}
                        step={100}
                        value={priceRange}
                        onValueChange={setPriceRange}
                        className="w-full"
                    />
                    <Button
                        variant="link"
                        className="p-0 h-auto text-xs text-primary mt-2"
                        onClick={() => setPriceRange([0, 50000])}
                    >
                        Reset price range
                    </Button>
                </div>
            </div>

            {/* Discount */}
            <div>
                <h3 className="font-bold mb-4 text-sm uppercase tracking-wide text-foreground/80">Discount</h3>
                <RadioGroup
                    value={minDiscount.toString()}
                    onValueChange={(val) => setMinDiscount(parseInt(val))}
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

            {/* Rating */}
            <div>
                <h3 className="font-bold mb-4 text-sm uppercase tracking-wide text-foreground/80">Rating</h3>
                <RadioGroup
                    value={minRating?.toString() ?? "0"}
                    onValueChange={(val) => setMinRating(parseInt(val))}
                    className="space-y-3"
                >
                    {[4, 3, 2, 1].map((rating) => (
                        <div key={rating} className="flex items-center space-x-3">
                            <RadioGroupItem value={rating.toString()} id={`${isDesktop ? 'r-desk-' : 'r-mob-'}${rating}`} />
                            <Label htmlFor={`${isDesktop ? 'r-desk-' : 'r-mob-'}${rating}`} className="text-sm cursor-pointer flex items-center gap-1">
                                <span>{rating}★ & above</span>
                            </Label>
                        </div>
                    ))}
                    <div className="flex items-center space-x-3">
                        <RadioGroupItem value="0" id={`${isDesktop ? 'r-desk-' : 'r-mob-'}0`} />
                        <Label htmlFor={`${isDesktop ? 'r-desk-' : 'r-mob-'}0`} className="text-sm cursor-pointer">
                            Any Rating
                        </Label>
                    </div>
                </RadioGroup>
            </div>

            {!isDesktop && onApply && (
                <div className="flex gap-2 pt-4 sticky bottom-0 bg-background pb-4 border-t mt-4">
                    <Button variant="outline" onClick={onClear} className="flex-1">
                        Clear All
                    </Button>
                    <Button onClick={onApply} className="flex-1 bg-primary hover:bg-primary-hover">
                        Apply Filters
                    </Button>
                </div>
            )}
        </div>
    );
}
