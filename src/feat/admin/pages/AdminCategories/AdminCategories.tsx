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

import { Pencil, Trash2, Plus, ArrowLeft, Upload, Info, ShoppingBag } from "lucide-react";
import { LoadingSpinner } from "@/shared/ui/LoadingSpinner";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  status: string;
  display_order: number;
}

export default function AdminCategories() {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    image_url: "",
    status: "active",
    display_order: 0,
  });

  // Auto-generate slug from name
  useEffect(() => {
    if (formData.name) {
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
      setFormData(prev => ({ ...prev, slug }));
    }
  }, [formData.name]);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate("/");
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchCategories();
    }
  }, [isAdmin]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load categories",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Category Name is required.";
    if (!formData.slug.trim()) newErrors.slug = "URL Slug is required.";
    // Check for valid slug characters
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
      let imageUrl = formData.image_url;

      // Handle Image Upload
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `categories/${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('products') // Reusing products bucket, standardizing
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('products')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      const categoryData = { ...formData, image_url: imageUrl };

      if (editingCategory) {
        const { error } = await supabase
          .from("categories")
          .update(categoryData)
          .eq("id", editingCategory.id);

        if (error) throw error;
        toast({ title: "Success", description: "Category updated successfully" });
      } else {
        const { error } = await supabase
          .from("categories")
          .insert([categoryData]);

        if (error) throw error;
        toast({ title: "Success", description: "Category created successfully" });
      }

      setDialogOpen(false);
      resetForm();
      fetchCategories();
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
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Success", description: "Category deleted successfully" });
      fetchCategories();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      image_url: category.image_url || "",
      status: category.status,
      display_order: category.display_order,
    });
    setImagePreview(category.image_url || null);
    setImageFile(null);
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingCategory(null);
    setFormData({
      name: "",
      slug: "",
      description: "",
      image_url: "",
      status: "active",
      display_order: 0,
    });
    setImagePreview(null);
    setImageFile(null);
    setErrors({});
  };

  if (adminLoading || loading) {
    return <AdminSkeleton variant="grid" />;
  }

  return (
    <div className="w-full mx-auto py-3 sm:py-6 lg:py-8 px-2 sm:px-4 lg:px-6 xl:px-8 flex flex-col gap-3 sm:gap-6 lg:gap-8 animate-in fade-in duration-500 pb-6 sm:pb-8 lg:pb-10">
      <div className="flex flex-col gap-3 sm:gap-6">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full xl:w-auto">
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-xl border-border/60 bg-card gap-2 font-medium text-xs w-fit justify-start shadow-sm"
              onClick={() => navigate("/admin")}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
                Category Management
                <span className="text-xs font-medium bg-primary/5 text-primary rounded-lg border border-primary/20 px-2 py-0.5">{categories.length} Total</span>
              </h1>
              <p className="text-xs sm:text-base text-muted-foreground mt-1">Organize product categories</p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full xl:w-auto">
            <Button
              variant="outline"
              onClick={() => navigate('/admin/subcategories')}
              className="flex-1 sm:flex-none h-10 rounded-xl font-bold text-xs bg-secondary hover:bg-secondary/80 shadow-sm gap-2"
            >
              <ShoppingBag className="h-4 w-4" />
              Manage Subcategories
            </Button>
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="flex-1 sm:flex-none h-10 rounded-xl font-bold text-xs bg-primary hover:bg-primary/90 shadow-md shadow-primary/20 gap-2">
                  <Plus className="h-4 w-4" />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingCategory ? "Edit Category" : "Add Category"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-6">
                    {/* Identity Section */}
                    <div className="space-y-4 border rounded-xl p-4 bg-muted/20">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-6 w-1 bg-primary rounded-full" />
                        <h3 className="font-semibold text-sm">Identity</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-xs font-medium text-muted-foreground">Category name *</Label>
                          <Input
                            id="name"
                            placeholder="e.g. Summer Collection"
                            value={formData.name}
                            onChange={(e) => {
                              setFormData({ ...formData, name: e.target.value });
                              if (errors.name) setErrors({ ...errors, name: "" });
                            }}
                            className={errors.name ? "border-destructive focus-visible:ring-destructive" : "bg-background"}
                          />
                          {errors.name && <p className="text-[10px] font-medium text-destructive mt-1">{errors.name}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="slug" className="text-xs font-medium text-muted-foreground flex items-center justify-between">
                            URL Slug
                            <span className="text-[10px] font-normal text-muted-foreground normal-case bg-muted px-2 py-0.5 rounded">Auto-generated</span>
                          </Label>
                          <div className="relative">
                            <Input
                              id="slug"
                              placeholder="summer-collection"
                              value={formData.slug}
                              onChange={(e) => {
                                setFormData({ ...formData, slug: e.target.value });
                                if (errors.slug) setErrors({ ...errors, slug: "" });
                              }}
                              className={`bg-muted/50 font-mono text-xs pl-8 border-dashed ${errors.slug ? "border-destructive focus-visible:ring-destructive" : ""}`}
                            />
                            <span className="absolute left-3 top-2.5 text-muted-foreground opacity-50">/</span>
                          </div>
                          {errors.slug && <p className="text-[10px] font-medium text-destructive mt-1">{errors.slug}</p>}
                          {!errors.slug && <p className="text-[10px] text-muted-foreground">The unique web address for this category.</p>}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description" className="text-xs font-medium text-muted-foreground">Description</Label>
                        <Textarea
                          id="description"
                          placeholder="Describe this category for SEO and customers..."
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          rows={3}
                          className="resize-none bg-background"
                        />
                      </div>
                    </div>

                    {/* Media Section */}
                    <div className="space-y-4 border rounded-xl p-4 bg-muted/20">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-6 w-1 bg-blue-500 rounded-full" />
                        <h3 className="font-semibold text-sm">Visual Assets</h3>
                      </div>
                      <div className="flex gap-4 items-start">
                        <div className="space-y-2 flex-1">
                          <Label className="text-xs font-medium text-muted-foreground">Category image</Label>
                          <div className="flex flex-col gap-2">
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setImageFile(file);
                                  setImagePreview(URL.createObjectURL(file));
                                }
                              }}
                              className="cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                            />
                            <p className="text-[10px] text-muted-foreground">Upload a high-quality image (JPG, PNG, WEBP). This will appear on the home page.</p>
                          </div>
                        </div>
                        <div className="h-24 w-24 rounded-lg border border-dashed border-border flex items-center justify-center bg-background overflow-hidden shrink-0 relative group">
                          {imagePreview || formData.image_url ? (
                            <>
                              <img
                                src={imagePreview || formData.image_url}
                                alt="Preview"
                                className="h-full w-full object-cover"
                              />
                            </>
                          ) : (
                            <span className="text-[10px] text-muted-foreground text-center p-2">No Image</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Settings Section */}
                    <div className="space-y-4 border rounded-xl p-4 bg-muted/20">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-6 w-1 bg-amber-500 rounded-full" />
                        <h3 className="font-semibold text-sm">Configuration</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="status" className="text-xs font-medium text-muted-foreground">Visibility status *</Label>
                          <Select
                            value={formData.status}
                            onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                          >
                            <SelectTrigger className="bg-background">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">
                                <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Active Live</span>
                              </SelectItem>
                              <SelectItem value="coming_soon">
                                <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-amber-500" /> Coming Soon</span>
                              </SelectItem>
                              <SelectItem value="disabled">
                                <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-slate-500" /> Disabled</span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="display_order" className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                            Sort Order
                            <div className="group relative">
                              <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-popover text-popover-foreground text-[10px] rounded shadow-lg w-40 hidden group-hover:block z-50 border">
                                Controls the order in which categories appear on the Home page and filters. Lower numbers appear first.
                              </div>
                            </div>
                          </Label>
                          <Input
                            id="display_order"
                            type="number"
                            value={formData.display_order}
                            onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                            className="bg-background"
                            min="0"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? "Saving..." : (editingCategory ? "Update" : "Create")}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-6">
        {categories.map((category) => (
          <Card key={category.id} className="group hover:border-primary/50 transition-all duration-300 bg-card borderFONborder/60 shadow-sm hover:shadow-md rounded-xl overflow-hidden">
            <CardHeader className="p-4 sm:p-5 pb-2">
              <CardTitle className="flex items-start justify-between gap-2">
                <span className="text-sm sm:text-base font-bold tracking-tight truncate pr-2">{category.name}</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border shrink-0 capitalize ${category.status === "active" ? "bg-emerald-500/5 text-emerald-600 border-emerald-500/20" :
                  category.status === "coming_soon" ? "bg-amber-500/5 text-amber-600 border-amber-500/20" :
                    "bg-muted/50 text-muted-foreground border-border/50"
                  }`}>
                  {category.status.replace("_", " ")}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 pt-2 flex flex-col gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2.5em]">{category.description || "No description provided."}</p>
                <div className="flex flex-col gap-1 mt-2">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono bg-muted/30 px-2 py-1 rounded-lg">
                    <span>Slug</span>
                    <span className="truncate max-w-[120px]">{category.slug}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono bg-muted/30 px-2 py-1 rounded-lg">
                    <span>Order</span>
                    <span>#{category.display_order}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-auto pt-2 border-t border-border/30">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openEditDialog(category)}
                  className="flex-1 h-8 text-xs font-bold rounded-xl hover:bg-primary/5 hover:text-primary border-border/40"
                >
                  <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(category.id)}
                  className="flex-1 h-8 text-xs font-bold rounded-xl shadow-sm shadow-destructive/20"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div >
  );
}
