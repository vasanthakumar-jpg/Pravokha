import { useState, useEffect } from "react";
import { Button } from "@/ui/Button";
import { apiClient } from "@/infra/api/apiClient";
import hero1 from "@/assets/hero-premium-tees.jpg";
import hero2 from "@/assets/hero-2.jpg";
import hero3 from "@/assets/hero-3.jpg";
import { Link } from "react-router-dom";
import styles from "./HeroCarousel.module.css";
import { cn } from "@/lib/utils";

interface Slide {
    image: string;
    title: string;
    description: string;
    cta: string;
    link: string;
    id?: string;
    isCombo?: boolean;
}

const staticSlides: Slide[] = [
    {
        image: hero1,
        title: "Premium Quality Tees",
        description: "Discover comfort & style in every thread",
        cta: "Shop T-Shirts",
        link: "/products?search=T-Shirt", // Optimized for Smarter Search
    },
    {
        image: hero2,
        title: "Athletic Track Pants",
        description: "Performance meets fashion",
        cta: "Shop Track Pants",
        link: "/products?search=Track+Pants", // Optimized for Smarter Search
    },
    {
        image: hero3,
        title: "Summer Collection",
        description: "Fresh styles for the season",
        cta: "Shop Shorts",
        link: "/products?search=Shorts", // Optimized for Smarter Search
    },
    {
        image: hero1,
        title: "Bulk Orders Available",
        description: "Special pricing for bulk purchases. Contact our Admin Team for wholesale rates and custom quotes.",
        cta: "Contact Admin for Bulk Orders",
        link: "/contact?subject=Bulk Order Inquiry",
    },
];

export function HeroCarousel() {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);
    const [slides, setSlides] = useState<Slide[]>(staticSlides);

    useEffect(() => {
        fetchComboOffers();
    }, []);

    const fetchComboOffers = async () => {
        try {
            const response = await apiClient.get("/home/combo-offers", { params: { activeOnly: "true" } });

            if (response.data.success && response.data.offers) {
                const comboSlides: Slide[] = response.data.offers.map((offer: any) => {
                    let productIdsStr = "";
                    if (offer.productIds) {
                        try {
                            const parsedIds = typeof offer.productIds === 'string'
                                ? JSON.parse(offer.productIds)
                                : offer.productIds;

                            if (Array.isArray(parsedIds) && parsedIds.length > 0) {
                                productIdsStr = parsedIds.join(",");
                            }
                        } catch (e) {
                            console.error("Error parsing productIds for combo link:", e);
                        }
                    }

                    return {
                        id: offer.id,
                        image: offer.imageUrl || hero1,
                        title: offer.title,
                        description: offer.description || `Get this bundle for just ₹${offer.comboPrice}`,
                        cta: "Shop Bundle",
                        link: productIdsStr
                            ? `/products?ids=${productIdsStr}`
                            : `/products?search=${encodeURIComponent(offer.title)}`,
                        isCombo: true,
                    };
                });

                setSlides([...comboSlides, ...staticSlides]);
            }
        } catch (error) {
            console.error("Error fetching combo offers:", error);
        }
    };

    useEffect(() => {
        if (!isAutoPlaying) return;

        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [isAutoPlaying, slides.length]);

    const goToSlide = (index: number) => {
        setCurrentSlide(index);
        setIsAutoPlaying(false);
    };

    return (
        <section className={styles.section}>
            <div className={styles.grid}>
                {slides.map((slide, index) => (
                    <div
                        key={index}
                        className={cn(styles.slide, index === currentSlide && styles.slideActive)}
                    >
                        <div className={styles.imageContainer}>
                            <img
                                src={slide.image}
                                alt={slide.title}
                                className={styles.image}
                                loading={index === 0 ? "eager" : "lazy"}
                            />

                            <div className={cn(styles.overlay, slide.isCombo && styles.overlayCombo)} />
                        </div>

                        <div className={styles.contentWrapper}>
                            <div className={styles.contentContainer}>
                                <div className={styles.content}>
                                    {slide.isCombo && (
                                        <span className={styles.badge}>
                                            Limited Time Offer
                                        </span>
                                    )}
                                    {index === currentSlide && (
                                        <>
                                            <h2 className={styles.title}>
                                                {slide.title}
                                            </h2>
                                            <p className={styles.description}>
                                                {slide.description}
                                            </p>
                                            <div className={styles.ctaWrapper}>
                                                <Link to={slide.link}>
                                                    <Button size="lg" className={styles.ctaButton}>
                                                        {slide.cta}
                                                    </Button>
                                                </Link>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {slides.length >= 2 && (
                <div className={styles.dots}>
                    {slides.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => goToSlide(index)}
                            className={cn(styles.dot, index === currentSlide && styles.dotActive)}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}
