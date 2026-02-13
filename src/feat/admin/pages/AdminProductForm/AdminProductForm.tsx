import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AdminHeaderSkeleton, AdminFormSkeleton } from "@/feat/admin/components/AdminSkeleton";
import { motion, AnimatePresence } from "framer-motion";
import {
    Card, CardContent, CardHeader, CardTitle, CardDescription
} from "@/ui/Card";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { Label } from "@/ui/Label";
import { Textarea } from "@/ui/Textarea";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/ui/Select";
import { Switch } from "@/ui/Switch";
import { useToast } from "@/shared/hook/use-toast";
import {
    ArrowLeft, Upload, X, Plus, Save, Loader2, Package,
    Eye, Layout, Layers, Image as ImageIcon, Briefcase, Info, TrendingUp, Trash2,
    Shield,
    XCircle,
    Copy
} from "lucide-react";
import { SIZES, COLORS } from "@/data/products";
import { MARKETPLACE_FEE_PERCENTAGE, MAX_DISCOUNT_PERCENTAGE } from "@/lib/constants";
import { apiClient } from "@/infra/api/apiClient";
import { useAuth } from "@/core/context/AuthContext";
import { useAdmin } from "@/core/context/AdminContext";
import { Badge } from "@/ui/Badge";
import { cn } from "@/lib/utils";
import { CategoryInput } from "@/feat/products/components/CategoryInput";
import { Separator } from "@/ui/Separator";
import { ScrollArea } from "@/ui/ScrollArea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/Tabs";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/ui/AlertDialog";

// -- Types --
interface ColorOption {
    id: string; // Internal UUID for linkage
    name: string;
    hex: string;
}

interface ProductFormData {
    title: string;
    slug: string;
    sku: string;
    description: string;
    category: string; // Keep for backward compat (slug)
    selectedCategoryId: string; // UUID
    selectedSubcategoryId: string; // UUID
    price: string;
    discountPrice: string;
    stockQuantity: string;
    published: boolean;
    selectedColors: ColorOption[];
    selectedSizes: string[];
    sizeStock: Record<string, number>;
    unavailableVariants: string[];

    // Per-Variant Image State
    variantImages: Record<string, File[]>; // Key: ColorOption.id
    variantPreviews: Record<string, string[]>; // Key: ColorOption.id
    existingVariantImages: Record<string, string[]>; // Key: ColorOption.id
    imagesToDelete: string[]; // Cleanup queue

    is_verified?: boolean;
}

const INITIAL_FORM_DATA: ProductFormData = {
    title: "",
    slug: "",
    sku: "",
    description: "",
    category: "",
    selectedCategoryId: "",
    selectedSubcategoryId: "",
    price: "",
    discountPrice: "",
    stockQuantity: "0",
    published: false,
    selectedColors: [],
    selectedSizes: [],
    sizeStock: {},
    unavailableVariants: [],

    variantImages: {},
    variantPreviews: {},
    existingVariantImages: {},
    imagesToDelete: [],

    is_verified: false,
};

const getStockKey = (color: string, size: string) =>
    `${(color || '').trim().toUpperCase()}-${(size || '').trim().toUpperCase()}`;


export default function AdminProductForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { toast } = useToast();
    const { user, loading: authLoading } = useAuth();
    const { isAdmin, isSuperAdmin, loading: adminLoading } = useAdmin();

    const [formData, setFormData] = useState<ProductFormData>(INITIAL_FORM_DATA);
    const [isLoading, setIsLoading] = useState(true); // Always start with true while auth is loading
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState("general");
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [dbCategories, setDbCategories] = useState<{ id: string; name: string; slug: string; parentId?: string | null }[]>([]);
    const [dbSubcategories, setDbSubcategories] = useState<{ id: string; name: string; slug: string; category_id: string }[]>([]);
    const [isLoadingSubcategories, setIsLoadingSubcategories] = useState(false);
    const [subcategoryWarning, setSubcategoryWarning] = useState("");

    // Fetch categories and subcategories hierarchy
    useEffect(() => {
        const fetchHierarchy = async () => {
            try {
                const response = await apiClient.get('/categories/admin/all');
                setDbCategories(response.data.categories || []);

                const subResponse = await apiClient.get('/categories/subcategories');
                const subData = (subResponse.data.subcategories || []).map((sub: any) => ({
                    ...sub,
                    category_id: sub.parentId || sub.categoryId || sub.category_id || sub.category?.id || ""
                }));
                setDbSubcategories(subData);
            } catch (err) {
                console.error("[AdminProductForm] Error fetching hierarchy:", err);
            }
        };
        fetchHierarchy();
    }, []);

    // -- Fetch Product Data --
    useEffect(() => {
        const fetchProduct = async () => {
            if (!id) {
                setIsLoading(false);
                return;
            }

            try {
                console.log(`[AdminProductForm] Fetching product: ${id}`);
                const { data: response } = await apiClient.get(`/products/${id}`);
                console.log('[AdminProductForm] API Response structure:', {
                    success: response.success,
                    hasData: !!response.data,
                    dataType: typeof response.data
                });

                const product = response.data;
                console.log('[AdminProductForm] Product data:', {
                    id: product?.id,
                    title: product?.title,
                    hasVariants: !!product?.variants,
                    hasImages: !!product?.images
                });

                if (!product) {
                    toast({
                        title: "Product Not Found",
                        description: "This product may have been deleted or doesn't exist.",
                        variant: "destructive"
                    });
                    navigate('/admin/products');
                    return;
                }

                const colors: ColorOption[] = [];
                const sizes: string[] = [];
                const existingVariantImages: Record<string, string[]> = {};
                const sizeStockMap: Record<string, number> = {};
                let totalStock = 0;

                // SUPPORT BOTH CAMELCASE (Backend) AND SNAKE_CASE (Possible future standard)
                const variants = product.variants || product.product_variants || [];

                const parseImages = (imgs: any): string[] => {
                    let parsed: string[] = [];
                    if (Array.isArray(imgs)) parsed = imgs;
                    else if (typeof imgs === 'string') {
                        try {
                            const p = JSON.parse(imgs);
                            parsed = Array.isArray(p) ? p : [];
                        } catch (e) {
                            parsed = [];
                        }
                    }
                    // Filter out nulls, empty strings, and common placeholders
                    return parsed.filter(src => src && typeof src === 'string' && !src.includes('placeholder') && !src.includes('no-image'));
                };

                if (variants.length > 0) {
                    console.log('[AdminProductForm] Processing variants:', variants.length);
                    variants.forEach((v: any, vIdx: number) => {
                        console.log(`[AdminProductForm] Variant ${vIdx}:`, v);
                        // Stable ID logic - prefer existing database IDs
                        let colorId = v.id;
                        const colorName = v.colorName || v.color_name || "Standard";
                        const colorHex = v.colorHex || v.color_hex;

                        const variantImages = parseImages(v.images);

                        const existingColor = colors.find(c => c.name === colorName);

                        if (!existingColor) {
                            colors.push({
                                id: colorId,
                                name: colorName,
                                hex: colorHex
                            });
                            existingVariantImages[colorId] = variantImages;
                        } else {
                            colorId = existingColor.id;
                            variantImages.forEach((img: string) => {
                                if (!existingVariantImages[colorId].includes(img)) existingVariantImages[colorId].push(img);
                            });
                        }

                        const sizesData = v.sizes || v.product_sizes || [];
                        console.log(`[AdminProductForm] Variant ${vIdx} sizesData:`, sizesData);

                        if (sizesData.length > 0) {
                            sizesData.forEach((s: any) => {
                                const sizeValue = (s.size || "").trim().toUpperCase();
                                // Filter out "One Size" as requested and ensure valid value
                                if (sizeValue && !sizes.includes(sizeValue)) sizes.push(sizeValue);

                                const sizeKey = getStockKey(colorName, sizeValue);
                                // Ensure s.stock is a number
                                const stockVal = Number(s.stock) || 0;
                                sizeStockMap[sizeKey] = (sizeStockMap[sizeKey] || 0) + stockVal;
                                totalStock += stockVal;
                            });
                        }


                    });
                    console.log('[AdminProductForm] Final parsed sizes:', sizes);
                } else {
                    console.warn('[AdminProductForm] No variants found in product data');
                }

                // Reconstruction of Category/Subcategory hierarchy
                // If product.category has a parentId, it's a subcategory.
                const prodCatId = product.categoryId || product.category_id || product.category?.id || "";
                const prodParentId = product.category?.parentId || product.category?.parent_id || null;

                const selectedCatId = prodParentId ? prodParentId : prodCatId;
                const selectedSubCatId = prodParentId ? prodCatId : "";

                setFormData({
                    title: product.title || "",
                    slug: product.slug || "",
                    sku: product.sku || "",
                    description: product.description || "",
                    category: product.category?.slug || product.category || "",
                    selectedCategoryId: selectedCatId,
                    selectedSubcategoryId: selectedSubCatId,
                    price: (product.compare_at_price || product.compareAtPrice || product.price || product.base_price || "").toString(),
                    discountPrice: (product.compareAtPrice || product.compare_at_price) ? product.price.toString() : (product.discountPrice || product.discount_price || "").toString(),
                    stockQuantity: totalStock.toString(),
                    published: product.published ?? product.is_published ?? (product.status === 'ACTIVE'),
                    is_verified: product.isVerified ?? product.is_verified ?? false,
                    selectedColors: colors,
                    selectedSizes: sizes,
                    sizeStock: sizeStockMap,
                    unavailableVariants: [],

                    variantImages: {},
                    variantPreviews: {},
                    existingVariantImages: existingVariantImages,
                    imagesToDelete: [],
                });

            } catch (error: any) {
                console.error('[AdminProductForm] Error loading product:', error);
                console.error('[AdminProductForm] Error response:', error.response?.data);
                console.error('[AdminProductForm] Error status:', error.response?.status);

                if (error.response?.status === 404) {
                    toast({
                        title: "Product Not Found",
                        description: "This product doesn't exist in the database. Redirecting to products list...",
                        variant: "destructive"
                    });
                    setTimeout(() => navigate('/admin/products'), 2000);
                } else {
                    toast({
                        title: "Error Loading Product",
                        description: error.response?.data?.message || error.message || "Failed to load product data",
                        variant: "destructive"
                    });
                }
            } finally {
                setIsLoading(false);
            }
        };

        // Only fetch when auth and admin state are ready
        if (!authLoading && !adminLoading) {
            if (isAdmin) {
                fetchProduct();
            } else {
                console.warn("[AdminProductForm] Unauthorized access attempt.");
                navigate("/auth");
            }
        }
    }, [id, authLoading, adminLoading, isAdmin, navigate, toast]);

    // Pre-populate category ID after categories are loaded
    useEffect(() => {
        if (!formData.category || dbCategories.length === 0) return;

        const cat = dbCategories.find(c => c.slug === formData.category);
        if (cat && cat.id !== formData.selectedCategoryId) {
            console.log(`[AdminProductForm] Pre-populating category: ${cat.name} (${cat.id})`);
            setFormData(prev => ({ ...prev, selectedCategoryId: cat.id }));
        }
    }, [dbCategories, formData.category, formData.selectedCategoryId]);

    const handleChange = (field: keyof ProductFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Handle category change with subcategory reset
    const handleCategoryChange = (categoryId: string) => {
        const selectedCat = dbCategories.find(c => c.id === categoryId);
        handleChange('selectedCategoryId', categoryId);
        handleChange('category', selectedCat?.slug || '');
        handleChange('selectedSubcategoryId', ''); // Reset subcategory
        setSubcategoryWarning("");

        // Check if category has subcategories
        const hasSubcategories = dbSubcategories.some(s => s.category_id === categoryId);
        if (hasSubcategories) {
            setSubcategoryWarning("This category has subcategories. Please select one for better product organization.");
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, colorId: string) => {
        const files = e.target.files;
        if (files) {
            const newFiles = Array.from(files);
            const newPreviews = newFiles.map(file => URL.createObjectURL(file));
            setFormData(prev => ({
                ...prev,
                variantImages: {
                    ...prev.variantImages,
                    [colorId]: [...(prev.variantImages[colorId] || []), ...newFiles]
                },
                variantPreviews: {
                    ...prev.variantPreviews,
                    [colorId]: [...(prev.variantPreviews[colorId] || []), ...newPreviews]
                },
            }));
        }
    };

    const removeImage = (index: number, type: 'new' | 'existing', colorId: string) => {
        if (type === 'new') {
            setFormData(prev => ({
                ...prev,
                variantImages: {
                    ...prev.variantImages,
                    [colorId]: prev.variantImages[colorId]?.filter((_, i) => i !== index) || []
                },
                variantPreviews: {
                    ...prev.variantPreviews,
                    [colorId]: prev.variantPreviews[colorId]?.filter((_, i) => i !== index) || []
                }
            }));
        } else {
            setFormData(prev => {
                const imageToDelete = prev.existingVariantImages[colorId]?.[index];
                const newDeletedList = imageToDelete
                    ? [...prev.imagesToDelete, imageToDelete]
                    : prev.imagesToDelete;

                return {
                    ...prev,
                    existingVariantImages: {
                        ...prev.existingVariantImages,
                        [colorId]: prev.existingVariantImages[colorId]?.filter((_, i) => i !== index) || []
                    },
                    imagesToDelete: newDeletedList
                };
            });
        }
    };

    const toggleSelection = (list: any[], item: any, field: 'selectedSizes' | 'selectedColors') => {
        setFormData(prev => {
            const currentList = prev[field] as any[];
            let exists = false;

            if (field === 'selectedColors') {
                exists = currentList.some((c: any) => c.name === item.name || c.id === item.id);
            } else {
                exists = currentList.includes(item);
            }

            let newList;
            // For colors, if we are removing, we need to match by ID if present or name
            if (exists) {
                if (field === 'selectedColors') {
                    newList = currentList.filter((c: any) => c.id !== item.id && c.name !== item.name);
                } else {
                    newList = currentList.filter((i: any) => i !== item);
                }
            } else {
                newList = [...currentList, item];
            }
            return { ...prev, [field]: newList };
        });
    };

    const handleSave = async () => {
        const newErrors: Record<string, string> = {};

        // -- Robust Validation --
        if (!formData.title.trim()) {
            newErrors.title = "Product Title is mandatory for indexing.";
        }
        if (Number(formData.price) <= 0) {
            newErrors.price = "Economic constraint violation: Price must be greater than 0.";
        }
        // Basic validation
        if (!formData.title) newErrors.title = "Product title is required";
        if (!formData.price || Number(formData.price) <= 0) {
            newErrors.price = "Price is required and must be greater than 0.";
        }
        if (!formData.selectedCategoryId) {
            newErrors.category = "Category is required.";
        }

        // Optional subcategory validation - only if subcategories exist for this category
        const subcategoriesForCat = dbSubcategories.filter(s => s.category_id === formData.selectedCategoryId);
        if (subcategoriesForCat.length > 0 && !formData.selectedSubcategoryId) {
            newErrors.subcategory = "Please select a subcategory for better organization.";
        }

        if (formData.selectedColors.length === 0) {
            newErrors.colors = "At least one color must be selected.";
        }
        if (formData.selectedSizes.length === 0) {
            newErrors.sizes = "At least one size must be selected.";
        }

        // Validate Images per Variant
        let missingImages = false;
        formData.selectedColors.forEach(color => {
            const existing = formData.existingVariantImages[color.id] || [];
            const newImgs = formData.variantImages[color.id] || [];
            if (existing.length + newImgs.length < 4) {
                missingImages = true;
            }
        });

        if (missingImages) {
            newErrors.images = "Each color variant must have at least 4 images.";
            toast({ title: "Incomplete Gallery", description: "Each color variant must have at least 4 images to ensure quality standards.", variant: "destructive" });
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            toast({ title: "Validation Error", description: "Please check the highlighted fields.", variant: "destructive" });

            // Auto-switch to the tab with errors
            if (newErrors.title || newErrors.price || newErrors.category || newErrors.subcategory) setActiveTab("general");
            else if (newErrors.colors || newErrors.sizes) setActiveTab("inventory");
            else if (newErrors.images) setActiveTab("media");

            return;
        }

        setErrors({});
        setIsSaving(true);
        try {
            // 1. Prepare Variants Data
            const colors = formData.selectedColors.length > 0 ? formData.selectedColors : [];
            const variantsData = [];

            console.log('[handleSave] Selected Colors:', colors);
            console.log('[handleSave] Selected Sizes:', formData.selectedSizes);

            for (const color of colors) {
                // Upload New Images for this Color
                const colorFiles = formData.variantImages[color.id] || [];
                const uploadedUrls: string[] = [];

                if (colorFiles.length > 0) {
                    const uploadFormData = new FormData();
                    colorFiles.forEach(file => {
                        uploadFormData.append('files', file);
                    });

                    // Use backend upload endpoint
                    const { data: uploadResult } = await apiClient.post('/uploads/multiple', uploadFormData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });

                    if (uploadResult && uploadResult.urls) {
                        uploadedUrls.push(...uploadResult.urls);
                    }
                }

                const existingUrls = formData.existingVariantImages[color.id] || [];
                const finalImages = [...existingUrls, ...uploadedUrls];

                // Debug Key Generation
                const debugKey = getStockKey(color.name, formData.selectedSizes[0] || "");
                console.log(`[handleSave] Processing color ${color.name}. Sample Key: ${debugKey}`);

                const sizeEntries = formData.selectedSizes
                    .filter(size => {
                        const key = getStockKey(color.name, size);
                        const isUnavailable = formData.unavailableVariants?.includes(key);
                        return !isUnavailable;
                    })
                    .map(size => {
                        const key = getStockKey(color.name, size);
                        return {
                            size: size.toUpperCase().trim(),
                            stock: formData.sizeStock[key] || 0
                        };
                    });


                const variantObject = {
                    color_name: color.name,
                    color_hex: color.hex,
                    images: finalImages,
                    sizes: sizeEntries && sizeEntries.length > 0 ? sizeEntries : []
                };

                console.log(`[handleSave] Variant ${color.name} Object:`, variantObject);
                variantsData.push(variantObject);
            }


            const productPayload = {
                title: formData.title,
                slug: formData.slug || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                sku: formData.sku || `SKU-${Date.now()}`,
                description: formData.description,
                category: formData.category,
                categoryId: formData.selectedSubcategoryId || formData.selectedCategoryId, // Most specific ID
                price: Number(formData.price),
                discount_price: formData.discountPrice ? Number(formData.discountPrice) : null,
                published: formData.published,
                is_verified: formData.is_verified,
                seller_id: user?.id,
                variants: variantsData,
                adminEditReason: (isAdmin || isSuperAdmin)
                    ? "Admin Update via Dashboard"
                    : undefined
            };

            // CRITICAL DEBUG: Log the complete payload being sent
            console.log('[handleSave] FINAL PRODUCT PAYLOAD:', JSON.stringify(productPayload, null, 2));
            console.log('[handleSave] Variants count:', productPayload.variants.length);
            console.log('[handleSave] Total sizes across all variants:',
                productPayload.variants.reduce((total, v) => total + (v.sizes?.length || 0), 0));


            if (id) {
                console.log('[handleSave] Calling PUT with payload:', JSON.stringify(productPayload));
                await apiClient.put(`/products/${id}`, productPayload);
            } else {
                console.log('[handleSave] Calling POST with payload:', JSON.stringify(productPayload));
                await apiClient.post('/products', productPayload);
            }


            toast({ title: "Success", description: "Product saved successfully." });
            navigate("/admin/products/manage");
        } catch (error: any) {
            console.error("Save Error:", error);
            const msg = error.response?.data?.message || error.message || "An error occurred";
            toast({ title: "Save Failed", description: msg, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const discountAmount = Number(formData.price) - Number(formData.discountPrice);
    const discountPercent = Number(formData.price) > 0 ? Math.round((discountAmount / Number(formData.price)) * 100) : 0;
    const earnings = (Number(formData.discountPrice) || Number(formData.price)) * (1 - MARKETPLACE_FEE_PERCENTAGE);

    if (isLoading) return (
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 flex flex-col gap-8 pb-10">
            <AdminHeaderSkeleton />
            <AdminFormSkeleton />
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto py-4 sm:py-8 px-4 sm:px-6 lg:px-8 flex flex-col gap-6 sm:gap-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Sticky Top Bar (SAP-H v1 adaptation for Form) */}
            <div className="sticky top-0 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 bg-background/95 backdrop-blur-md border-b border-border/60 shadow-sm">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => navigate("/admin/products/manage")}
                            className="h-10 w-10 sm:h-9 sm:w-auto sm:px-3 rounded-xl border-border/60 bg-card gap-2 font-bold text-xs shadow-sm shrink-0"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            <span className="hidden sm:inline">Back</span>
                        </Button>
                        <div className="min-w-0 flex-1 sm:flex-none">
                            <h1 className="text-lg sm:text-2xl font-black tracking-tight flex items-center gap-2 truncate">
                                {id ? "Optimize Product" : "Initialize Matrix"}
                                <div className="shrink-0">
                                    {formData.published ? (
                                        <Badge className="bg-emerald-500 hover:bg-emerald-600 border-none px-2 py-0 text-[9px] font-black h-4 uppercase">LIVE</Badge>
                                    ) : (
                                        <Badge variant="secondary" className="px-2 py-0 text-[9px] font-black h-4 uppercase bg-muted/50">DRAFT</Badge>
                                    )}
                                </div>
                            </h1>
                            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 opacity-70 hidden xs:block">Product Management Matrix</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button
                            variant="outline"
                            onClick={() => {
                                if (id) {
                                    navigator.clipboard.writeText(id);
                                    toast({ title: "Copied!", description: "Product UUID copied to clipboard." });
                                }
                            }}
                            className="rounded-xl h-10 sm:h-11 w-10 sm:w-auto px-0 sm:px-4 border-dashed border-border/60 hover:bg-primary/5 hover:border-primary/30 transition-all font-bold text-xs"
                            title="Copy Product ID"
                        >
                            <span className="sr-only sm:not-sr-only sm:mr-2">ID</span>
                            <Copy className="h-4 w-4" />
                        </Button>

                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="outline" className="rounded-xl h-10 sm:h-11 flex-1 sm:flex-none border-border/60 hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/30 transition-all font-bold text-xs uppercase tracking-tight">
                                    Discard
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-card border-border/60 rounded-3xl shadow-2xl">
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="text-xl font-black tracking-tight">Discard Changes?</AlertDialogTitle>
                                    <AlertDialogDescription className="text-muted-foreground font-medium text-sm">
                                        All unsaved modifications to this product matrix will be terminated. This process is irreversible.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                                    <AlertDialogCancel className="rounded-xl border-border/50 font-bold w-full sm:w-auto">Continue Editing</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={() => navigate("/admin/products/manage")}
                                        className="rounded-xl bg-destructive text-white hover:bg-destructive/90 font-black shadow-lg shadow-destructive/20 w-full sm:w-auto"
                                    >
                                        Confirm Termination
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="rounded-xl h-10 sm:h-11 shadow-lg shadow-primary/20 flex-[2] sm:flex-none bg-primary text-primary-foreground font-black hover:scale-[1.02] active:scale-95 transition-all text-xs uppercase tracking-widest gap-2"
                        >
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Deploy
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left: Component Sections */}
                <div className="lg:col-span-8 space-y-8">
                    <Tabs defaultValue="general" className="w-full" onValueChange={setActiveTab}>
                        <TabsList className="bg-muted/50 p-1 rounded-2xl border border-border/50 w-full overflow-x-auto overflow-y-hidden flex-nowrap justify-start scrollbar-hide">
                            <TabsTrigger value="general" className="rounded-xl px-3 sm:px-4 md:px-6 py-2 data-[state=active]:bg-background transition-all flex items-center gap-1.5 sm:gap-2 shrink-0 text-xs sm:text-sm">
                                <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> <span>General</span>
                            </TabsTrigger>
                            <TabsTrigger value="inventory" className="rounded-xl px-3 sm:px-4 md:px-6 py-2 data-[state=active]:bg-background transition-all flex items-center gap-1.5 sm:gap-2 shrink-0 text-xs sm:text-sm">
                                <Layers className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> <span className="hidden xs:inline">Variants &</span> <span>Matrix</span>
                            </TabsTrigger>
                            <TabsTrigger value="media" className="rounded-xl px-3 sm:px-4 md:px-6 py-2 data-[state=active]:bg-background transition-all flex items-center gap-1.5 sm:gap-2 shrink-0 text-xs sm:text-sm">
                                <ImageIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Gallery
                            </TabsTrigger>
                        </TabsList>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="mt-6"
                            >
                                <TabsContent value="general" className="m-0 space-y-6">
                                    <Card className="border-border/50 bg-card/60 backdrop-blur-xl rounded-3xl overflow-hidden">
                                        <CardHeader>
                                            <CardTitle className="text-lg flex items-center gap-2 font-bold"><Shield className="h-5 w-5 text-primary" /> Authority & Status</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-border/40">
                                                <div className="space-y-0.5">
                                                    <Label className="text-sm font-bold">Public Release</Label>
                                                    <p className="text-[10px] text-muted-foreground font-medium">Toggle visibility on the main shopfront.</p>
                                                </div>
                                                <Switch
                                                    checked={formData.published}
                                                    onCheckedChange={v => handleChange('published', v)}
                                                />
                                            </div>

                                        </CardContent>
                                    </Card>
                                    <Card className="border-border/50 bg-card/60 backdrop-blur-xl overflow-hidden rounded-3xl">
                                        <CardHeader>
                                            <CardTitle className="text-lg flex items-center gap-2 font-bold"><Briefcase className="h-5 w-5 text-primary" /> Product Identity</CardTitle>
                                            <CardDescription>Core details that identify your product in the marketplace.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            <div className="grid gap-2">
                                                <Label className={cn("text-xs font-bold text-muted-foreground", errors.title && "text-rose-500")}>Product Title</Label>
                                                <Input
                                                    value={formData.title}
                                                    onChange={e => {
                                                        handleChange('title', e.target.value);
                                                        if (errors.title) setErrors(prev => ({ ...prev, title: "" }));
                                                    }}
                                                    placeholder="e.g. Atmosphere Tech Rain Jacket"
                                                    className={cn(
                                                        "rounded-xl border-border/50 h-11 text-base focus:ring-2 focus:ring-primary/20",
                                                        errors.title && "border-rose-500 bg-rose-500/5 focus:ring-rose-500/20"
                                                    )}
                                                />
                                                {errors.title && <p className="text-[10px] font-bold text-rose-500 animate-in fade-in slide-in-from-top-1">{errors.title}</p>}
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                                <div className="grid gap-2">
                                                    <Label className="text-xs font-bold text-muted-foreground">Slug (URL)</Label>
                                                    <Input
                                                        value={formData.slug}
                                                        onChange={e => handleChange('slug', e.target.value)}
                                                        placeholder="auto-generated-slug"
                                                        className="rounded-xl border-border/50 h-11 font-mono text-sm bg-muted/20"
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label className="text-xs font-bold text-muted-foreground">Global SKU</Label>
                                                    <Input
                                                        value={formData.sku}
                                                        onChange={e => handleChange('sku', e.target.value)}
                                                        placeholder="PRV-ATH-001"
                                                        className="rounded-xl border-border/50 h-11 font-mono text-sm"
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label className="text-xs font-bold text-muted-foreground">Description</Label>
                                                <Textarea
                                                    value={formData.description}
                                                    onChange={e => handleChange('description', e.target.value)}
                                                    rows={6}
                                                    className="rounded-2xl border-border/50 resize-none focus:ring-2 focus:ring-primary/20"
                                                    placeholder="Tell the story of this product..."
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label className={cn("text-xs font-bold text-muted-foreground", errors.category && "text-rose-500")}>Product Category *</Label>
                                                <Select
                                                    value={formData.selectedCategoryId}
                                                    onValueChange={handleCategoryChange}
                                                >
                                                    <SelectTrigger className={cn(
                                                        "rounded-xl border-border/50 h-11",
                                                        errors.category && "border-rose-500 bg-rose-500/5"
                                                    )}>
                                                        <SelectValue placeholder="Select a category" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {dbCategories
                                                            .filter(cat => !cat.parentId) // Only top-level categories
                                                            .map(cat => (
                                                                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                                            ))}
                                                    </SelectContent>
                                                </Select>
                                                {errors.category && <p className="text-[10px] font-bold text-rose-500 animate-in fade-in">{errors.category}</p>}
                                            </div>

                                            {formData.selectedCategoryId && (
                                                <div className="grid gap-2">
                                                    <Label className={cn("text-xs font-bold text-muted-foreground", errors.subcategory && "text-rose-500")}>
                                                        Subcategory *
                                                    </Label>
                                                    <Select
                                                        value={formData.selectedSubcategoryId}
                                                        onValueChange={(v) => {
                                                            handleChange('selectedSubcategoryId', v);
                                                            setSubcategoryWarning("");
                                                            if (errors.subcategory) setErrors(prev => ({ ...prev, subcategory: "" }));
                                                        }}
                                                        disabled={isLoadingSubcategories || !formData.selectedCategoryId}
                                                    >
                                                        <SelectTrigger className={cn(
                                                            "rounded-xl border-border/50 h-11",
                                                            errors.subcategory && "border-rose-500 bg-rose-500/5"
                                                        )}>
                                                            <SelectValue placeholder="Select a subcategory" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {dbSubcategories
                                                                .filter(sub => {
                                                                    // Robust check for different potential backend property names
                                                                    const subCatId = (sub as any).category_id || (sub as any).categoryId || (sub as any).parentId;
                                                                    return subCatId === formData.selectedCategoryId;
                                                                })
                                                                .map(sub => (
                                                                    <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                                                                ))
                                                            }
                                                        </SelectContent>
                                                    </Select>
                                                    {errors.subcategory && <p className="text-[10px] font-bold text-rose-500 animate-in fade-in">{errors.subcategory}</p>}
                                                    {subcategoryWarning && !errors.subcategory && (
                                                        <p className="text-[10px] font-medium text-amber-600 animate-in fade-in flex items-center gap-1">
                                                            <Info className="h-3 w-3" />
                                                            {subcategoryWarning}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="inventory" className="m-0 space-y-6">
                                    <Card className="border-border/50 bg-card/60 backdrop-blur-xl overflow-hidden rounded-3xl">
                                        <CardHeader>
                                            <CardTitle className="text-lg flex items-center gap-2 font-bold"><Layers className="h-5 w-5 text-primary" /> Variant Matrix</CardTitle>
                                            <CardDescription>Define the available configurations and their stock levels.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-8">
                                            {/* Color Palette */}
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <Label className={cn("text-sm font-bold tracking-wider text-muted-foreground", errors.colors && "text-rose-500")}>Color configurations</Label>
                                                    <Badge variant="outline" className="rounded-lg">{formData.selectedColors.length} Active</Badge>
                                                </div>
                                                {errors.colors && <p className="text-[10px] font-bold text-rose-500 -mt-2 animate-in fade-in slide-in-from-top-1">{errors.colors}</p>}
                                                <div className="flex flex-col sm:flex-row gap-2">
                                                    <Input
                                                        placeholder="Color Name (e.g. Onyx Black)"
                                                        id="new-color-name"
                                                        className="rounded-xl flex-1"
                                                    />
                                                    <div className="flex gap-2">
                                                        <Input
                                                            type="color"
                                                            id="new-color-hex"
                                                            className="w-12 h-10 p-1 rounded-xl cursor-pointer shrink-0 border-border/50"
                                                            defaultValue="#000000"
                                                        />
                                                        <Button
                                                            type="button"
                                                            onClick={() => {
                                                                const nameInput = document.getElementById('new-color-name') as HTMLInputElement;
                                                                const hexInput = document.getElementById('new-color-hex') as HTMLInputElement;
                                                                const name = nameInput.value.trim();
                                                                const hex = hexInput.value;

                                                                if (name) {
                                                                    const existing = formData.selectedColors.find(c => c.name.toLowerCase() === name.toLowerCase() || c.hex === hex);
                                                                    if (existing) {
                                                                        toast({ title: "Duplicate Color", description: "This color has already been added.", variant: "destructive" });
                                                                        return;
                                                                    }

                                                                    const newColor = { id: crypto.randomUUID(), name, hex };
                                                                    toggleSelection(formData.selectedColors, newColor, 'selectedColors');
                                                                    nameInput.value = "";
                                                                }
                                                            }}
                                                            className="rounded-xl bg-muted text-foreground hover:bg-muted/80 font-bold"
                                                        >
                                                            Connect
                                                        </Button>
                                                    </div>
                                                </div>
                                                <ScrollArea className="w-full pb-4">
                                                    <div className="flex flex-wrap gap-2">
                                                        {formData.selectedColors.map((color) => (
                                                            <Badge
                                                                key={color.id}
                                                                className="pl-1 pr-2 py-1 gap-2 bg-background border-border/50 text-foreground rounded-full hover:bg-muted group/color transition-all"
                                                            >
                                                                <div className="w-5 h-5 rounded-full border shadow-sm" style={{ backgroundColor: color.hex }} />
                                                                <span className="text-xs font-bold">{color.name}</span>
                                                                <button onClick={() => toggleSelection(formData.selectedColors, color, 'selectedColors')} className="hover:text-destructive opacity-50 group-hover/color:opacity-100 transition-opacity">
                                                                    <X className="h-3 w-3" />
                                                                </button>
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </ScrollArea>
                                                <Separator className="opacity-50" />
                                                <div>
                                                    <p className="text-[10px] font-bold tracking-widest text-muted-foreground mb-3">Quick inject</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {Object.entries(COLORS).map(([name, hex]) => {
                                                            const isSelected = formData.selectedColors.some(c => c.hex === hex);
                                                            if (isSelected) return null;
                                                            return (
                                                                <button
                                                                    key={name}
                                                                    onClick={() => toggleSelection(formData.selectedColors, { id: crypto.randomUUID(), name: name.charAt(0).toUpperCase() + name.slice(1), hex }, 'selectedColors')}
                                                                    className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-border/30 bg-muted/10 hover:bg-muted text-[10px] font-bold transition-all text-muted-foreground"
                                                                >
                                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: hex }} />
                                                                    {name.toUpperCase()}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Size Architecture */}
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <Label className={cn("text-sm font-bold tracking-wider text-muted-foreground", errors.sizes && "text-rose-500")}>Size architecture</Label>
                                                    <div className="flex items-center gap-2">
                                                        <Input
                                                            id="custom-size-input"
                                                            placeholder="Add size (e.g. 40, 42, 6Y)"
                                                            className="h-8 text-xs w-32 sm:w-40"
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    e.preventDefault();
                                                                    const input = e.currentTarget as HTMLInputElement;
                                                                    const rawVal = input.value.trim();

                                                                    if (rawVal) {
                                                                        // 1. Case-insensitive matching with standard SIZES
                                                                        const standardMatch = SIZES.find(s => s.toLowerCase() === rawVal.toLowerCase());
                                                                        const val = standardMatch || rawVal.toUpperCase();

                                                                        // 2. Add only if not already present
                                                                        if (!formData.selectedSizes.includes(val)) {
                                                                            toggleSelection(formData.selectedSizes, val, 'selectedSizes');
                                                                        } else {
                                                                            toast({ title: "Size already added", description: `${val} is already in your selection.` });
                                                                        }
                                                                        input.value = '';
                                                                    }
                                                                }
                                                            }}
                                                        />
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="secondary"
                                                            className="h-8 px-3 text-xs font-bold"
                                                            onClick={() => {
                                                                const input = document.getElementById('custom-size-input') as HTMLInputElement;
                                                                const rawVal = input.value.trim();

                                                                if (rawVal) {
                                                                    const standardMatch = SIZES.find(s => s.toLowerCase() === rawVal.toLowerCase());
                                                                    const val = (standardMatch || rawVal).trim().toUpperCase();


                                                                    if (!formData.selectedSizes.includes(val)) {
                                                                        toggleSelection(formData.selectedSizes, val, 'selectedSizes');
                                                                    } else {
                                                                        toast({ title: "Size already added", description: `${val} is already in your selection.` });
                                                                    }
                                                                    input.value = '';
                                                                }
                                                            }}
                                                        >
                                                            <Plus className="h-3 w-3 mr-1" /> Add
                                                        </Button>
                                                    </div>
                                                </div>
                                                {errors.sizes && <p className="text-[10px] font-bold text-rose-500 -mt-2 animate-in fade-in slide-in-from-top-1">{errors.sizes}</p>}
                                                <div className="flex flex-wrap gap-3">
                                                    {/* Render Standard Sizes */}
                                                    {SIZES.map(size => (
                                                        <button
                                                            key={size}
                                                            type="button"
                                                            onClick={() => {
                                                                toggleSelection(formData.selectedSizes, size, 'selectedSizes');
                                                                if (errors.sizes) setErrors(prev => ({ ...prev, sizes: "" }));
                                                            }}
                                                            className={cn(
                                                                "min-w-[48px] h-12 rounded-xl border flex items-center justify-center font-black transition-all shadow-sm",
                                                                formData.selectedSizes.includes(size)
                                                                    ? "bg-primary text-primary-foreground border-primary scale-105 shadow-primary/20 ring-4 ring-primary/10"
                                                                    : "bg-background hover:border-primary/50 text-muted-foreground",
                                                                errors.sizes && !formData.selectedSizes.includes(size) && "border-rose-500/50 bg-rose-500/5"
                                                            )}
                                                        >
                                                            {size}
                                                        </button>
                                                    ))}

                                                    {/* Render Custom/Selected Sizes Not in Standard List */}
                                                    {formData.selectedSizes
                                                        .filter(s => !SIZES.includes(s))
                                                        .map(size => (
                                                            <button
                                                                key={size}
                                                                type="button"
                                                                onClick={() => toggleSelection(formData.selectedSizes, size, 'selectedSizes')}
                                                                className={cn(
                                                                    "min-w-[48px] px-3 h-12 rounded-xl border flex items-center justify-center font-black transition-all shadow-sm relative group",
                                                                    "bg-primary text-primary-foreground border-primary scale-105 shadow-primary/20 ring-4 ring-primary/10"
                                                                )}
                                                            >
                                                                {size}
                                                                <div className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <X className="h-2 w-2" />
                                                                </div>
                                                            </button>
                                                        ))
                                                    }
                                                </div>
                                            </div>

                                            {/* Global Matrix Input */}
                                            {formData.selectedColors.length > 0 && formData.selectedSizes.length > 0 && (
                                                <div className="pt-6 border-t space-y-6">
                                                    <div className="flex items-center justify-between px-1">
                                                        <h4 className="text-sm font-black tracking-widest flex items-center gap-2">
                                                            <Layout className="h-4 w-4 text-primary" /> Matrix Synchronization
                                                        </h4>
                                                        <Badge variant="outline" className="rounded-lg text-[10px] font-mono">
                                                            {Object.values(formData.sizeStock).reduce((a, b) => a + b, 0)} TOTAL UNITS
                                                        </Badge>
                                                    </div>

                                                    <div className="grid gap-6">
                                                        {formData.selectedColors.map(color => (
                                                            <div key={color.id} className="p-5 rounded-3xl border border-border/50 bg-muted/10 space-y-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-5 h-5 rounded-full border shadow-sm ring-4 ring-background" style={{ backgroundColor: color.hex }} />
                                                                    <span className="font-black text-sm tracking-tight text-foreground/80">{(color.name || '').toUpperCase()}</span>
                                                                </div>
                                                                <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                                                    {formData.selectedSizes.map(size => {
                                                                        const key = getStockKey(color.name, size);
                                                                        const isUnavailable = formData.unavailableVariants?.includes(key);
                                                                        const stock = formData.sizeStock[key] || 0;

                                                                        if (isUnavailable) return (
                                                                            <div key={key} className="p-2 h-20 rounded-2xl border-2 border-dashed border-border/30 bg-muted/20 flex flex-col items-center justify-center gap-1 opacity-50 grayscale">
                                                                                <span className="text-[10px] font-black text-muted-foreground">{size}</span>
                                                                                <Button variant="ghost" size="sm" className="h-6 text-[9px] font-bold text-primary px-2" onClick={() => setFormData(p => ({ ...p, unavailableVariants: p.unavailableVariants.filter(k => k !== key) }))}>ENABLE</Button>
                                                                            </div>
                                                                        );

                                                                        return (
                                                                            <div key={key} className={cn(
                                                                                "p-3 h-20 rounded-2xl border bg-background flex flex-col justify-between group transition-all relative overflow-hidden",
                                                                                stock === 0 ? "border-rose-500/50 bg-rose-500/5" : stock <= 5 ? "border-amber-500/50 bg-amber-500/5" : "border-border/50"
                                                                            )}>
                                                                                <div className="absolute top-0 right-0 p-1">
                                                                                    <div className={cn(
                                                                                        "w-1.5 h-1.5 rounded-full shadow-sm",
                                                                                        stock === 0 ? "bg-rose-500 animate-pulse" : stock <= 5 ? "bg-amber-500" : "bg-emerald-500"
                                                                                    )} />
                                                                                </div>
                                                                                <div className="flex items-center justify-between">
                                                                                    <span className="text-[10px] font-black">{size}</span>
                                                                                    <button
                                                                                        onClick={() => setFormData(p => ({ ...p, unavailableVariants: [...p.unavailableVariants, key] }))}
                                                                                        className="text-muted-foreground hover:text-destructive transition-all opacity-0 group-hover:opacity-100"
                                                                                    >
                                                                                        <XCircle className="h-3 w-3" />
                                                                                    </button>
                                                                                </div>
                                                                                <div className="flex items-center gap-1.5">
                                                                                    <Input
                                                                                        type="number"
                                                                                        value={stock}
                                                                                        min="0"
                                                                                        onChange={e => {
                                                                                            const val = Math.max(0, parseInt(e.target.value) || 0);
                                                                                            setFormData(p => ({
                                                                                                ...p,
                                                                                                sizeStock: { ...p.sizeStock, [key]: val }
                                                                                            }));
                                                                                        }}
                                                                                        className="h-7 text-[11px] font-bold rounded-lg border-muted bg-muted/20 w-full"
                                                                                    />
                                                                                    <span className="text-[9px] font-bold text-muted-foreground">U</span>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="media" className="m-0 space-y-6">
                                    <Card className="border-border/50 bg-card/60 backdrop-blur-xl overflow-hidden rounded-3xl">
                                        <CardHeader>
                                            <CardTitle className="text-lg flex items-center gap-2 font-bold"><ImageIcon className="h-5 w-5 text-primary" /> Visual Assets</CardTitle>
                                            <CardDescription>Upload high-resolution images for your product gallery.</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            {formData.selectedColors.length === 0 ? (
                                                <div className="text-center py-12 text-muted-foreground">
                                                    <Package className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                                    <p className="font-bold">No Variants Defined</p>
                                                    <p className="text-xs mt-1">Please add colors in the "Variants & Matrix" tab first.</p>
                                                    <Button variant="link" onClick={() => setActiveTab("inventory")} className="mt-2 text-primary">Go to Variants</Button>
                                                </div>
                                            ) : (
                                                <div className="space-y-8">
                                                    {formData.selectedColors.map(color => {
                                                        const existing = Array.isArray(formData.existingVariantImages[color.id])
                                                            ? formData.existingVariantImages[color.id]
                                                            : [];
                                                        const previews = Array.isArray(formData.variantPreviews[color.id])
                                                            ? formData.variantPreviews[color.id]
                                                            : [];
                                                        const hasImages = existing.length + previews.length > 0;

                                                        return (
                                                            <div key={color.id} className="space-y-4">
                                                                <div className="flex items-center gap-3 pb-2 border-b border-border/30">
                                                                    <div className="w-4 h-4 rounded-full border shadow-sm" style={{ backgroundColor: color.hex }} />
                                                                    <div className="flex flex-col">
                                                                        <h4 className="font-bold text-sm tracking-tight">{color.name}</h4>
                                                                        <span className={cn("text-[10px] font-medium", (existing.length + previews.length) >= 4 ? "text-emerald-600" : "text-rose-500")}>
                                                                            {(existing.length + previews.length) >= 4
                                                                                ? `${existing.length + previews.length} images (Ready)`
                                                                                : `${existing.length + previews.length}/4 images required`
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                                                                    {/* Upload Trigger */}
                                                                    <label className="aspect-square rounded-2xl border-2 border-dashed border-border/60 hover:border-primary/50 hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer group">
                                                                        <div className="p-2 rounded-full bg-muted group-hover:bg-primary/20 transition-colors">
                                                                            <Upload className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                                                        </div>
                                                                        <span className="text-[10px] font-black text-muted-foreground tracking-widest text-center px-1">Add media</span>
                                                                        <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, color.id)} />
                                                                    </label>

                                                                    {/* Existing Images */}
                                                                    {existing.map((src, i) => (
                                                                        <div key={`exist-${color.id}-${i}`} className="aspect-square rounded-2xl overflow-hidden border border-border/50 relative group bg-background shadow-sm">
                                                                            <img src={src} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                                                                            <div className="absolute inset-x-0 bottom-0 top-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                                <button onClick={() => removeImage(i, 'existing', color.id)} className="p-2 bg-rose-500 text-white rounded-full hover:bg-rose-600 transition-all hover:scale-110 shadow-xl">
                                                                                    <Trash2 className="h-4 w-4" />
                                                                                </button>
                                                                            </div>
                                                                            <div className="absolute top-1.5 left-1.5 bg-background/90 backdrop-blur-sm px-1.5 py-0.5 rounded text-[8px] font-bold border border-border/40 shadow-sm leading-none">Stored</div>
                                                                        </div>
                                                                    ))}

                                                                    {/* New Previews */}
                                                                    {previews.map((src, i) => (
                                                                        <div key={`new-${color.id}-${i}`} className="aspect-square rounded-2xl overflow-hidden border border-primary/30 relative group bg-background shadow-lg shadow-primary/5">
                                                                            <img src={src} className="w-full h-full object-cover" />
                                                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                                <button onClick={() => removeImage(i, 'new', color.id)} className="p-2 bg-rose-500 text-white rounded-full hover:bg-rose-600 transition-all hover:scale-110 shadow-xl">
                                                                                    <Trash2 className="h-4 w-4" />
                                                                                </button>
                                                                            </div>
                                                                            <div className="absolute top-1.5 left-1.5 bg-primary text-primary-foreground px-1.5 py-0.5 rounded text-[8px] font-bold tracking-wider shadow-sm leading-none">NEW</div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )
                                            }

                                            <div className="mt-8 p-4 rounded-2xl bg-muted/30 border border-dashed border-border/50 flex items-center gap-3 text-xs text-muted-foreground italic">
                                                <Info className="h-4 w-4 text-primary shrink-0" />
                                                Preferred formats: WebP or PNG. Recommended resolution: 1200x1200px. Max total payload: 25MB.
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            </motion.div>
                        </AnimatePresence>
                    </Tabs>
                </div>

                {/* Right: Sidebar & Preview */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Live Preview Card */}
                    <Card className="border-border/50 bg-card/60 backdrop-blur-xl overflow-hidden rounded-3xl sticky top-24">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-sm font-black tracking-widest flex items-center justify-between">
                                Marketplace Preview
                                <Eye className="h-4 w-4 text-primary" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-3">
                                <div className="aspect-[4/5] rounded-2xl bg-muted overflow-hidden relative border shadow-inner">
                                    {(() => {
                                        const firstColor = formData.selectedColors[0];
                                        const previewImage = firstColor
                                            ? (formData.variantPreviews[firstColor.id]?.[0] || formData.existingVariantImages[firstColor.id]?.[0])
                                            : null;

                                        return previewImage ? (
                                            <img src={previewImage} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-muted-foreground grayscale opacity-30">
                                                <ImageIcon className="h-12 w-12" />
                                                <span className="text-[10px] font-bold tracking-widest">Asset undefined</span>
                                            </div>
                                        );
                                    })()}
                                    {discountPercent > 0 && (
                                        <div className="absolute top-3 left-3 bg-rose-500 text-white px-2 py-1 rounded-lg text-[10px] font-black tracking-wider shadow-lg shadow-rose-500/30">
                                            -{discountPercent}%
                                        </div>
                                    )}
                                </div>

                                {/* Mini Gallery Carousel Adaptation - Intelligent filtering */}
                                {(() => {
                                    const allImages = formData.selectedColors.flatMap(color =>
                                        [...(formData.existingVariantImages[color.id] || []), ...(formData.variantPreviews[color.id] || [])]
                                    ).filter(src => src && !src.includes('placeholder'));

                                    if (allImages.length <= 1) return null;

                                    return (
                                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide py-1">
                                            {allImages.slice(0, 10).map((src, idx) => (
                                                <div key={idx} className="w-12 h-12 min-w-[3rem] rounded-xl overflow-hidden border border-border/40 hover:border-primary/50 transition-colors shadow-sm cursor-pointer opacity-70 hover:opacity-100">
                                                    <img src={src} className="w-full h-full object-cover" />
                                                </div>
                                            ))}
                                            {allImages.length > 10 && (
                                                <div className="w-12 h-12 min-w-[3rem] rounded-xl bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                                                    +{allImages.length - 10}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <div className="text-xs text-primary font-bold uppercase tracking-widest opacity-80">{formData.category || "General"}</div>
                                    <h3 className="text-lg font-black tracking-tight line-clamp-1">{formData.title || "Untitled Product"}</h3>
                                </div>

                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-black tracking-tight text-foreground">₹{(Number(formData.discountPrice) || Number(formData.price) || 0).toLocaleString()}</span>
                                    {Number(formData.discountPrice) > 0 && (
                                        <span className="text-sm text-muted-foreground line-through decoration-rose-500/50">₹{Number(formData.price).toLocaleString()}</span>
                                    )}
                                </div>

                                <div className="space-y-3 pt-2 border-t border-border/50">


                                    <div className="space-y-4 pt-4">
                                        <div className="grid gap-2">
                                            <Label className={cn("text-[10px] font-black uppercase text-muted-foreground", errors.price && "text-rose-500")}>Base Price</Label>
                                            <div className="relative">
                                                <span className={cn("absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground", errors.price && "text-rose-500")}>₹</span>
                                                <Input
                                                    type="number"
                                                    value={formData.price}
                                                    onChange={e => {
                                                        handleChange('price', e.target.value);
                                                        if (errors.price) setErrors(prev => ({ ...prev, price: "" }));
                                                    }}
                                                    className={cn(
                                                        "pl-7 rounded-xl font-black h-11",
                                                        errors.price && "border-rose-500 bg-rose-500/5 focus-visible:ring-rose-500/20"
                                                    )}
                                                />
                                            </div>
                                            {errors.price && <p className="text-[9px] font-bold text-rose-500 animate-in fade-in slide-in-from-top-1">{errors.price}</p>}
                                        </div>
                                        <div className="grid gap-2">
                                            <Label className="text-[10px] font-black uppercase text-muted-foreground">Promo Price (Optional)</Label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">₹</span>
                                                <Input type="number" value={formData.discountPrice} onChange={e => handleChange('discountPrice', e.target.value)} className="pl-7 rounded-xl font-black h-11" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Financial Intelligence */}
                                    <div className="p-4 rounded-2xl bg-muted/50 border border-border/50 space-y-3">
                                        <div className="flex items-center justify-between text-[11px] font-bold">
                                            <span className="text-muted-foreground uppercase flex items-center gap-1">Commission ({MARKETPLACE_FEE_PERCENTAGE * 100}%)</span>
                                            <span className="text-rose-600">-₹{((Number(formData.discountPrice) || Number(formData.price)) * MARKETPLACE_FEE_PERCENTAGE).toFixed(0)}</span>
                                        </div>
                                        <Separator className="bg-border/30" />
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-black uppercase text-foreground">Est. Payout</span>
                                            <span className="text-xl font-black text-emerald-600">₹{earnings.toFixed(0)}</span>
                                        </div>
                                        <p className="text-[9px] text-muted-foreground italic text-center">Net earnings per unit after platform fees.</p>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3 pt-4">
                                        <div className="p-3 rounded-2xl bg-background border flex flex-col gap-1">
                                            <span className="text-[9px] font-black uppercase text-muted-foreground">Variants</span>
                                            <div className="flex items-center gap-1.5 leading-none">
                                                <TrendingUp className="h-3 w-3 text-primary" />
                                                <span className="text-[10px] font-black uppercase">{(formData.selectedSizes.length || 0) * (formData.selectedColors.length || 0)} Matrix</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div >
    );
}

