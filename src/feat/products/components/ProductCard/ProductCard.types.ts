export interface ProductCardProps {
    product: {
        id: string;
        title: string;
        slug: string;
        description: string;
        price: number;
        discountPrice?: number;
        rating: number;
        reviews: number;
        variants: Array<{
            id: string;
            colorName: string;
            colorHex: string;
            images: string[];
            sizes: Array<{
                size: string;
                stock: number;
            }>;
        }>;
        featured?: boolean;
        is_featured?: boolean;
        newArrival?: boolean;
        is_new?: boolean;
        is_verified?: boolean;
        published?: boolean;
        sellerId?: string;
    };
}
