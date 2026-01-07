import { useState, useEffect } from 'react';
import { Product } from '@/data/products';

const STORAGE_KEY = 'pravokha_recently_viewed';
const MAX_ITEMS = 8;
const RECENCY_THRESHOLD = 4 * 60 * 60 * 1000; // 4 hours in milliseconds

export interface RecentlyViewedItem {
  product: Product;
  viewedAt: number;
}

export function useRecentlyViewed() {
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);

  useEffect(() => {
    loadRecentlyViewed();
  }, []);

  const loadRecentlyViewed = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: RecentlyViewedItem[] = JSON.parse(stored);
        // Clean up old items on load
        const now = Date.now();
        const valid = parsed.filter(item => now - item.viewedAt < RECENCY_THRESHOLD);

        if (valid.length !== parsed.length) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(valid));
        }
        setItems(valid);
      }
    } catch (error) {
      console.error('Failed to load recently viewed:', error);
    }
  };

  const addToRecentlyViewed = (product: Product) => {
    try {
      const now = Date.now();
      const newItem: RecentlyViewedItem = { product, viewedAt: now };

      let updated = [newItem];
      const existing = items.filter(item => item.product.id !== product.id);
      updated = [...updated, ...existing].slice(0, MAX_ITEMS);

      setItems(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save recently viewed:', error);
    }
  };

  const clearRecentlyViewed = () => {
    setItems([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  // For backward compatibility and ease of use
  const recentlyViewed = items.map(i => i.product);

  return { recentlyViewed, items, addToRecentlyViewed, clearRecentlyViewed };
}
