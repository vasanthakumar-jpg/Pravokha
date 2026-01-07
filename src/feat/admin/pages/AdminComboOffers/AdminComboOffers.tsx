import { useState, useEffect } from "react";
import { supabase } from "@/infra/api/supabase";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { Label } from "@/ui/Label";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/Card";
import { useToast } from "@/shared/hook/use-toast";
import { Plus, Edit, Trash2, Check, X, Upload, ImageIcon, Loader2, ArrowLeft } from "lucide-react";
import { Badge } from "@/ui/Badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/ui/Dialog";
import { Textarea } from "@/ui/Textarea";
import { AdminHeaderSkeleton, AdminListSkeleton } from "@/feat/admin/components/AdminSkeleton";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/core/context/AuthContext";

interface ComboOffer {
  id: string;
  title: string;
  description: string;
  product_ids: string[];
  original_price: number;
  combo_price: number;
  discount_percentage: number;
  active: boolean;
  start_date: string | null;
  end_date: string | null;
  image_url: string | null;
  created_at: string;
}

export default function AdminComboOffers() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, role, loading: authLoading } = useAuth();
  const [offers, setOffers] = useState<ComboOffer[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<ComboOffer | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    product_ids: "",
    original_price: "",
    combo_price: "",
    discount_percentage: "",
    start_date: "",
    end_date: "",
    image_url: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    // Only fetch offers after auth is complete and user is an admin
    if (!authLoading && user && role === 'admin') {
      fetchOffers();
    }
  }, [authLoading, user, role]);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      console.log("[AdminComboOffers] Fetching combo offers...");

      const { data, error } = await supabase
        .from("combo_offers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[AdminComboOffers] Error fetching combo offers:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to fetch combo offers",
          variant: "destructive",
        });
      } else {
        console.log("[AdminComboOffers] Fetched offers:", data?.length || 0);
        setOffers(data || []);
      }
    } catch (err: any) {
      console.error("[AdminComboOffers] Exception fetching offers:", err);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please upload an image file.",
        variant: "destructive"
      });
      e.target.value = ''; // Reset input
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive"
      });
      e.target.value = ''; // Reset input
      return;
    }

    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `combo-thumbnails/${fileName}`;

      console.log('Starting upload:', filePath);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(uploadError.message || 'Failed to upload image');
      }

      console.log('Upload successful:', uploadData);

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      console.log('Public URL:', publicUrl);

      setFormData(prev => ({ ...prev, image_url: publicUrl }));
      toast({
        title: "✓ Asset Uploaded",
        description: "Thumbnail successfully uploaded and ready."
      });

      // Reset the input
      e.target.value = '';
    } catch (error: any) {
      console.error('Image upload error:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload image. Please try again.",
        variant: "destructive"
      });
      // Reset the input on error
      e.target.value = '';
    } finally {
      setUploading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = "Title is required.";
    if (!formData.description.trim()) newErrors.description = "Description is required.";

    if (!formData.product_ids.trim()) {
      newErrors.product_ids = "At least one Product ID is required.";
    } else {
      const ids = formData.product_ids.split(",").map(s => s.trim());
      if (ids.some(id => !id)) newErrors.product_ids = "Invalid Product ID format.";
    }

    if (!formData.original_price || parseFloat(formData.original_price) <= 0) {
      newErrors.original_price = "Original price must be greater than 0.";
    }
    if (!formData.combo_price || parseFloat(formData.combo_price) <= 0) {
      newErrors.combo_price = "Combo price must be greater than 0.";
    }
    if (parseFloat(formData.combo_price) >= parseFloat(formData.original_price)) {
      newErrors.combo_price = "Combo price must be less than original price.";
    }

    if (!formData.discount_percentage || parseInt(formData.discount_percentage) <= 0 || parseInt(formData.discount_percentage) >= 100) {
      newErrors.discount_percentage = "Discount must be between 1 and 99.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const offerData = {
        title: formData.title,
        description: formData.description,
        product_ids: formData.product_ids.split(",").map(id => id.trim()),
        original_price: parseFloat(formData.original_price),
        combo_price: parseFloat(formData.combo_price),
        discount_percentage: parseInt(formData.discount_percentage),
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        image_url: formData.image_url || null,
        active: true,
      };

      if (editingOffer) {
        const { error } = await supabase
          .from("combo_offers")
          .update(offerData)
          .eq("id", editingOffer.id);

        if (error) throw error;

        toast({
          title: "Success!",
          description: "Combo offer updated successfully",
        });
      } else {
        const { error } = await supabase
          .from("combo_offers")
          .insert([offerData]);

        if (error) throw error;

        toast({
          title: "Success!",
          description: "Combo offer created successfully",
        });
      }

      setDialogOpen(false);
      resetForm();
      fetchOffers();
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

  const handleToggleActive = async (offer: ComboOffer) => {
    const { error } = await supabase
      .from("combo_offers")
      .update({ active: !offer.active })
      .eq("id", offer.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update offer status",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success!",
        description: `Offer ${!offer.active ? "activated" : "deactivated"}`,
      });
      fetchOffers();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this combo offer?")) return;

    const { error } = await supabase
      .from("combo_offers")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete offer",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success!",
        description: "Offer deleted successfully",
      });
      fetchOffers();
    }
  };

  const handleEdit = (offer: ComboOffer) => {
    setEditingOffer(offer);
    setFormData({
      title: offer.title,
      description: offer.description,
      product_ids: offer.product_ids.join(", "),
      original_price: offer.original_price.toString(),
      combo_price: offer.combo_price.toString(),
      discount_percentage: offer.discount_percentage.toString(),
      start_date: offer.start_date ? offer.start_date.split('T')[0] : "",
      end_date: offer.end_date ? offer.end_date.split('T')[0] : "",
      image_url: offer.image_url || "",
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingOffer(null);
    setFormData({
      title: "",
      description: "",
      product_ids: "",
      original_price: "",
      combo_price: "",
      discount_percentage: "",
      start_date: "",
      end_date: "",
      image_url: "",
    });
    setErrors({});
  };

  // Show loading skeleton while auth is initializing
  if (authLoading) {
    return (
      <div className="w-full mx-auto py-3 sm:py-6 lg:py-8 px-2 sm:px-4 lg:px-6 xl:px-8 flex flex-col gap-4 sm:gap-6 lg:gap-8 animate-in fade-in duration-500 pb-20">
        <AdminHeaderSkeleton />
        <AdminListSkeleton count={3} />
      </div>
    );
  }

  return (
    <div className="w-full mx-auto py-3 sm:py-6 lg:py-8 px-2 sm:px-4 lg:px-6 xl:px-8 flex flex-col gap-4 sm:gap-6 lg:gap-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col gap-4 sm:gap-6">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full xl:w-auto">
            <Button
              variant="outline"
              size="sm"
              className="h-8 sm:h-9 rounded-xl border-border/40 bg-card/40 backdrop-blur-sm gap-2 font-bold text-xs w-fit justify-start"
              onClick={() => navigate("/admin")}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl lg:text-2xl font-bold flex items-center gap-2">
                Combo Offers
                <span className="text-[10px] font-bold tracking-tight bg-primary/5 text-primary rounded-lg border border-primary/20 px-1.5 py-0.5">{offers.length} Total</span>
              </h1>
              <p className="text-xs sm:text-sm lg:text-base text-muted-foreground mt-0.5">Create and curate platform product bundles</p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full xl:w-auto">
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="flex-1 sm:flex-none h-10 rounded-xl font-bold text-xs bg-primary hover:bg-primary/90 shadow-md shadow-primary/20 gap-2">
                  <Plus className="h-4 w-4" />
                  New Combo Offer
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingOffer ? "Edit Combo Offer" : "Create New Combo Offer"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => {
                        setFormData({ ...formData, title: e.target.value });
                        if (errors.title) setErrors({ ...errors, title: "" });
                      }}
                      className={errors.title ? "border-destructive focus-visible:ring-destructive" : ""}
                    />
                    {errors.title && <p className="text-[10px] font-medium text-destructive mt-1">{errors.title}</p>}
                  </div>

                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => {
                        setFormData({ ...formData, description: e.target.value });
                        if (errors.description) setErrors({ ...errors, description: "" });
                      }}
                      className={errors.description ? "border-destructive focus-visible:ring-destructive" : ""}
                    />
                    {errors.description && <p className="text-[10px] font-medium text-destructive mt-1">{errors.description}</p>}
                  </div>

                  <div>
                    <Label htmlFor="product_ids">Product IDs (comma-separated) *</Label>
                    <Input
                      id="product_ids"
                      value={formData.product_ids}
                      onChange={(e) => {
                        setFormData({ ...formData, product_ids: e.target.value });
                        if (errors.product_ids) setErrors({ ...errors, product_ids: "" });
                      }}
                      placeholder="e.g., tshirt-black, tshirt-white, tshirt-navy"
                      className={errors.product_ids ? "border-destructive focus-visible:ring-destructive" : ""}
                    />
                    {errors.product_ids && <p className="text-[10px] font-medium text-destructive mt-1">{errors.product_ids}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="original_price">Original Price *</Label>
                      <Input
                        id="original_price"
                        type="number"
                        step="0.01"
                        value={formData.original_price}
                        onChange={(e) => {
                          setFormData({ ...formData, original_price: e.target.value });
                          if (errors.original_price) setErrors({ ...errors, original_price: "" });
                        }}
                        className={errors.original_price ? "border-destructive focus-visible:ring-destructive" : ""}
                      />
                      {errors.original_price && <p className="text-[10px] font-medium text-destructive mt-1">{errors.original_price}</p>}
                    </div>

                    <div>
                      <Label htmlFor="combo_price">Combo Price *</Label>
                      <Input
                        id="combo_price"
                        type="number"
                        step="0.01"
                        value={formData.combo_price}
                        onChange={(e) => {
                          setFormData({ ...formData, combo_price: e.target.value });
                          if (errors.combo_price) setErrors({ ...errors, combo_price: "" });
                        }}
                        className={errors.combo_price ? "border-destructive focus-visible:ring-destructive" : ""}
                      />
                      {errors.combo_price && <p className="text-[10px] font-medium text-destructive mt-1">{errors.combo_price}</p>}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="discount_percentage">Discount % *</Label>
                    <Input
                      id="discount_percentage"
                      type="number"
                      value={formData.discount_percentage}
                      onChange={(e) => {
                        setFormData({ ...formData, discount_percentage: e.target.value });
                        if (errors.discount_percentage) setErrors({ ...errors, discount_percentage: "" });
                      }}
                      className={errors.discount_percentage ? "border-destructive focus-visible:ring-destructive" : ""}
                    />
                    {errors.discount_percentage && <p className="text-[10px] font-medium text-destructive mt-1">{errors.discount_percentage}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start_date">Start Date</Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="end_date">End Date</Label>
                      <Input
                        id="end_date"
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label>Hero Visual Asset</Label>
                    <div className="flex items-center gap-4">
                      {formData.image_url ? (
                        <div className="relative h-24 w-24 rounded-2xl overflow-hidden border-2 border-primary/20 shadow-lg group">
                          <img src={formData.image_url} alt="Combo Preview" className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                          <button
                            type="button"
                            onClick={() => setFormData(p => ({ ...p, image_url: "" }))}
                            className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-5 w-5 text-white" />
                          </button>
                        </div>
                      ) : (
                        <Label className="h-24 w-24 border-2 border-dashed border-border/50 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/50 hover:border-primary/30 transition-all">
                          {uploading ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <Upload className="h-6 w-6 text-muted-foreground" />}
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center px-2">Upload Asset</span>
                          <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                        </Label>
                      )}
                      <div className="flex-1 space-y-2">
                        <Label htmlFor="image_url" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Manual URL Override</Label>
                        <Input
                          id="image_url"
                          type="url"
                          value={formData.image_url}
                          onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                          placeholder="https://..."
                          className="h-10 rounded-xl bg-muted/30 border-border/50"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" disabled={loading} className="flex-1">
                      {loading ? "Saving..." : editingOffer ? "Update Offer" : "Create Offer"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setDialogOpen(false);
                        resetForm();
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <AdminListSkeleton count={3} />
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4"
          >
            {offers.map((offer) => (
              <Card key={offer.id} className="group flex flex-col overflow-hidden bg-card/40 backdrop-blur-xl border-border/40 hover:shadow-lg transition-all duration-300 rounded-2xl">
                {/* Image Section */}
                <div className="relative h-48 bg-muted/30 overflow-hidden border-b border-border/40">
                  {offer.image_url ? (
                    <img
                      src={offer.image_url}
                      alt={offer.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <ImageIcon className="h-10 w-10 mb-2 opacity-50" />
                      <span className="text-[10px] uppercase font-bold tracking-widest opacity-50">No Image</span>
                    </div>
                  )}
                  <div className="absolute top-3 right-3 flex gap-2">
                    <Badge variant={offer.active ? "default" : "secondary"} className={`${offer.active ? "bg-emerald-500 text-white hover:bg-emerald-600" : "bg-gray-500 text-white"} backdrop-blur-md shadow-sm`}>
                      {offer.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="absolute bottom-3 left-3">
                    <Badge variant="secondary" className="bg-background/80 backdrop-blur-md text-foreground font-bold shadow-sm border-0">
                      {offer.discount_percentage}% OFF
                    </Badge>
                  </div>
                </div>

                <CardHeader className="p-4 sm:p-5 pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-base sm:text-lg font-bold line-clamp-1" title={offer.title}>
                      {offer.title}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2.5em]">
                      {offer.description}
                    </p>
                  </div>
                </CardHeader>

                <CardContent className="p-4 sm:p-5 pt-0 flex flex-col flex-1 gap-4">
                  <div className="grid grid-cols-2 gap-2 mt-2 bg-muted/20 p-3 rounded-xl border border-border/50">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Bundle Price</p>
                      <p className="text-sm font-bold text-emerald-600">₹{offer.combo_price}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Items</p>
                      <p className="text-sm font-medium">{offer.product_ids.length}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-auto pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleActive(offer)}
                      className="flex-1 h-9 bg-background/50 border-input/50"
                    >
                      {offer.active ? <span className="text-amber-600 font-bold text-xs">Deactivate</span> : <span className="text-emerald-600 font-bold text-xs">Activate</span>}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 text-muted-foreground hover:text-foreground"
                      onClick={() => handleEdit(offer)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(offer.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {offers.length === 0 && (
              <div className="col-span-full">
                <Card className="border-dashed border-2 bg-muted/5">
                  <CardContent className="py-12 sm:py-20 flex flex-col items-center justify-center text-center">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Plus className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">No Combo Offers Yet</h3>
                    <p className="text-muted-foreground max-w-sm mb-6">Create your first product bundle to boost average order value.</p>
                    <Button onClick={() => { setDialogOpen(true); resetForm(); }}>
                      Create First Offer
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
