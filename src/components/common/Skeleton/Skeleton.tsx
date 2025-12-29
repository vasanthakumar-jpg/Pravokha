import type { SkeletonProps } from './Skeleton.types';
import styles from './Skeleton.module.css';

export const Skeleton = ({
    variant = 'rectangular',
    width,
    height = variant === 'text' ? '1rem' : '100%',
    className = '',
    count = 1,
}: SkeletonProps) => {
    const style = {
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
    };

    const skeletonClass = `${styles.skeleton} ${styles[variant]} ${className}`;

    if (count === 1) {
        return <div className={skeletonClass} style={style} aria-label="Loading..." />;
    }

    return (
        <>
            {Array.from({ length: count }).map((_, index) => (
                <div key={index} className={skeletonClass} style={style} aria-label="Loading..." />
            ))}
        </>
    );
};

// Pre-built skeleton variants for common use cases
export const SkeletonCard = () => (
    <div className={styles.productCard}>
        <div className={`${styles.skeleton} ${styles.productImage}`} />
        <div className={`${styles.skeleton} ${styles.productTitle}`} />
        <div className={`${styles.skeleton} ${styles.productPrice}`} />
    </div>
);

export const SkeletonText = ({ lines = 3 }: { lines?: number }) => (
    <div>
        {Array.from({ length: lines }).map((_, i) => (
            <div
                key={i}
                className={`${styles.skeleton} ${styles.text}`}
                style={{ width: i === lines - 1 ? '60%' : '100%' }}
            />
        ))}
    </div>
);
