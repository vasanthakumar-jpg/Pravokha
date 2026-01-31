import { useState, useEffect } from "react";
import { apiClient } from "@/infra/api/apiClient";
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
  productIds: string[];
  originalPrice: number;
  comboPrice: number;
  discountPercentage: number;
  active: boolean;
  startDate: string | null;
  endDate: string | null;
  imageUrl: string | null;
  createdAt: string;
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
    productIds: "",
    originalPrice: "",
    comboPrice: "",
    discountPercentage: "",
    startDate: "",
    endDate: "",
    imageUrl: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    // Only fetch offers after auth is complete and user is an admin
    if (!authLoading && user && (role === 'ADMIN' || role === 'admin')) {
      fetchOffers();
    }
  }, [authLoading, user, role]);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      console.log("[AdminComboOffers] Fetching offers...");
      const { data } = await apiClient.get('/combo-offers');
      console.log("[AdminComboOffers] API Response:", data);

      // Standardize response extraction and map fields to ensure non-null values
      const rawOffers = data.comboOffers || data.data || data || [];

      if (!Array.isArray(rawOffers)) {
        console.error("[AdminComboOffers] Invalid data format received:", rawOffers);
        throw new Error("Invalid data format received from API");
      }

      const mappedOffers = rawOffers.map((offer: any) => ({
        ...offer,
        productIds: Array.isArray(offer.productIds) ? offer.productIds : [],
        originalPrice: offer.originalPrice || 0,
        comboPrice: offer.comboPrice || 0,
        discountPercentage: offer.discountPercentage || 0,
        startDate: offer.startDate || null,
        endDate: offer.endDate || null,
        imageUrl: offer.imageUrl || null
      }));
      setOffers(mappedOffers);
      console.log("[AdminComboOffers] Offers state updated:", mappedOffers.length);
    } catch (err: any) {
      console.error("[AdminComboOffers] Error fetching offers:", err);
      toast({
        title: "Error",
        description: "Failed to fetch combo offers. Check console for details.",
        variant: "destructive",
      });
    } finally {
      console.log("[AdminComboOffers] Fetch complete, setting loading to false");
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: "Invalid File", description: "Please upload an image file.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File Too Large", description: "Max 5MB.", variant: "destructive" });
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('files', file);

      const { data } = await apiClient.post('/uploads/multiple', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (data?.urls?.[0]) {
        setFormData(prev => ({ ...prev, imageUrl: data.urls[0] }));
        toast({ title: "✓ Asset Uploaded", description: "Thumbnail ready." });
      }

      e.target.value = '';
    } catch (error: any) {
      console.error('Image upload error:', error);
      toast({ title: "Upload Failed", description: "Failed to upload image.", variant: "destructive" });
      e.target.value = '';
    } finally {
      setUploading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = "Title is required.";
    if (!formData.description.trim()) newErrors.description = "Description is required.";

    if (!formData.productIds.trim()) {
      newErrors.productIds = "At least one Product ID is required.";
    } else {
      const ids = formData.productIds.split(",").map(s => s.trim());
      if (ids.some(id => !id)) newErrors.productIds = "Invalid Product ID format.";
    }

    if (!formData.originalPrice || parseFloat(formData.originalPrice) <= 0) {
      newErrors.originalPrice = "Original price must be greater than 0.";
    }
    if (!formData.comboPrice || parseFloat(formData.comboPrice) <= 0) {
      newErrors.comboPrice = "Combo price must be greater than 0.";
    }
    if (parseFloat(formData.comboPrice) >= parseFloat(formData.originalPrice)) {
      newErrors.comboPrice = "Combo price must be less than original price.";
    }

    if (!formData.discountPercentage || parseInt(formData.discountPercentage) <= 0 || parseInt(formData.discountPercentage) >= 100) {
      newErrors.discountPercentage = "Discount must be between 1 and 99.";
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
        productIds: formData.productIds.split(",").map(id => id.trim()),
        originalPrice: parseFloat(formData.originalPrice),
        comboPrice: parseFloat(formData.comboPrice),
        discountPercentage: parseInt(formData.discountPercentage),
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        imageUrl: formData.imageUrl || null,
        active: true,
      };

      if (editingOffer) {
        await apiClient.put(`/combo-offers/${editingOffer.id}`, offerData);
        toast({ title: "Success!", description: "Combo offer updated successfully" });
      } else {
        await apiClient.post('/combo-offers', offerData);
        toast({ title: "Success!", description: "Combo offer created successfully" });
      }

      setDialogOpen(false);
      resetForm();
      fetchOffers();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (offer: ComboOffer) => {
    // Optimistic update
    const previousOffers = [...offers];
    setOffers(offers.map(o =>
      o.id === offer.id ? { ...o, active: !o.active } : o
    ));

    try {
      await apiClient.patch(`/combo-offers/${offer.id}/status`, { active: !offer.active });
      toast({ title: "Success!", description: `Offer ${!offer.active ? "activated" : "deactivated"}` });
      // No fetch needed if successful
    } catch (error) {
      // Revert on error
      setOffers(previousOffers);
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this combo offer?")) return;
    try {
      await apiClient.delete(`/combo-offers/${id}`);
      toast({ title: "Success!", description: "Offer deleted successfully" });
      fetchOffers();
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete offer", variant: "destructive" });
    }
  };

  const handleEdit = (offer: ComboOffer) => {
    setEditingOffer(offer);
    setFormData({
      title: offer.title,
      description: offer.description,
      productIds: offer.productIds.join(", "),
      originalPrice: offer.originalPrice.toString(),
      comboPrice: offer.comboPrice.toString(),
      discountPercentage: offer.discountPercentage.toString(),
      startDate: offer.startDate ? offer.startDate.split('T')[0] : "",
      endDate: offer.endDate ? offer.endDate.split('T')[0] : "",
      imageUrl: offer.imageUrl || "",
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingOffer(null);
    setFormData({
      title: "",
      description: "",
      productIds: "",
      originalPrice: "",
      comboPrice: "",
      discountPercentage: "",
      startDate: "",
      endDate: "",
      imageUrl: "",
    });
    setErrors({});
  };

  console.log("[AdminComboOffers] Render - loading:", loading, "authLoading:", authLoading, "offers:", offers.length);

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
              className="h-9 rounded-xl border-border/60 bg-card gap-2 font-medium text-xs w-fit justify-start shadow-sm"
              onClick={() => navigate("/admin")}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
                Combo Offers
                <span className="text-xs font-medium bg-primary/5 text-primary rounded-lg border border-primary/20 px-2 py-0.5">{offers.length} Total</span>
              </h1>
              <p className="text-xs sm:text-base text-muted-foreground mt-1">Create product bundles</p>
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
                    <Label htmlFor="productIds">Product IDs (comma-separated) *</Label>
                    <Input
                      id="productIds"
                      value={formData.productIds}
                      onChange={(e) => {
                        setFormData({ ...formData, productIds: e.target.value });
                        if (errors.productIds) setErrors({ ...errors, productIds: "" });
                      }}
                      placeholder="e.g., tshirt-black, tshirt-white, tshirt-navy"
                      className={errors.productIds ? "border-destructive focus-visible:ring-destructive" : ""}
                    />
                    {errors.productIds && <p className="text-[10px] font-medium text-destructive mt-1">{errors.productIds}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="originalPrice">Original Price *</Label>
                      <Input
                        id="originalPrice"
                        type="number"
                        step="0.01"
                        value={formData.originalPrice}
                        onChange={(e) => {
                          setFormData({ ...formData, originalPrice: e.target.value });
                          if (errors.originalPrice) setErrors({ ...errors, originalPrice: "" });
                        }}
                        className={errors.originalPrice ? "border-destructive focus-visible:ring-destructive" : ""}
                      />
                      {errors.originalPrice && <p className="text-[10px] font-medium text-destructive mt-1">{errors.originalPrice}</p>}
                    </div>

                    <div>
                      <Label htmlFor="comboPrice">Combo Price *</Label>
                      <Input
                        id="comboPrice"
                        type="number"
                        step="0.01"
                        value={formData.comboPrice}
                        onChange={(e) => {
                          setFormData({ ...formData, comboPrice: e.target.value });
                          if (errors.comboPrice) setErrors({ ...errors, comboPrice: "" });
                        }}
                        className={errors.comboPrice ? "border-destructive focus-visible:ring-destructive" : ""}
                      />
                      {errors.comboPrice && <p className="text-[10px] font-medium text-destructive mt-1">{errors.comboPrice}</p>}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="discountPercentage">Discount % *</Label>
                    <Input
                      id="discountPercentage"
                      type="number"
                      value={formData.discountPercentage}
                      onChange={(e) => {
                        setFormData({ ...formData, discountPercentage: e.target.value });
                        if (errors.discountPercentage) setErrors({ ...errors, discountPercentage: "" });
                      }}
                      className={errors.discountPercentage ? "border-destructive focus-visible:ring-destructive" : ""}
                    />
                    {errors.discountPercentage && <p className="text-[10px] font-medium text-destructive mt-1">{errors.discountPercentage}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="endDate">End Date</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label>Hero Visual Asset</Label>
                    <div className="flex items-center gap-4">
                      {formData.imageUrl ? (
                        <div className="relative h-24 w-24 rounded-2xl overflow-hidden border-2 border-primary/20 shadow-lg group">
                          <img src={formData.imageUrl} alt="Combo Preview" className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                          <button
                            type="button"
                            onClick={() => setFormData(p => ({ ...p, imageUrl: "" }))}
                            className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-5 w-5 text-white" />
                          </button>
                        </div>
                      ) : (
                        <Label className="h-24 w-24 border-2 border-dashed border-border/50 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/50 hover:border-primary/30 transition-all">
                          {uploading ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <Upload className="h-6 w-6 text-muted-foreground" />}
                          <span className="text-xs font-medium text-muted-foreground text-center px-2">Upload asset</span>
                          <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                        </Label>
                      )}
                      <div className="flex-1 space-y-2">
                        <Label htmlFor="imageUrl" className="text-xs font-medium text-muted-foreground">Manual URL override</Label>
                        <Input
                          id="imageUrl"
                          type="text"
                          value={formData.imageUrl}
                          onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                          placeholder="https://... or /uploads/..."
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
              <Card key={offer.id} className="group flex flex-col overflow-hidden bg-card border-border/60 hover:shadow-lg transition-all duration-300 rounded-xl">
                {/* Image Section */}
                <div className="relative h-48 bg-muted/30 overflow-hidden border-b border-border/40">
                  {offer.imageUrl ? (
                    <img
                      src={offer.imageUrl}
                      alt={offer.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <ImageIcon className="h-10 w-10 mb-2 opacity-50" />
                      <span className="text-xs font-medium">No image</span>
                    </div>
                  )}
                  <div className="absolute top-3 right-3 flex gap-2">
                    <Badge variant={offer.active ? "default" : "secondary"} className={`${offer.active ? "bg-emerald-500 text-white hover:bg-emerald-600" : "bg-gray-500 text-white"} shadow-sm border-0`}>
                      {offer.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="absolute bottom-3 left-3">
                    <Badge variant="secondary" className="bg-background text-foreground font-bold shadow-sm border border-border/40">
                      {offer.discountPercentage}% OFF
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
                      <p className="text-xs text-muted-foreground font-medium">Bundle price</p>
                      <p className="text-sm font-bold text-emerald-600">₹{offer.comboPrice}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground font-medium">Items</p>
                      <p className="text-sm font-medium">{offer.productIds.length}</p>
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
