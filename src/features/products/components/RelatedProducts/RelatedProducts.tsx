import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ProductCard } from "@/features/products/components/ProductCard";
import { Product } from "@/data/products";
import styles from "./RelatedProducts.module.css";
import { cn } from "@/lib/utils";

interface RelatedProductsProps {
    products: Product[];
    title?: string;
}

export function RelatedProducts({ products, title = "You May Also Like" }: RelatedProductsProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = 300;
            const newScrollPosition = scrollRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
            scrollRef.current.scrollTo({ left: newScrollPosition, behavior: 'smooth' });
        }
    };

    if (products.length === 0) return null;

    return (
        <section className={styles.section}>
            <div className="container">
                <div className={styles.header}>
                    <h2 className={styles.title}>{title}</h2>
                    <div className={styles.controls}>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => scroll('left')}
                            className={styles.controlButton}
                            aria-label="Scroll left"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => scroll('right')}
                            className={styles.controlButton}
                            aria-label="Scroll right"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div
                    ref={scrollRef}
                    className={styles.scrollContainer}
                >
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
