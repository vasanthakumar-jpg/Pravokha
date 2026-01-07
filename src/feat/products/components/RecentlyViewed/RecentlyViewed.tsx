import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useRecentlyViewed } from '@/shared/hook/useRecentlyViewed';
import { ProductCard } from '../ProductCard';
import styles from './RecentlyViewed.module.css';
import { ArrowRight, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { Button } from '@/ui/Button';
import { cn } from '@/lib/utils';
import { Separator } from '@/ui/Separator';

export const RecentlyViewed = () => {
    const { recentlyViewed, clearRecentlyViewed } = useRecentlyViewed();
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(true);

    useEffect(() => {
        const handleScroll = () => {
            if (scrollContainerRef.current) {
                const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
                setShowLeftArrow(scrollLeft > 10);
                setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
            }
        };

        const container = scrollContainerRef.current;
        if (container) {
            container.addEventListener('scroll', handleScroll);
            handleScroll(); // Initial check
            // Re-check on resize
            window.addEventListener('resize', handleScroll);
        }
        return () => {
            container?.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleScroll);
        };
    }, [recentlyViewed]);

    // Enforce minimum items rule strict
    if (!recentlyViewed || recentlyViewed.length === 0) return null;

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            // Scroll by item width + gap
            const itemWidth = window.innerWidth < 640 ? 200 : 280; // Match CSS widths
            const scrollAmount = itemWidth + 24; // Width + Gap
            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    return (
        <section className={cn("py-12 px-4 sm:px-6 lg:px-8 border-t border-border/40", styles.container)}>
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-[0.2em] px-3 py-1 bg-primary/10 rounded-full w-fit mb-2">
                            <Clock className="w-3 h-3" />
                            Your History
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">Recently Viewed</h2>
                        <p className="text-sm text-muted-foreground">Pick up where you left off.</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="hidden sm:flex items-center gap-2 mr-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => clearRecentlyViewed()}
                                className="text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8"
                            >
                                Clear History
                            </Button>
                            <div className="h-4 w-px bg-border/60 mx-2" />
                        </div>

                        <Button
                            variant="outline"
                            size="icon"
                            className={cn(
                                "rounded-full h-9 w-9 border-border/40 bg-background/50 backdrop-blur-sm transition-opacity duration-300 shadow-sm hover:bg-white hover:border-primary/20",
                                !showLeftArrow && "opacity-30 cursor-not-allowed"
                            )}
                            onClick={() => scroll('left')}
                            disabled={!showLeftArrow}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className={cn(
                                "rounded-full h-9 w-9 border-border/40 bg-background/50 backdrop-blur-sm transition-opacity duration-300 shadow-sm hover:bg-white hover:border-primary/20",
                                !showRightArrow && "opacity-30 cursor-not-allowed"
                            )}
                            onClick={() => scroll('right')}
                            disabled={!showRightArrow}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                <div className="relative group/carousel">
                    {/* Items Container */}
                    <div
                        ref={scrollContainerRef}
                        className={cn("scrollbar-hide snap-x snap-mandatory pb-4", styles.scrollContainer)}
                    >
                        {recentlyViewed.map((product) => (
                            <div key={product.id} className={styles.carouselItem}>
                                <ProductCard product={product} />
                            </div>
                        ))}

                        {/* "See More" End Card */}
                        <div className={cn(styles.carouselItem, "flex flex-col items-center justify-center bg-muted/20 border-2 border-dashed border-border/40 rounded-2xl p-6 text-center h-[380px] hover:border-primary/30 hover:bg-muted/30 transition-all group/card cursor-pointer")}>
                            <Link to="/products" className="flex flex-col items-center gap-3">
                                <div className="h-12 w-12 rounded-full bg-background border border-border/60 flex items-center justify-center group-hover/card:scale-110 transition-transform shadow-sm">
                                    <ArrowRight className="h-5 w-5 text-primary" />
                                </div>
                                <div className="space-y-1">
                                    <p className="font-bold text-foreground">Continue Browsing</p>
                                    <p className="text-xs text-muted-foreground">Discover more items</p>
                                </div>
                            </Link>
                        </div>
                    </div>

                    {/* Hover Fade Gradients */}
                    <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none opacity-0 sm:opacity-100" />
                    <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none opacity-0 sm:opacity-100" />
                </div>
            </div>
        </section>
    );
};


