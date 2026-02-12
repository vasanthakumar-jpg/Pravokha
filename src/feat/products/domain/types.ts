export interface ProductDomain {
    id: string;
    title: string;
    slug: string;
    description: string;
    price: number;
    stock_quantity?: number;
    category: string | { name: string; slug: string; id?: string };
    colors?: any[];
    sizes?: string[];
    published: boolean;
    created_at: string;
    is_featured?: boolean;
    is_new?: boolean;
    is_verified?: boolean;
    seller_id?: string;
    deleted_at?: string | null;
    main_image?: string | null;
}

export type ProductViewMode = "list" | "grid";
export type ProductStatusFilter = "all" | "published" | "draft" | "low_stock" | "out_of_stock";
