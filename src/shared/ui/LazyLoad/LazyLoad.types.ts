export interface LazyLoadProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    rootMargin?: string;
    threshold?: number;
    className?: string;
}
