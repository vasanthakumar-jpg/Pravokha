import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AdminSkeleton } from "@/feat/admin/components/AdminSkeleton";
import { motion, AnimatePresence } from "framer-motion";
import { useAdmin } from "@/core/context/AdminContext";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/Card";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { Badge } from "@/ui/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/Table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/ui/DropdownMenu";
import {
  Download,
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Package,
  ArrowLeft,
  Filter,
  ArrowUpDown,
  TrendingUp,
  LayoutGrid,
  List,
  ChevronRight,
  Loader2,
  PackageCheck,
  AlertCircle,
  Shield
} from "lucide-react";
import { apiClient } from "@/infra/api/apiClient";
import { Skeleton } from "@/ui/Skeleton";
import { toast } from "@/shared/hook/use-toast";

import { NoResultsFound } from "@/feat/admin/components/NoResultsFound";

function StatsCard({ title, value, icon: Icon, color, description, trend }: any) {
  return (
    <Card className="border-border/60 bg-card shadow-sm">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className={cn("p-2 rounded-lg bg-opacity-10", color.replace("bg-", "bg-opacity-10 text-"))}>
            <Icon className={cn("h-4 w-4", color.replace("bg-", "text-"))} />
          </div>
        </div>
        <div className="flex flex-col gap-1 mt-2">
          <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
          <p className="text-[10px] text-muted-foreground flex items-center gap-2">
            {description}
            {trend && (
              <span className={cn(
                "font-bold flex items-center gap-0.5",
                typeof trend === 'object' && trend.isPositive ? "text-emerald-500" : "text-rose-500"
              )}>
                {typeof trend === 'object' ? (
                  <>
                    {trend.isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingUp className="h-3 w-3 rotate-180" />}
                    {trend.value}%
                  </>
                ) : (
                  <span className="text-amber-500">{trend}</span>
                )}
              </span>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

import { usePermission } from "@/core/hooks/usePermission";

export default function AdminProductsManagement() {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { can } = usePermission();


  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    draft: 0,
    totalStock: 0,
    published: 0
  });

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate("/");
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchProducts();
    }
  }, [isAdmin, currentPage, pageSize]);

  // Update stats based on products
  useEffect(() => {
    if (products.length > 0) {
      const liveCount = products.filter(p => p.status === 'ACTIVE').length;
      const stock = products.reduce((acc, p) => acc + (p.stock || 0), 0);
      setStats({
        total: totalCount || products.length,
        active: liveCount,
        draft: products.filter(p => p.status === 'DRAFT').length,
        totalStock: stock,
        published: liveCount
      });
    }
  }, [products, totalCount]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      // Calculate pagination for backend if supported, otherwise fetch and slice
      // Current backend might return all products or support pagination params
      const { data, headers } = await apiClient.get('/products', {
        params: {
          page: currentPage,
          limit: pageSize,
          role: 'admin' // Ensure admin view to see drafts
        }
      });

      // If backend provides paginated response structure
      if (data && Array.isArray(data.products)) {
        setProducts(data.products);
        setTotalCount(data.total || 0);
      } else if (Array.isArray(data)) {
        // Fallback if backend returns simple array
        setProducts(data);
        setTotalCount(parseInt(headers['x-total-count'] || data.length.toString()));
      }

    } catch (err) {
      console.error("Error fetching products:", err);
      toast({ title: "Error", description: "Failed to fetch products catalogue.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const dynamicCategories = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach(p => {
      const cat = typeof p.category === 'object' ? p.category?.name : (p.category || "Uncategorized");
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [products]);

  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p => {
        const catName = typeof p.category === 'object' ? p.category?.name : (p.category || "");
        return (p.title || "").toLowerCase().includes(q) ||
          (p.sku || "").toLowerCase().includes(q) ||
          (catName || "").toLowerCase().includes(q);
      });
    }

    // Filters
    if (categoryFilter !== "all") {
      filtered = filtered.filter(p => {
        const catName = typeof p.category === 'object' ? p.category?.name : (p.category || "");
        return catName === categoryFilter;
      });
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter(p => statusFilter === "published" ? p.status === 'ACTIVE' : p.status !== 'ACTIVE');
    }
    if (sourceFilter !== "all") {
      filtered = filtered.filter(p => {
        const storeName = p.vendor?.storeName?.toLowerCase() || "";
        const isOfficial = storeName.includes("official") ||
          storeName.includes("admin") ||
          storeName.includes("pravokha") || // Add platform name for safety
          p.sellerId === "admin"; // Check ID if available
        return sourceFilter === "official" ? isOfficial : !isOfficial;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest": return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "oldest": return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "price-low": return a.price - b.price;
        case "price-high": return b.price - a.price;
        default: return 0;
      }
    });

    return filtered;
  }, [products, searchQuery, categoryFilter, statusFilter, sortBy]);

  const handleExportCSV = () => {
    const headers = ["ID", "SKU", "Name", "Category", "Price", "Stock", "Status", "Created"];
    const rows = filteredProducts.map(p => [
      p.id,
      p.sku || "N/A",
      `"${(p.title || "No Title").replace(/"/g, '""')}"`,
      typeof p.category === 'object' ? p.category?.name : (p.category || "Uncategorized"),
      p.price || 0,
      p.stock || 0,
      p.status,
      p.created_at ? new Date(p.created_at).toLocaleDateString() : 'N/A'
    ]);

    const csvContent = "data:text/csv;charset=utf-8,"
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `products_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ... rest of component

  // ...

  const togglePublished = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'ACTIVE' ? 'DRAFT' : 'ACTIVE';
      await apiClient.patch(`/products/${id}`, { status: newStatus });
      setProducts(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
      toast({ title: "Visibility Updated", description: "Product status shifted successfully." });
    } catch (err) {
      console.error(err);
      toast({ title: "Update Failed", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This will remove the entire product matrix.")) return;
    try {
      await apiClient.delete(`/products/${id}`);
      setProducts(prev => prev.filter(p => p.id !== id));
      toast({ title: "Product Terminated", description: "Item removed from catalogue." });
    } catch (err) {
      console.error(err);
      toast({ title: "Deletion Failed", variant: "destructive" });
    }
  };

  if (adminLoading || loading) return <AdminSkeleton variant="table" />;

  return (
    <div className="w-full mx-auto py-3 sm:py-6 lg:py-8 px-2 sm:px-4 lg:px-6 xl:px-8 flex flex-col gap-3 sm:gap-6 lg:gap-8 animate-in fade-in duration-500 pb-6 sm:pb-8 lg:pb-10">
      {/* Header & Stats Section */}
      <div className="flex flex-col gap-3 sm:gap-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4 w-full lg:w-auto">
            <Button
              variant="outline"
              size="sm"
              className="h-9 w-9 sm:w-auto px-0 sm:px-3 rounded-xl border-border/60 bg-card gap-2 font-medium text-xs shadow-sm flex-shrink-0"
              onClick={() => navigate("/admin")}
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold flex items-center flex-wrap gap-2 sm:gap-3 truncate">
                Product Master
                <Badge variant="outline" className="text-[10px] font-bold tracking-tight bg-primary/5 rounded-lg border-primary/20 shrink-0 h-5 px-1.5">{stats.total} items</Badge>
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5 truncate">Catalogue governance & lifecycle management</p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
            <Button
              variant="outline"
              onClick={() => setViewMode(viewMode === "table" ? "grid" : "table")}
              className="flex-none h-10 px-3 rounded-xl border-border/60 bg-card font-medium text-xs shadow-sm"
            >
              {viewMode === "table" ? <LayoutGrid className="h-3.5 w-3.5 sm:mr-2" /> : <List className="h-3.5 w-3.5 sm:mr-2" />}
              <span className="hidden sm:inline">{viewMode === "table" ? "Grid" : "Table"}</span>
            </Button>
            <Button
              onClick={handleExportCSV}
              variant="outline"
              className="flex-none h-10 px-3 rounded-xl border-border/60 bg-card font-medium text-xs shadow-sm"
            >
              <Download className="h-3.5 w-3.5 sm:mr-2" />
              <span className="hidden sm:inline">Export CSV</span>
              <span className="sm:hidden">CSV</span>
            </Button>
            {can('APPROVE_PRODUCT') && (
              <Button
                onClick={() => navigate("/admin/products/updates")}
                variant="outline"
                className="flex-none h-10 px-3 rounded-xl border-amber-200 bg-amber-50/50 text-amber-700 hover:bg-amber-100 font-bold text-xs"
              >
                <Shield className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Update Requests</span>
                <span className="sm:hidden">Updates</span>
              </Button>
            )}
            {can('CREATE_PRODUCT') && (
              <Button
                onClick={() => navigate("/admin/products/add")}
                className="flex-1 sm:flex-none h-10 px-4 rounded-xl font-bold text-xs bg-primary hover:bg-primary/90 shadow-md shadow-primary/20 whitespace-nowrap"
              >
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Initialisation</span>
                <span className="sm:hidden">Add</span>
              </Button>
            )}
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-6">
          <StatsCard
            title="Total Stock Volume"
            value={stats.totalStock.toLocaleString()}
            icon={Package}
            color="bg-blue-600"
            description="Overall inventory count"
            trend={{ value: 5.4, isPositive: true }}
          />
          <StatsCard
            title="Live Published"
            value={stats.published.toString()}
            icon={PackageCheck}
            color="bg-emerald-500"
            description="Active in marketplace"
            trend={{ value: 12, isPositive: true }}
          />
          <StatsCard
            title="Stock depletion"
            value={products.filter(p => !p.product_variants || p.product_variants.every((v: any) => v.product_sizes?.every((s: any) => s.stock === 0))).length.toString()}
            icon={AlertCircle}
            color="bg-rose-500"
            description="Out of stock entries"
            trend="Attention needed"
          />
        </div>
      </div>


      {/* Main Controls */}
      <Card className="border-border/60 bg-card transition-all duration-500 rounded-xl shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border/40 pb-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center text-sm font-medium text-muted-foreground grayscale">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by Title, SKU or Category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 bg-card border-border/60 rounded-xl focus:ring-primary/20 shadow-sm text-sm"
              />
            </div>
            <div className="flex items-center gap-4 w-full sm:w-auto font-bold text-[10px]">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className={cn(
                    "flex items-center gap-1 group cursor-pointer hover:text-primary transition-colors pr-2 border-r border-border/50",
                    (categoryFilter !== "all" || statusFilter !== "all") && "text-primary"
                  )}>
                    <Filter className="h-3 w-3" />
                    <span>Filter</span>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 max-h-[400px] overflow-y-auto bg-card border-border/60 shadow-xl rounded-xl scrollbar-hide">
                  <DropdownMenuLabel className="text-[10px] font-black tracking-widest text-muted-foreground opacity-70 px-2 py-1.5">Intelligent categorization</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setCategoryFilter("all")} className={cn("rounded-lg px-2 py-2 flex justify-between items-center", categoryFilter === "all" && "bg-primary/10 text-primary")}>
                    <span>All Collections</span>
                    <Badge variant="secondary" className="text-[9px] px-1.5">{products.length}</Badge>
                  </DropdownMenuItem>
                  {dynamicCategories.map(cat => (
                    <DropdownMenuItem
                      key={cat.name}
                      onClick={() => setCategoryFilter(cat.name)}
                      className={cn("rounded-lg px-2 py-2 flex justify-between items-center", categoryFilter === cat.name && "bg-primary/10 text-primary")}
                    >
                      <span className="capitalize">{cat.name.toLowerCase()}</span>
                      <Badge variant="outline" className="text-[9px] px-1.5">{cat.count}</Badge>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator className="bg-border/50 my-1" />
                  <DropdownMenuLabel className="text-[10px] font-black tracking-widest text-muted-foreground opacity-70 px-2 py-1.5">Governance status</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setStatusFilter("all")} className={cn("rounded-lg px-2 py-1.5", statusFilter === "all" && "bg-primary/10 text-primary")}>All Status</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("published")} className={cn("rounded-lg px-2 py-1.5", statusFilter === "published" && "bg-primary/10 text-primary")}>Live Published</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("draft")} className={cn("rounded-lg px-2 py-1.5", statusFilter === "draft" && "bg-primary/10 text-primary")}>Draft Archives</DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border/50 my-1" />
                  <DropdownMenuLabel className="text-[10px] font-black tracking-widest text-muted-foreground opacity-70 px-2 py-1.5">Product source</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setSourceFilter("all")} className={cn("rounded-lg px-2 py-1.5", sourceFilter === "all" && "bg-primary/10 text-primary")}>All Sources</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSourceFilter("official")} className={cn("rounded-lg px-2 py-1.5", sourceFilter === "official" && "bg-primary/10 text-primary")}>Official (Admin)</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSourceFilter("seller")} className={cn("rounded-lg px-2 py-1.5", sourceFilter === "seller" && "bg-primary/10 text-primary")}>Third-party Sellers</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className={cn(
                    "flex items-center gap-1 group cursor-pointer hover:text-primary transition-colors",
                    (sortBy !== "newest" || sourceFilter !== "all") && "text-primary"
                  )}>
                    <ArrowUpDown className="h-3 w-3" />
                    <span>Sort</span>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 max-h-[300px] overflow-y-auto bg-card border-border/60 shadow-xl rounded-xl scrollbar-hide">
                  <DropdownMenuItem onClick={() => setSortBy("newest")} className={cn("rounded-lg px-2 py-1.5", sortBy === "newest" && "bg-primary/10 text-primary")}>Newest First</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("oldest")} className={cn("rounded-lg px-2 py-1.5", sortBy === "oldest" && "bg-primary/10 text-primary")}>Oldest Record</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("price-low")} className={cn("rounded-lg px-2 py-1.5", sortBy === "price-low" && "bg-primary/10 text-primary")}>Price: Ascending</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("price-high")} className={cn("rounded-lg px-2 py-1.5", sortBy === "price-high" && "bg-primary/10 text-primary")}>Price: Descending</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <AnimatePresence mode="wait">
            {viewMode === "table" ? (
              <motion.div
                key="table"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="overflow-x-auto">
                {filteredProducts.length === 0 ? (
                  <NoResultsFound
                    searchTerm={searchQuery}
                    onReset={() => {
                      setSearchQuery("");
                      setCategoryFilter("all");
                      setStatusFilter("all");
                    }}
                    className="m-6"
                  />
                ) : (
                  <div className="hidden sm:block overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-muted/30">
                        <TableRow className="border-border/40 hover:bg-transparent">
                          <TableHead className="w-[80px] px-6 h-12 text-[11px] font-bold tracking-wider text-muted-foreground/60">Image</TableHead>
                          <TableHead className="text-[11px] font-bold tracking-wider text-muted-foreground/60">Intelligence</TableHead>
                          <TableHead className="text-[11px] font-bold tracking-wider text-muted-foreground/60">Category</TableHead>
                          <TableHead className="text-[11px] font-bold tracking-wider text-muted-foreground/60">Source</TableHead>
                          <TableHead className="text-[11px] font-bold tracking-wider text-muted-foreground/60">Price matrix</TableHead>
                          <TableHead className="text-[11px] font-bold tracking-wider text-muted-foreground/60">Governance</TableHead>
                          <TableHead className="text-[11px] font-bold tracking-wider text-muted-foreground/60 text-right pr-10">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProducts.map((product) => (
                          <TableRow key={product.id} className="border-border/50 hover:bg-muted/30 transition-colors group">
                            <TableCell>
                              <div className="w-12 h-12 rounded-xl bg-muted overflow-hidden border border-border/50 shadow-sm transition-transform group-hover:scale-105">
                                {product.variants?.[0]?.images?.[0] ? (
                                  <img src={product.variants[0].images[0]} className="w-full h-full object-cover" />
                                ) : product.product_variants?.[0]?.images?.[0] ? (
                                  <img src={product.product_variants[0].images[0]} className="w-full h-full object-cover" />
                                ) : (
                                  <Package className="w-full h-full p-3 text-muted-foreground/50" />
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <div className="text-sm font-bold tracking-tight text-foreground/90">{product.title}</div>
                                <div className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                                  SKU: {product.sku}
                                  {(product.isFeatured || product.featured) && (
                                    <Badge className="h-3 px-1 text-[8px] bg-amber-500/10 text-amber-600 border-amber-500/20">FEATURED</Badge>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[9px] font-bold rounded-lg border-border/50 bg-background/50">
                                {((typeof product.category === 'object' ? product.category?.name : product.category) || "N/A").toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-[11px] font-bold text-foreground truncate max-w-[120px]">
                                  {product.vendor?.storeName || "Unknown Seller"}
                                </span>
                                <span className="text-[9px] text-muted-foreground opacity-70 italic">
                                  {product.vendor?.storeName?.toLowerCase().includes("official") ? "Platform Official" : "External Seller"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-bold text-sm text-foreground">₹{product.price.toLocaleString()}</span>
                                {product.discount_price && (
                                  <span className="text-[10px] text-muted-foreground line-through decoration-rose-500/50">₹{product.discount_price.toLocaleString()}</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={product.status === 'ACTIVE' ? "default" : "secondary"}
                                className={cn(
                                  "text-[8px] font-black tracking-widest rounded-md border-none",
                                  product.status === 'ACTIVE' ? "bg-emerald-500" : "bg-muted text-muted-foreground"
                                )}
                              >
                                {product.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right pr-10">
                              <div className="flex items-center justify-end gap-1">
                                {can('EDIT_ANY_PRODUCT') && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => navigate(`/admin/products/edit/${product.id}`)}
                                    className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                )}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-48 bg-card/80 backdrop-blur-xl border-border/50">
                                    <DropdownMenuLabel className="text-[10px] font-bold tracking-widest text-muted-foreground opacity-70">Governance</DropdownMenuLabel>
                                    {can('APPROVE_PRODUCT') && (
                                      <DropdownMenuItem onClick={() => togglePublished(product.id, product.status)} className="cursor-pointer gap-2 text-xs font-bold">
                                        {product.status === 'ACTIVE' ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                        {product.status === 'ACTIVE' ? "Draft Archive" : "Publish Live"}
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator className="bg-border/50" />
                                    {can('DELETE_ANY_PRODUCT') && (
                                      <DropdownMenuItem onClick={() => handleDelete(product.id)} className="cursor-pointer gap-2 text-xs font-bold text-rose-500 focus:bg-rose-500 focus:text-white transition-colors">
                                        <Trash2 className="h-3.5 w-3.5" />
                                        Terminate Entry
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* Mobile Table View (Cards) */}
                <div className="block sm:hidden grid grid-cols-1 gap-4 p-4">
                  {filteredProducts.map((product) => (
                    <div key={product.id} className="flex flex-col bg-card border border-border/60 rounded-2xl shadow-sm overflow-hidden group active:scale-[0.98] transition-transform">
                      <div className="flex p-4 gap-4">
                        <div className="h-24 w-24 min-w-[6rem] rounded-xl bg-muted overflow-hidden border border-border/50 shadow-inner relative">
                          {(() => {
                            const image = product.variants?.[0]?.images?.[0] || product.product_variants?.[0]?.images?.[0];
                            return image ? (
                              <img src={image} className="w-full h-full object-cover" loading="lazy" />
                            ) : (
                              <div className="flex items-center justify-center h-full w-full bg-muted/50">
                                <Package className="h-8 w-8 text-muted-foreground/30" />
                              </div>
                            );
                          })()}
                          <div className="absolute top-1 left-1">
                            <Badge
                              variant={product.status === 'ACTIVE' ? "default" : "secondary"}
                              className={cn(
                                "text-[7px] font-black h-4 px-1 rounded-md",
                                product.status === 'ACTIVE' ? "bg-emerald-500 text-white" : "bg-black/40 text-white"
                              )}
                            >
                              {product.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                          <div className="space-y-1">
                            <div className="flex justify-between items-start">
                              <h3 className="text-sm font-bold truncate leading-tight pr-1">{product.title}</h3>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-6 w-6 -mt-1 -mr-2">
                                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-52 bg-card/95 backdrop-blur-xl border-border/50 rounded-xl shadow-2xl">
                                  <DropdownMenuLabel className="text-[10px] font-black tracking-widest text-muted-foreground opacity-70">Catalog Governance</DropdownMenuLabel>
                                  {can('EDIT_ANY_PRODUCT') && (
                                    <DropdownMenuItem onClick={() => navigate(`/admin/products/edit/${product.id}`)} className="font-bold py-2.5">
                                      <Pencil className="mr-2 h-4 w-4" /> Edit Attributes
                                    </DropdownMenuItem>
                                  )}
                                  {can('APPROVE_PRODUCT') && (
                                    <DropdownMenuItem onClick={() => togglePublished(product.id, product.status)} className="font-bold py-2.5">
                                      {product.status === 'ACTIVE' ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                                      {product.status === 'ACTIVE' ? "Archive Entry" : "Deploy Live"}
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator className="bg-border/40" />
                                  {can('DELETE_ANY_PRODUCT') && (
                                    <DropdownMenuItem onClick={() => handleDelete(product.id)} className="text-rose-500 font-bold focus:bg-rose-500 focus:text-white py-2.5">
                                      <Trash2 className="mr-2 h-4 w-4" /> Terminate Matrix
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            <p className="text-[9px] text-muted-foreground font-mono opacity-60">SKU: {product.sku}</p>
                            <div className="pt-1 flex items-center gap-2">
                              <Badge variant="outline" className="text-[8px] h-4 px-1.5 font-bold bg-muted/30">
                                {((typeof product.category === 'object' ? product.category?.name : product.category) || "N/A").toUpperCase()}
                              </Badge>
                            </div>
                          </div>

                          <div className="flex items-end justify-between mt-1">
                            <div className="flex flex-col">
                              <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-tighter">Selling Price</span>
                              <span className="font-black text-base tracking-tighter">₹{(product.price || 0).toLocaleString()}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[8px] text-muted-foreground font-medium block italic truncate max-w-[80px]">
                                {product.vendor?.storeName || "Direct"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-6 p-3 sm:p-6"
              >
                {filteredProducts.map((product) => (
                  <Card
                    key={product.id}
                    className="group relative overflow-hidden bg-card border-border/60 hover:border-primary/40 transition-all duration-500 rounded-xl shadow-sm cursor-pointer"
                    onClick={() => can('EDIT_ANY_PRODUCT') && navigate(`/admin/products/edit/${product.id}`)}
                  >
                    <div className="aspect-[4/5] bg-muted relative overflow-hidden">
                      {(() => {
                        const image = product.variants?.[0]?.images?.[0] || product.product_variants?.[0]?.images?.[0];
                        return image ? (
                          <img src={image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center grayscale opacity-20">
                            <Package className="h-12 w-12" />
                          </div>
                        );
                      })()}

                      {/* Top Right: Edit Action (Permanently Visible) */}
                      {can('EDIT_ANY_PRODUCT') && (
                        <div className="absolute top-3 right-3 z-20">
                          <Button
                            variant="secondary"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/admin/products/edit/${product.id}`);
                            }}
                            className="h-8 w-8 rounded-xl bg-card shadow-lg border border-border/60 hover:scale-110 active:scale-95 transition-all text-primary"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      )}

                      {/* Top Left: Badges */}
                      <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 items-start">
                        <Badge
                          variant={product.status === 'ACTIVE' ? "default" : "secondary"}
                          className={cn(
                            "text-[8px] font-black tracking-widest rounded-md border-none px-2",
                            product.status === 'ACTIVE' ? "bg-emerald-500/90 text-white" : "bg-black/40 text-white"
                          )}
                        >
                          {product.status}
                        </Badge>
                        {product.isFeatured && <Badge className="text-[8px] bg-amber-500 px-2 rounded-md border-none text-white font-bold">Featured</Badge>}
                        {product.isVerified && <Badge className="text-[8px] bg-primary px-2 rounded-md border-none text-white font-bold flex items-center gap-1"><Shield className="h-2 w-2" /> Verified</Badge>}
                      </div>
                    </div>
                    <CardHeader className="p-4 space-y-1">
                      <div className="text-[10px] font-semibold text-primary tracking-widest">
                        {typeof product.category === 'object' ? product.category?.name : (product.category || "N/A")}
                      </div>
                      <CardTitle className="text-sm font-heading font-semibold tracking-tight flex items-center justify-between">
                        {product.title}
                        <span className="font-mono text-[9px] text-muted-foreground opacity-50">{product.sku}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 pt-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center baseline gap-1.5">
                          <span className="font-bold text-base">₹{product.price.toLocaleString()}</span>
                          {product.discount_price && <span className="text-[9px] text-muted-foreground line-through opacity-50">₹{product.discount_price}</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          {product.total_stock <= 5 ? (
                            <Badge variant="outline" className="text-[8px] text-rose-500 border-rose-500/20 bg-rose-500/5 px-1.5 py-0">Low Stock</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[8px] text-emerald-500 border-emerald-500/20 bg-emerald-500/5 px-1.5 py-0">In Stock</Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
        {/* Pagination Footer */}
        {!loading && totalCount > pageSize && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-muted/30 border-t border-border/40">
            <div className="text-sm text-muted-foreground">
              Showing <span className="font-bold text-foreground">{((currentPage - 1) * pageSize) + 1}</span> to{' '}
              <span className="font-bold text-foreground">{Math.min(currentPage * pageSize, totalCount)}</span> of{' '}
              <span className="font-bold text-foreground">{totalCount}</span> products
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-xl"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-background border border-border/40">
                <span className="text-sm font-bold">Page {currentPage}</span>
                <span className="text-sm text-muted-foreground">of {Math.ceil(totalCount / pageSize)}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-xl"
                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(totalCount / pageSize), prev + 1))}
                disabled={currentPage >= Math.ceil(totalCount / pageSize)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div >
  );
}

function ProductsSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <Skeleton className="h-4 w-40 rounded-lg" />
        </div>
        <Skeleton className="h-11 w-40 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
      </div>
      <div className="space-y-4">
        <Skeleton className="h-16 w-full rounded-2xl" />
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <Skeleton className="h-12 flex-1 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}

