import { ProductGrid } from "@/feat/products/components/ProductGrid";
import { Product } from "@/data/products";
import styles from "./RelatedProducts.module.css";

interface RelatedProductsProps {
    products: Product[];
    title?: string;
}

export function RelatedProducts({ products, title = "You May Also Like" }: RelatedProductsProps) {
    if (products.length === 0) return null;

    return (
        <section className={styles.section}>
            <div className="container">
                <div className={styles.header}>
                    <h2 className={styles.title}>{title}</h2>
                </div>

                <ProductGrid products={products} />
            </div>
        </section>
    );
}

export default RelatedProducts;
