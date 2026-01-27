import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/ui/Button";
import { CategorySmallCard } from "@/feat/products/components/CategorySmallCard";
import styles from "./CategoryCarousel.module.css";
import { cn } from "@/lib/utils";

interface Category {
    id: string;
    name: string;
    description?: string;
    image_url?: string;
    slug: string;
    status?: string;
}

interface CategoryCarouselProps {
    categories: Category[];
    getFallbackImage: (slug: string) => string;
    isCategoryActive: (status?: string) => boolean;
}

export function CategoryCarousel({ categories, getFallbackImage, isCategoryActive }: CategoryCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Responsive cards per view
    const getCardsPerView = () => {
        if (typeof window === 'undefined') return 3;
        const width = window.innerWidth;
        if (width >= 1024) return 3; // Desktop
        if (width >= 768) return 2; // Tablet
        return 1; // Mobile
    };

    const [cardsPerView, setCardsPerView] = useState(getCardsPerView());
    const [gapSize, setGapSize] = useState(window.innerWidth >= 640 ? '1.5rem' : '1rem');

    // Update cards per view and gap on resize
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleResize = () => {
            setCardsPerView(getCardsPerView());
            setGapSize(window.innerWidth >= 640 ? '1.5rem' : '1rem');
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []); // Empty dependency array - only run on mount

    const maxIndex = Math.max(0, categories.length - cardsPerView);
    const canGoPrev = currentIndex > 0;
    const canGoNext = currentIndex < maxIndex;

    // Show arrows only if there are more cards than can be displayed
    const showArrows = categories.length > cardsPerView;

    const handlePrev = () => {
        if (canGoPrev) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    const handleNext = () => {
        if (canGoNext) {
            setCurrentIndex(prev => prev + 1);
        }
    };

    if (categories.length === 0) {
        return (
            <div className="text-center text-muted-foreground py-10">
                No categories found. Please add categories in Admin Panel.
            </div>
        );
    }

    return (
        <div className={styles.carouselContainer}>
            {/* Left Arrow - only show if needed */}
            {showArrows && (
                <button
                    onClick={handlePrev}
                    disabled={!canGoPrev}
                    className={cn(styles.arrowButton, styles.arrowLeft, !canGoPrev && styles.arrowDisabled)}
                    aria-label="Previous categories"
                >
                    <ChevronLeft className="h-6 w-6" />
                </button>
            )}

            {/* Cards Container */}
            <div className={styles.carouselWrapper}>
                <div
                    className={styles.cardsTrack}
                    style={{
                        transform: `translateX(calc(-${currentIndex} * (100% / ${cardsPerView} + ${gapSize} / ${cardsPerView})))`,
                    }}
                >
                    {categories.map((category) => (
                        <div
                            key={category.id}
                            className={styles.cardSlot}
                            style={{
                                flex: `0 0 calc((100% - (${cardsPerView} - 1) * ${gapSize}) / ${cardsPerView})`
                            }}
                        >
                            <CategorySmallCard
                                title={category.name}
                                description={category.description || "Discover our collection"}
                                image={category.imageUrl || getFallbackImage(category.slug)}
                                link={`/products?category=${category.slug}`}
                                disabled={!isCategoryActive(category.status)}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Arrow - only show if needed */}
            {showArrows && (
                <button
                    onClick={handleNext}
                    disabled={!canGoNext}
                    className={cn(styles.arrowButton, styles.arrowRight, !canGoNext && styles.arrowDisabled)}
                    aria-label="Next categories"
                >
                    <ChevronRight className="h-6 w-6" />
                </button>
            )}


        </div>
    );
}
