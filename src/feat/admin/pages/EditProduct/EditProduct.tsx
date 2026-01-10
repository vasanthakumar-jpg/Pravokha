import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/Card";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { Label } from "@/ui/Label";
import { Textarea } from "@/ui/Textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/Select";
import { Badge } from "@/ui/Badge";
import { useToast } from "@/shared/hook/use-toast";
import { ArrowLeft, Upload, X, Plus, Image as ImageIcon, Loader2 } from "lucide-react";
import { categories, SIZES, COLORS } from "@/data/products";
import { apiClient } from "@/infra/api/apiClient";
import { useAuth } from "@/core/context/AuthContext";
import { AdminHeaderSkeleton, AdminFormSkeleton } from "@/feat/admin/components/AdminSkeleton";
import { motion, AnimatePresence } from "framer-motion";

interface ColorOption {
  name: string;
  hex: string;
}

interface ProductFormData {
  title: string;
  description: string;
  category: string;
  price: string;
  discountPrice: string;
  discountPercentage: string;
  stockQuantity: string;  // Keep for total calculation
  selectedColors: ColorOption[];
  selectedSizes: string[];
  sizeStock: Record<string, number>;  // NEW: Per-size stock quantities
  images: File[];
  imagePreviews: string[];
  existingImages: string[];
}

const INITIAL_FORM_DATA: ProductFormData = {
  title: "",
  description: "",
  category: "",
  price: "",
  discountPrice: "",
  discountPercentage: "",
  stockQuantity: "0",
  selectedColors: [],
  selectedSizes: [],
  sizeStock: {},  // NEW: Initialize empty
  images: [],
  imagePreviews: [],
  existingImages: [],
};

export default function EditProduct() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState<ProductFormData>(INITIAL_FORM_DATA);
  const [customSize, setCustomSize] = useState("");
  const [customColor, setCustomColor] = useState({ name: "", hex: "#000000" });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [primaryImageIndex, setPrimaryImageIndex] = useState(0);

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;

      try {
        console.log(`[EditProduct] Fetching product: ${id}`);
        const response = await apiClient.get(`/admin/products/${id}`);
        const productData = response.data.product;

        if (!productData) throw new Error("Product data not found");

        // Extract colors and sizes from variants
        const colors: ColorOption[] = [];
        const sizes: string[] = [];
        const existingImages: string[] = [];

        if (productData.product_variants && productData.product_variants.length > 0) {
          productData.product_variants.forEach((variant: any) => {
            // Collect colors
            if (!colors.some(c => c.name === variant.color_name)) {
              colors.push({
                name: variant.color_name,
                hex: variant.color_hex
              });
            }

            // Collect images
            if (variant.images) {
              variant.images.forEach((img: string) => {
                if (!existingImages.includes(img)) {
                  existingImages.push(img);
                }
              });
            }

            // Collect sizes
            if (variant.product_sizes) {
              variant.product_sizes.forEach((sizeObj: any) => {
                if (!sizes.includes(sizeObj.size)) {
                  sizes.push(sizeObj.size);
                }
              });
            }
          });
        }

        // Calculate total stock and build per-size stock map
        let totalStock = 0;
        const sizeStockMap: Record<string, number> = {};

        if (productData.product_variants) {
          productData.product_variants.forEach((variant: any) => {
            if (variant.product_sizes) {
              variant.product_sizes.forEach((sizeObj: any) => {
                const size = sizeObj.size;
                const stock = sizeObj.stock || 0;

                // Sum up stock across all color variants for each size
                if (sizeStockMap[size]) {
                  sizeStockMap[size] += stock;
                } else {
                  sizeStockMap[size] = stock;
                }
                totalStock += stock;
              });
            }
          });
        }

        // Calculate initial percentage
        let initialPercentage = "";
        if (productData.price && productData.discount_price) {
          initialPercentage = Math.round(((productData.price - productData.discount_price) / productData.price) * 100).toString();
        }

        setFormData({
          title: productData.title || "",
          description: productData.description || "",
          category: productData.category || "",
          price: productData.price?.toString() || "",
          discountPrice: productData.discount_price?.toString() || "",
          discountPercentage: initialPercentage,
          stockQuantity: totalStock.toString(),
          selectedColors: colors,
          selectedSizes: sizes,
          sizeStock: sizeStockMap,  // NEW: Load per-size stock
          images: [],
          imagePreviews: [],
          existingImages: existingImages,
        });

      } catch (error: any) {
        console.error("Error fetching product:", error);
        toast({
          title: "Error",
          description: "Failed to load product",
          variant: "destructive",
        });
        navigate("/admin/products");
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading) {
      fetchProduct();
    }
  }, [id, authLoading]);

  // Price calculation handlers
  const handlePriceChange = (value: string) => {
    setFormData(prev => {
      const price = Number(value);
      const percentage = Number(prev.discountPercentage);
      let newDiscountPrice = prev.discountPrice;

      if (price > 0 && percentage > 0) {
        newDiscountPrice = Math.round(price - (price * percentage / 100)).toString();
      }

      return { ...prev, price: value, discountPrice: newDiscountPrice };
    });
  };

  const handlePercentageChange = (value: string) => {
    setFormData(prev => {
      const percentage = Number(value);
      const price = Number(prev.price);
      let newDiscountPrice = prev.discountPrice;

      if (price > 0 && value !== "") {
        newDiscountPrice = Math.round(price - (price * percentage / 100)).toString();
      }

      return { ...prev, discountPercentage: value, discountPrice: newDiscountPrice };
    });
  };

  const handleDiscountPriceChange = (value: string) => {
    setFormData(prev => {
      const discountPrice = Number(value);
      const price = Number(prev.price);
      let newPercentage = prev.discountPercentage;

      if (price > 0 && value !== "") {
        newPercentage = Math.round(((price - discountPrice) / price) * 100).toString();
      }

      return { ...prev, discountPrice: value, discountPercentage: newPercentage };
    });
  };

  // Image upload handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));

      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...newFiles],
        imagePreviews: [...prev.imagePreviews, ...newPreviews],
      }));

      toast({
        title: "Images uploaded",
        description: `${newFiles.length} image(s) added`,
      });
    }
  };

  const removeNewImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
      imagePreviews: prev.imagePreviews.filter((_, i) => i !== index),
    }));
  };

  const removeExistingImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      existingImages: prev.existingImages.filter((_, i) => i !== index),
    }));
  };

  // Size management with per-size stock
  const toggleSize = (size: string) => {
    setFormData(prev => {
      const isRemoving = prev.selectedSizes.includes(size);
      const newSizes = isRemoving
        ? prev.selectedSizes.filter(s => s !== size)
        : [...prev.selectedSizes, size];

      // Update sizeStock - preserve existing value or initialize with 0
      const newSizeStock = { ...prev.sizeStock };
      if (isRemoving) {
        delete newSizeStock[size];
      } else if (!newSizeStock[size]) {
        newSizeStock[size] = 0;  // Initialize with 0 if new
      }

      return {
        ...prev,
        selectedSizes: newSizes,
        sizeStock: newSizeStock
      };
    });
  };

  const addCustomSize = () => {
    if (customSize.trim() && !formData.selectedSizes.includes(customSize.trim())) {
      setFormData(prev => ({
        ...prev,
        selectedSizes: [...prev.selectedSizes, customSize.trim()],
      }));
      setCustomSize("");
      toast({
        title: "Custom size added",
        description: `Size "${customSize.trim()}" has been added`,
      });
    }
  };

  const handleSizeStockChange = (size: string, value: string) => {
    if (value === '' || /^\d+$/.test(value)) {
      setFormData(prev => ({
        ...prev,
        sizeStock: {
          ...prev.sizeStock,
          [size]: value === '' ? 0 : parseInt(value)
        }
      }));
    }
  };

  // Color management
  const toggleColor = (colorKey: string) => {
    const color = COLORS[colorKey as keyof typeof COLORS];
    const colorName = colorKey.charAt(0).toUpperCase() + colorKey.slice(1);
    const isSelected = formData.selectedColors.some(c => c.name === colorName);

    if (isSelected) {
      setFormData(prev => ({
        ...prev,
        selectedColors: prev.selectedColors.filter(c => c.name !== colorName),
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        selectedColors: [...prev.selectedColors, { name: colorName, hex: color }],
      }));
    }
  };

  const addCustomColor = () => {
    if (customColor.name.trim() && customColor.hex) {
      const exists = formData.selectedColors.some(c => c.name === customColor.name);

      if (!exists) {
        setFormData(prev => ({
          ...prev,
          selectedColors: [...prev.selectedColors, { name: customColor.name, hex: customColor.hex }],
        }));
        setCustomColor({ name: "", hex: "#000000" });
        toast({
          title: "Custom color added",
          description: `Color "${customColor.name}" has been added`,
        });
      }
    }
  };

  const handleStockChange = (value: string) => {
    // Only allow empty string or positive whole numbers
    if (value === '' || /^\d+$/.test(value)) {
      setFormData(prev => ({ ...prev, stockQuantity: value }));
    }
  };

  const getStockStatus = () => {
    const totalStock = Number(formData.stockQuantity);
    if (totalStock === 0) return { text: "Out of Stock", variant: "destructive" as const };
    if (totalStock > 0 && totalStock < 10) return { text: "Low Stock", variant: "secondary" as const };
    return { text: "In Stock", variant: "default" as const };
  };

  // Validation
  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      toast({
        title: "Missing title",
        description: "Please enter a product title",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.description.trim()) {
      toast({
        title: "Missing description",
        description: "Please enter a product description",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.category) {
      toast({
        title: "Missing category",
        description: "Please select a category",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.price || Number(formData.price) <= 0) {
      toast({
        title: "Invalid price",
        description: "Please enter a valid price",
        variant: "destructive",
      });
      return false;
    }

    if (formData.selectedSizes.length === 0) {
      toast({
        title: "No sizes selected",
        description: "Please select at least one size for the product",
        variant: "destructive",
      });
      return false;
    }

    if (formData.existingImages.length === 0 && formData.images.length === 0) {
      toast({
        title: "No images",
        description: "Please keep or upload at least one product image",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  // Upload new images to backend
  const uploadNewImages = async (): Promise<string[]> => {
    if (formData.images.length === 0) return [];

    const uploadedUrls: string[] = [];
    const uploadFormData = new FormData();

    formData.images.forEach(image => {
      uploadFormData.append('files', image);
    });

    try {
      const response = await apiClient.post('/upload/multiple', uploadFormData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        return response.data.urls;
      }
      throw new Error("Upload failed");
    } catch (err) {
      console.error("Upload error:", err);
      throw new Error("Failed to upload product images.");
    }
  };

  const handleSaveChanges = async () => {
    if (!validateForm()) return;
    if (isSaving) return;

    setIsSaving(true);
    try {
      // 1. Upload new images if any
      const newImageUrls = await uploadNewImages();
      const allImageUrls = [...formData.existingImages, ...newImageUrls];

      // 2. Update product via backend
      const response = await apiClient.patch(`/admin/products/${id}`, {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        price: Number(formData.price),
        discountPrice: formData.discountPrice ? Number(formData.discountPrice) : null,
        images: allImageUrls,
        colors: formData.selectedColors,
        sizes: formData.selectedSizes,
        sizeStock: formData.sizeStock,
        published: true,
      });

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to update product");
      }

      toast({
        title: "Product updated!",
        description: "Your changes have been saved successfully.",
      });

      navigate("/admin/products");

    } catch (error: any) {
      console.error("Save error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save product",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };


  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 flex flex-col gap-8 pb-10">
        <AdminHeaderSkeleton />
        <AdminFormSkeleton />
      </div>
    );
  }

  const stockStatus = getStockStatus();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 flex flex-col gap-8 pb-10">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-xl border-border/60 bg-card gap-2 font-medium text-xs w-full sm:w-auto justify-start shadow-sm"
                onClick={() => navigate("/admin/products")}
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold">Edit Product</h1>
                <p className="text-sm sm:text-base text-muted-foreground mt-0.5">Update product details and marketplace parameters</p>
              </div>
            </div>
            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="w-full sm:w-auto h-10 rounded-xl bg-primary shadow-lg shadow-primary/20 font-bold text-xs"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Product Images */}
              <Card>
                <CardHeader>
                  <CardTitle>Product Images *</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Existing Images */}
                  {formData.existingImages.length > 0 && (
                    <div>
                      <Label className="text-sm mb-2 block">Current Images</Label>
                      <div className="grid grid-cols-4 gap-3">
                        {formData.existingImages.map((img, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={img}
                              alt={`Existing ${index + 1}`}
                              className="w-full h-24 object-cover rounded border-2 border-muted"
                            />
                            <Button
                              size="icon"
                              variant="destructive"
                              className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeExistingImage(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* New Images */}
                  {formData.imagePreviews.length > 0 && (
                    <div>
                      <Label className="text-sm mb-2 block">New Images</Label>
                      <div className="grid grid-cols-4 gap-3">
                        {formData.imagePreviews.map((preview, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={preview}
                              alt={`New ${index + 1}`}
                              className="w-full h-24 object-cover rounded border-2 border-primary"
                            />
                            <Button
                              size="icon"
                              variant="destructive"
                              className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeNewImage(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            <Badge className="absolute bottom-1 left-1 text-xs">New</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Upload Button */}
                  <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
                    <label htmlFor="images" className="cursor-pointer">
                      <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <span className="text-sm text-primary hover:underline">
                        Click to upload more images
                      </span>
                      <p className="text-xs text-muted-foreground mt-1">
                        Upload additional images (JPG, PNG, WebP)
                      </p>
                      <input
                        id="images"
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </label>
                  </div>
                </CardContent>
              </Card>

              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title">Product Title *</Label>
                    <Input
                      id="title"
                      placeholder="Enter product title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Enter product description"
                      rows={5}
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category">Category *</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.filter(c => c.id !== "all").map((cat) => (
                            <SelectItem key={cat.id} value={cat.slug}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="price">Price (₹) *</Label>
                        <Input
                          id="price"
                          type="number"
                          placeholder="0"
                          value={formData.price}
                          onChange={(e) => handlePriceChange(e.target.value)}
                        />
                      </div>

                      <div>
                        <Label htmlFor="discountPercentage">Discount (%)</Label>
                        <Input
                          id="discountPercentage"
                          type="number"
                          placeholder="0"
                          value={formData.discountPercentage}
                          onChange={(e) => handlePercentageChange(e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="discountPrice">Discount Price (Calculated)</Label>
                      <Input
                        id="discountPrice"
                        type="number"
                        placeholder="0"
                        value={formData.discountPrice}
                        onChange={(e) => handleDiscountPriceChange(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Final price after discount
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium">Stock Status:</span>
                    <Badge variant={stockStatus.variant}>{stockStatus.text}</Badge>
                    <span className="text-xs text-muted-foreground ml-auto">
                      Total: {Object.values(formData.sizeStock).reduce((sum, qty) => sum + qty, 0)} units
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Sizes and Colors - Side by side on desktop */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sizes */}
                <Card>
                  <CardHeader>
                    <CardTitle>Available Sizes *</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {SIZES.map((size) => (
                        <Button
                          key={size}
                          type="button"
                          variant={formData.selectedSizes.includes(size) ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleSize(size)}
                        >
                          {size}
                        </Button>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <Input
                        placeholder="Custom size (e.g., Free Size)"
                        value={customSize}
                        onChange={(e) => setCustomSize(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addCustomSize())}
                      />
                      <Button onClick={addCustomSize} variant="outline">
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>

                    {formData.selectedSizes.length > 0 && (
                      <div className="space-y-3 pt-3 border-t">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Stock Quantity per Size:</span>
                          <span className="text-xs text-muted-foreground">
                            Total: {Object.values(formData.sizeStock).reduce((sum, qty) => sum + qty, 0)} units
                          </span>
                        </div>
                        {formData.selectedSizes.map((size) => (
                          <div key={size} className="flex items-center gap-3">
                            <div className="flex items-center gap-2 flex-1">
                              <Label className="text-sm font-medium w-16">Size {size}:</Label>
                              <Input
                                type="number"
                                min="0"
                                placeholder="0"
                                value={formData.sizeStock[size] || 0}
                                onChange={(e) => handleSizeStockChange(size, e.target.value)}
                                className="w-24"
                              />
                              <span className="text-xs text-muted-foreground">units</span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleSize(size)}
                              className="h-8"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Colors */}
                <Card>
                  <CardHeader>
                    <CardTitle>Available Colors (Optional)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
                      {Object.entries(COLORS).map(([key, hex]) => {
                        const colorName = key.charAt(0).toUpperCase() + key.slice(1);
                        const isSelected = formData.selectedColors.some(c => c.name === colorName);
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => toggleColor(key)}
                            className={`relative h-6 w-6 rounded border-2 transition-all ${isSelected ? "border-primary ring-2 ring-primary ring-offset-1" : "border-muted hover:border-primary/50"
                              }`}
                            style={{ backgroundColor: hex }}
                            title={colorName}
                          >
                            {isSelected && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="h-3 w-3 rounded-full bg-white shadow-lg flex items-center justify-center">
                                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                </div>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <Input
                        placeholder="Color name"
                        value={customColor.name}
                        onChange={(e) => setCustomColor(prev => ({ ...prev, name: e.target.value }))}
                      />
                      <Input
                        type="color"
                        value={customColor.hex}
                        onChange={(e) => setCustomColor(prev => ({ ...prev, hex: e.target.value }))}
                        className="h-10"
                      />
                      <Button onClick={addCustomColor} variant="outline">
                        <Plus className="h-4 w-4 mr-1" />
                        Add Color
                      </Button>
                    </div>

                    {formData.selectedColors.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2 border-t">
                        <span className="text-sm text-muted-foreground">Selected:</span>
                        {formData.selectedColors.map((color) => (
                          <Badge key={color.name} variant="secondary" className="gap-2">
                            <div
                              className="h-3 w-3 rounded-full border"
                              style={{ backgroundColor: color.hex }}
                            />
                            {color.name}
                            <X
                              className="h-3 w-3 cursor-pointer"
                              onClick={() => setFormData(prev => ({
                                ...prev,
                                selectedColors: prev.selectedColors.filter(c => c.name !== color.name)
                              }))}
                            />
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Preview Card - Right Side */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <Card>
                  <CardHeader>
                    <CardTitle>Product Preview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {(formData.existingImages.length > 0 || formData.imagePreviews.length > 0) ? (
                      <img
                        src={formData.imagePreviews[0] || formData.existingImages[0]}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center">
                        <Upload className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}

                    <div>
                      <h3 className="font-semibold text-lg">
                        {formData.title || "Product Title"}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-3 mt-1">
                        {formData.description || "Product description will appear here..."}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold">₹{formData.price || 0}</span>
                    </div>

                    {formData.selectedColors.length > 0 && (
                      <div>
                        <span className="text-sm text-muted-foreground block mb-2">
                          Colors ({formData.selectedColors.length}):
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {formData.selectedColors.map((color) => (
                            <div
                              key={color.name}
                              className="h-6 w-6 rounded-full border-2"
                              style={{ backgroundColor: color.hex }}
                              title={color.name}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {formData.selectedSizes.length > 0 && (
                      <div>
                        <span className="text-sm text-muted-foreground block mb-2">
                          Sizes ({formData.selectedSizes.length}):
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {formData.selectedSizes.map((size) => (
                            <Badge key={size} variant="outline">
                              {size}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Stock:</span>
                        <span className="font-semibold">{formData.stockQuantity || 0} units</span>
                      </div>
                      <Badge variant={stockStatus.variant} className="w-full justify-center">
                        {stockStatus.text}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Bottom Save Button */}
          <div className="mt-6 flex justify-end gap-4 pb-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/admin/products")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
