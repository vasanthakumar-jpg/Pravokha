import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/integrations/supabase/client";
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
        link: "/products?category=t-shirts",
    },
    {
        image: hero2,
        title: "Athletic Track Pants",
        description: "Performance meets fashion",
        cta: "Shop Track Pants",
        link: "/products?category=track-pants",
    },
    {
        image: hero3,
        title: "Summer Collection",
        description: "Fresh styles for the season",
        cta: "Shop Shorts",
        link: "/products?category=shorts",
    },
    {
        image: hero1,
        title: "Bulk Orders Available",
        description: "Special pricing for bulk purchases. Contact us for wholesale rates.",
        cta: "Contact for Bulk Orders",
        link: "/contact",
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
            const { data, error } = await supabase
                .from("combo_offers")
                .select("*")
                .eq("active", true)
                .order("created_at", { ascending: false });

            if (error) throw error;

            if (data && data.length > 0) {
                const comboSlides: Slide[] = data.map((offer: any) => ({
                    id: offer.id,
                    image: offer.image_url || hero1,
                    title: offer.title,
                    description: offer.description || `Get this bundle for just ₹${offer.combo_price}`,
                    cta: "Shop Bundle",
                    link: `/products?search=${offer.title}`,
                    isCombo: true,
                }));

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
        </section>
    );
}
