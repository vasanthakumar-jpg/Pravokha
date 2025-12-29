import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "@/contexts/AdminContext";
import { AdminSkeleton } from "@/features/admin/components/AdminSkeleton";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import {
  Package,
  Plus,
  Search,
  Filter,
  LayoutGrid,
  List,
  MoreVertical,
  Edit,
  Eye,
  EyeOff,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  DollarSign,
  ShieldCheck,
  ArrowLeft
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/Tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

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
  is_verified?: boolean;
}

export default function AdminProducts() {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const deletedProductRef = useRef<Product | null>(null);
  const deleteTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate("/auth");
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchProducts();
    }
  }, [isAdmin]);

  useEffect(() => {
    filterProducts();
  }, [products, searchQuery, categoryFilter, statusFilter]);

  const fetchProducts = async () => {
    if (!user) return;
    try {
      let query = (supabase as any)
        .from("products")
        .select(`
          *,
          product_variants (
            id,
            stock,
            images
          )
        `)
        .order("created_at", { ascending: false });

      if (!isAdmin) {
        query = query.eq("seller_id", user.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      const productsWithStock = (data || []).map((product: any) => {
        const totalStock = product.product_variants?.reduce(
          (sum: number, variant: any) => sum + (variant.stock || 0),
          0
        ) || 0;
        return { ...product, stock_quantity: totalStock };
      });

      setProducts(productsWithStock);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query)
      );
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((p) => p.category === categoryFilter);
    }

    if (statusFilter !== "all") {
      if (statusFilter === "published") {
        filtered = filtered.filter((p) => p.published);
      } else if (statusFilter === "draft") {
        filtered = filtered.filter((p) => !p.published);
      } else if (statusFilter === "low_stock") {
        filtered = filtered.filter(
          (p) => (p.stock_quantity || 0) > 0 && (p.stock_quantity || 0) < 10
        );
      } else if (statusFilter === "out_of_stock") {
        filtered = filtered.filter((p) => (p.stock_quantity || 0) === 0);
      }
    }

    setFilteredProducts(filtered);
  };

  const getStockStatus = (stock: number = 0) => {
    if (stock === 0) return { label: "Out of Stock", color: "bg-red-500 text-white hover:bg-red-600" };
    if (stock < 10) return { label: "Low Stock", color: "bg-orange-500 text-white hover:bg-orange-600" };
    return { label: "In Stock", color: "bg-green-500 text-white hover:bg-green-600" };
  };

  const handleTogglePublish = async (productId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("products")
        .update({ published: !currentStatus })
        .eq("id", productId);

      if (error) throw error;

      toast({
        title: currentStatus ? "Product unpublished" : "Product published",
        description: currentStatus
          ? "Product is now in draft mode"
          : "Product is now live on the site",
      });

      // Log audit
      await supabase.from('audit_logs').insert({
        actor_id: user.id,
        target_id: productId,
        target_type: 'product',
        action_type: 'product_update',
        severity: 'info',
        description: `Product ${productId} ${!currentStatus ? 'published' : 'unpublished'} by admin.`,
        metadata: {
          published: !currentStatus,
          previous_state: currentStatus
        }
      });

      fetchProducts();
    } catch (error) {
      console.error("Error toggling publish status:", error);
      toast({
        title: "Error",
        description: "Failed to update product status",
      });
    }
  };

  const confirmDelete = (productId: string) => {
    setProductToDelete(productId);
    setDeleteDialogOpen(true);
  };

  const undoDelete = () => {
    if (deleteTimeoutRef.current) {
      clearTimeout(deleteTimeoutRef.current);
      deleteTimeoutRef.current = null;
    }

    if (deletedProductRef.current) {
      setProducts((prev) => [deletedProductRef.current!, ...prev]);
      deletedProductRef.current = null;
      toast({
        title: "Deletion Cancelled",
        description: "The product has been restored.",
      });
    }
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;

    const product = products.find((p) => p.id === productToDelete);
    if (!product) return;

    setDeleteDialogOpen(false);
    setProductToDelete(null);

    deletedProductRef.current = product;
    setProducts((prev) => prev.filter((p) => p.id !== product.id));

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

    deleteTimeoutRef.current = setTimeout(async () => {
      try {
        const { error } = await supabase.from("products").delete().eq("id", product.id);
        if (error) throw error;

        // Log audit
        await supabase.from('audit_logs').insert({
          actor_id: user.id,
          target_id: product.id,
          target_type: 'product',
          action_type: 'product_deletion',
          severity: 'warning',
          description: `Product ${product.id} ("${product.title}") permanently deleted by admin.`,
          metadata: {
            deleted_product: product.title,
            category: product.category
          }
        });

        deletedProductRef.current = null;
      } catch (error: any) {
        console.error("Error deleting product:", error);
        setProducts((prev) => [product, ...prev]);
        toast({
          title: "Error",
          description: "Failed to delete product permanently",
          variant: "destructive",
        });
      }
    }, 5000);
  };

  // Stats calculations
  const totalProducts = products.length;
  const activeListings = products.filter((p) => p.published).length;
  const lowStockProducts = products.filter(
    (p) => (p.stock_quantity || 0) > 0 && (p.stock_quantity || 0) < 10
  ).length;
  const totalRevenue = products.reduce((sum, p) => sum + p.price, 0);

  if (adminLoading || loading) {
    return <AdminSkeleton variant="grid" />;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 flex flex-col gap-8 pb-10">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-xl border-border/40 bg-card/40 backdrop-blur-sm gap-2 font-bold text-xs w-full sm:w-auto justify-start"
              onClick={() => navigate("/admin")}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold">Product inventory</h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-0.5">Manage global marketplace listings and warehouse stock</p>
            </div>
          </div>
          <Button
            onClick={() => navigate("/admin/products/add")}
            className="w-full sm:w-auto h-10 rounded-xl bg-primary shadow-lg shadow-primary/20 font-bold text-xs"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Product
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Total Products</p>
                <p className="text-xl sm:text-2xl font-bold">{totalProducts}</p>
              </div>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Package className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Active Listings</p>
                <p className="text-xl sm:text-2xl font-bold">{activeListings}</p>
              </div>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Low Stock</p>
                <p className="text-xl sm:text-2xl font-bold">{lowStockProducts}</p>
              </div>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-xl sm:text-2xl font-bold">₹{totalRevenue.toLocaleString()}</p>
              </div>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search, Filter & View Toggle */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3">
            {/* Row 1: Search + View Toggle (desktop) */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              {/* Desktop View Toggle */}
              <div className="hidden sm:flex border rounded-lg overflow-hidden">
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-none px-3 h-10"
                >
                  <List className="h-4 w-4 mr-2" />
                  List
                </Button>
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-none px-3 h-10"
                >
                  <LayoutGrid className="h-4 w-4 mr-2" />
                  Grid
                </Button>
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

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[130px]">
                  <span className="truncate text-sm">
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
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Loading products...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-8 text-center">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No products found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Image</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead className="hidden md:table-cell">Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead className="hidden sm:table-cell">Stock</TableHead>
                      <TableHead className="hidden lg:table-cell">Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => {
                      const stockStatus = getStockStatus(product.stock_quantity);
                      return (
                        <TableRow key={product.id}>
                          <TableCell>
                            <ProductImage productId={product.id} title={product.title} size="list" />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{product.title}</span>
                              <div className="flex gap-1">
                                {product.is_featured && <Badge className="bg-teal-600 text-white border-0 text-[10px] px-1.5 py-0 h-4">F</Badge>}
                                {product.is_new && <Badge className="bg-yellow-400 text-yellow-900 border-0 text-[10px] px-1.5 py-0 h-4">N</Badge>}
                                {product.is_verified && <ShieldCheck className="h-4 w-4 text-blue-600" />}
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground line-clamp-1 md:hidden">
                              {product.category}
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Badge variant="outline" className="capitalize">
                              {product.category?.replace(/-/g, " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>₹{product.price.toLocaleString()}</TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <Badge className={stockStatus.color}>{stockStatus.label}</Badge>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <Badge variant={product.published ? "default" : "secondary"}>
                              {product.published ? "Published" : "Draft"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => navigate(`/product/${product.slug}`)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Live
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigate(`/admin/products/edit/${product.id}`)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Product
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
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Products Grid View */}
      {viewMode === "grid" && (
        <div>
          {loading ? (
            <AdminSkeleton variant="grid" />
          ) : filteredProducts.length === 0 ? (
            <Card className="p-8 sm:p-12">
              <div className="flex flex-col items-center justify-center text-muted-foreground">
                <Package className="h-12 w-12 sm:h-16 sm:w-16 mb-4 opacity-20" />
                <p className="text-lg sm:text-xl font-medium">No products found</p>
                <p className="text-sm mt-1 text-center">Try adjusting your filters or add a new product.</p>
                <Button
                  variant="link"
                  onClick={() => {
                    setSearchQuery("");
                    setCategoryFilter("all");
                    setStatusFilter("all");
                  }}
                  className="mt-4"
                >
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
                        {product.is_verified && (
                          <Badge className="bg-blue-600 hover:bg-blue-700 text-white border-0 text-[10px] px-2 py-0.5 w-fit flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3" /> Verified
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
                      <h3 className="font-semibold text-base line-clamp-1">{product.title}</h3>

                      {/* Info Rows */}
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Price</span>
                          <span className="font-semibold">₹{product.price.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Category</span>
                          <span className="capitalize text-xs">{product.category?.replace(/-/g, " ")}</span>
                        </div>
                      </div>

                      {/* Stock Info */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Package className="h-4 w-4" />
                        <span>{product.stock_quantity || 0} Stock</span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 pt-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 h-8 text-xs gap-1.5"
                              onClick={() => navigate(`/admin/products/edit/${product.id}`)}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product and remove it from our
              servers.
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

