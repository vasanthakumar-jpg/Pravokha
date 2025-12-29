import { Star } from "lucide-react";
import { Progress } from "@/components/ui/Progress";
import styles from "./ReviewStatistics.module.css";
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
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.ratingValue}>{rating.toFixed(1)}</div>
                <div className={styles.starRow}>
                    {[...Array(5)].map((_, i) => (
                        <Star
                            key={i}
                            className={cn(
                                styles.starIcon,
                                i < Math.floor(rating) ? styles.starActive : styles.starInactive
                            )}
                        />
                    ))}
                </div>
                <p className={styles.ratingCount}>
                    {totalRatings.toLocaleString()} ratings & {totalReviews} reviews
                </p>
            </div>

            <div className={styles.distribution}>
                {[5, 4, 3, 2, 1].map((stars) => {
                    const percentage = distribution[stars as keyof typeof distribution];
                    return (
                        <div key={stars} className={styles.distributionRow}>
                            <div className={styles.starLabel}>
                                <span className={styles.starLabelText}>{stars}</span>
                                <Star className={styles.starLabelIcon} />
                            </div>
                            <Progress value={percentage} className={styles.progressBar} />
                            <span className={styles.percentage}>
                                {percentage}%
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
