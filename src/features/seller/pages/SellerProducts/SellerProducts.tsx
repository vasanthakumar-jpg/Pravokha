import { useEffect, useState, useRef } from "react";


import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
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
  Lock as LockIcon,
  Download,
  Upload,
  FileSpreadsheet
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
  product_variants?: any[];
  is_featured?: boolean;
  is_new?: boolean;
}

export default function SellerProducts() {
  const { user, verificationStatus } = useAuth();
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
    fetchProducts();
  }, [user]);

  useEffect(() => {
    filterProducts();
  }, [products, searchQuery, categoryFilter, statusFilter]);

  const fetchProducts = async () => {
    if (!user) return;

    try {
      let productsData: any[] = [];

      const productsResult: any = await (supabase as any)
        .from("products")
        .select("*, product_variants(product_sizes(stock))")
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false });

      productsData = productsResult.data || [];

      if (productsResult.error) throw productsResult.error;

      const transformedProducts: Product[] = productsData.map((product: any) => {
        // Calculate total stock from variants -> sizes
        const totalStock = product.product_variants?.reduce((sum: number, variant: any) => {
          const variantStock = variant.product_sizes?.reduce((s: number, size: any) => s + (size.stock || 0), 0) || 0;
          return sum + variantStock;
        }, 0) || 0;

        const colors = ["Black", "White"];
        const sizes = ["S", "M", "L", "XL", "XXL", "XXXL"];

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
          colors,
          sizes,
          is_featured: product.is_featured, // Assuming these fields exist in your DB
          is_new: product.is_new, // Assuming these fields exist in your DB
        };
      });

      setProducts(transformedProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
      if (statusFilter === "published") {
        filtered = filtered.filter(p => p.published);
      } else if (statusFilter === "draft") {
        filtered = filtered.filter(p => !p.published);
      } else if (statusFilter === "low_stock") {
        filtered = filtered.filter(p => (p.stock_quantity || 0) < 10 && (p.stock_quantity || 0) > 0);
      } else if (statusFilter === "out_of_stock") {
        filtered = filtered.filter(p => (p.stock_quantity || 0) === 0);
      }
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

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (deleteTimeoutRef.current) {
        clearTimeout(deleteTimeoutRef.current);
      }
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
      toast({
        title: "Deletion Cancelled",
        description: "The product has been restored.",
      });
    }
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;

    const product = products.find(p => p.id === productToDelete);
    if (!product) return;

    // Close dialog immediately
    setDeleteDialogOpen(false);
    const currentReason = deletionReason;
    setDeletionReason("");
    setProductToDelete(null);

    // Optimistic update
    deletedProductRef.current = product;
    setProducts(prev => prev.filter(p => p.id !== product.id));

    toast({
      title: "Product Deleted",
      description: "Undo to restore within 5 seconds",
      action: (
        <Button variant="outline" size="sm" onClick={undoDelete}>
          Undo
        </Button>
      ),
      duration: 5000,
    });

    // Delayed permanent delete
    deleteTimeoutRef.current = setTimeout(async () => {
      try {
        // First update the deletion reason for the audit trail
        await supabase
          .from('products')
          .update({ deletion_reason: currentReason })
          .eq('id', product.id);

        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', product.id);

        if (error) {
          throw error;
        }

        // Audit Logging
        await supabase.from('audit_logs').insert({
          actor_id: user.id,
          target_id: product.id,
          target_type: 'product',
          action_type: 'product_deletion',
          severity: 'warning',
          description: `Product "${product.title}" (${product.id}) deleted. Reason: ${currentReason || 'N/A'}`,
          metadata: { reason: currentReason, product_title: product.title }
        });

        // Success - no need to do anything as it's already removed from UI
        deletedProductRef.current = null;
      } catch (error: any) {
        console.error("Error deleting product:", error);
        // Revert optimistic update on error
        setProducts(prev => [product, ...prev]);
        toast({
          title: "Error",
          description: "Failed to delete product permanently",
          variant: "destructive",
        });
      }
    }, 5000);
  };

  const handleTogglePublish = async (productId: string, currentStatus: boolean) => {
    if (verificationStatus !== 'verified' && !currentStatus) {
      toast({
        title: "Verification Required",
        description: "You must be verified to publish products.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('products')
        .update({ published: !currentStatus })
        .eq('id', productId);

      if (error) throw error;

      setProducts(products.map(p =>
        p.id === productId ? { ...p, published: !currentStatus } : p
      ));

      toast({
        title: !currentStatus ? "Product Published" : "Product Unpublished",
        description: !currentStatus ? "Your product is now live." : "Your product is now a draft.",
      });
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update product status",
        variant: "destructive",
      });
    }
  };

  // ... inside render ...



  const getStockStatus = (stock: number = 0) => {
    if (stock === 0) return { label: "Out of Stock", color: "bg-rose-500/10 text-rose-600 border-rose-500/20" };
    if (stock < 10) return { label: "Low Stock", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" };
    return { label: "In Stock", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" };
  };

  const stats = {
    total: products.length,
    active: products.filter(p => p.published).length,
    lowStock: products.filter(p => (p.stock_quantity || 0) < 10).length,
    revenue: products.reduce((acc, p) => acc + (p.price * 5), 0) // Placeholder revenue
  };

  const exportToCSV = () => {
    if (filteredProducts.length === 0) {
      toast({
        title: "Export Failed",
        description: "No products to export.",
        variant: "destructive",
      });
      return;
    }

    const headers = ["Title", "Price", "Category", "Stock", "Status", "Description"];
    const csvRows = [
      headers.join(","),
      ...filteredProducts.map(p => [
        `"${p.title.replace(/"/g, '""')}"`,
        p.price,
        p.category,
        p.stock_quantity || 0,
        p.published ? "Published" : "Draft",
        `"${(p.description || "").replace(/"/g, '""')}"`
      ].join(","))
    ];

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `products_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Successful",
      description: `Exported ${filteredProducts.length} products to CSV.`,
    });
  };

  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);

  return (
    <div className="container py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-8 max-w-7xl">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="responsive-h1">Products</h1>
          <p className="responsive-body text-muted-foreground mt-1">Manage your product inventory</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            className="hidden sm:flex items-center gap-2 h-9 sm:h-10 rounded-xl"
          >
            <Download className="h-4 w-4" />
            <span className="hidden lg:inline">Export All</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setBulkUploadOpen(true)}
            disabled={verificationStatus !== 'verified'}
            className="flex items-center gap-2 h-9 sm:h-10 rounded-xl"
          >
            <Upload className="h-4 w-4" />
            <span className="hidden lg:inline">Bulk Upload</span>
          </Button>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => navigate("/seller/products/add")}
                disabled={verificationStatus !== 'verified'}
                className="flex-1 sm:flex-none shadow-lg hover:shadow-xl transition-all h-9 sm:h-10 rounded-xl bg-[#146B6B] hover:bg-[#0E4D4D] text-white"
              >
                {verificationStatus !== 'verified' && <LockIcon className="h-4 w-4 mr-2" />}
                {verificationStatus === 'verified' ? <Plus className="h-4 w-4 mr-2" /> : null}
                Add new product
              </Button>
            </TooltipTrigger>
            {verificationStatus !== 'verified' && (
              <TooltipContent>
                <p>Verify your account to add products</p>
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </div>

      {/* Stats Cards - 2 cols on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <Card>
          <CardContent className="p-4 sm:p-6 flex items-center justify-between">
            <div>
              <p className="responsive-label text-muted-foreground">Total products</p>
              <h3 className="responsive-h1 mt-1 sm:mt-2">{stats.total}</h3>
            </div>
            <div className="h-8 w-8 sm:h-10 sm:w-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
              <Package className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6 flex items-center justify-between">
            <div>
              <p className="responsive-label text-muted-foreground">Active listings</p>
              <h3 className="responsive-h1 mt-1 sm:mt-2">{stats.active}</h3>
            </div>
            <div className="h-8 w-8 sm:h-10 sm:w-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6 flex items-center justify-between">
            <div>
              <p className="responsive-label text-muted-foreground">Low stock</p>
              <h3 className="responsive-h1 mt-1 sm:mt-2">{stats.lowStock}</h3>
            </div>
            <div className="h-8 w-8 sm:h-10 sm:w-10 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6 flex items-center justify-between">
            <div>
              <p className="responsive-label text-muted-foreground">Total revenue</p>
              <h3 className="responsive-h1 mt-1 sm:mt-2">₹{stats.revenue.toLocaleString()}</h3>
            </div>
            <div className="h-8 w-8 sm:h-10 sm:w-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
              <Package className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="p-3 sm:p-4 lg:p-6">
          <div className="flex flex-col gap-3">
            {/* Row 1: Search + View Toggle on larger screens */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>

              {/* View Toggle - Desktop/Tablet */}
              <div className="hidden sm:flex">
                <div className="flex border rounded-lg overflow-hidden">
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className="rounded-none px-3 h-10"
                  >
                    <List className="h-4 w-4" />
                    <span className="ml-2 hidden md:inline">List</span>
                  </Button>
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className="rounded-none px-3 h-10"
                  >
                    <LayoutGrid className="h-4 w-4" />
                    <span className="ml-2 hidden md:inline">Grid</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Row 2: Filters */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
              {/* Category Filter */}
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <Filter className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                  <span className="truncate text-sm">
                    <SelectValue placeholder="Category" />
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="mens-tshirts">Men's T-Shirts</SelectItem>
                  <SelectItem value="mens-track-pants">Men's Track Pants</SelectItem>
                  <SelectItem value="mens-shorts">Men's Shorts</SelectItem>
                  <SelectItem value="womens-tshirts">Women's T-Shirts</SelectItem>
                  <SelectItem value="womens-track-pants">Women's Track Pants</SelectItem>
                  <SelectItem value="womens-shorts">Women's Shorts</SelectItem>
                  <SelectItem value="kids-tshirts">Kids T-Shirts</SelectItem>
                  <SelectItem value="kids-track-pants">Kids Track Pants</SelectItem>
                  <SelectItem value="kids-shorts">Kids Shorts</SelectItem>
                </SelectContent>
              </Select>

              {/* Low Stock Quick-Filter Toggle */}
              <Button
                variant={statusFilter === "low_stock" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(statusFilter === "low_stock" ? "all" : "low_stock")}
                className={cn(
                  "h-10 px-3 rounded-xl gap-2",
                  statusFilter === "low_stock" ? "bg-amber-500 hover:bg-amber-600 border-transparent text-white" : "border-border/40"
                )}
              >
                <AlertCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Low Stock</span>
              </Button>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[130px] h-10 px-3 rounded-xl">
                  <span className="truncate responsive-body font-semibold">
                    <SelectValue placeholder="Status" />
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="low_stock">Low Stock</SelectItem>
                  <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* View Toggle - Mobile */}
            <div className="flex sm:hidden justify-end pt-1">
              <div className="inline-flex border rounded-lg overflow-hidden bg-muted/50">
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-none px-3 h-8 text-xs gap-1"
                >
                  <List className="h-3.5 w-3.5" />
                  List
                </Button>
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-none px-3 h-8 text-xs gap-1"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  Grid
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products List View */}
      {viewMode === "list" && (
        <Card className="overflow-hidden border-0 shadow-md">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[80px] pr-0">Image</TableHead>
                  <TableHead className="w-[280px] responsive-label">Product details</TableHead>
                  <TableHead className="w-[140px] responsive-label font-semibold">Category</TableHead>
                  <TableHead className="w-[100px] responsive-label">Price</TableHead>
                  <TableHead className="w-[100px] responsive-label">Stock</TableHead>
                  <TableHead className="w-[100px] responsive-label">Status</TableHead>
                  <TableHead className="w-[100px] responsive-label text-right pr-8">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="w-[80px]"><div className="h-12 w-12 bg-muted/40 rounded-xl animate-pulse" /></TableCell>
                      <TableCell className="w-[280px]">
                        <div className="space-y-2">
                          <div className="h-4 w-32 bg-muted rounded" />
                          <div className="h-3 w-48 bg-muted/60 rounded" />
                        </div>
                      </TableCell>
                      <TableCell className="w-[140px]"><div className="h-6 w-24 bg-muted/50 rounded-lg animate-pulse" /></TableCell>
                      <TableCell className="w-[100px]"><div className="h-5 w-16 bg-muted rounded animate-pulse" /></TableCell>
                      <TableCell className="w-[100px]">
                        <div className="space-y-1">
                          <div className="h-3 w-10 bg-muted rounded" />
                          <div className="h-5 w-14 bg-muted/40 rounded-full" />
                        </div>
                      </TableCell>
                      <TableCell className="w-[100px]"><div className="h-6 w-20 bg-muted/60 rounded-full animate-pulse" /></TableCell>
                      <TableCell className="text-right w-[100px]"><div className="h-9 w-9 bg-muted/40 rounded-xl animate-pulse ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) :
                  filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-64 text-center">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <Package className="h-12 w-12 mb-4 opacity-20" />
                          <p className="text-lg font-medium">No products found</p>
                          <p className="text-sm">Try adjusting your filters or add a new product.</p>
                          <Button variant="link" onClick={() => { setSearchQuery(""); setCategoryFilter("all"); setStatusFilter("all"); }} className="mt-2">
                            Clear Filters
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((product) => {
                      const stockStatus = getStockStatus(product.stock_quantity);
                      return (
                        <TableRow key={product.id} className="group hover:bg-muted/30 transition-colors">
                          <TableCell className="w-[80px]">
                            <ProductImage productId={product.id} title={product.title} />
                          </TableCell>
                          <TableCell className="w-[280px]">
                            <div>
                              <p className="responsive-body font-semibold group-hover:text-primary transition-colors">{product.title}</p>
                              <p className="responsive-small text-muted-foreground line-clamp-1 max-w-[200px] mt-0.5">{product.description}</p>
                            </div>
                          </TableCell>
                          <TableCell className="w-[140px]">
                            <Badge variant="outline" className="capitalize font-normal">
                              {product.category.replace(/-/g, ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="w-[100px] font-medium">₹{product.price.toLocaleString()}</TableCell>
                          <TableCell className="w-[100px]">
                            <div className="flex flex-col gap-1">
                              <span className="responsive-body font-semibold">{product.stock_quantity} units</span>
                              <Badge variant="outline" className={cn("w-fit responsive-label px-1.5 py-0 border-transparent", stockStatus.color)}>
                                {stockStatus.label}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={product.published ? "default" : "secondary"} className={product.published ? "bg-green-600 hover:bg-green-700" : ""}>
                              {product.published ? "Published" : "Draft"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => navigate(`/product/${product.slug}`)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Live
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigate(`/seller/products/edit/${product.id}`)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Product
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setQuickStockProduct(product); setQuickStockOpen(true); }}>
                                  <Package className="h-4 w-4 mr-2" />
                                  Quick Stock
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleTogglePublish(product.id, product.published)}>
                                  {product.published ? (
                                    <>
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Unpublish
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle2 className="h-4 w-4 mr-2" />
                                      Publish
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => confirmDelete(product.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Products Grid View */}
      {viewMode === "grid" && (
        <div className="mt-2">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="rounded-3xl border-border/40 overflow-hidden">
                  <div className="aspect-square bg-muted/20 animate-pulse" />
                  <CardContent className="p-5 space-y-4">
                    <div className="h-5 w-3/4 bg-muted rounded" />
                    <div className="space-y-2">
                      <div className="h-4 w-full bg-muted/60 rounded" />
                      <div className="h-4 w-1/2 bg-muted/60 rounded" />
                    </div>
                    <div className="flex gap-2">
                      <div className="h-9 flex-1 bg-muted/40 rounded-xl" />
                      <div className="h-9 flex-1 bg-muted/40 rounded-xl" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <Card className="p-8 sm:p-12">
              <div className="flex flex-col items-center justify-center text-muted-foreground">
                <Package className="h-12 w-12 sm:h-16 sm:w-16 mb-4 opacity-20" />
                <p className="text-lg sm:text-xl font-medium">No products found</p>
                <p className="text-sm mt-1 text-center">Try adjusting your filters or add a new product.</p>
                <Button variant="link" onClick={() => { setSearchQuery(""); setCategoryFilter("all"); setStatusFilter("all"); }} className="mt-4">
                  Clear Filters
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product.stock_quantity);
                return (
                  <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    {/* Image Container */}
                    <div className="relative aspect-square bg-muted">
                      <ProductImage productId={product.id} title={product.title} size="grid" />

                      {/* Badges */}
                      <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                        {product.is_featured && (
                          <Badge className="bg-teal-600 hover:bg-teal-700 text-white border-0 text-[10px] px-2 py-0.5">
                            Featured
                          </Badge>
                        )}
                        {product.is_new && (
                          <Badge className="bg-yellow-400 hover:bg-yellow-500 text-yellow-900 border-0 text-[10px] px-2 py-0.5 w-fit">
                            New
                          </Badge>
                        )}
                        <Badge className={`${stockStatus.color} border-0 text-[10px] px-2 py-0.5 w-fit`}>
                          {stockStatus.label}
                        </Badge>
                      </div>
                    </div>

                    {/* Card Content */}
                    <CardContent className="p-4 space-y-3">
                      {/* Title */}
                      <h3 className="font-semibold text-base line-clamp-1">
                        {product.title}
                      </h3>

                      {/* Info Rows */}
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Price</span>
                          <span className="font-semibold">₹{product.price.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Category</span>
                          <span className="capitalize text-xs">{product.category.replace(/-/g, ' ')}</span>
                        </div>
                      </div>

                      {/* Stock Info */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Package className="h-4 w-4" />
                        <span>{product.stock_quantity} Stock</span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 pt-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 h-8 text-xs gap-1.5"
                              onClick={() => navigate(`/seller/products/edit/${product.id}`)}
                            >
                              <Edit className="h-3.5 w-3.5" />
                              Edit
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Edit Product</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => { setQuickStockProduct(product); setQuickStockOpen(true); }}
                            >
                              <Package className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Quick Stock Update</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className={`h-8 w-8 p-0 ${product.published ? 'text-green-600 hover:text-green-700' : 'text-muted-foreground'}`}
                              onClick={() => handleTogglePublish(product.id, product.published)}
                            >
                              {product.published ? (
                                <Eye className="h-3.5 w-3.5" />
                              ) : (
                                <EyeOff className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{product.published ? "Unpublish Product" : "Publish Product"}</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="flex-1 h-8 text-xs gap-1.5"
                              onClick={() => confirmDelete(product.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Delete Product</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {quickStockProduct && (
        <QuickStockModal
          product={quickStockProduct}
          isOpen={quickStockOpen}
          onClose={() => { setQuickStockOpen(false); setQuickStockProduct(null); }}
          onSuccess={fetchProducts}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will remove the product from listings. For compliance, please provide a reason for removal.
              <span className="block mt-2 text-xs text-muted-foreground bg-muted p-2 rounded italic">
                Note: This reason is required for internal audit, tax compliance, and inventory reconciliation.
              </span>
            </AlertDialogDescription>
            <div className="mt-4">
              <Input
                placeholder="Reason for removal (e.g., Out of stock, Discontinued...)"
                value={deletionReason}
                onChange={(e) => setDeletionReason(e.target.value)}
                autoFocus
              />
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletionReason("")}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProduct}
              disabled={!deletionReason.trim()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirm Deletion
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

// Helper component to load product image
function ProductImage({ productId, title, size = "list" }: { productId: string; title: string; size?: "list" | "grid" }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadImage = async () => {
      try {
        const { data, error } = await supabase
          .from('product_variants')
          .select('images')
          .eq('product_id', productId)
          .limit(1)
          .maybeSingle();

        if (!error && data && data.images && data.images.length > 0) {
          setImageUrl(data.images[0]);
        }
      } catch (err) {
        console.error('Error loading image:', err);
      } finally {
        setLoading(false);
      }
    };

    loadImage();
  }, [productId]);

  const containerClass = size === "grid"
    ? "absolute inset-0 w-full h-full"
    : "h-12 w-12";

  const imageClass = size === "grid"
    ? "w-full h-full object-cover"
    : "h-12 w-12 object-cover rounded border";

  if (loading) {
    return <div className={`${containerClass} bg-muted rounded animate-pulse`} />;
  }

  if (!imageUrl) {
    return (
      <div className={`${containerClass} bg-muted rounded flex items-center justify-center`}>
        <Package className={size === "grid" ? "h-12 w-12 text-muted-foreground/30" : "h-6 w-6 text-muted-foreground/50"} />
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={title}
      className={imageClass}
    />
  );
}

