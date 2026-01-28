import { useState, useEffect } from "react";
import { apiClient } from "@/infra/api/apiClient";
import { Product } from "@/data/products";

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/products');
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
        categorySlug: p.category?.slug,
        subcategory_id: p.subcategoryId,
        rating: parseFloat(p.rating) || 0,
        reviews: parseInt(p.reviews) || 0,
        sku: p.sku,
        sellerId: p.dealerId,
        featured: p.isFeatured || false,
        newArrival: p.isNew || false,
        variants: (p.variants || []).map((v: any) => ({
          id: v.id,
          colorName: v.colorName || 'Default',
          colorHex: v.colorHex || '#000',
          images: v.images && Array.isArray(v.images) && v.images.length > 0
            ? v.images
            : ['https://placehold.co/600x600/e2e8f0/64748b?text=No+Image'],
          sizes: (v.sizes || []).map((s: any) => ({
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
