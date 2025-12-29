import { Star } from "lucide-react";
import { Progress } from "@/components/ui/Progress";
import styles from "./ProductReviews.module.css";
import { cn } from "@/lib/utils";

interface ReviewStatisticsProps {
    rating: number;
    totalRatings: number;
    totalReviews: number;
    distribution?: {
        5: number;
        4: number;
        3: number;
        2: number;
        1: number;
    };
}

export const ReviewStatistics = ({
    rating,
    totalRatings,
    totalReviews,
    distribution = { 5: 70, 4: 15, 3: 10, 2: 3, 1: 2 }
}: ReviewStatisticsProps) => {
    return (
        <div className={styles.statsSection}>
            <div className={styles.statsHeader}>
                <div className={styles.avgRating}>{rating.toFixed(1)}</div>
                <div className="flex items-center justify-center gap-1">
                    {[...Array(5)].map((_, i) => (
                        <Star
                            key={i}
                            className={cn(
                                "h-5 w-5",
                                i < Math.floor(rating)
                                    ? "fill-[#146B6B] text-[#146B6B]"
                                    : "fill-muted text-muted"
                            )}
                        />
                    ))}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                    {totalRatings.toLocaleString()} ratings & {totalReviews} reviews
                </p>
            </div>

            <div className={styles.starsDistribution}>
                {[5, 4, 3, 2, 1].map((stars) => {
                    const percentage = distribution[stars as keyof typeof distribution];
                    return (
                        <div key={stars} className={styles.distRow}>
                            <div className={styles.distLabel}>
                                <span className={styles.distText}>{stars}</span>
                                <Star className={styles.distStar} />
                            </div>
                            <Progress value={percentage} className="flex-1" />
                            <span className={styles.distPercent}>
                                {percentage}%
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
