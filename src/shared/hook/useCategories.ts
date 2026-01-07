import { useApi } from './useApi';
import { getCategories } from '@/backend/api/categories/getCategories';

/**
 * Custom hook to fetch categories with loading states
 * Usage: const { data: categories, loading, error } = useCategories();
 */
export function useCategories() {
    return useApi(getCategories);
}
