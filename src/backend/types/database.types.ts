/* Supabase Database Types
 * Generated from Supabase schema
 * This file contains TypeScript types for database tables
 */

export interface Database {
    public: {
        Tables: {
            categories: {
                Row: {
                    id: string;
                    name: string;
                    slug: string;
                    description: string | null;
                    image_url: string | null;
                    status: string;
                    display_order: number;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    name: string;
                    slug: string;
                    description?: string | null;
                    image_url?: string | null;
                    status?: string;
                    display_order?: number;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    name?: string;
                    slug?: string;
                    description?: string | null;
                    image_url?: string | null;
                    status?: string;
                    display_order?: number;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            products: {
                Row: {
                    id: string;
                    title: string;
                    slug: string;
                    description: string | null;
                    price: string;
                    discount_price: string | null;
                    category: string;
                    rating: string | null;
                    reviews: number | null;
                    sku: string;
                    is_featured: boolean;
                    is_new: boolean;
                    published: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    title: string;
                    slug: string;
                    description?: string | null;
                    price: string;
                    discount_price?: string | null;
                    category: string;
                    rating?: string | null;
                    reviews?: number | null;
                    sku: string;
                    is_featured?: boolean;
                    is_new?: boolean;
                    published?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    title?: string;
                    slug?: string;
                    description?: string | null;
                    price?: string;
                    discount_price?: string | null;
                    category?: string;
                    rating?: string | null;
                    reviews?: number | null;
                    sku?: string;
                    is_featured?: boolean;
                    is_new?: boolean;
                    published?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
            };
        };
        Views: Record<string, never>;
        Functions: Record<string, never>;
        Enums: Record<string, never>;
    };
}
