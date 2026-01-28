import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/infra/api/apiClient';

export interface Subcategory {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    status: string;
}

export interface Category {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    imageUrl: string | null;
    status: string;
    subcategories: Subcategory[];
}

export function useCategories() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCategories = useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/categories');
            if (response.data.success) {
                setCategories(response.data.categories);
            }
        } catch (err: any) {
            console.error('Error fetching categories:', err);
            setError(err.message || 'Failed to load categories');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    return { categories, loading, error, refresh: fetchCategories };
}
