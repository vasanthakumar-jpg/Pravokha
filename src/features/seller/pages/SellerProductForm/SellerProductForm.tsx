import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    Card, CardContent, CardHeader, CardTitle, CardDescription
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/hooks/use-toast";
import {
    ArrowLeft, Upload, X, Plus, ChevronRight, Check, DollarSign, Image as ImageIcon, Package, Tag, Loader2
} from "lucide-react";
import { categories, SIZES, COLORS } from "@/data/products";
import { MARKETPLACE_FEE_PERCENTAGE, MAX_DISCOUNT_PERCENTAGE } from "@/lib/constants";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { CategoryInput } from "@/features/products/components/CategoryInput";

// -- Step Configuration --
const STEPS = [
    { id: 1, title: "The Basics", icon: Tag, description: "Title, Category & Details" },
    { id: 2, title: "Visuals", icon: ImageIcon, description: "Photos & Media" },
    { id: 3, title: "Stock & Variants", icon: Package, description: "Sizes, Colors & Inventory" },
    { id: 4, title: "Pricing", icon: DollarSign, description: "Price & Profit" },
    { id: 5, title: "Review", icon: Check, description: "Final Check" },
];

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
    stockQuantity: string;
    selectedColors: ColorOption[];
    selectedSizes: string[];
    sizeStock: Record<string, number>;
    unavailableVariants: string[];
    images: File[];
    imagePreviews: string[];
    existingImages: string[];
    isFeatured: boolean;
    isNew: boolean;
    sku: string;
}

const generateSKU = () => `PVK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

const INITIAL_FORM_DATA: ProductFormData = {
    title: "",
    description: "",
    category: "",
    price: "",
    discountPrice: "",
    stockQuantity: "0",
    selectedColors: [],
    selectedSizes: [],
    sizeStock: {},
    unavailableVariants: [],
    images: [],
    imagePreviews: [],
    existingImages: [],
    isFeatured: false,
    isNew: false,
    sku: generateSKU(),
};

// Helper for stock keys
const getStockKey = (color: string, size: string) => `${color}-${size}`;

export default function SellerProductForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { toast } = useToast();
    const { user, role, verificationStatus } = useAuth();
    const isAdmin = role === 'admin';

    const [currentStep, setCurrentStep] = useState(1);
    const [direction, setDirection] = useState(0); // 1 = forward, -1 = back
    const [formData, setFormData] = useState<ProductFormData>(INITIAL_FORM_DATA);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(!!id);
    const [isSaving, setIsSaving] = useState(false);

    // -- Fetch Data (Simplified for brevity, assumes identical structure to Admin) --
    useEffect(() => {
        const fetchProduct = async () => {
            if (!id) return;
            try {
                // ... (Implementation identical to AdminForm for fetching logic, 
                // just re-using the logic to populate state)
                setIsLoading(true);
                const { data: product, error } = await supabase
                    .from("products")
                    .select("*, product_variants(*, product_sizes(*))")
                    .eq("id", id)
                    .single();

                if (error) throw error;

                const colors: ColorOption[] = [];
                const sizes: string[] = [];
                const existingImages: string[] = [];
                const sizeStockMap: Record<string, number> = {};

                if (product.product_variants) {
                    product.product_variants.forEach((v: any) => {
                        if (!colors.some(c => c.name === v.color_name)) {
                            colors.push({ name: v.color_name, hex: v.color_hex });
                        }
                        if (v.images) v.images.forEach((img: string) => {
                            if (!existingImages.includes(img)) existingImages.push(img);
                        });
                        if (v.product_sizes) {
                            v.product_sizes.forEach((s: any) => {
                                if (!sizes.includes(s.size)) sizes.push(s.size);
                                const sizeKey = getStockKey(v.color_name, s.size);
                                sizeStockMap[sizeKey] = (sizeStockMap[sizeKey] || 0) + s.stock;
                            });
                        }
                    });
                }

                setFormData({
                    title: product.title || "",
                    description: product.description || "",
                    category: product.category || "",
                    price: product.price?.toString() || "",
                    discountPrice: product.discount_price?.toString() || "",
                    stockQuantity: "0",
                    selectedColors: colors,
                    selectedSizes: sizes,
                    sizeStock: sizeStockMap,
                    unavailableVariants: [],
                    images: [],
                    imagePreviews: [],
                    existingImages: existingImages,
                    isFeatured: product.is_featured || false,
                    isNew: product.is_new || false,
                    sku: product.sku || generateSKU(),
                });
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProduct();
    }, [id]);

    const handleSave = async (isPublished: boolean = true) => {
        if (verificationStatus !== 'verified') {
            toast({
                title: "Verification Required",
                description: "You must be a verified seller to list products. Please check your settings.",
                variant: "destructive"
            });
            return;
        }

        if (!formData.title || !formData.price || !formData.category) {
            toast({ title: "Validation Error", description: "Title, Category, and Price are required.", variant: "destructive" });
            return;
        }

        if (Number(formData.discountPrice) >= Number(formData.price)) {
            toast({ title: "Validation Error", description: "Discount Price must be less than Base Price.", variant: "destructive" });
            return;
        }

        if (Number(formData.discountPrice) > 0) {
            const discountPercent = (Number(formData.price) - Number(formData.discountPrice)) / Number(formData.price);
            if (discountPercent > MAX_DISCOUNT_PERCENTAGE) {
                toast({
                    title: "Discount Too High",
                    description: `Maximum allowed discount is ${(MAX_DISCOUNT_PERCENTAGE * 100)}%. Please adjust your price.`,
                    variant: "destructive"
                });
                return;
            }
        }

        setIsSaving(true);
        try {
            // 1. Upload Images
            const newImageUrls: string[] = [];
            for (const file of formData.images) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                const { error: uploadError } = await supabase.storage.from('product-images').upload(`products/${fileName}`, file);
                if (uploadError) throw uploadError;
                const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(`products/${fileName}`);
                newImageUrls.push(publicUrl);
            }
            const allImages = [...formData.existingImages, ...newImageUrls];

            const productPayload = {
                title: formData.title,
                slug: formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + (id ? '' : `-${Date.now()}`),
                description: formData.description,
                category: formData.category,
                price: Number(formData.price),
                discount_price: formData.discountPrice ? Number(formData.discountPrice) : null,
                published: isPublished,
                is_featured: formData.isFeatured,
                is_new: formData.isNew,
                sku: formData.sku,
                seller_id: user?.id
            };

            let productId = id;
            if (id) {
                await supabase.from('products').update(productPayload).eq('id', id);
                // Clean up old variants (simplest approach)
                const { data: existingVariants } = await supabase.from('product_variants').select('id').eq('product_id', id);
                if (existingVariants?.length) {
                    const vIds = existingVariants.map(v => v.id);
                    await supabase.from('product_sizes').delete().in('variant_id', vIds);
                    await supabase.from('product_variants').delete().eq('product_id', id);
                }
            } else {
                const { data } = await supabase.from('products').insert(productPayload).select().single();
                productId = data.id;
            }

            // Create Variants
            const colors = formData.selectedColors.length > 0 ? formData.selectedColors : [{ name: 'Default', hex: '#000000' }];
            for (const color of colors) {
                const { data: variant } = await supabase.from('product_variants').insert({
                    product_id: productId,
                    color_name: color.name,
                    color_hex: color.hex,
                    images: allImages,
                }).select().single();

                if (formData.selectedSizes.length > 0) {
                    const sizeEntries = formData.selectedSizes
                        .filter(size => !formData.unavailableVariants?.includes(getStockKey(color.name, size)))
                        .map(size => ({
                            variant_id: variant.id,
                            size: size,
                            stock: formData.sizeStock[getStockKey(color.name, size)] || 0,
                        }));

                    if (sizeEntries.length > 0) {
                        await supabase.from('product_sizes').insert(sizeEntries);
                    }
                }
            }

            toast({
                title: isPublished ? "Product Published! 🎉" : "Draft Saved",
                description: isPublished ? "Your product is now live on the store." : "You can continue editing this later."
            });
            navigate("/seller/products");

        } catch (error: any) {
            toast({ title: "Publish Failed", description: error.message, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const checkSkuAvailability = async (skuToCheck: string): Promise<boolean> => {
        if (!skuToCheck || skuToCheck === formData.sku) return true; // No change or empty

        // If editing, and SKU hasn't changed from original, it's valid
        // (We need to store original SKU to be perfect, but checking DB excluding self is safer)

        try {
            let query = supabase.from('products').select('id').eq('sku', skuToCheck);
            if (id) {
                query = query.neq('id', id);
            }

            const { data, error } = await query.maybeSingle();

            if (error) throw error;
            return !data; // True if available (no data found)
        } catch (err) {
            console.error("SKU check failed", err);
            return true; // Fail open to avoid blocking valid saves on connection blip, but risky
        }
    };

    const validateStep = (step: number): boolean => {
        const newErrors: Record<string, string> = {};
        let isValid = true;

        if (step === 1) {
            if (!formData.title.trim()) newErrors.title = "Product title is required.";
            else if (formData.title.length < 3) newErrors.title = "Title must be at least 3 characters.";

            if (!formData.category) newErrors.category = "Please select or create a category.";

            if (!formData.description.trim()) newErrors.description = "Product description is required.";
            else if (formData.description.length < 10) newErrors.description = "Description should be at least 10 characters.";

            // BETTER: Let's do a blocking check in handleNext if step is 1)
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
            // Shake effect or just toast
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
        }
    };

    const removeImage = (index: number, type: 'new' | 'existing') => {
        if (type === 'new') {
            setFormData(prev => ({
                ...prev,
                images: prev.images.filter((_, i) => i !== index),
                imagePreviews: prev.imagePreviews.filter((_, i) => i !== index),
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                existingImages: prev.existingImages.filter((_, i) => i !== index),
            }));
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
                    <div
                        className="absolute top-4 sm:top-5 left-0 h-[2px] bg-[#267A77] -z-10 transition-all duration-500 ease-in-out"
                        style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
                    />

                    {STEPS.map((step) => {
                        const Icon = step.icon;
                        const isActive = currentStep >= step.id;
                        const isCompleted = currentStep > step.id;
                        const isCurrent = currentStep === step.id;

                        return (
                            <div key={step.id} className="flex flex-col items-center gap-2 relative z-10 group cursor-default">
                                <div
                                    className={cn(
                                        "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 bg-white dark:bg-slate-900",
                                        isActive
                                            ? "border-[#267A77] bg-[#267A77] text-white shadow-lg scale-110"
                                            : "border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500",
                                        isCurrent && "ring-4 ring-[#267A77]/20"
                                    )}
                                >
                                    {isCompleted ? <Check className="h-4 w-4 sm:h-5 sm:w-5" /> : <Icon className="h-4 w-4 sm:h-5 sm:w-5" />}
                                </div>
                                <span className={cn(
                                    "text-[10px] sm:text-xs font-bold whitespace-nowrap transition-colors duration-300 absolute -bottom-6",
                                    isActive ? "text-[#267A77]" : "text-gray-400 dark:text-gray-500"
                                )}>
                                    {step.title}
                                </span>
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

                                {/* STEP 1: BASICS */}
                                {currentStep === 1 && (
                                    <div className="space-y-4">
                                        <div className="grid gap-2">
                                            <Label className={cn(errors.title ? "text-destructive" : "")}>Product Title</Label>
                                            <Input
                                                value={formData.title}
                                                onChange={e => {
                                                    handleChange('title', e.target.value);
                                                    if (errors.title) setErrors(prev => ({ ...prev, title: "" }));
                                                }}
                                                placeholder="e.g. Vintage Leather Jacket"
                                                className={cn("text-lg h-12", errors.title ? "border-destructive focus-visible:ring-destructive" : "")}
                                                autoFocus
                                            />
                                            {errors.title && (
                                                <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-destructive font-medium">
                                                    {errors.title}
                                                </motion.p>
                                            )}
                                        </div>
                                        <div className="grid gap-2">
                                            <Label className={cn(errors.category ? "text-destructive" : "")}>Category</Label>
                                            <CategoryInput
                                                value={formData.category}
                                                onChange={v => {
                                                    handleChange('category', v);
                                                    if (errors.category) setErrors(prev => ({ ...prev, category: "" }));
                                                }}
                                                placeholder="Select Category"
                                                allowManagement={isAdmin} // Restricted to Admins
                                            />
                                            {errors.category && (
                                                <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-destructive font-medium">
                                                    {errors.category}
                                                </motion.p>
                                            )}
                                        </div>
                                        <div className="grid gap-2">
                                            <Label className={cn(errors.description ? "text-destructive" : "")}>Story / Description</Label>
                                            <Textarea
                                                value={formData.description}
                                                onChange={e => {
                                                    handleChange('description', e.target.value);
                                                    if (errors.description) setErrors(prev => ({ ...prev, description: "" }));
                                                }}
                                                placeholder="Tell the customer about this product..."
                                                className={cn("min-h-[150px] resize-none", errors.description ? "border-destructive focus-visible:ring-destructive" : "")}
                                            />
                                            {errors.description && (
                                                <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-destructive font-medium">
                                                    {errors.description}
                                                </motion.p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* STEP 2: VISUALS */}
                                {currentStep === 2 && (
                                    <div className="space-y-6">
                                        <label
                                            className="
                                                border-2 border-dashed border-gray-300/60 rounded-xl p-10 flex flex-col items-center justify-center 
                                                cursor-pointer hover:bg-gray-50/80 hover:border-primary/50 transition-all group relative overflow-hidden
                                            "
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-gray-50/50 pointer-events-none" />
                                            <div className="bg-white p-4 rounded-full mb-4 shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all duration-300 relative z-10">
                                                <Upload className="h-8 w-8 text-primary" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-700 relative z-10">Click to Upload Photos</h3>
                                            <p className="text-sm text-gray-400 text-center max-w-xs mt-2 relative z-10">
                                                Add high-quality images. Recommended size: 1000x1000px.
                                            </p>
                                            <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
                                        </label>

                                        {(formData.existingImages.length > 0 || formData.imagePreviews.length > 0) && (
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                                {/* Existing Images */}
                                                {formData.existingImages.map((src, i) => (
                                                    <div key={`exist-${i}`} className="relative group aspect-[4/5] rounded-xl overflow-hidden shadow-sm border bg-white cursor-zoom-in" onClick={() => setPreviewImage(src)}>
                                                        <img src={src} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />

                                                        {i === 0 && (
                                                            <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-full border border-white/20 shadow-lg z-10">
                                                                Main Cover
                                                            </div>
                                                        )}

                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                removeImage(i, 'existing');
                                                            }}
                                                            className="absolute top-2 right-2 bg-white/90 hover:bg-destructive hover:text-white text-gray-600 p-1.5 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all duration-200 z-20"
                                                            title="Remove Image"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                                {/* New Uploads */}
                                                {formData.imagePreviews.map((src, i) => (
                                                    <div key={`new-${i}`} className="relative group aspect-[4/5] rounded-xl overflow-hidden shadow-md border-2 border-primary/20 bg-white cursor-zoom-in" onClick={() => setPreviewImage(src)}>
                                                        <img src={src} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />

                                                        {formData.existingImages.length === 0 && i === 0 && (
                                                            <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-full border border-white/20 shadow-lg z-10">
                                                                Main Cover
                                                            </div>
                                                        )}

                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                removeImage(i, 'new');
                                                            }}
                                                            className="absolute top-2 right-2 bg-white/90 hover:bg-destructive hover:text-white text-gray-600 p-1.5 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all duration-200 z-20"
                                                            title="Remove Image"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </button>

                                                        <div className="absolute bottom-2 right-2 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all delay-100 translate-y-2 group-hover:translate-y-0">
                                                            New
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* STEP 3: VARIANTS */}
                                {currentStep === 3 && (
                                    <div className="space-y-8">
                                        {/* Dynamic Color Selection */}
                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <Label className="text-base font-semibold">Product Colors</Label>
                                            </div>

                                            {/* Add New Color */}
                                            <div className="flex gap-2 mb-4 items-end">
                                                <div className="grid gap-1.5 flex-1">
                                                    <Label className="text-xs text-muted-foreground">Color Name</Label>
                                                    <Input
                                                        placeholder="e.g. Midnight Blue"
                                                        id="new-color-name"
                                                    />
                                                </div>
                                                <div className="grid gap-1.5 w-24">
                                                    <Label className="text-xs text-muted-foreground">Hex Code</Label>
                                                    <div className="relative">
                                                        <Input
                                                            type="color"
                                                            id="new-color-hex"
                                                            className="h-10 w-full p-1 cursor-pointer"
                                                            defaultValue="#000000"
                                                        />
                                                    </div>
                                                </div>
                                                <Button
                                                    type="button"
                                                    onClick={() => {
                                                        const nameInput = document.getElementById('new-color-name') as HTMLInputElement;
                                                        const hexInput = document.getElementById('new-color-hex') as HTMLInputElement;
                                                        const name = nameInput.value.trim();
                                                        const hex = hexInput.value;

                                                        if (name) {
                                                            // Check for duplicates
                                                            const exists = formData.selectedColors.some(
                                                                c => c.hex.toLowerCase() === hex.toLowerCase() || c.name.toLowerCase() === name.toLowerCase()
                                                            );

                                                            if (exists) {
                                                                toast({
                                                                    title: "Duplicate Color",
                                                                    description: "A color with this name or hex code already exists.",
                                                                    variant: "destructive"
                                                                });
                                                                return;
                                                            }

                                                            const newColor = { name, hex };
                                                            toggleSelection(formData.selectedColors, newColor, 'selectedColors');
                                                            nameInput.value = "";
                                                        }
                                                    }}
                                                >
                                                    Add Color
                                                </Button>
                                            </div>

                                            {/* Selected Colors List */}
                                            <div className="flex flex-wrap gap-3">
                                                {formData.selectedColors.map((color) => (
                                                    <div
                                                        key={color.name}
                                                        className="group relative px-4 py-2 rounded-full border border-primary/20 bg-primary/5 flex items-center gap-3 animate-in zoom-in-50"
                                                    >
                                                        <div className="w-4 h-4 rounded-full border shadow-sm ring-1 ring-offset-1 ring-black/5" style={{ backgroundColor: color.hex }} />
                                                        <span className="text-sm font-medium text-foreground">
                                                            {color.name}
                                                        </span>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleSelection(formData.selectedColors, color, 'selectedColors');
                                                            }}
                                                            className="ml-1 hover:bg-destructive/10 hover:text-destructive rounded-full p-0.5 transition-colors"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                ))}
                                                {formData.selectedColors.length === 0 && (
                                                    <p className="text-sm text-muted-foreground italic">No colors selected. Please add at least one.</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Size Selection */}
                                        <div>
                                            <Label className="text-base font-semibold mb-3 block">Available Sizes</Label>
                                            <div className="flex flex-wrap gap-2">
                                                {SIZES.map(size => (
                                                    <div
                                                        key={size}
                                                        onClick={() => toggleSelection(formData.selectedSizes, size, 'selectedSizes')}
                                                        className={cn(
                                                            "w-12 h-12 rounded-lg border flex items-center justify-center font-bold cursor-pointer transition-all select-none",
                                                            formData.selectedSizes.includes(size)
                                                                ? "bg-primary text-primary-foreground border-primary shadow-lg scale-110"
                                                                : "bg-white text-gray-400 hover:border-gray-300 hover:text-gray-600"
                                                        )}
                                                    >
                                                        {size}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Matrix Stock Grid */}
                                        {formData.selectedSizes.length > 0 && formData.selectedColors.length > 0 && (
                                            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-lg font-semibold">Stock Availability Matrix</Label>
                                                </div>

                                                {formData.selectedColors.map(color => (
                                                    <div key={color.name} className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                                                        <div className="flex items-center gap-3 mb-4">
                                                            <div className="w-5 h-5 rounded-full border shadow-sm" style={{ backgroundColor: color.hex }} />
                                                            <h4 className="font-semibold text-slate-800">{color.name} Variants</h4>
                                                            <Badge variant="outline" className="bg-white text-slate-600 border-slate-200">
                                                                {formData.selectedSizes.filter(s => !formData.unavailableVariants?.includes(getStockKey(color.name, s))).length} Active Sizes
                                                            </Badge>
                                                        </div>

                                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                                            {formData.selectedSizes.map(size => {
                                                                const key = getStockKey(color.name, size);
                                                                const isUnavailable = formData.unavailableVariants?.includes(key);
                                                                const stock = formData.sizeStock[key] || 0;
                                                                const isOutOfStock = stock === 0;

                                                                if (isUnavailable) {
                                                                    return (
                                                                        <div key={key} className="border border-dashed border-gray-300 rounded-lg p-3 flex items-center justify-between bg-gray-50/50 opacity-60">
                                                                            <span className="text-sm font-medium text-gray-400">{size}</span>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                className="h-6 px-2 text-xs text-primary hover:text-primary hover:bg-primary/10"
                                                                                onClick={() => {
                                                                                    setFormData(prev => ({
                                                                                        ...prev,
                                                                                        unavailableVariants: prev.unavailableVariants?.filter(k => k !== key)
                                                                                    }));
                                                                                }}
                                                                            >
                                                                                Enable
                                                                            </Button>
                                                                        </div>
                                                                    );
                                                                }

                                                                return (
                                                                    <div key={key} className={cn(
                                                                        "relative p-3 rounded-lg border transition-all duration-200 bg-white group",
                                                                        stock === 0 ? "border-red-100" : (stock <= 5 ? "border-amber-200 shadow-sm" : "border-green-100 shadow-sm")
                                                                    )}>
                                                                        <div className="flex justify-between items-center mb-2">
                                                                            <Badge variant="outline" className={cn(
                                                                                "text-[10px] px-1.5 bg-white font-bold",
                                                                                stock === 0 ? "border-red-200 text-red-600" : (stock <= 5 ? "border-amber-200 text-amber-600" : "border-green-200 text-green-700")
                                                                            )}>
                                                                                {size}
                                                                            </Badge>
                                                                            <button
                                                                                onClick={() => {
                                                                                    setFormData(prev => ({
                                                                                        ...prev,
                                                                                        unavailableVariants: [...(prev.unavailableVariants || []), key]
                                                                                    }));
                                                                                }}
                                                                                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-destructive transition-all"
                                                                                title="Remove this size for this color"
                                                                            >
                                                                                <X className="h-3.5 w-3.5" />
                                                                            </button>
                                                                        </div>

                                                                        <div className="relative">
                                                                            <Input
                                                                                type="number"
                                                                                min="0"
                                                                                className={cn(
                                                                                    "h-9 pr-8 text-right font-mono font-medium focus-visible:ring-1",
                                                                                    isOutOfStock ? "text-red-600 bg-red-50/30" : "text-green-700"
                                                                                )}
                                                                                placeholder="0"
                                                                                value={stock === 0 ? "" : stock}
                                                                                onChange={e => {
                                                                                    const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                                                                                    setFormData(prev => ({
                                                                                        ...prev,
                                                                                        sizeStock: { ...prev.sizeStock, [key]: val }
                                                                                    }));
                                                                                }}
                                                                            />
                                                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none">qty</span>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Step 4: Pricing */}
                                {currentStep === 4 && (
                                    <div className="w-full max-w-xl space-y-6 animate-in slide-in-from-right-8 fade-in duration-300">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Pricing Strategy</CardTitle>
                                                <CardDescription>Set your product price and potential discounts.</CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-6">
                                                <div className="grid gap-4">
                                                    <div className="grid gap-2">
                                                        <Label className={cn(errors.price ? "text-destructive" : "")}>Base Price (₹) <span className="text-destructive">*</span></Label>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            placeholder="0.00"
                                                            value={formData.price}
                                                            onChange={e => {
                                                                const val = e.target.value;
                                                                if (Number(val) < 0) return;
                                                                handleChange('price', val);
                                                                if (errors.price) setErrors(prev => ({ ...prev, price: "" }));
                                                            }}
                                                            className={cn("text-lg font-mono", errors.price ? "border-destructive focus-visible:ring-destructive" : "")}
                                                        />
                                                        {errors.price ? (
                                                            <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-destructive font-medium">
                                                                {errors.price}
                                                            </motion.p>
                                                        ) : (
                                                            <p className="text-xs text-muted-foreground">The price customers will see.</p>
                                                        )}
                                                    </div>

                                                    <div className="grid gap-2">
                                                        <Label className={cn(errors.discountPrice ? "text-destructive" : "")}>Discounted Price (Optional)</Label>
                                                        <div className="relative">
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                placeholder="0.00"
                                                                value={formData.discountPrice}
                                                                onChange={e => {
                                                                    const val = e.target.value;
                                                                    if (Number(val) < 0) return;
                                                                    handleChange('discountPrice', val);
                                                                    if (errors.discountPrice) setErrors(prev => ({ ...prev, discountPrice: "" }));
                                                                }}
                                                                className={cn(
                                                                    "font-mono pr-8",
                                                                    errors.discountPrice
                                                                        ? "border-destructive focus-visible:ring-destructive"
                                                                        : (Number(formData.discountPrice) > 0 ? "border-green-500 focus-visible:ring-green-500" : "")
                                                                )}
                                                            />
                                                            {Number(formData.discountPrice) > 0 && !errors.discountPrice && Number(formData.discountPrice) < Number(formData.price) && (
                                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-green-600">
                                                                    -{Math.round(((Number(formData.price) - Number(formData.discountPrice)) / Number(formData.price)) * 100)}%
                                                                </div>
                                                            )}
                                                        </div>
                                                        {errors.discountPrice ? (
                                                            <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-destructive font-medium">
                                                                {errors.discountPrice}
                                                            </motion.p>
                                                        ) : (
                                                            <p className="text-xs text-muted-foreground">
                                                                {Number(formData.discountPrice) > 0
                                                                    ? "Discount applied successfully."
                                                                    : "Set a lower price to show a discount badge."}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Estimated Earnings Calculator */}
                                                {Number(formData.price) > 0 && (
                                                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-3 sm:p-4 space-y-3">
                                                        <h4 className="text-sm font-semibold text-emerald-800 flex items-center gap-2">
                                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                            Estimated Payout
                                                        </h4>

                                                        <div className="space-y-2 text-sm">
                                                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                                                                <span className="text-emerald-700/70">Selling Price</span>
                                                                <span className="font-medium text-emerald-900">
                                                                    {Number(formData.discountPrice) > 0 && Number(formData.discountPrice) < Number(formData.price) ? (
                                                                        <span className="flex items-center gap-2">
                                                                            <span className="line-through text-emerald-700/50 text-xs">₹{formData.price}</span>
                                                                            <span>₹{formData.discountPrice}</span>
                                                                        </span>
                                                                    ) : (
                                                                        <span>₹{formData.price}</span>
                                                                    )}
                                                                </span>
                                                            </div>

                                                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                                                                <div className="flex items-center gap-1.5 text-emerald-700/70">
                                                                    Marketplace Fee
                                                                    <div className="group relative cursor-help">
                                                                        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full border border-emerald-200">{(MARKETPLACE_FEE_PERCENTAGE * 100).toFixed(0)}%</span>
                                                                        {/* Tooltip */}
                                                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg z-10 hidden sm:block">
                                                                            Includes platform commission, payment gateway charges, and service fees.
                                                                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <span className="text-red-500 font-medium whitespace-nowrap">
                                                                    - ₹{(
                                                                        (Number(formData.discountPrice) > 0 && Number(formData.discountPrice) < Number(formData.price)
                                                                            ? Number(formData.discountPrice)
                                                                            : Number(formData.price)) * MARKETPLACE_FEE_PERCENTAGE
                                                                    ).toFixed(2)}
                                                                </span>
                                                            </div>

                                                            <div className="border-t border-dashed border-emerald-200 my-2" />

                                                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-1">
                                                                <div className="flex flex-col">
                                                                    <span className="font-bold text-emerald-800">Your Earnings</span>
                                                                    <span className="text-[10px] text-emerald-600 hidden sm:inline">Per unit sold</span>
                                                                </div>
                                                                <span className="text-xl font-bold text-emerald-700 whitespace-nowrap">
                                                                    ₹{(
                                                                        (Number(formData.discountPrice) > 0 && Number(formData.discountPrice) < Number(formData.price)
                                                                            ? Number(formData.discountPrice)
                                                                            : Number(formData.price)) * (1 - MARKETPLACE_FEE_PERCENTAGE)
                                                                    ).toFixed(2)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </div>
                                )}

                                {/* STEP 5: REVIEW */}
                                {currentStep === 5 && (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 gap-4">
                                            {/* Attributes Summary or other review items can go here if needed later */}
                                        </div>

                                        {/* Admin Only Flags */}
                                        {isAdmin && (
                                            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                                                <div
                                                    className={cn(
                                                        "flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all hover:bg-gray-50",
                                                        formData.isFeatured ? "border-[#267A77] bg-[#267A77]/5" : "border-gray-200"
                                                    )}
                                                    onClick={() => handleChange('isFeatured', !formData.isFeatured)}
                                                >
                                                    <div>
                                                        <h4 className="font-semibold text-sm">Featured Product</h4>
                                                        <p className="text-xs text-muted-foreground">Highlight on homepage</p>
                                                    </div>
                                                    <div className={cn(
                                                        "w-5 h-5 rounded-full border flex items-center justify-center transition-colors",
                                                        formData.isFeatured
                                                            ? "bg-[#267A77] border-[#267A77]"
                                                            : "border-gray-300 bg-transparent"
                                                    )}>
                                                        {formData.isFeatured && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                                                    </div>
                                                </div>

                                                <div
                                                    className={cn(
                                                        "flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all hover:bg-gray-50",
                                                        formData.isNew ? "border-[#FFD028] bg-[#FFD028]/5" : "border-gray-200"
                                                    )}
                                                    onClick={() => handleChange('isNew', !formData.isNew)}
                                                >
                                                    <div>
                                                        <h4 className="font-semibold text-sm">New Arrival</h4>
                                                        <p className="text-xs text-muted-foreground">Mark as newly added</p>
                                                    </div>
                                                    <div className={cn(
                                                        "w-5 h-5 rounded-full border flex items-center justify-center transition-colors",
                                                        formData.isNew
                                                            ? "bg-[#FFD028] border-[#FFD028]"
                                                            : "border-gray-300 dark:border-gray-600 bg-transparent"
                                                    )}>
                                                        {formData.isNew && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex gap-4">
                                            <div className="w-1/3 aspect-[3/4] rounded-lg overflow-hidden border shadow-sm relative bg-gray-100">
                                                {(formData.imagePreviews[0] || formData.existingImages[0]) ? (
                                                    <img src={formData.imagePreviews[0] || formData.existingImages[0]} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full text-gray-400">No Image</div>
                                                )}
                                                {Number(formData.discountPrice) > 0 && (
                                                    <Badge className="absolute top-2 right-2 bg-destructive text-white shadow-lg">Sale</Badge>
                                                )}
                                                <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
                                                    {formData.isFeatured && (
                                                        <span className="bg-[#267A77] w-fit text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                                            Featured
                                                        </span>
                                                    )}
                                                    {formData.isNew && (
                                                        <span className="bg-[#FFD028] w-fit text-black text-[10px] font-medium px-2 py-0.5 rounded-full shadow-sm">
                                                            New
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex-1 space-y-3">
                                                <h2 className="text-2xl font-bold">{formData.title || "Untitled Product"}</h2>
                                                <Badge variant="outline">{formData.category}</Badge>
                                                <div className="text-xl font-semibold mt-2">
                                                    {Number(formData.discountPrice) > 0 ? (
                                                        <>
                                                            <span className="text-destructive mr-2">₹{formData.discountPrice}</span>
                                                            <span className="text-muted-foreground line-through text-base">₹{formData.price}</span>
                                                        </>
                                                    ) : (
                                                        <span>₹{formData.price || 0}</span>
                                                    )}
                                                </div>
                                                <div className="text-sm text-muted-foreground line-clamp-3">
                                                    {formData.description || "No description provided."}
                                                </div>
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {formData.selectedColors.map(c => <div key={c.name} className="w-4 h-4 rounded-full border" style={{ backgroundColor: c.hex }} title={c.name} />)}
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                    {formData.selectedSizes.map(s => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-lg">
                                            <h4 className="font-semibold text-yellow-800 text-sm mb-1">Ready to Publish?</h4>
                                            <p className="text-xs text-yellow-700">
                                                Your product will be instantly available on the marketplace. You can always edit strict details later from the dashboard.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Footer / Controls */}
            <div className="w-full max-w-2xl px-6 pt-6 pb-20 flex flex-col gap-4">
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
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                    Publish Now
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
            </div>

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
            </AnimatePresence>
        </div >
    );
}
