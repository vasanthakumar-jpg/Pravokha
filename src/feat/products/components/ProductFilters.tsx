import { Search, Filter, List, LayoutGrid } from "lucide-react";
import { Input } from "@/ui/Input";
import { Button } from "@/ui/Button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/ui/Select";
import { ProductStatusFilter, ProductViewMode } from "../domain/types";

interface ProductFiltersProps {
    searchQuery: string;
    onSearchChange: (value: string) => void;
    categoryFilter: string;
    onCategoryFilterChange: (value: string) => void;
    statusFilter: ProductStatusFilter;
    onStatusFilterChange: (value: ProductStatusFilter) => void;
    viewMode: ProductViewMode;
    onViewModeChange: (value: ProductViewMode) => void;
}

export function ProductFilters({
    searchQuery,
    onSearchChange,
    categoryFilter,
    onCategoryFilterChange,
    statusFilter,
    onStatusFilterChange,
    viewMode,
    onViewModeChange,
}: ProductFiltersProps) {
    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-9 h-10 rounded-xl"
                    />
                </div>
                <div className="hidden sm:flex border rounded-lg overflow-hidden">
                    <Button
                        variant={viewMode === "list" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => onViewModeChange("list")}
                        className="rounded-none px-3 h-10"
                    >
                        <List className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={viewMode === "grid" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => onViewModeChange("grid")}
                        className="rounded-none px-3 h-10"
                    >
                        <LayoutGrid className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
                    <SelectTrigger className="w-full sm:w-auto min-w-[140px] h-10 rounded-xl whitespace-nowrap">
                        <Filter className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                        <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="mens-tshirts">Men's T-Shirts</SelectItem>
                        <SelectItem value="mens-track-pants">Men's Track Pants</SelectItem>
                        <SelectItem value="womens-tshirts">Women's T-Shirts</SelectItem>
                        <SelectItem value="kids-tshirts">Kids T-Shirts</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={(v) => onStatusFilterChange(v as ProductStatusFilter)}>
                    <SelectTrigger className="w-full sm:w-auto min-w-[110px] h-10 rounded-xl whitespace-nowrap">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="low_stock">Low Stock</SelectItem>
                        <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
