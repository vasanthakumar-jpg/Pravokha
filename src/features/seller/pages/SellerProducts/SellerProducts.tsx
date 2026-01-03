import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Package,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  XCircle,
  LayoutGrid,
  List,
  Download,
  Upload,
  Database
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/DropdownMenu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/Tooltip";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/AlertDialog";
import { QuickStockModal } from "@/features/seller/components/QuickStockModal";
import { BulkUploadModal } from "@/features/seller/components/BulkUploadModal";

interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  stock_quantity?: number;
  category: string;
  colors?: any[];
  sizes?: string[];
  published: boolean;
  created_at: string;
  is_featured?: boolean;
  is_new?: boolean;
}

export default function SellerProducts() {
  const { user, verificationStatus, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");

  useEffect(() => {
    if (!authLoading && user && role === 'seller') {
      fetchProducts();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [authLoading, user, role]);

  useEffect(() => {
    filterProducts();
  }, [products, searchQuery, categoryFilter, statusFilter]);

  const fetchProducts = async (retryCount = 0) => {
    if (!user) return;

    try {
      if (retryCount === 0) setLoading(true);

      const { data: productsData, error } = await (supabase as any)
        .from("products")
        .select(`
          id,
          title,
          slug,
          description,
          price,
          category,
          published,
          created_at,
          is_featured,
          is_new,
          product_variants (
            product_sizes (
              stock
            )
          )
        `)
        .eq("seller_id", user.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const transformedProducts: Product[] = (productsData || []).map((product: any) => {
        const totalStock = product.product_variants?.reduce((sum: number, variant: any) => {
          const variantStock = variant.product_sizes?.reduce((s: number, size: any) => s + (size.stock || 0), 0) || 0;
          return sum + variantStock;
        }, 0) || 0;

        return {
          id: product.id,
          title: product.title,
          slug: product.slug,
          description: product.description,
          price: product.price,
          category: product.category,
          published: product.published,
          created_at: product.created_at,
          stock_quantity: totalStock,
          is_featured: product.is_featured,
          is_new: product.is_new,
        };
      });

      setProducts(transformedProducts);
      setLoading(false);
    } catch (error: any) {
      console.error("Error fetching products:", error);
      if (retryCount < 2) {
        setTimeout(() => fetchProducts(retryCount + 1), 2000);
      } else {
        toast({
          title: "Error",
          description: "Failed to load products. Please check your connection.",
          variant: "destructive",
        });
        setLoading(false);
      }
    }
  };

  const filterProducts = () => {
    let filtered = [...products];
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
      );
    }
    if (categoryFilter !== "all") {
      filtered = filtered.filter(p => p.category === categoryFilter);
    }
    if (statusFilter !== "all") {
      if (statusFilter === "published") filtered = filtered.filter(p => p.published);
      else if (statusFilter === "draft") filtered = filtered.filter(p => !p.published);
      else if (statusFilter === "low_stock") filtered = filtered.filter(p => (p.stock_quantity || 0) < 10 && (p.stock_quantity || 0) > 0);
      else if (statusFilter === "out_of_stock") filtered = filtered.filter(p => (p.stock_quantity || 0) === 0);
    }
    setFilteredProducts(filtered);
  };

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [deletionReason, setDeletionReason] = useState("");
  const deleteTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const deletedProductRef = useRef<Product | null>(null);

  const [quickStockProduct, setQuickStockProduct] = useState<Product | null>(null);
  const [quickStockOpen, setQuickStockOpen] = useState(false);
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);

  useEffect(() => {
    return () => {
      if (deleteTimeoutRef.current) clearTimeout(deleteTimeoutRef.current);
    };
  }, []);

  const confirmDelete = (productId: string) => {
    setProductToDelete(productId);
    setDeletionReason("");
    setDeleteDialogOpen(true);
  };

  const undoDelete = () => {
    if (deleteTimeoutRef.current) {
      clearTimeout(deleteTimeoutRef.current);
      deleteTimeoutRef.current = null;
    }
    if (deletedProductRef.current) {
      setProducts(prev => [deletedProductRef.current!, ...prev]);
      deletedProductRef.current = null;
      toast({ title: "Deletion Cancelled", description: "The product has been restored." });
    }
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    const product = products.find(p => p.id === productToDelete);
    if (!product) return;

    setDeleteDialogOpen(false);
    const currentReason = deletionReason;
    setDeletionReason("");
    setProductToDelete(null);

    deletedProductRef.current = product;
    setProducts(prev => prev.filter(p => p.id !== product.id));

    toast({
      title: "Product Deleted",
      description: "Undo to restore within 5 seconds",
      action: (<Button variant="outline" size="sm" onClick={undoDelete}>Undo</Button>),
      duration: 5000,
    });

    deleteTimeoutRef.current = setTimeout(async () => {
      try {
        await supabase.from('products').update({ deletion_reason: currentReason }).eq('id', product.id);
        const { error } = await supabase.from('products').update({
          deleted_at: new Date().toISOString(),
          published: false
        }).eq('id', product.id);

        if (error) throw error;

        await supabase.from('audit_logs').insert({
          actor_id: user?.id,
          target_id: product.id,
          target_type: 'product',
          action_type: 'product_deletion',
          severity: 'warning',
          description: `Product "${product.title}" (${product.id}) deleted. Reason: ${currentReason || 'N/A'}`,
          metadata: { reason: currentReason, product_title: product.title }
        });
        deletedProductRef.current = null;
      } catch (error) {
        console.error("Error deleting product:", error);
        setProducts(prev => [product, ...prev]);
        toast({ title: "Error", description: "Failed to delete product permanently", variant: "destructive" });
      }
    }, 5000);
  };

  const handleTogglePublish = async (productId: string, currentStatus: boolean) => {
    if (verificationStatus !== 'verified' && !currentStatus) {
      toast({ title: "Verification Required", description: "You must be verified to publish products.", variant: "destructive" });
      return;
    }

    try {
      const { error } = await supabase.from('products').update({ published: !currentStatus }).eq('id', productId);
      if (error) throw error;

      setProducts(products.map(p => p.id === productId ? { ...p, published: !currentStatus } : p));
      toast({
        title: !currentStatus ? "Product Published" : "Product Unpublished",
        description: !currentStatus ? "Your product is now live." : "Your product is now a draft.",
      });
    } catch (error) {
      console.error("Error updating status:", error);
      toast({ title: "Error", description: "Failed to update product status", variant: "destructive" });
    }
  };

  const getStockStatus = (stock: number = 0) => {
    if (stock === 0) return { label: "Out of Stock", color: "text-rose-600" };
    if (stock < 10) return { label: "Low Stock", color: "text-amber-600" };
    return { label: "In Stock", color: "text-emerald-600" };
  };

  const stats = {
    total: products.length,
    active: products.filter(p => p.published).length,
    lowStock: products.filter(p => (p.stock_quantity || 0) < 10).length,
    revenue: products.reduce((acc, p) => acc + (p.price * 5), 0)
  };

  const exportToCSV = () => {
    if (filteredProducts.length === 0) {
      toast({ title: "Export Failed", description: "No products to export.", variant: "destructive" });
      return;
    }
    const headers = ["Title", "Price", "Category", "Stock", "Status", "Description"];
    const csvContent = [headers.join(","), ...filteredProducts.map(p => [
      `"${p.title.replace(/"/g, '""')}"`, p.price, p.category, p.stock_quantity || 0,
      p.published ? "Published" : "Draft", `"${(p.description || "").replace(/"/g, '""')}"`
    ].join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `products_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast({ title: "Export Successful", description: `Exported ${filteredProducts.length} products to CSV.` });
  };

  return (
    <div className="container py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-8 max-w-7xl">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Products</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Manage your product inventory</p>
        </div>

        <div className="flex flex-row items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            className="flex-1 sm:flex-none h-10 rounded-xl border-border/40 bg-card/40 backdrop-blur-sm px-4 gap-2"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setBulkUploadOpen(true)}
            disabled={verificationStatus !== 'verified'}
            className="flex-1 sm:flex-none h-10 rounded-xl border-border/40 bg-card/40 backdrop-blur-sm px-4 gap-2"
          >
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Bulk</span>
          </Button>
          <Button
            onClick={() => navigate("/seller/products/add")}
            disabled={verificationStatus !== 'verified'}
            className="flex-[2] sm:flex-none shadow-lg h-10 rounded-xl bg-[#146B6B] hover:bg-[#0E4D4D] text-white font-bold px-4 gap-2"
          >
            <Plus className="h-4 w-4" />
            <span className="text-xs sm:text-sm">Add Product</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards - Updated to match Image 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Products", value: stats.total, icon: Package, color: "text-white", bg: "bg-rose-500", trend: "+0% from last period" },
          { label: "Active Listings", value: stats.active, icon: CheckCircle2, color: "text-white", bg: "bg-emerald-500", trend: "+0% from last period" },
          { label: "Low Stock", value: stats.lowStock, icon: AlertCircle, color: "text-white", bg: "bg-blue-500", trend: "0% from last period" },
          { label: "Total Revenue", value: `₹${stats.revenue.toLocaleString()}`, icon: Database, color: "text-white", bg: "bg-purple-500", trend: "+0% from last period" }
        ].map((stat, i) => (
          <Card key={i} className="border-border/40 shadow-sm overflow-hidden group hover:shadow-md transition-all rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                    {stat.label}
                  </p>
                  <div className="space-y-1">
                    <p className="text-2xl font-black text-foreground">{stat.value}</p>
                    <p className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                      <Plus className="h-2 w-2" /> {stat.trend}
                    </p>
                  </div>
                </div>
                <div className={cn("p-3 rounded-2xl shrink-0 transition-transform group-hover:scale-110 shadow-lg", stat.bg)}>
                  <stat.icon className={cn("h-5 w-5", stat.color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters and Search */}
      <Card className="mb-6 border-border/40 shadow-sm overflow-hidden bg-card/40 backdrop-blur-md">
        <CardContent className="p-3 sm:p-4 lg:p-6">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 rounded-xl"
                />
              </div>
              <div className="hidden sm:flex border rounded-xl overflow-hidden bg-muted/20">
                <Button variant={viewMode === "list" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("list")} className="rounded-none h-10 px-4">
                  <List className="h-4 w-4" />
                </Button>
                <Button variant={viewMode === "grid" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("grid")} className="rounded-none h-10 px-4">
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-[160px] h-10 rounded-xl">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {/* ... other items can be added dynamically ... */}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[130px] h-10 rounded-xl">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="low_stock">Low Stock</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex sm:hidden w-full border rounded-xl overflow-hidden bg-muted/20 mt-1">
                <Button variant={viewMode === "list" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("list")} className="flex-1 rounded-none h-10">
                  <List className="h-4 w-4 mr-2" /> List
                </Button>
                <Button variant={viewMode === "grid" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("grid")} className="flex-1 rounded-none h-10">
                  <LayoutGrid className="h-4 w-4 mr-2" /> Grid
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products View */}
      <div className="space-y-4">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="aspect-square animate-pulse bg-muted/20 rounded-2xl" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12 bg-card/40 border-2 border-dashed border-border/40 rounded-3xl">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium text-muted-foreground">No products found</p>
          </div>
        ) : viewMode === "list" ? (
          <div className="space-y-4">
            {/* Desktop Table */}
            <Card className="hidden lg:block overflow-hidden border-border/40 shadow-sm rounded-2xl">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="w-[80px] pl-6">Image</TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-center">Price</TableHead>
                    <TableHead className="text-center">Stock</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map(product => (
                    <TableRow key={product.id} className="group hover:bg-muted/20">
                      <TableCell className="pl-6">
                        <ProductImage productId={product.id} title={product.title} size="list" />
                      </TableCell>
                      <TableCell className="font-bold">{product.title}</TableCell>
                      <TableCell className="capitalize">{product.category.replace(/-/g, ' ')}</TableCell>
                      <TableCell className="text-center font-bold">₹{product.price.toLocaleString()}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                          <span className="font-bold">{product.stock_quantity}</span>
                          <span className={cn("text-[10px] font-bold uppercase", getStockStatus(product.stock_quantity).color)}>
                            {getStockStatus(product.stock_quantity).label}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={product.published ? "default" : "outline"} className={cn(product.published && "bg-emerald-500 hover:bg-emerald-600")}>
                          {product.published ? "Live" : "Draft"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <ProductActions
                          product={product}
                          fetchProducts={fetchProducts}
                          handleTogglePublish={handleTogglePublish}
                          confirmDelete={confirmDelete}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>

            {/* Mobile Card List */}
            <div className="lg:hidden grid grid-cols-1 gap-3">
              {filteredProducts.map(product => (
                <Card key={product.id} className="overflow-hidden border-border/40 shadow-sm rounded-2xl">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="h-20 w-20 shrink-0 bg-muted rounded-xl overflow-hidden border border-border/20">
                        <ProductImage productId={product.id} title={product.title} size="grid" />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-bold text-sm line-clamp-2">{product.title}</h4>
                          <ProductActions
                            product={product}
                            fetchProducts={fetchProducts}
                            handleTogglePublish={handleTogglePublish}
                            confirmDelete={confirmDelete}
                          />
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <p className="font-black text-[#146B6B]">₹{product.price.toLocaleString()}</p>
                          <Badge className="text-[10px] h-5 px-1.5 uppercase font-bold" variant={product.published ? "default" : "secondary"}>
                            {product.published ? "Live" : "Draft"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          /* Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredProducts.map(product => {
              const stockStatus = getStockStatus(product.stock_quantity);
              return (
                <Card key={product.id} className="group overflow-hidden border-border/40 shadow-sm hover:shadow-md transition-all rounded-3xl">
                  <div className="relative aspect-square bg-muted">
                    <ProductImage productId={product.id} title={product.title} size="grid" />
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                      {product.published && (
                        <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-0 text-[10px] h-5 px-2">LIVE</Badge>
                      )}
                      <Badge variant="outline" className={cn("bg-white/90 backdrop-blur-sm border-0 text-[10px] h-5 px-2", stockStatus.color)}>
                        {stockStatus.label}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-bold text-sm line-clamp-1 mb-3">{product.title}</h3>
                    <div className="flex items-center justify-between">
                      <p className="font-black text-lg text-foreground">₹{product.price.toLocaleString()}</p>
                      <div className="flex items-center gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => navigate(`/seller/products/edit/${product.id}`)}>
                              <Edit className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => handleTogglePublish(product.id, product.published)}>
                              {product.published ? <Eye className="h-4 w-4 text-emerald-500" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{product.published ? "Unpublish" : "Publish"}</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {quickStockProduct && (
        <QuickStockModal
          product={quickStockProduct}
          isOpen={quickStockOpen}
          onClose={() => { setQuickStockOpen(false); setQuickStockProduct(null); }}
          onSuccess={fetchProducts}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{products.find(p => p.id === productToDelete)?.title}"? This action can be undone for 5 seconds.
            </AlertDialogDescription>
            <div className="mt-4">
              <Input
                placeholder="Reason for deletion (optional)"
                value={deletionReason}
                onChange={(e) => setDeletionReason(e.target.value)}
              />
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProduct} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BulkUploadModal
        isOpen={bulkUploadOpen}
        onClose={() => setBulkUploadOpen(false)}
        onSuccess={fetchProducts}
        userId={user?.id || ''}
      />
    </div>
  );
}

function ProductImage({ productId, title, size = "list" }: { productId: string; title: string; size?: "list" | "grid" }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadImage = async () => {
      try {
        const { data, error } = await supabase
          .from('product_variants')
          .select('images')
          .eq('product_id', productId)
          .limit(1)
          .maybeSingle();

        if (isMounted && !error && data?.images?.[0]) {
          setImageUrl(data.images[0]);
        }
      } catch (err) {
        console.error('Error image:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadImage();
    return () => { isMounted = false; };
  }, [productId]);

  const containerClass = size === "grid" ? "w-full h-full" : "h-10 w-10";
  if (loading) return <div className={cn(containerClass, "bg-muted animate-pulse rounded-lg")} />;
  if (!imageUrl) return (
    <div className={cn(containerClass, "bg-muted flex items-center justify-center rounded-lg")}>
      <Package className="h-5 w-5 text-muted-foreground/40" />
    </div>
  );

  return (
    <img src={imageUrl} alt={title} className={cn(containerClass, "object-cover rounded-lg border border-border/20")} />
  );
}

function ProductActions({ product, fetchProducts, handleTogglePublish, confirmDelete }: {
  product: any;
  fetchProducts: () => void;
  handleTogglePublish: (id: string, current: boolean) => void;
  confirmDelete: (id: string) => void;
}) {
  const navigate = useNavigate();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted rounded-full">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 rounded-xl p-1 shadow-lg border-border/40">
        <DropdownMenuItem onClick={() => navigate(`/product/${product.slug}`)} className="gap-2 cursor-pointer rounded-lg">
          <Eye className="h-4 w-4" /> Live View
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate(`/seller/products/edit/${product.id}`)} className="gap-2 cursor-pointer rounded-lg">
          <Edit className="h-4 w-4" /> Edit Details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleTogglePublish(product.id, product.published)} className="gap-2 cursor-pointer rounded-lg">
          {product.published ? <EyeOff className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          {product.published ? "Unpublish" : "Publish Now"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => confirmDelete(product.id)} className="gap-2 cursor-pointer rounded-lg text-rose-600 focus:text-rose-600 focus:bg-rose-50">
          <Trash2 className="h-4 w-4" /> Delete Item
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
