import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import styles from "./InteractiveStarRating.module.css";

interface InteractiveStarRatingProps {
    rating: number;
    onRatingChange?: (rating: number) => void;
    readOnly?: boolean;
    size?: "sm" | "md" | "lg";
    showQuotes?: boolean;
}

const QUOTES = {
    1: "Poor",
    2: "Fair",
    3: "Average",
    4: "Good",
    5: "Excellent",
};

export const InteractiveStarRating = ({
    rating,
    onRatingChange,
    readOnly = false,
    size = "md",
    showQuotes = true,
}: InteractiveStarRatingProps) => {
    const [hoverRating, setHoverRating] = useState(0);

    const iconSize = {
        sm: "h-3 w-3 sm:h-4 sm:w-4",
        md: "h-6 w-6",
        lg: "h-8 w-8",
    }[size];

    const currentRating = hoverRating || rating;

    return (
        <div className={styles.container}>
            <div className={styles.starsWrapper}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        className={cn(
                            styles.starButton,
                            readOnly && "cursor-default",
                            !readOnly && styles.interactive
                        )}
                        onClick={() => !readOnly && onRatingChange?.(star)}
                        onMouseEnter={() => !readOnly && setHoverRating(star)}
                        onMouseLeave={() => !readOnly && setHoverRating(0)}
                    >
                        <Star
                            className={cn(
                                iconSize,
                                styles.starIcon,
                                star <= currentRating
                                    ? styles.filled
                                    : styles.empty
                            )}
                        />
                    </button>
                ))}
            </div>
            {showQuotes && !readOnly && currentRating > 0 && (
                <div className={styles.quoteWrapper}>
                    <span className={styles.quoteText}>
                        {QUOTES[currentRating as keyof typeof QUOTES]}
                    </span>
                </div>
            )}
        </div>
    );
};
