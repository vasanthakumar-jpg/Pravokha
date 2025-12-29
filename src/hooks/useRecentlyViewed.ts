import { useState, useEffect } from 'react';
import { Product } from '@/data/products';

const STORAGE_KEY = 'pravokha_recently_viewed';
const MAX_ITEMS = 8;

export function useRecentlyViewed() {
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);

  useEffect(() => {
    loadRecentlyViewed();
  }, []);

  const loadRecentlyViewed = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setRecentlyViewed(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load recently viewed:', error);
    }
  };

  const addToRecentlyViewed = (product: Product) => {
    try {
      let updated = [product];
      const existing = recentlyViewed.filter(p => p.id !== product.id);
      updated = [...updated, ...existing].slice(0, MAX_ITEMS);
      
      setRecentlyViewed(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save recently viewed:', error);
    }
  };

  return { recentlyViewed, addToRecentlyViewed };
}
