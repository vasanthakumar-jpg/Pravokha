import React, { useRef } from "react";
import { ProductCard } from "../ProductCard";
import { Product } from "@/data/products";
import styles from "./RelatedProducts.module.css";
import { Button } from "@/ui/Button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface RelatedProductsProps {
    products: Product[];
    title?: string;
}

export function RelatedProducts({ products, title = "You May Also Like" }: RelatedProductsProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    if (!products || products.length === 0) return null;

    const scroll = (direction: "left" | "right") => {
        if (scrollRef.current) {
            const { scrollLeft, clientWidth } = scrollRef.current;
            const scrollTo = direction === "left" ? scrollLeft - clientWidth : scrollLeft + clientWidth;
            scrollRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
        }
    };

    return (
        <section className={styles.section}>
            <div className="container">
                <div className={styles.header}>
                    <h2 className={styles.title}>{title}</h2>
                    <div className={styles.controls}>
                        <Button
                            variant="outline"
                            size="icon"
                            className={styles.controlButton}
                            onClick={() => scroll("left")}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className={styles.controlButton}
                            onClick={() => scroll("right")}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className={styles.scrollContainer} ref={scrollRef}>
                    {products.map((product) => (
                        <div key={product.id} className={styles.productWrapper}>
                            <ProductCard product={product} />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default RelatedProducts;
