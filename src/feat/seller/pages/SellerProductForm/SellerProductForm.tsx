import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import { Badge } from "@/ui/Badge";
import { useToast } from "@/shared/hook/use-toast";

import {
    ArrowLeft, Upload, X, Plus, ChevronRight, Check, DollarSign, Image as ImageIcon, Package, Tag, Loader2, ShieldAlert, Shield, AlertCircle
} from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/ui/AlertDialog";
import { SIZES } from "@/data/products";
import { MARKETPLACE_FEE_PERCENTAGE, MAX_DISCOUNT_PERCENTAGE } from "@/lib/constants";
import { apiClient } from "@/infra/api/apiClient";
import { useAuth } from "@/core/context/AuthContext";
import { cn } from "@/lib/utils";

import { ProductFormData, ColorOption, getStockKey } from "./components/types";
import { BasicInfoStep } from "./components/BasicInfoStep";
import { VariantsStep } from "./components/VariantsStep";
import { VisualsStep } from "./components/VisualsStep";
import { PricingStep } from "./components/PricingStep";
import { ReviewStep } from "./components/ReviewStep";
const STEPS = [
    { id: 1, title: "The Basics", icon: Tag, description: "Title, Category & Details" },
    { id: 2, title: "Global Variants", icon: Package, description: "Define Colors & Sizes" },
    { id: 3, title: "Visuals", icon: ImageIcon, description: "Upload Photos per Color" },
    { id: 4, title: "Pricing", icon: DollarSign, description: "Price & Profit" },
    { id: 5, title: "Review", icon: Check, description: "Final Check" },
];

const generateSKU = () => `PVK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

const INITIAL_FORM_DATA: ProductFormData = {
    title: "",
    description: "",
    category: "",
    selectedCategoryId: "",
    selectedSubcategoryId: "",
    price: "",
    discountPrice: "",
    stockQuantity: "0",
    selectedColors: [],
    selectedSizes: [],
    sizeStock: {},
    unavailableVariants: [],

    variantImages: {},
    variantPreviews: {},
    existingVariantImages: {},
    imagesToDelete: [],

    sku: generateSKU(),
    tags: [],
};

export default function SellerProductForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { toast } = useToast();
    const { user, role, verificationStatus, loading: authLoading } = useAuth();
    const isAdmin = role === 'ADMIN';

    const [currentStep, setCurrentStep] = useState(1);
    const [direction, setDirection] = useState(0); // 1 = forward, -1 = back
    const [formData, setFormData] = useState<ProductFormData>(INITIAL_FORM_DATA);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true); // Always start loading
    const [isSaving, setIsSaving] = useState(false);
    const [originalData, setOriginalData] = useState<any>(null);
    const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
    const [requestReason, setRequestReason] = useState("");
    const [dbCategories, setDbCategories] = useState<{ id: string; name: string; slug: string }[]>([]);
    const [dbSubcategories, setDbSubcategories] = useState<{ id: string; name: string; slug: string; categoryId: string; parentId?: string }[]>([]);
    const [isLoadingSubcategories, setIsLoadingSubcategories] = useState(false);
    const [subcategoryWarning, setSubcategoryWarning] = useState("");
    const [marketplaceFee, setMarketplaceFee] = useState(MARKETPLACE_FEE_PERCENTAGE);

    // Fetch categories and subcategories hierarchy
    useEffect(() => {
        const fetchHierarchy = async () => {
            try {
                // Fetch categories
                const { data: cats } = await apiClient.get("/categories");
                setDbCategories(cats.categories || []);

                // Fetch subcategories
                const { data: subs } = await apiClient.get("/categories/subcategories");
                const subData = (subs.subcategories || []).map((sub: any) => ({
                    ...sub,
                    categoryId: sub.categoryId || sub.category_id || sub.parentId,
                    parentId: sub.parentId || sub.category_id || sub.categoryId
                }));
                setDbSubcategories(subData);
            } catch (err) {
                console.error("[SellerProductForm] Error fetching hierarchy:", err);
            }
        };
        fetchHierarchy();
    }, []);

    // -- Fetch Data --
    useEffect(() => {
        const fetchProduct = async () => {
            if (!id) {
                setIsLoading(false);
                return;
            }
            try {
                console.log(`[SellerProductForm] Fetching product: ${id}`);
                const response = await apiClient.get(`/products/${id}`);
                const product = response.data?.data || response.data;

                const colors: ColorOption[] = [];
                const sizes: string[] = [];
                const existingVariantImages: Record<string, string[]> = {};
                const sizeStockMap: Record<string, number> = {};

                // Determine category and subcategory identifiers safely
                const categoryRaw = product.category?.slug || product.categorySlug || product.category || "";
                const subcategoryRaw = product.subcategory?.slug || product.subcategorySlug || product.subcategory || "";

                const variants = product.variants || product.product_variants || [];

                if (variants) {
                    // Sort variants to ensure stable color order if possible
                    variants.sort((a: any, b: any) => {
                        const dateA = a.created_at || a.createdAt || "";
                        const dateB = b.created_at || b.createdAt || "";
                        return dateA.localeCompare(dateB);
                    });

                    variants.forEach((v: any) => {
                        // Create a stable ID for the color (use existing variant ID)
                        let colorId = v.id;
                        const existingColor = colors.find(c => c.name === v.color_name || c.name === v.colorName);

                        const colorName = v.color_name || v.colorName;
                        const colorHex = v.color_hex || v.colorHex;

                        if (!existingColor) {
                            colors.push({ id: colorId, name: colorName, hex: colorHex });
                            existingVariantImages[colorId] = v.images || [];
                        } else {
                            // If duplicate color name, re-use the ID
                            colorId = existingColor.id;
                            // Merge images if any
                            v.images?.forEach((img: string) => {
                                if (!existingVariantImages[colorId].includes(img)) existingVariantImages[colorId].push(img);
                            });
                        }

                        const productSizes = v.sizes || v.product_sizes || [];

                        if (productSizes) {
                            productSizes.forEach((s: any) => {
                                if (!sizes.includes(s.size)) sizes.push(s.size);
                                const sizeKey = getStockKey(colorName, s.size);
                                sizeStockMap[sizeKey] = (sizeStockMap[sizeKey] || 0) + s.stock;
                            });
                        }
                    });
                }

                // Reconstruction of Category/Subcategory hierarchy
                const prodCatId = product.categoryId || product.category_id || product.category?.id || "";
                const prodParentId = product.category?.parentId || product.category?.parent_id || null;

                const selectedCatId = prodParentId ? prodParentId : prodCatId;
                const selectedSubCatId = prodParentId ? prodCatId : "";

                // Price logic - robust mapping
                const finalDiscountPrice = product.discountPrice !== undefined ? product.discountPrice : product.discount_price;
                const finalCompareAtPrice = product.compareAtPrice !== undefined ? product.compareAtPrice : product.compare_at_price;

                // If we have a compareAtPrice, then 'price' is the sale price and compareAtPrice is the base price.
                // If we don't have compareAtPrice but have discountPrice, then 'price' is base and discountPrice is sale.
                let basePrice = product.price;
                let salePrice = finalDiscountPrice || null;

                if (finalCompareAtPrice) {
                    basePrice = finalCompareAtPrice;
                    salePrice = product.price;
                }

                setFormData({
                    title: product.title || "",
                    description: product.description || "",
                    category: categoryRaw,
                    selectedCategoryId: selectedCatId,
                    selectedSubcategoryId: selectedSubCatId,
                    price: basePrice?.toString() || "",
                    discountPrice: salePrice?.toString() || "",
                    stockQuantity: "0",
                    selectedColors: colors,
                    selectedSizes: sizes.filter(s => s !== "One Size"), // Remove One Size default
                    sizeStock: sizeStockMap,
                    unavailableVariants: [],

                    variantImages: {},
                    variantPreviews: {},
                    existingVariantImages: existingVariantImages,
                    imagesToDelete: [],

                    sku: product.sku || generateSKU(),
                    tags: product.tags || [],
                });

                setOriginalData(product);
            } catch (error) {
                console.error("[SellerProductForm] Fetch failed:", error);
                toast({ title: "Error", description: "Failed to load product", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        };

        if (!authLoading) {
            // Both Sellers and Admins can access this form (Admins as proxies)
            if (role === 'SELLER' || role === 'ADMIN' || role === 'SUPER_ADMIN') {
                fetchProduct();
            } else {
                console.warn("[SellerProductForm] Unauthorized access attempt:", role);
                navigate("/dashboard"); // Redirect to a safe dashboard instead of auth if already logged in
            }
        }
    }, [id, authLoading, role, navigate, toast]);

    // Pre-populate category ID after categories are loaded
    useEffect(() => {
        if (!formData.category || dbCategories.length === 0) return;

        // Try to find the category ID if we only have the slug/name
        const cat = dbCategories.find(c =>
            c.slug.toLowerCase() === formData.category.toLowerCase() ||
            c.name.toLowerCase() === formData.category.toLowerCase()
        );

        if (cat && cat.id !== formData.selectedCategoryId) {
            console.log(`[SellerProductForm] Pre-populating category ID for "${formData.category}": ${cat.name} (${cat.id})`);
            setFormData(prev => ({ ...prev, selectedCategoryId: cat.id }));
        }
    }, [dbCategories, formData.category, formData.selectedCategoryId]);

    // Pre-populate subcategory ID after subcategories are loaded
    useEffect(() => {
        if (!formData.selectedCategoryId || dbSubcategories.length === 0) return;
        if (formData.selectedSubcategoryId) return; // Already have it

        // If we have a subcategory slug from product, find its ID
        const subSlug = originalData?.subcategory?.slug || originalData?.subcategorySlug || (typeof originalData?.subcategory === 'string' ? originalData.subcategory : null);
        if (subSlug) {
            const sub = dbSubcategories.find(s => s.slug === subSlug && s.categoryId === formData.selectedCategoryId);
            if (sub) {
                console.log(`[SellerProductForm] Pre-populating subcategory: ${sub.name} (${sub.id})`);
                setFormData(prev => ({ ...prev, selectedSubcategoryId: sub.id }));
            }
        }
    }, [dbSubcategories, formData.selectedCategoryId, formData.selectedSubcategoryId, originalData]);

    // Handle category change with subcategory reset
    const handleCategoryChange = (categoryId: string) => {
        const selectedCat = dbCategories.find(c => c.id === categoryId);
        setFormData(prev => ({
            ...prev,
            selectedCategoryId: categoryId,
            category: selectedCat?.slug || '',
            selectedSubcategoryId: '' // Reset subcategory
        }));
        setSubcategoryWarning("");

        // Check if category has subcategories
        const categorySubcategories = dbSubcategories.filter(s => (s.categoryId === categoryId || s.parentId === categoryId));
        if (categorySubcategories.length > 0) {
            setSubcategoryWarning("Please select a subcategory for better product organization.");
        } else {
            setSubcategoryWarning("Note: This category currently has no subcategories.");
        }

        // Update marketplace fee
        if (selectedCat && (selectedCat as any).commissionRate !== undefined) {
            setMarketplaceFee((selectedCat as any).commissionRate / 100);
        } else {
            setMarketplaceFee(MARKETPLACE_FEE_PERCENTAGE);
        }
    };

    const handleSubcategoryChange = (subCategoryId: string) => {
        setFormData(prev => ({
            ...prev,
            selectedSubcategoryId: subCategoryId
        }));
        setSubcategoryWarning("");

        const subCat = dbSubcategories.find(s => s.id === subCategoryId);
        if (subCat && (subCat as any).commissionRate !== undefined) {
            setMarketplaceFee((subCat as any).commissionRate / 100);
        }
    };

    const handleSave = async (isPublished: boolean = true) => {
        // Backend will auto-convert to DRAFT if seller is unverified

        // Final Validation Check
        if (!validateStep(1) || !validateStep(4)) return;
        // Also check images again just in case
        if (!validateStep(3)) return;

        setIsSaving(true);
        try {
            // Restricted Field Check (Editing existing product as non-admin)
            if (id && !isAdmin && originalData) {
                const isTitleChanged = formData.title !== originalData.title;
                const isDescChanged = formData.description !== originalData.description;

                // Compare Subcategory ID
                const originalSubId = originalData.subcategory?.id || originalData.subcategory_id;
                const isSubChanged = formData.selectedSubcategoryId !== originalSubId &&
                    // Handle case where both are falsy/null
                    !(!formData.selectedSubcategoryId && !originalSubId);

                // Compare Category Slug/ID (Robust fallback)
                const origCatSlug = originalData.category?.slug || originalData.category || "";
                const isCatChanged = formData.category !== origCatSlug;

                if (isTitleChanged || isDescChanged || isSubChanged || isCatChanged) {
                    setIsRequestDialogOpen(true);
                    setIsSaving(false);
                    return;
                }
            }

            // 1. Prepare Product Data
            let productId = id;

            // Prepare variants data for backend processing
            const colors = formData.selectedColors.length > 0 ? formData.selectedColors : [];
            const variantsData = [];

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

                    // uploadResult.urls should be an array of strings
                    if (uploadResult && uploadResult.urls) {
                        uploadedUrls.push(...uploadResult.urls);
                    }
                }

                const existingUrls = formData.existingVariantImages[color.id] || [];
                const finalImages = [...existingUrls, ...uploadedUrls];

                // Prepare sizes for this variant
                const sizeEntries = formData.selectedSizes
                    .filter(size => !formData.unavailableVariants?.includes(getStockKey(color.name, size)))
                    .map(size => ({
                        size: size,
                        stock: formData.sizeStock[getStockKey(color.name, size)] || 0,
                    }));

                variantsData.push({
                    color_name: color.name,
                    color_hex: color.hex,
                    images: finalImages,
                    sizes: sizeEntries
                });
            }

            const productPayload: any = {
                title: formData.title,
                slug: formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + (id ? '' : `-${Date.now()}`),
                description: formData.description,
                category: formData.category, // Legacy slug, but also sending IDs
                categoryId: formData.selectedSubcategoryId || formData.selectedCategoryId, // Most specific ID
                price: Number(formData.price),
                discount_price: formData.discountPrice ? Number(formData.discountPrice) : null,
                published: isPublished,
                sku: formData.sku,
                seller_id: user?.id,
                variants: variantsData // Send nested variants to be handled by backend
            };

            // Governance check - if critical fields changed, might require approval
            // For now, assuming backend handles status='pending_review' if needed based on roles.

            if (id) {
                await apiClient.put(`/products/${id}`, productPayload);
            } else {
                const { data } = await apiClient.post('/products', productPayload);
                productId = data.id;
            }

            // 3. Cleanup Deleted Images (Storage)
            if (formData.imagesToDelete.length > 0) {
                // This might need a backend endpoint to safely delete files
                // OR we just forget about them (soft delete logic usually applies)
                // Keeping it valid:
                // await apiClient.post('/uploads/delete', { urls: formData.imagesToDelete });
                console.log("Images to delete not handled directly in frontend anymore:", formData.imagesToDelete);
            }

            toast({
                title: isPublished ? "Product Published! 🎉" : "Draft Saved",
                description: isPublished ? "Your product is now live on the store." : "You can continue editing this later."
            });
            navigate("/seller/products");

        } catch (error: any) {
            console.error("Save Error:", error);

            let errorMsg = error.response?.data?.message || error.message || "An unexpected error occurred while saving.";

            toast({
                title: "Save Failed",
                description: errorMsg,
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };

    const checkSkuAvailability = async (skuToCheck: string): Promise<boolean> => {
        if (!skuToCheck) return true;

        try {
            const { data } = await apiClient.post('/products/check-sku', {
                sku: skuToCheck,
                excludeId: id
            });
            return data.available;
        } catch (err) {
            console.error("SKU check failed", err);
            return true; // Fail open
        }
    };

    const validateStep = (step: number): boolean => {
        const newErrors: Record<string, string> = {};
        let isValid = true;

        if (step === 1) {
            if (!formData.title.trim()) newErrors.title = "Product title is required.";
            else if (formData.title.length < 3) newErrors.title = "Title must be at least 3 characters.";

            if (!formData.selectedCategoryId) newErrors.category = "Please select a category.";
            if (!formData.selectedSubcategoryId) newErrors.subcategory = "Please select a subcategory.";

            if (!formData.description.trim()) newErrors.description = "Product description is required.";
            else if (formData.description.length < 10) newErrors.description = "Description should be at least 10 characters.";
        }

        if (step === 2) {
            if (formData.selectedColors.length === 0) {
                newErrors.colors = "At least one color is required.";
            }
            if (formData.selectedSizes.length === 0) {
                newErrors.sizes = "At least one size is required.";
            }
        }

        // Validate Visuals (Step 3) - REQUIRE images for EACH variant
        if (step === 3) {
            if (formData.selectedColors.length === 0) {
                // Technically this is caught in step 2 (Variants) usually, but good to check
                toast({ title: "No Colors", description: "Please go back and add at least one color.", variant: "destructive" });
                isValid = false;
            } else {
                let missingImages = false;
                formData.selectedColors.forEach(color => {
                    const existing = formData.existingVariantImages[color.id] || [];
                    const newImgs = formData.variantImages[color.id] || [];
                    if (existing.length + newImgs.length === 0) {
                        missingImages = true;
                    }
                });

                if (missingImages) {
                    toast({
                        title: "Missing Images",
                        description: "Every color variant must have at least one image.",
                        variant: "destructive"
                    });
                    isValid = false;
                }
            }
        }

        if (step === 4) {
            if (!formData.price) newErrors.price = "Base price is required.";
            else if (Number(formData.price) <= 0) newErrors.price = "Price must be greater than 0.";

            if (formData.discountPrice) {
                if (Number(formData.discountPrice) >= Number(formData.price)) {
                    newErrors.discountPrice = "Discount price must be lower than base price.";
                } else if (Number(formData.discountPrice) > 0) {
                    const discountPercent = (Number(formData.price) - Number(formData.discountPrice)) / Number(formData.price);
                    if (discountPercent > MAX_DISCOUNT_PERCENTAGE) {
                        newErrors.discountPrice = `Max discount allowed is ${(MAX_DISCOUNT_PERCENTAGE * 100)}%.`;
                    }
                }
            }
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            isValid = false;
            toast({
                title: "Please check your inputs",
                description: "There are validation errors in the form.",
                variant: "destructive"
            });
        } else {
            setErrors({});
        }

        return isValid;
    };

    const handleNext = async () => {
        if (validateStep(currentStep)) {
            // Async Validation for Step 1
            if (currentStep === 1) {
                const isSkuAvailable = await checkSkuAvailability(formData.sku);
                if (!isSkuAvailable) {
                    setErrors(prev => ({ ...prev, sku: "This SKU is already taken. Please regenerate or choose another." }));
                    toast({
                        title: "SKU Conflict",
                        description: `The SKU '${formData.sku}' is already in use.`,
                        variant: "destructive"
                    });
                    return; // Block progress
                }
            }

            if (currentStep < 5) {
                setDirection(1);
                setCurrentStep(s => s + 1);
            } else {
                // Default action for "Next/Finish" is usually Publish in wizards, 
                // but our UI will have specific buttons for that now. 
                // We'll keep this as a fallback to Publish.
                handleSave(true);
            }
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setDirection(-1);
            setCurrentStep(s => s - 1);
        }
    };

    // -- Handlers --
    const handleChange = (field: keyof ProductFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
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
                // If this variant had images marked for deletion, we don't automatically restore them, 
                // but we could. For now, we just add new ones.
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
            const exists = field === 'selectedColors'
                ? currentList.some((c: any) => c.name === item.name)
                : currentList.includes(item);

            let newList;
            if (exists) {
                newList = field === 'selectedColors'
                    ? currentList.filter((c: any) => c.name !== item.name)
                    : currentList.filter((i: any) => i !== item);
            } else {
                newList = [...currentList, item];
            }
            return { ...prev, [field]: newList };
        });
    };



    // Animation Variants
    const variants = {
        enter: (d: number) => ({ x: d > 0 ? 50 : -50, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (d: number) => ({ x: d < 0 ? 50 : -50, opacity: 0 }),
    };


    if (isLoading) return (
        <div className="min-h-screen flex flex-col items-center py-10 animate-pulse bg-background">
            {/* Header Skeleton */}
            <div className="w-full max-w-2xl px-6 mb-8 flex flex-col items-center gap-4">
                <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-4 w-24 bg-gray-200/60 dark:bg-gray-700/60 rounded" />
            </div>

            {/* Stepper Skeleton - Centered & Spaced */}
            <div className="w-full max-w-4xl px-4 mb-12 flex justify-between items-center">
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 border-4 border-background shadow-sm" />
                        <div className="h-3 w-20 bg-gray-200/60 dark:bg-gray-700/60 rounded" />
                    </div>
                ))}
            </div>

            {/* Form Content Skeleton */}
            <div className="w-full max-w-3xl bg-card rounded-xl p-8 shadow-sm border border-border/40 mx-auto">
                <div className="flex flex-col items-center gap-2 mb-8">
                    <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="h-4 w-48 bg-gray-200/60 dark:bg-gray-700/60 rounded" />
                </div>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                        <div className="h-12 w-full bg-gray-200/50 dark:bg-gray-700/50 rounded-lg" />
                    </div>
                    <div className="space-y-2">
                        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                        <div className="h-12 w-full bg-gray-200/50 dark:bg-gray-700/50 rounded-lg" />
                    </div>
                    <div className="space-y-2">
                        <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
                        <div className="h-32 w-full bg-gray-200/50 dark:bg-gray-700/50 rounded-lg" />
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-background flex flex-col items-center py-10">
            {/* Header */}
            {/* Header */}
            <div className="w-full max-w-2xl px-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
                <Button
                    variant="ghost"
                    className="text-muted-foreground hover:text-foreground self-start md:self-auto w-fit"
                    onClick={() => navigate("/seller/products")}
                >
                    <ArrowLeft className="h-4 w-4 mr-2" /> Cancel
                </Button>
                <div className="text-center order-first md:order-none w-full md:w-auto">
                    <h1 className="text-xl font-bold">
                        {id ? "Edit Product" : "List New Product"}
                    </h1>
                    <p className="text-xs text-muted-foreground">Step {currentStep} of 5</p>
                </div>
                <div className="w-20 hidden md:block" /> {/* Spacer */}
            </div>

            {/* Stepper */}
            {/* Stepper - Horizontal Order Tracking Style (Robust Bar) */}
            <div className="w-full max-w-4xl px-4 mb-12">
                <div className="relative flex justify-between items-center w-full">
                    {/* Background Bar (Gray) */}
                    <div className="absolute top-4 sm:top-5 left-0 w-full h-[2px] bg-gray-200 dark:bg-gray-700 -z-20" />

                    {/* Progress Bar (Teal) */}
                    <motion.div
                        className="absolute top-4 sm:top-5 left-0 h-[2px] bg-[#267A77] -z-10"
                        initial={{ width: 0 }}
                        animate={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
                        transition={{ type: "spring", stiffness: 100, damping: 20 }}
                    />

                    {STEPS.map((step) => {
                        const Icon = step.icon;
                        const isActive = currentStep >= step.id;
                        const isCompleted = currentStep > step.id;
                        const isCurrent = currentStep === step.id;

                        return (
                            <div key={step.id} className="flex flex-col items-center gap-2 relative z-10 group cursor-default">
                                <motion.div
                                    initial={false}
                                    animate={{
                                        scale: isCurrent ? 1.2 : 1,
                                        backgroundColor: isActive ? "#267A77" : "rgba(255, 255, 255, 1)",
                                        borderColor: isActive ? "#267A77" : "rgba(209, 213, 219, 1)",
                                        color: isActive ? "#ffffff" : "rgba(156, 163, 175, 1)",
                                        boxShadow: isCurrent ? "0 0 20px rgba(38, 122, 119, 0.4)" : "none"
                                    }}
                                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                    className={cn(
                                        "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 dark:bg-slate-900"
                                    )}
                                >
                                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />

                                    {isCompleted && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="absolute inset-0 bg-[#267A77] rounded-full flex items-center justify-center"
                                        >
                                            <Check className="h-4 w-4 sm:h-5 sm:w-5 text-white font-bold" />
                                        </motion.div>
                                    )}
                                </motion.div>
                                <motion.span
                                    animate={{
                                        color: isActive ? "#267A77" : "rgba(156, 163, 175, 1)",
                                        y: isCurrent ? 5 : 0,
                                        opacity: isActive ? 1 : 0.6
                                    }}
                                    className={cn(
                                        "text-[10px] sm:text-xs font-bold whitespace-nowrap transition-colors duration-300 absolute -bottom-6"
                                    )}
                                >
                                    {step.title}
                                </motion.span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Form Content */}
            <div className="w-full max-w-2xl px-4 flex-1">
                <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                        key={currentStep}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.3 }}
                        className="w-full"
                    >
                        <Card className="border-none shadow-xl bg-card/80 backdrop-blur-sm">
                            <CardHeader className="text-center pb-2">
                                <CardTitle className="text-2xl">{STEPS[currentStep - 1].title}</CardTitle>
                                <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 md:p-8">

                                {currentStep === 1 && (
                                    <BasicInfoStep
                                        id={id}
                                        formData={formData}
                                        onChange={handleChange}
                                        errors={errors}
                                        setErrors={setErrors}
                                        dbCategories={dbCategories}
                                        dbSubcategories={dbSubcategories}
                                        handleCategoryChange={handleCategoryChange}
                                        handleSubcategoryChange={handleSubcategoryChange}
                                        isLoadingSubcategories={isLoadingSubcategories}
                                        subcategoryWarning={subcategoryWarning}
                                        setSubcategoryWarning={setSubcategoryWarning}
                                        generateSKU={generateSKU}
                                        toast={toast}
                                        setFormData={setFormData}
                                    />
                                )}

                                {currentStep === 2 && (
                                    <VariantsStep
                                        formData={formData}
                                        setFormData={setFormData}
                                        SIZES={SIZES}
                                        toggleSelection={toggleSelection}
                                        toast={toast}
                                    />
                                )}

                                {currentStep === 3 && (
                                    <VisualsStep
                                        id={id}
                                        isAdmin={isAdmin}
                                        formData={formData}
                                        handleImageUpload={handleImageUpload}
                                        removeImage={removeImage}
                                        handleBack={handleBack}
                                    />
                                )}

                                {currentStep === 4 && (
                                    <PricingStep
                                        formData={formData}
                                        onChange={handleChange}
                                        errors={errors}
                                        setErrors={setErrors}
                                        MARKETPLACE_FEE_PERCENTAGE={marketplaceFee}
                                    />
                                )}

                                {currentStep === 5 && (
                                    <ReviewStep
                                        isAdmin={isAdmin}
                                        formData={formData}
                                        onChange={handleChange}
                                    />
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                </AnimatePresence>
            </div >

            {/* Footer / Controls */}
            < div className="w-full max-w-2xl px-6 pt-6 pb-20 flex flex-col gap-4" >
                <div className="flex flex-col-reverse sm:flex-row justify-between items-center w-full gap-3 sm:gap-0">
                    {/* Left Side: Cancel (Only on Step 1) or Back */}
                    <div className="w-full sm:w-auto">
                        {currentStep === 1 ? (
                            <Button variant="ghost" className="w-full sm:w-auto text-muted-foreground hover:text-destructive" onClick={() => navigate("/seller/products")}>
                                Cancel
                            </Button>
                        ) : (
                            <Button
                                variant="outline"
                                onClick={handleBack}
                                disabled={isSaving}
                                className="w-full sm:w-24 gap-2"
                            >
                                <ArrowLeft className="w-4 h-4" /> Back
                            </Button>
                        )}
                    </div>

                    {/* Right Side: Actions */}
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        {currentStep === 5 ? (
                            <>
                                <Button
                                    variant="secondary"
                                    onClick={() => handleSave(false)}
                                    disabled={isSaving}
                                    className="w-full sm:w-32"
                                >
                                    Save Draft
                                </Button>
                                <Button
                                    onClick={() => handleSave(true)}
                                    disabled={isSaving}
                                    className="w-full sm:w-40 bg-primary hover:bg-primary/90 shadow-lg gap-2"
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : (isAdmin ? <Upload className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />)}
                                    {isAdmin ? "Publish Now" : "Submit for Review"}
                                </Button>
                            </>
                        ) : (
                            <Button
                                onClick={handleNext}
                                className="w-full sm:w-32"
                            >
                                Next <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        )}
                    </div>
                </div>
            </div >

            {/* Image Preview Overlay */}
            <AnimatePresence>
                {
                    previewImage && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
                            onClick={() => setPreviewImage(null)}
                        >
                            <motion.button
                                className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setPreviewImage(null)}
                            >
                                <X className="h-8 w-8" />
                            </motion.button>
                            <motion.img
                                src={previewImage}
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="max-w-full max-h-[90vh] rounded-lg shadow-2xl object-contain"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </motion.div>
                    )
                }
            </AnimatePresence >


            {/* Change Request Dialog */}
            < AlertDialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen} >
                <AlertDialogContent className="max-w-md rounded-2xl">
                    <AlertDialogHeader>
                        <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4 mx-auto">
                            <ShieldAlert className="w-6 h-6 text-amber-600" />
                        </div>
                        <AlertDialogTitle className="text-center text-xl">Restricted Field Update</AlertDialogTitle>
                        <AlertDialogDescription className="text-center pt-2">
                            The following restricted fields have been modified:
                            <div className="mt-3 p-3 bg-muted/50 rounded-xl text-left text-xs space-y-1 font-medium border border-border/40">
                                {formData.title !== originalData?.title && <p className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Product Title</p>}
                                {(formData.category !== originalData?.category || formData.selectedSubcategoryId !== originalData?.subcategory_id) && <p className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Category/Subcategory</p>}
                                {formData.description !== originalData?.description && <p className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Product Description</p>}
                            </div>
                            <p className="mt-4 text-xs">
                                These changes require <strong>Admin Approval</strong> before they are applied.
                                Pricing and Stock updates will be applied immediately.
                            </p>
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className="py-4">
                        <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-2 block">Reason for Update</Label>
                        <Textarea
                            placeholder="Please explain why you need to change these restricted fields..."
                            value={requestReason}
                            onChange={e => setRequestReason(e.target.value)}
                            className="min-h-[100px] text-sm resize-none rounded-xl"
                        />
                    </div>

                    <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                        <AlertDialogCancel className="rounded-xl h-11" onClick={() => setIsRequestDialogOpen(false)}>Discard Changes</AlertDialogCancel>
                        <AlertDialogAction
                            className="rounded-xl h-11 bg-[#267A77] hover:bg-[#1f6361]"
                            onClick={async () => {
                                if (!requestReason.trim()) {
                                    toast({ title: "Reason Required", description: "Please explain why you are making these changes.", variant: "destructive" });
                                    return;
                                }

                                setIsSaving(true);
                                try {
                                    // 1. Submit Restricted Changes to Request Table
                                    const requestedChanges = {
                                        title: formData.title !== originalData.title ? formData.title : undefined,
                                        category: formData.category !== originalData.category ? formData.category : undefined,
                                        description: formData.description !== originalData.description ? formData.description : undefined,
                                        subcategory_id: formData.selectedSubcategoryId !== originalData.subcategory_id ? formData.selectedSubcategoryId : undefined,
                                        reason: requestReason
                                    };

                                    const requestResponse = await apiClient.post('/products/requests', {
                                        product_id: id,
                                        seller_id: user?.id,
                                        requested_changes: requestedChanges,
                                        status: 'pending'
                                    });

                                    if (!requestResponse.data.success) {
                                        throw new Error(requestResponse.data.message || 'Failed to submit update request');
                                    }

                                    // 2. Perform safe update for Allowed fields (Price, Stock, Variants)
                                    // Re-calculate variants for the safe update to prevent data loss
                                    const colors = formData.selectedColors.length > 0 ? formData.selectedColors : [];
                                    const safeVariantsData = [];

                                    for (const color of colors) {
                                        const existingUrls = formData.existingVariantImages[color.id] || [];
                                        const sizeEntries = formData.selectedSizes
                                            .filter(size => !formData.unavailableVariants?.includes(getStockKey(color.name, size)))
                                            .map(size => ({
                                                size: size,
                                                stock: formData.sizeStock[getStockKey(color.name, size)] || 0,
                                            }));

                                        safeVariantsData.push({
                                            color_name: color.name,
                                            color_hex: color.hex,
                                            images: existingUrls, // Safe update only uses existing images unless we re-upload (simpler to just send what we have)
                                            sizes: sizeEntries
                                        });
                                    }

                                    const safePayload: any = {
                                        price: Number(formData.price),
                                        discount_price: formData.discountPrice ? Number(formData.discountPrice) : null,
                                        title: originalData.title,
                                        description: originalData.description,
                                        category: originalData.category,
                                        subcategory_id: originalData.subcategory_id,
                                        slug: originalData.slug,
                                        variants: safeVariantsData
                                    };




                                    await apiClient.put(`/products/${id}`, safePayload);

                                    toast({
                                        title: "Request Submitted",
                                        description: "Your core changes are pending approval. Pricing/Stock updates applied.",
                                    });
                                    navigate("/seller/products");
                                } catch (e) {
                                    console.error(e);
                                    toast({ title: "Error", description: "Failed to submit update request.", variant: "destructive" });
                                } finally {
                                    setIsSaving(false);
                                    setIsRequestDialogOpen(false);
                                }
                            }}
                        >
                            Submit for Approval
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog >
        </div >
    );
}
