import { useEffect, useState } from "react";
import { Package } from "lucide-react";
import { apiClient } from "@/infra/api/apiClient";
import { cn, getMediaUrl } from "@/lib/utils";

interface ProductImageProps {
    productId: string;
    title: string;
    src?: string | null;
    size?: "list" | "grid";
    className?: string;
}

export function ProductImage({ productId, title, src, size = "list", className }: ProductImageProps) {
    const [imageUrl, setImageUrl] = useState<string | null>(src || null);
    const [loading, setLoading] = useState(!src);

    useEffect(() => {
        if (src) {
            setImageUrl(src);
            setLoading(false);
            return;
        }

        let isMounted = true;
        const loadImage = async () => {
            try {
                const response = await apiClient.get(`/products/${productId}`);
                if (isMounted && response.data.success && response.data.product?.variants?.[0]?.images?.[0]) {
                    setImageUrl(response.data.product.variants[0].images[0]);
                }
            } catch (err) {
                console.error('Error loading image:', err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        loadImage();
        return () => { isMounted = false; };
    }, [productId]);

    const containerClass = size === "grid" ? "w-full h-full" : "h-10 w-10";

    if (loading) return <div className={cn(containerClass, "bg-muted animate-pulse rounded-lg", className)} />;

    if (!imageUrl) return (
        <div className={cn(containerClass, "bg-muted flex items-center justify-center rounded-lg", className)}>
            <Package className="h-5 w-5 text-muted-foreground/40" />
        </div>
    );

    return (
        <img
            src={getMediaUrl(imageUrl)}
            alt={title}
            className={cn(containerClass, "object-cover rounded-lg border border-border/20", className)}
        />
    );
}
