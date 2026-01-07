import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/infra/api/supabase";
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
        try {
            let query = (supabase as any)
                .from("products")
                .select(`
          *,
          product_variants (
            id,
            stock,
            images,
            product_sizes (
              stock
            )
          )
        `)
                .is("deleted_at", null)
                .order("created_at", { ascending: false });

            if (sellerId && !isAdmin) {
                query = query.eq("seller_id", sellerId);
            }

            const { data, error } = await query;

            if (error) throw error;

            const transformed = (data || []).map((p: any) => {
                // Handle both simple and nested stock structures found in Admin/Seller pages
                const totalStock = p.product_variants?.reduce((sum: number, v: any) => {
                    if (v.product_sizes) {
                        return sum + (v.product_sizes.reduce((s: number, sz: any) => s + (sz.stock || 0), 0) || 0);
                    }
                    return sum + (v.stock || 0);
                }, 0) || 0;

                return {
                    ...p,
                    stock_quantity: totalStock,
                };
            });

            setProducts(transformed);
        } catch (error) {
            console.error("Error fetching products:", error);
            toast({
                title: "Error",
                description: "Failed to load products",
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
            filtered = filtered.filter((p) => p.category === categoryFilter);
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
