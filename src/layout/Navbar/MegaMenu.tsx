import { useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Category } from "@/shared/hook/useCategories";
import { ChevronRight, ArrowRight } from "lucide-react";
import styles from "./MegaMenu.module.css";
import { Button } from "@/ui/Button";

interface MegaMenuProps {
    isOpen: boolean;
    onClose: () => void;
    categories: Category[];
}

export function MegaMenu({ isOpen, onClose, categories }: MegaMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen, onClose]);

    // Group categories if needed, but here we just list them as columns
    // We can limit to 5 categories based on the design (Men, Women, Sarees, Kids, Accessories)
    const displayCategories = categories.slice(0, 5);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    ref={menuRef}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 15 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className={styles.megaMenu}
                >
                    <div className={styles.container}>
                        <div className={styles.grid}>
                            {/* Categories Columns */}
                            <div className={styles.categoriesSection}>
                                {categories.slice(0, 5).map((category) => (
                                    <div key={category.id} className={styles.column}>
                                        <Link
                                            to={`/products?category=${category.slug}`}
                                            className={styles.categoryTitle}
                                            onClick={onClose}
                                        >
                                            {category.name}
                                        </Link>
                                        <ul className={styles.subcategoryList}>
                                            <li>
                                                <Link
                                                    to={`/products?category=${category.slug}`}
                                                    className={styles.subcategoryLink}
                                                    style={{ fontWeight: "700", color: "hsl(var(--primary))" }}
                                                    onClick={onClose}
                                                >
                                                    All {category.name}
                                                </Link>
                                            </li>
                                            {category.subcategories?.slice(0, 6).map((sub) => (
                                                <li key={sub.id}>
                                                    <Link
                                                        to={`/products?subcategory=${sub.slug}`}
                                                        className={styles.subcategoryLink}
                                                        onClick={onClose}
                                                    >
                                                        {sub.name}
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}

                                {/* All Categories Link Column */}
                                <div className={styles.column}>
                                    <Link
                                        to="/products"
                                        className={styles.categoryTitle}
                                        style={{ color: "hsl(var(--primary))" }}
                                        onClick={onClose}
                                    >
                                        All Categories
                                    </Link>
                                    <ul className={styles.subcategoryList}>
                                        <li>
                                            <Link to="/products" className={styles.subcategoryLink} onClick={onClose}>
                                                Browse All
                                            </Link>
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            {/* Featured/Trending Banner Column */}
                            <div className={styles.featuredSection}>
                                <div className={styles.featuredCard}>
                                    <div className={styles.featuredContent}>
                                        <span className={styles.tag}>NEW ARRIVAL</span>
                                        <h3>Trending In Style</h3>
                                        <p>Discover the latest trends in modern fashion and accessories.</p>
                                        <div className={styles.featuredIcons}>
                                            <span className={styles.iconItem}>⌚</span>
                                            <span className={styles.iconItem}>👟</span>
                                            <span className={styles.iconItem}>👜</span>
                                        </div>
                                        <Link to="/products" onClick={onClose}>
                                            <Button className={styles.shopNowBtn}>
                                                Shop Now
                                            </Button>
                                        </Link>
                                    </div>
                                    <div className={styles.featuredImageWrapper}>
                                        <img
                                            src="https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1000&auto=format&fit=crop"
                                            alt="Trending fashion"
                                            className={styles.featuredImage}
                                        />
                                    </div>
                                </div>
                                <Link to="/products" className={styles.bannerFooter} onClick={onClose}>
                                    View All Modern Accessories <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
