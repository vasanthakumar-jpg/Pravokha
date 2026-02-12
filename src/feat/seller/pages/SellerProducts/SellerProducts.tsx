import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/ui/Card";
import { Button } from "@/ui/Button";
import { Plus, ArrowLeft, Download, Upload } from "lucide-react";
import { apiClient } from "@/infra/api/apiClient";
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
  AlertDialogTitle,
} from "@/ui/AlertDialog";

// Unified Imports
import { useProductInventory } from "@/feat/products/hooks/useProductInventory";
import { useCategories } from "@/shared/hook/useCategories";
import { ProductStats } from "@/feat/products/components/ProductStats";
import { ProductFilters } from "@/feat/products/components/ProductFilters";
import { ProductListTable } from "@/feat/products/components/ProductListTable";
import { ProductGridDisplay } from "@/feat/products/components/ProductGridDisplay";
import { ProductViewMode } from "@/feat/products/domain/types";

// Seller specific items
import { useProfile } from "@/shared/hook/useProfile";

export default function SellerProducts() {
  const { user, role } = useAuth();
  const { profile } = useProfile(user?.id);
  const { categories } = useCategories();
  const isAdmin = role === 'ADMIN';
  const navigate = useNavigate();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<ProductViewMode>("grid");

  const verificationStatus = (profile as any)?.verificationStatus || (profile as any)?.verification_status;

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
  } = useProductInventory({ sellerId: user?.id });

  // UI state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get("bulk") === "true") {
      // Clean up the URL
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("bulk");
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleTogglePublish = async (productId: string, currentStatus: boolean) => {
    if (!isAdmin && verificationStatus !== 'verified' && !currentStatus) {
      toast({ title: "Verification Required", description: "You must be verified to publish products.", variant: "destructive" });
      return;
    }

    try {
      await apiClient.patch(`/products/${productId}`, { published: !currentStatus });

      toast({
        title: !currentStatus ? "Product Published" : "Product Unpublished",
        description: !currentStatus ? "Your product is now live." : "Your product is now a draft.",
      });
      refresh();
    } catch (error) {
      console.error("Error updating status:", error);
      toast({ title: "Error", description: "Failed to update product status", variant: "destructive" });
    }
  };

  const confirmDelete = (productId: string) => {
    setProductToDelete(productId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;

    try {
      await apiClient.delete(`/products/${productToDelete}`);

      toast({ title: "Product Deleted", description: "Product has been removed" });
      refresh();
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({ title: "Error", description: "Failed to delete product", variant: "destructive" });
    } finally {
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  const exportToCSV = () => {
    if (filteredProducts.length === 0) {
      toast({ title: "Export Failed", description: "No products to export.", variant: "destructive" });
      return;
    }
    const headers = ["Title", "Price", "Category", "Stock", "Status"];
    const csvContent = [headers.join(","), ...filteredProducts.map(p => [
      `"${p.title.replace(/"/g, '""')}"`, p.price, p.category, p.stock_quantity || 0,
      p.published ? "Published" : "Draft"
    ].join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `products_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex items-center gap-4 w-full lg:w-auto">
            <div className="h-9 w-20 bg-muted rounded-xl" />
            <div className="space-y-2">
              <div className="h-8 w-48 bg-muted rounded-lg" />
              <div className="h-4 w-32 bg-muted/60 rounded-lg" />
            </div>
          </div>
          <div className="flex gap-2 w-full lg:w-auto overflow-hidden">
            <div className="h-10 w-24 bg-muted rounded-xl" />
            <div className="h-10 w-24 bg-muted rounded-xl" />
            <div className="h-10 flex-1 sm:w-32 bg-muted rounded-xl" />
          </div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-muted/20 rounded-2xl border border-border/40 p-6 flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <div className="h-4 w-24 bg-muted/60 rounded" />
                <div className="h-9 w-9 bg-muted/40 rounded-xl" />
              </div>
              <div className="h-8 w-32 bg-muted/80 rounded" />
            </div>
          ))}
        </div>

        {/* Filter Bar Skeleton */}
        <div className="h-20 bg-muted/10 rounded-xl border border-border/40 p-4 flex gap-4">
          <div className="flex-1 h-10 bg-muted/40 rounded-lg" />
          <div className="h-10 w-32 bg-muted/40 rounded-lg" />
          <div className="h-10 w-32 bg-muted/40 rounded-lg" />
          <div className="h-10 w-24 bg-muted/40 rounded-lg" />
        </div>

        {/* Grid Display Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-80 bg-muted/10 rounded-2xl border border-border/40" />
          ))}
        </div>
      </div>
    );
  }

  // Stats calculations
  const totalProducts = products.length;
  const activeListings = products.filter((p) => p.published).length;
  const lowStockProducts = products.filter((p) => (p.stock_quantity || 0) > 0 && (p.stock_quantity || 0) < 10).length;
  const totalRevenue = products.reduce((sum, p) => sum + p.price, 0);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 flex flex-col gap-8 pb-10">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex items-center gap-4 w-full lg:w-auto">
            <Button
              variant="outline"
              size="sm"
              className="h-9 w-9 sm:w-auto sm:px-3 rounded-xl border-border/40 bg-card/40 backdrop-blur-sm gap-2 font-bold text-xs shrink-0"
              onClick={() => navigate("/seller")}
            >
              <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Back</span>
            </Button>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold truncate">My Products</h1>
              <p className="text-sm text-muted-foreground mt-0.5 truncate">Manage your store inventory</p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
            <Button variant="outline" size="sm" onClick={exportToCSV} className="flex-none h-10 rounded-xl gap-2 font-bold text-xs px-3 sm:px-4">
              <Download className="h-4 w-4" /> Export
            </Button>
            <Button
              type="button"
              onClick={() => navigate("/seller/products/add")}
              className="flex-1 sm:flex-none h-10 rounded-xl bg-primary shadow-lg shadow-primary/20 font-bold text-xs px-3 sm:px-4"
              disabled={!isAdmin && verificationStatus !== 'verified'}
            >
              <Plus className="h-4 w-4 mr-2" /> <span className="whitespace-nowrap">Add Product</span>
            </Button>
          </div>
        </div>
      </div>

      <ProductStats
        total={totalProducts}
        active={activeListings}
        lowStock={lowStockProducts}
        revenue={totalRevenue}
        role="seller"
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
            categories={categories}
          />
        </CardContent>
      </Card>

      {viewMode === "list" ? (
        <Card className="overflow-hidden">
          <ProductListTable
            products={filteredProducts}
            onTogglePublish={handleTogglePublish}
            onDelete={confirmDelete}
            basePath="/seller/products"
          />
        </Card>
      ) : (
        <ProductGridDisplay
          products={filteredProducts}
          onTogglePublish={handleTogglePublish}
          onDelete={confirmDelete}
          basePath="/seller/products"
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the product from your store.
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
