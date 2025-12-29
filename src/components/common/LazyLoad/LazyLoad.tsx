import { useEffect, useRef, useState } from 'react';
import type { LazyLoadProps } from './LazyLoad.types';
import styles from './LazyLoad.module.css';

export const LazyLoad = ({
    children,
    fallback = null,
    rootMargin = '50px',
    threshold = 0.01,
    className = '',
}: LazyLoadProps) => {
    const [isVisible, setIsVisible] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasLoaded) {
                    setIsVisible(true);
                    setHasLoaded(true);
                    observer.disconnect();
                }
            },
            {
                rootMargin,
                threshold,
            }
        );

        observer.observe(element);

        return () => {
            observer.disconnect();
        };
    }, [rootMargin, threshold, hasLoaded]);

    return (
        <div
            ref={ref}
            className={`${styles.lazyContainer} ${isVisible ? styles.loaded : styles.loading} ${className}`}
        >
            {isVisible ? children : fallback}
        </div>
    );
};
