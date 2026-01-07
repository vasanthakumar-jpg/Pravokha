import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "@/core/context/AdminContext";
import { AdminSkeleton } from "@/feat/admin/components/AdminSkeleton";
import { Card, CardContent } from "@/ui/Card";
import { Button } from "@/ui/Button";
import { ArrowLeft, Plus } from "lucide-react";
import { supabase } from "@/infra/api/supabase";
import { useToast } from "@/shared/hook/use-toast";
import { useAuth } from "@/core/context/AuthContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/ui/AlertDialog";

// Unified Imports
import { useProductInventory } from "@/feat/products/hooks/useProductInventory";
import { ProductStats } from "@/feat/products/components/ProductStats";
import { ProductFilters } from "@/feat/products/components/ProductFilters";
import { ProductListTable } from "@/feat/products/components/ProductListTable";
import { ProductGridDisplay } from "@/feat/products/components/ProductGridDisplay";
import { ProductViewMode } from "@/feat/products/domain/types";

export default function AdminProducts() {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<ProductViewMode>("grid");

  // Global inventory hook
  const {
    filteredProducts,
    products,
    loading,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    statusFilter,
    setStatusFilter,
    refresh
  } = useProductInventory({ isAdmin: true });

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate("/auth");
    }
  }, [isAdmin, adminLoading, navigate]);

  const handleTogglePublish = async (productId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("products")
        .update({ published: !currentStatus })
        .eq("id", productId);

      if (error) throw error;

      toast({
        title: currentStatus ? "Product unpublished" : "Product published",
        description: currentStatus ? "Product is now in draft mode" : "Product is now live",
      });

      // Audit Log
      await supabase.from('audit_logs').insert({
        actor_id: user?.id,
        target_id: productId,
        target_type: 'product',
        action_type: 'product_update',
        severity: 'info',
        description: `Product ${productId} ${!currentStatus ? 'published' : 'unpublished'} by admin.`
      });

      refresh();
    } catch (error) {
      console.error("Error toggling publish status:", error);
      toast({ title: "Error", description: "Failed to update product status" });
    }
  };

  const confirmDelete = (productId: string) => {
    setProductToDelete(productId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;

    try {
      const { error } = await supabase.from("products").update({ deleted_at: new Date().toISOString() }).eq("id", productToDelete);
      if (error) throw error;

      toast({ title: "Product Deleted", description: "Product has been moved to trash" });
      refresh();
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({ title: "Error", description: "Failed to delete product", variant: "destructive" });
    } finally {
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  if (adminLoading || loading) {
    return <AdminSkeleton variant="grid" />;
  }

  if (!isAdmin) return null;

  // Stats calculations
  const totalProducts = products.length;
  const activeListings = products.filter((p) => p.published).length;
  const lowStockProducts = products.filter((p) => (p.stock_quantity || 0) > 0 && (p.stock_quantity || 0) < 10).length;
  const totalRevenue = products.reduce((sum, p) => sum + p.price, 0);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 flex flex-col gap-8 pb-10">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-xl border-border/40 bg-card/40 backdrop-blur-sm gap-2 font-bold text-xs"
              onClick={() => navigate("/admin")}
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Product inventory</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Manage global marketplace listings</p>
            </div>
          </div>
          <Button
            onClick={() => navigate("/admin/products/add")}
            className="w-full sm:w-auto h-10 rounded-xl bg-primary shadow-lg shadow-primary/20 font-bold text-xs"
          >
            <Plus className="h-4 w-4 mr-2" /> Add New Product
          </Button>
        </div>
      </div>

      <ProductStats
        total={totalProducts}
        active={activeListings}
        lowStock={lowStockProducts}
        revenue={totalRevenue}
        role="admin"
      />

      <Card>
        <CardContent className="p-4">
          <ProductFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            categoryFilter={categoryFilter}
            onCategoryFilterChange={setCategoryFilter}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        </CardContent>
      </Card>

      {viewMode === "list" ? (
        <Card className="overflow-hidden">
          <ProductListTable
            products={filteredProducts}
            onTogglePublish={handleTogglePublish}
            onDelete={confirmDelete}
            basePath="/admin/products"
          />
        </Card>
      ) : (
        <ProductGridDisplay
          products={filteredProducts}
          onTogglePublish={handleTogglePublish}
          onDelete={confirmDelete}
          basePath="/admin/products"
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will move the product to trash. This can be undone later from the audit logs if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProduct} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Helper component to load product image
function ProductImage({
  productId,
  title,
  size = "list",
}: {
  productId: string;
  title: string;
  size?: "list" | "grid";
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadImage = async () => {
      try {
        const { data, error } = await supabase
          .from("product_variants")
          .select("images")
          .eq("product_id", productId)
          .limit(1)
          .single();

        if (!error && data && data.images && data.images.length > 0) {
          setImageUrl(data.images[0]);
        }
      } catch (err) {
        console.error("Error loading image:", err);
      } finally {
        setLoading(false);
      }
    };

    loadImage();
  }, [productId]);

  if (size === "list") {
    if (loading) {
      return <div className="h-12 w-12 rounded-md bg-muted animate-pulse" />;
    }
    if (!imageUrl) {
      return (
        <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center">
          <Package className="h-5 w-5 text-muted-foreground" />
        </div>
      );
    }
    return <img src={imageUrl} alt={title} className="h-12 w-12 rounded-md object-cover" />;
  }

  // Grid size
  if (loading) {
    return <div className="w-full h-full bg-muted animate-pulse" />;
  }
  if (!imageUrl) {
    return (
      <div className="w-full h-full bg-muted flex items-center justify-center">
        <Package className="h-16 w-16 text-muted-foreground opacity-30" />
      </div>
    );
  }
  return <img src={imageUrl} alt={title} className="w-full h-full object-cover" />;
}

