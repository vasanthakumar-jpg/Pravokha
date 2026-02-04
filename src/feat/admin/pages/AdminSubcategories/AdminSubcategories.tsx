import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "@/infra/api/apiClient";
import { useAdmin } from "@/core/context/AdminContext";
import { AdminSkeleton } from "@/feat/admin/components/AdminSkeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/Card";
import { Button } from "@/ui/Button";
import { Badge } from "@/ui/Badge";
import { Input } from "@/ui/Input";
import { Label } from "@/ui/Label";
import { Textarea } from "@/ui/Textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/Select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/ui/Dialog";
import { toast } from "@/shared/hook/use-toast";
import { Pencil, Trash2, Plus, ArrowLeft, Tag } from "lucide-react";

interface Subcategory {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    image_url: string | null;
    category_id: string;
    status: string;
    display_order: number;
    categories?: { name: string };
    category?: { name: string; id: string };
}

interface Category {
    id: string;
    name: string;
    slug: string;
}

export default function AdminSubcategories() {
    const navigate = useNavigate();
    const { isAdmin, loading: adminLoading } = useAdmin();
    const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [searchQuery, setSearchQuery] = useState("");

    const filteredSubcategories = (subcategories || []).filter(sub => {
        const query = (searchQuery || "").toLowerCase();
        const categoryName = (sub.categories?.name || sub.category?.name || "");
        return (
            sub.status !== 'inactive' && (
                (sub.name || "").toLowerCase().includes(query) ||
                (sub.slug || "").toLowerCase().includes(query) ||
                categoryName.toLowerCase().includes(query)
            )
        );
    });

    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        description: "",
        image_url: "",
        category_id: "",
        status: "active",
        display_order: 0,
    });

    const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

    // Auto-generate slug from name
    useEffect(() => {
        if (formData.name && !editingSubcategory && !slugManuallyEdited) {
            const slug = formData.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)+/g, "");
            setFormData(prev => ({ ...prev, slug }));
        }
    }, [formData.name, editingSubcategory, slugManuallyEdited]);

    useEffect(() => {
        if (!adminLoading && !isAdmin) {
            navigate("/");
        }
    }, [isAdmin, adminLoading, navigate]);

    useEffect(() => {
        if (isAdmin) {
            fetchData();
        }
    }, [isAdmin]);

    const fetchData = async () => {
        try {
            setLoading(true);
            // Fetch categories (admin view to see all)
            const catResponse = await apiClient.get('/categories/admin/all');
            setCategories(catResponse.data.categories || []);

            // Fetch subcategories with category info
            const subResponse = await apiClient.get('/categories/subcategories');
            const data = (subResponse.data.subcategories || []).map((sub: any) => ({
                ...sub,
                category_id: sub.parentId || sub.categoryId || sub.category_id || sub.category?.id || sub.parent?.id,
                display_order: sub.displayOrder ?? sub.display_order ?? 0,
                image_url: sub.imageUrl || sub.image_url || null,
                categories: sub.category || sub.parent // Map for legacy UI support
            }));
            setSubcategories(data);
        } catch (error: any) {
            toast({
                title: "Error",
                description: "Failed to load data",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.name.trim()) newErrors.name = "Subcategory Name is required.";
        if (!formData.slug.trim()) newErrors.slug = "URL Slug is required.";
        if (!formData.category_id) newErrors.category_id = "Parent Category is required.";
        if (formData.slug && !/^[a-z0-9-]+$/.test(formData.slug)) {
            newErrors.slug = "Slug can only contain lowercase letters, numbers, and hyphens.";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            if (editingSubcategory) {
                await apiClient.patch(`/categories/subcategories/${editingSubcategory.id}`, formData);
                toast({ title: "Success", description: "Subcategory updated successfully" });
            } else {
                await apiClient.post('/categories/subcategories', formData);
                toast({ title: "Success", description: "Subcategory created successfully" });
            }

            setDialogOpen(false);
            resetForm();
            fetchData();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.message || error.message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this subcategory?")) return;

        try {
            await apiClient.delete(`/categories/subcategories/${id}`);
            toast({ title: "Success", description: "Subcategory deleted successfully" });
            fetchData();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.message || error.message,
                variant: "destructive",
            });
        }
    };

    const openEditDialog = (subcategory: Subcategory) => {
        setEditingSubcategory(subcategory);
        setFormData({
            name: subcategory.name,
            slug: subcategory.slug,
            description: subcategory.description || "",
            image_url: subcategory.image_url || "",
            category_id: subcategory.category_id,
            status: subcategory.status,
            display_order: subcategory.display_order,
        });
        setDialogOpen(true);
    };

    const resetForm = () => {
        setEditingSubcategory(null);
        setFormData({
            name: "",
            slug: "",
            description: "",
            image_url: "",
            category_id: "",
            status: "active",
            display_order: 0,
        });
        setErrors({});
        setSlugManuallyEdited(false);
        setSearchQuery(""); // Clear search to show new items
    };

    if (adminLoading || loading) {
        return <AdminSkeleton variant="grid" />;
    }

    return (
        <div className="w-full mx-auto py-6 px-4 flex flex-col gap-6">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate("/admin/categories")}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Categories
                    </Button>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
                            Subcategories
                            <Badge variant="outline" className="text-xs font-medium bg-primary/5 rounded-lg border-primary/20">{filteredSubcategories.length} Total</Badge>
                        </h1>
                        <p className="text-xs sm:text-base text-muted-foreground mt-1">Manage product subcategories</p>
                    </div>
                </div>
                <Dialog open={dialogOpen} onOpenChange={(open) => {
                    setDialogOpen(open);
                    if (!open) resetForm();
                }}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Subcategory
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>{editingSubcategory ? "Edit Subcategory" : "Add Subcategory"}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="category_id">Parent Category *</Label>
                                    <Select
                                        value={formData.category_id}
                                        onValueChange={(value) => {
                                            setFormData({ ...formData, category_id: value });
                                            if (errors.category_id) setErrors({ ...errors, category_id: "" });
                                        }}
                                    >
                                        <SelectTrigger className={errors.category_id ? "border-destructive" : ""}>
                                            <SelectValue placeholder="Select a category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((cat) => (
                                                <SelectItem key={cat.id} value={cat.id}>
                                                    {cat.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.category_id && <p className="text-xs text-destructive">{errors.category_id}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="name">Subcategory Name *</Label>
                                    <Input
                                        id="name"
                                        placeholder="e.g. T-Shirts"
                                        value={formData.name}
                                        onChange={(e) => {
                                            setFormData({ ...formData, name: e.target.value });
                                            if (errors.name) setErrors({ ...errors, name: "" });
                                        }}
                                        className={errors.name ? "border-destructive" : ""}
                                    />
                                    {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="slug">URL Slug *</Label>
                                <Input
                                    id="slug"
                                    placeholder="mens-t-shirts"
                                    value={formData.slug}
                                    onChange={(e) => {
                                        setFormData({ ...formData, slug: e.target.value });
                                        if (errors.slug) setErrors({ ...errors, slug: "" });
                                    }}
                                    onBlur={() => setSlugManuallyEdited(true)}
                                    className={errors.slug ? "border-destructive" : ""}
                                />
                                {errors.slug && <p className="text-xs text-destructive">{errors.slug}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Describe this subcategory..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="status">Status *</Label>
                                    <Select
                                        value={formData.status}
                                        onValueChange={(value) => setFormData({ ...formData, status: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="inactive">Inactive</SelectItem>
                                            <SelectItem value="coming_soon">Coming Soon</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="display_order">Display Order</Label>
                                    <Input
                                        id="display_order"
                                        type="number"
                                        value={formData.display_order}
                                        onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                                        min="0"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={loading}>
                                    {loading ? "Saving..." : (editingSubcategory ? "Update" : "Create")}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>



            {/* Search Bar */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-2">
                <Input
                    placeholder="Search subcategories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-md bg-card border-border/60 shadow-sm"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSubcategories.map((subcategory) => (
                    <Card key={subcategory.id} className="hover:border-primary/50 transition-all group overflow-hidden">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-start justify-between gap-2">
                                <span className="text-base font-bold truncate group-hover:text-primary transition-colors">{subcategory.name}</span>
                                <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${subcategory.status === "active" ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" :
                                    subcategory.status === "coming_soon" ? "bg-amber-500/10 text-amber-600 border border-amber-500/20" :
                                        "bg-muted text-muted-foreground border border-border"
                                    }`}>
                                    {subcategory.status}
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-3">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 px-2.5 py-1.5 rounded-lg border border-border/40">
                                <Tag className="h-3.5 w-3.5" />
                                <span className="font-semibold text-foreground/80">{subcategory.parent?.name || subcategory.categories?.name || subcategory.category?.name || "No Category"}</span>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2.5em] leading-relaxed">
                                {subcategory.description || "No description provided for this subcategory."}
                            </p>
                            <div className="flex flex-col gap-1.5 mt-1">
                                <div className="flex justify-between text-[10px] text-muted-foreground font-mono bg-muted/20 px-2 py-1 rounded border border-border/20">
                                    <span className="opacity-60">SLUG</span>
                                    <span className="truncate max-w-[150px] font-medium">{subcategory.slug}</span>
                                </div>
                                <div className="flex justify-between text-[10px] text-muted-foreground font-mono bg-muted/20 px-2 py-1 rounded border border-border/20">
                                    <span className="opacity-60">SORT ORDER</span>
                                    <span className="font-medium">#{subcategory.display_order}</span>
                                </div>
                            </div>
                            <div className="flex gap-2 pt-3 mt-1 border-t border-border/40">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openEditDialog(subcategory)}
                                    className="flex-1 h-9 rounded-xl hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all"
                                >
                                    <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDelete(subcategory.id)}
                                    className="flex-1 h-9 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive transition-all"
                                >
                                    <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {subcategories.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center py-20 bg-muted/10 rounded-[32px] border-2 border-dashed border-border/40">
                    <div className="bg-muted/20 p-6 rounded-full mb-4">
                        <Tag className="h-12 w-12 text-muted-foreground/40" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground/80">
                        {categories.length > 0 ? "No Subcategories Configured" : "No Subcategories Yet"}
                    </h3>
                    <p className="text-muted-foreground mt-2 max-w-sm text-center">
                        {categories.length > 0
                            ? `You have ${categories.length} active categories, but no subcategories have been linked to them. Subcategories help customers filter products more effectively.`
                            : "The subcategory management system is empty. Start by creating your first subcategory for a product category."}
                    </p>
                    <Button
                        variant="link"
                        className="mt-4 text-primary font-bold"
                        onClick={() => setDialogOpen(true)}
                    >
                        Create your first subcategory
                    </Button>
                </div>
            )}

            {subcategories.length > 0 && filteredSubcategories.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 bg-muted/5 rounded-[32px] border border-border/20">
                    <div className="bg-muted/10 p-5 rounded-full mb-4">
                        <Tag className="h-10 w-10 text-muted-foreground/30" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground/70">No Matches Found</h3>
                    <p className="text-muted-foreground mt-2">
                        We couldn't find any subcategories matching "<span className="font-bold text-foreground/80">{searchQuery}</span>"
                    </p>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="mt-4 text-primary"
                        onClick={() => setSearchQuery("")}
                    >
                        Clear Search
                    </Button>
                </div>
            )}
        </div >
    );
}
