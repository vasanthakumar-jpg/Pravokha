import { useState, useEffect } from 'react';

interface UseApiOptions<T> {
    initialData?: T;
    enabled?: boolean;
}

interface UseApiReturn<T> {
    data: T | undefined;
    loading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

/**
 * Reusable hook for API calls with loading and error states
 * @param apiFunction - The API function to call
 * @param options - Options including initialData and enabled flag
 */
export function useApi<T>(
    apiFunction: () => Promise<T>,
    options: UseApiOptions<T> = {}
): UseApiReturn<T> {
    const { initialData, enabled = true } = options;
    const [data, setData] = useState<T | undefined>(initialData);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchData = async () => {
        if (!enabled) return;

        setLoading(true);
        setError(null);

        try {
            const result = await apiFunction();
            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('An error occurred'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled]);

    return { data, loading, error, refetch: fetchData };
}
