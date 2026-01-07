import { useEffect, useState } from "react";
import { Package } from "lucide-react";
import { supabase } from "@/infra/api/supabase";
import { cn } from "@/lib/utils";

interface ProductImageProps {
    productId: string;
    title: string;
    size?: "list" | "grid";
    className?: string;
}

export function ProductImage({ productId, title, size = "list", className }: ProductImageProps) {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const loadImage = async () => {
            try {
                const { data, error } = await supabase
                    .from('product_variants')
                    .select('images')
                    .eq('product_id', productId)
                    .limit(1)
                    .maybeSingle();

                if (isMounted && !error && data?.images?.[0]) {
                    setImageUrl(data.images[0]);
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
            src={imageUrl}
            alt={title}
            className={cn(containerClass, "object-cover rounded-lg border border-border/20", className)}
        />
    );
}
