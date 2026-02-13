import { useState, useEffect } from "react";
import { apiClient } from "@/infra/api/apiClient";
import { Product } from "@/data/products";

export interface ProductFilters {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
  minPrice?: number;
  maxPrice?: number;
  tag?: string;
  subcategory?: string;
  minDiscount?: number;
  minRating?: number;
  ids?: string;
}

export function useProducts(filters: ProductFilters = {}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Deep comparison or JSON stringify to avoid infinite loop if object reference changes
  const filterString = JSON.stringify(filters);

  useEffect(() => {
    fetchProducts();
  }, [filterString]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      // Build query params
      const params: any = {};
      if (filters.category) params.category = filters.category;
      if (filters.search) params.search = filters.search;
      if (filters.page) params.page = filters.page;
      if (filters.limit) params.limit = filters.limit;
      if (filters.sort) params.sort = filters.sort;
      if (filters.minPrice !== undefined) params.minPrice = filters.minPrice;
      if (filters.maxPrice !== undefined) params.maxPrice = filters.maxPrice;
      if (filters.tag) params.tag = filters.tag;
      if (filters.minRating !== undefined) params.minRating = filters.minRating;
      if (filters.ids) params.ids = filters.ids;
      // Subcategory isn't directly supported by backend yet as a param, logic might need adjustment if backend doesn't support 'subcategory' param.
      // Checking backend controller... it accepts 'category' (slug). 
      // If subcategory is passed, we might need to handle it. 
      // Current backend service: `where.category = { slug: filters.category };`
      // If we select a subcategory, we should probably pass its slug as 'category' param?
      // Or we need to update backend to support subcategory specific filtering.
      // For now, let's pass it if backend implementation updates or if we treat subcategory slug as category slug (which often works if slugs are unique).
      if (filters.subcategory) params.category = filters.subcategory; // Override category with subcategory slug

      const response = await apiClient.get('/products', { params });
      const productsData = response.data.products;

      // Transform database structure to match Product interface
      const transformedProducts: Product[] = (productsData || []).map((p: any) => ({
        id: p.id,
        title: p.title || 'Untitled Product',
        slug: p.slug,
        description: p.description || 'No description available',
        price: parseFloat(p.price) || 0,
        discountPrice: p.discountPrice ? parseFloat(p.discountPrice) : undefined,
        category: p.category?.name || p.category || 'Uncategorized',
        categorySlug: p.category?.slug || p.category_slug,
        subcategory_id: p.subcategoryId || p.subcategory_id,
        subcategoryName: p.subcategory?.name || p.subcategory_name,
        subcategorySlug: p.subcategory?.slug || p.subcategory_slug,
        rating: parseFloat(p.rating) || 0,
        reviews: parseInt(p.reviews) || 0,
        sku: p.sku,
        sellerId: p.dealerId || p.seller_id,
        variants: (p.variants || []).map((v: any) => ({
          id: v.id,
          colorName: v.colorName || v.color_name || 'Default',
          colorHex: v.colorHex || v.color_hex || '#000',
          images: (v.images && Array.isArray(v.images) && v.images.length > 0)
            ? v.images
            : (v.image_url ? [v.image_url] : ['https://placehold.co/600x600/e2e8f0/64748b?text=No+Image']),
          sizes: (v.sizes || v.product_sizes || []).map((s: any) => ({
            size: s.size || 'One Size',
            stock: parseInt(s.stock) || 0,
          })),
        })),
      }));

      setProducts(transformedProducts);
      setError(null);
    } catch (err: any) {
      console.error(`Error fetching products:`, err);
      setError(err.response?.data?.message || err.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  return { products, loading, error, refetch: fetchProducts };
}
