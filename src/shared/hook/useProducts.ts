import { useState, useEffect } from "react";
import { supabase } from "@/infra/api/supabase";
import { Product, ProductVariant } from "@/data/products";

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProductsWithRetry();
  }, []);

  // Optimized fetchProducts with selective field queries and pagination
  const fetchProductsWithRetry = async (retryCount = 0) => {
    console.log(`[useProducts] Fetching products... (Attempt ${retryCount + 1})`);
    if (retryCount === 0) setLoading(true);

    try {
      // Create a promise that rejects after 15 seconds (reduced for faster retry)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out')), 15000)
      );

      // Optimized query: select only necessary fields and limit to 50 products
      const fetchPromise = supabase
        .from("products")
        .select(`
          id,
          seller_id,
          title,
          slug,
          description,
          price,
          discount_price,
          category,
          subcategory_id,
          rating,
          reviews,
          sku,
          is_featured,
          is_new,
          product_variants (
            id,
            color_name,
            color_hex,
            images,
            product_sizes (
              size,
              stock
            )
          )
        `)
        .eq("published", true)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(50); // Fetch only first 50 products

      const { data: productsData, error: productsError } = await Promise.race([
        fetchPromise,
        timeoutPromise
      ]) as any;

      if (productsError) throw productsError;

      console.log("[useProducts] Products fetched successfully:", productsData?.length);

      // Transform database structure to match Product interface with data sanitization
      const transformedProducts: Product[] = (productsData || []).map((p: any) => ({
        id: p.id,
        title: p.title || 'Untitled Product',
        slug: p.slug,
        description: p.description || 'No description available',
        price: parseFloat(p.price) || 0,
        discountPrice: p.discount_price ? (parseFloat(p.discount_price) || undefined) : undefined,
        category: p.category,
        subcategory_id: p.subcategory_id,
        rating: Math.min(5, Math.max(0, parseFloat(p.rating) || 4.5)),
        reviews: Math.max(0, parseInt(p.reviews) || 0),
        sku: p.sku,
        sellerId: p.seller_id,
        featured: p.is_featured || false,
        newArrival: p.is_new || false,
        variants: (p.product_variants || []).map((v: any) => ({
          id: v.id,
          colorName: v.color_name,
          colorHex: v.color_hex,
          // Validate images and provide fallback
          images: Array.isArray(v.images) && v.images.length > 0
            ? v.images
            : ['https://placehold.co/600x600/e2e8f0/64748b?text=No+Image'],
          sizes: (v.product_sizes || []).map((s: any) => ({
            size: s.size,
            stock: s.stock,
          })),
        })),
      }));

      setProducts(transformedProducts);
      setError(null);
      setLoading(false);
    } catch (err: any) {
      console.error(`Error fetching products (Attempt ${retryCount + 1}):`, err);

      if (retryCount < 2) {
        console.log(`[useProducts] Retrying in 1 second...`);
        setTimeout(() => {
          fetchProductsWithRetry(retryCount + 1);
        }, 1000);
      } else {
        setError(err.message || "Failed to load products after multiple attempts");
        setLoading(false);
      }
    }
  };

  return { products, loading, error, refetch: () => fetchProductsWithRetry() };
}
