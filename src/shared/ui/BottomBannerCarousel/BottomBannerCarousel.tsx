import { useState, useEffect } from "react";
import { Button } from "@/ui/Button";
import { Link } from "react-router-dom";
import newSeasonImg from "@/assets/category-new-season.jpg";
import saleImg from "@/assets/category-sale.jpg";
import premiumImg from "@/assets/category-premium.jpg";
import styles from "./BottomBannerCarousel.module.css";
import { cn } from "@/lib/utils";

interface BannerSlide {
    id: number;
    title: string;
    description: string;
    image: string;
    link: string;
    buttonText: string;
}

const banners: BannerSlide[] = [
    {
        id: 1,
        title: "New Season Arrivals",
        description: "Discover the latest trends in fashion. Fresh styles for the modern wardrobe.",
        image: newSeasonImg,
        link: "/products",
        buttonText: "Shop New Collection",
    },
    {
        id: 2,
        title: "Limited Time Offer",
        description: "Up to 50% off on selected items. Don't miss out on incredible deals!",
        image: saleImg,
        link: "/products",
        buttonText: "Shop Deals Now",
    },
    {
        id: 3,
        title: "Premium Quality",
        description: "Experience unmatched comfort and timeless style with our premium collection.",
        image: premiumImg,
        link: "/products",
        buttonText: "Explore Premium",
    },
];

export function BottomBannerCarousel() {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);

    useEffect(() => {
        if (!isAutoPlaying) return;

        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % banners.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [isAutoPlaying]);

    const goToSlide = (index: number) => {
        setCurrentSlide(index);
        setIsAutoPlaying(false);
    };

    return (
        <div className={styles.container}>
            {banners.map((banner, index) => (
                <div
                    key={banner.id}
                    className={cn(
                        styles.slide,
                        index === currentSlide ? styles.slideActive : styles.slideInactive
                    )}
                >
                    <div className={styles.slideContent}>
                        <img
                            src={banner.image}
                            alt={banner.title}
                            className={styles.image}
                            loading="lazy"
                        />
                        <div className={styles.overlay} />
                        <div className={styles.textContainer}>
                            <h2 className={styles.title}>
                                {banner.title}
                            </h2>
                            <p className={styles.description}>
                                {banner.description}
                            </p>
                            <div className={styles.buttonWrapper}>
                                <Link to={banner.link}>
                                    <Button size="lg">
                                        {banner.buttonText}
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            ))}

            <div className={styles.indicators}>
                {banners.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        className={cn(
                            styles.indicatorDot,
                            index === currentSlide ? styles.indicatorActive : styles.indicatorInactive
                        )}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
}
