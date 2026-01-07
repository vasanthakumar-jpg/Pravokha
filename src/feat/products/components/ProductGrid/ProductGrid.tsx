import React from "react";
import { Product } from "@/data/products";
import { ProductCard } from "../ProductCard";
import styles from "./ProductGrid.module.css";
import { cn } from "@/lib/utils";

interface ProductGridProps {
    products: Product[];
    className?: string;
    emptyMessage?: string;
    error?: string | null;
    onRetry?: () => void;
}

export function ProductGrid({
    products,
    className,
    emptyMessage = "No products found matching your criteria.",
    error = null,
    onRetry
}: ProductGridProps) {
    if (error) {
        return (
            <div className={styles.emptyState}>
                <p className="text-destructive mb-4">{error}</p>
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="text-sm font-medium text-primary hover:underline underline-offset-4"
                    >
                        Try again
                    </button>
                )}
            </div>
        );
    }

    if (!products || products.length === 0) {
        return (
            <div className={styles.emptyState}>
                <p>{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className={cn(styles.gridContainer, className)}>
            {products.map((product) => (
                <div key={product.id} className={styles.gridItem}>
                    <ProductCard product={product} />
                </div>
            ))}
        </div>
    );
}

export default ProductGrid;
