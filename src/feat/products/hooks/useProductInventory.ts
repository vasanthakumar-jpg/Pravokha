import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/infra/api/apiClient";
import { ProductDomain, ProductStatusFilter } from "../domain/types";
import { useToast } from "@/shared/hook/use-toast";

interface UseProductInventoryProps {
    sellerId?: string;
    isAdmin?: boolean;
}

export function useProductInventory({ sellerId, isAdmin }: UseProductInventoryProps) {
    const [products, setProducts] = useState<ProductDomain[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<ProductDomain[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState<ProductStatusFilter>("all");
    const { toast } = useToast();

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        console.log(`[useProductInventory] Fetching products for sellerId:`, sellerId, `(isAdmin: ${isAdmin})`);

        try {
            const response = await apiClient.get('/products', {
                params: { sellerId }
            });

            console.log(`[useProductInventory] API Response:`, response.data);

            if (response.data.success) {
                const productList = response.data.products || response.data.data || [];
                const transformed = productList.map((p: any) => {
                    // Handle both simple and nested stock structures found in Admin/Seller pages
                    const totalStock = p.variants?.reduce((sum: number, v: any) => {
                        if (v.sizes && v.sizes.length > 0) {
                            return sum + (v.sizes.reduce((s: number, sz: any) => s + (sz.stock || 0), 0) || 0);
                        }
                        return sum + (v.stock || 0);
                    }, 0) || 0;

                    return {
                        ...p,
                        id: p.id,
                        title: p.title,
                        description: p.description,
                        price: p.price,
                        category: p.category,
                        published: p.published,
                        seller_id: p.dealerId,
                        created_at: p.createdAt,
                        stock_quantity: totalStock,
                        main_image: p.variants?.[0]?.images?.[0] || p.product_variants?.[0]?.images?.[0] || null
                    };
                });

                setProducts(transformed);
            }
        } catch (error: any) {
            console.error("Error fetching products:", error);
            toast({
                title: "Error",
                description: "Failed to load products from backend",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [sellerId, isAdmin, toast]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    useEffect(() => {
        let filtered = [...products];

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (p) =>
                    p.title.toLowerCase().includes(q) ||
                    p.description?.toLowerCase().includes(q)
            );
        }

        if (categoryFilter !== "all") {
            filtered = filtered.filter((p) => {
                const pCategory = p.category as any;
                return pCategory?.slug === categoryFilter || pCategory?.name === categoryFilter || p.category === categoryFilter;
            });
        }

        if (statusFilter !== "all") {
            if (statusFilter === "published") filtered = filtered.filter((p) => p.published);
            else if (statusFilter === "draft") filtered = filtered.filter((p) => !p.published);
            else if (statusFilter === "low_stock") filtered = filtered.filter((p) => (p.stock_quantity || 0) > 0 && (p.stock_quantity || 0) < 10);
            else if (statusFilter === "out_of_stock") filtered = filtered.filter((p) => (p.stock_quantity || 0) === 0);
        }

        setFilteredProducts(filtered);
    }, [products, searchQuery, categoryFilter, statusFilter]);

    return {
        products,
        filteredProducts,
        loading,
        searchQuery,
        setSearchQuery,
        categoryFilter,
        setCategoryFilter,
        statusFilter,
        setStatusFilter,
        refresh: fetchProducts,
    };
}
