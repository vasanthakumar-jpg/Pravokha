import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/infra/api/supabase";
import { useAdmin } from "@/core/context/AdminContext";
import { AdminSkeleton } from "@/feat/admin/components/AdminSkeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/Card";
import { Button } from "@/ui/Button";
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

    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        description: "",
        image_url: "",
        category_id: "",
        status: "active",
        display_order: 0,
    });

    // Auto-generate slug from name
    useEffect(() => {
        if (formData.name && !editingSubcategory) {
            const slug = formData.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)+/g, "");
            setFormData(prev => ({ ...prev, slug }));
        }
    }, [formData.name, editingSubcategory]);

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
            // Fetch categories
            const { data: categoriesData, error: categoriesError } = await supabase
                .from("categories")
                .select("id, name, slug")
                .order("display_order");

            if (categoriesError) throw categoriesError;
            setCategories(categoriesData || []);

            // Fetch subcategories with category info
            const { data: subcategoriesData, error: subcategoriesError } = await supabase
                .from("subcategories")
                .select("*, categories(name)")
                .order("display_order");

            if (subcategoriesError) throw subcategoriesError;
            setSubcategories(subcategoriesData || []);
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
                const { error } = await supabase
                    .from("subcategories")
                    .update(formData)
                    .eq("id", editingSubcategory.id);

                if (error) throw error;
                toast({ title: "Success", description: "Subcategory updated successfully" });
            } else {
                const { error } = await supabase
                    .from("subcategories")
                    .insert([formData]);

                if (error) throw error;
                toast({ title: "Success", description: "Subcategory created successfully" });
            }

            setDialogOpen(false);
            resetForm();
            fetchData();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this subcategory?")) return;

        try {
            const { error } = await supabase
                .from("subcategories")
                .delete()
                .eq("id", id);

            if (error) throw error;
            toast({ title: "Success", description: "Subcategory deleted successfully" });
            fetchData();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
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
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            Subcategory Management
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">{subcategories.length} Total</span>
                        </h1>
                        <p className="text-sm text-muted-foreground">Manage product subcategories within categories</p>
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {subcategories.map((subcategory) => (
                    <Card key={subcategory.id} className="hover:border-primary/50 transition-all">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-start justify-between gap-2">
                                <span className="text-base font-bold truncate">{subcategory.name}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${subcategory.status === "active" ? "bg-emerald-500/10 text-emerald-600" :
                                    subcategory.status === "coming_soon" ? "bg-amber-500/10 text-amber-600" :
                                        "bg-muted text-muted-foreground"
                                    }`}>
                                    {subcategory.status}
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-3">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded">
                                <Tag className="h-3 w-3" />
                                <span className="font-medium">{subcategory.categories?.name || "No Category"}</span>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2.5em]">
                                {subcategory.description || "No description provided."}
                            </p>
                            <div className="flex flex-col gap-1">
                                <div className="flex justify-between text-xs text-muted-foreground font-mono bg-muted/30 px-2 py-1 rounded">
                                    <span>SLUG</span>
                                    <span className="truncate max-w-[120px]">{subcategory.slug}</span>
                                </div>
                                <div className="flex justify-between text-xs text-muted-foreground font-mono bg-muted/30 px-2 py-1 rounded">
                                    <span>ORDER</span>
                                    <span>#{subcategory.display_order}</span>
                                </div>
                            </div>
                            <div className="flex gap-2 pt-2 border-t">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openEditDialog(subcategory)}
                                    className="flex-1"
                                >
                                    <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit
                                </Button>
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDelete(subcategory.id)}
                                    className="flex-1"
                                >
                                    <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
