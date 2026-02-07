import React from "react";
import { motion } from "framer-motion";
import { Input } from "@/ui/Input";
import { Label } from "@/ui/Label";
import { Textarea } from "@/ui/Textarea";
import { Button } from "@/ui/Button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/Select";
import { Plus, Shield, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductFormData } from "./types";

interface BasicInfoStepProps {
    id?: string;
    formData: ProductFormData;
    onChange: (field: keyof ProductFormData, value: any) => void;
    errors: Record<string, string>;
    setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    dbCategories: { id: string; name: string; slug: string }[];
    dbSubcategories: { id: string; name: string; slug: string; categoryId: string }[];
    handleCategoryChange: (categoryId: string) => void;
    isLoadingSubcategories: boolean;
    subcategoryWarning: string;
    setSubcategoryWarning: (warning: string) => void;
    generateSKU: () => string;
    toast: any;
    setFormData: React.Dispatch<React.SetStateAction<ProductFormData>>;
}

export const BasicInfoStep: React.FC<BasicInfoStepProps> = ({
    id,
    formData,
    onChange,
    errors,
    setErrors,
    dbCategories,
    dbSubcategories,
    handleCategoryChange,
    isLoadingSubcategories,
    subcategoryWarning,
    setSubcategoryWarning,
    generateSKU,
    toast,
    setFormData
}) => {
    return (
        <div className="space-y-4">
            <div className="grid gap-2">
                <Input
                    value={formData.title}
                    onChange={e => {
                        onChange('title', e.target.value);
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
                <div className="flex items-center justify-between">
                    <Label className={cn(errors.sku ? "text-destructive" : "")}>Product SKU (Unique ID)</Label>
                    {!id && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-[10px] text-primary hover:text-primary/80 flex items-center gap-1"
                            onClick={(e) => {
                                e.preventDefault();
                                onChange('sku', generateSKU());
                                toast({ title: "New SKU Generated", description: "You have a fresh unique identifier." });
                            }}
                        >
                            <Plus className="w-3 h-3" /> Regenerate
                        </Button>
                    )}
                </div>
                <div className="relative">
                    <Input
                        value={formData.sku}
                        onChange={e => {
                            onChange('sku', e.target.value.toUpperCase());
                            if (errors.sku) setErrors(prev => ({ ...prev, sku: "" }));
                        }}
                        placeholder="PVK-XXXXXX"
                        className={cn("font-mono tracking-widest text-sm", errors.sku ? "border-destructive" : "")}
                        disabled={!!id}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {!!id ? <Shield className="w-4 h-4 text-muted-foreground/40" /> : <Tag className="w-4 h-4 text-muted-foreground/40" />}
                    </div>
                </div>
                <p className="text-[10px] text-muted-foreground italic">
                    {!!id ? "Existing product SKU cannot be changed for tracking integrity." : "A unique identifier used for inventory tracking."}
                </p>
                {errors.sku && (
                    <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-destructive font-medium">
                        {errors.sku}
                    </motion.p>
                )}
            </div>

            <div className="grid gap-2">
                <div className="flex items-center justify-between">
                    <Label className={cn(errors.category ? "text-destructive" : "")}>Category *</Label>
                </div>
                <Select
                    value={formData.selectedCategoryId}
                    onValueChange={handleCategoryChange}
                >
                    <SelectTrigger className={cn(
                        "text-lg h-12",
                        errors.category ? "border-destructive focus-visible:ring-destructive" : ""
                    )}>
                        <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                        {dbCategories.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {errors.category && (
                    <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-destructive font-medium">
                        {errors.category}
                    </motion.p>
                )}
            </div>

            {formData.selectedCategoryId && (
                <div className="grid gap-2">
                    <Label className={cn(errors.subcategory ? "text-destructive" : "")}>
                        Subcategory *
                    </Label>
                    <Select
                        value={formData.selectedSubcategoryId}
                        onValueChange={(v) => {
                            setFormData(prev => ({ ...prev, selectedSubcategoryId: v }));
                            setSubcategoryWarning("");
                            if (errors.subcategory) setErrors(prev => ({ ...prev, subcategory: "" }));
                        }}
                        disabled={isLoadingSubcategories || !formData.selectedCategoryId}
                    >
                        <SelectTrigger className={cn(
                            "text-lg h-12",
                            errors.subcategory ? "border-destructive focus-visible:ring-destructive" : ""
                        )}>
                            <SelectValue placeholder="Select a subcategory" />
                        </SelectTrigger>
                        <SelectContent>
                            {dbSubcategories
                                .filter(sub => (sub.categoryId === formData.selectedCategoryId))
                                .map(sub => (
                                    <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                                ))
                            }
                        </SelectContent>
                    </Select>
                    {errors.subcategory && (
                        <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-destructive font-medium">
                            {errors.subcategory}
                        </motion.p>
                    )}
                    {subcategoryWarning && !errors.subcategory && (
                        <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-amber-600 font-medium">
                            {subcategoryWarning}
                        </motion.p>
                    )}
                </div>
            )}
            {/* Review Categories Configuration */}
            <div className="grid gap-2">
                <div className="flex items-center justify-between">
                    <Label>Review Categories (Optional)</Label>
                </div>
                <div className="text-xs text-muted-foreground mb-2">
                    Define custom criteria for customers to rate (e.g., Comfort, Fit, Quality). These will appear as star ratings.
                </div>
                <div className="flex gap-2">
                    <Input
                        placeholder="Add a category (e.g. Comfort)"
                        id="new-review-cat"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                const input = e.currentTarget as HTMLInputElement;
                                const val = input.value.trim();
                                if (val) {
                                    const tag = `review_cat:${val}`;
                                    const currentTags = formData.tags || [];
                                    if (!currentTags.includes(tag)) {
                                        const newTags = [...currentTags, tag];
                                        onChange('tags', newTags);
                                        input.value = '';
                                    }
                                }
                            }
                        }}
                    />
                    <Button type="button" variant="secondary" onClick={() => {
                        const input = document.getElementById('new-review-cat') as HTMLInputElement;
                        if (input && input.value.trim()) {
                            const val = input.value.trim();
                            const tag = `review_cat:${val}`;
                            const currentTags = formData.tags || [];
                            if (!currentTags.includes(tag)) {
                                const newTags = [...currentTags, tag];
                                onChange('tags', newTags);
                                input.value = '';
                            }
                        }
                    }}>Add</Button>
                </div>
                {/* Display active review categories */}
                <div className="flex flex-wrap gap-2 mt-2">
                    {(formData.tags || [])
                        .filter(t => t.startsWith('review_cat:'))
                        .map(tag => (
                            <div key={tag} className="flex items-center gap-1 bg-secondary px-2 py-1 rounded text-xs">
                                <span>{tag.replace('review_cat:', '')}</span>
                                <button
                                    onClick={() => {
                                        const newTags = (formData.tags || []).filter(t => t !== tag);
                                        onChange('tags', newTags);
                                    }}
                                    className="text-muted-foreground hover:text-destructive"
                                >
                                    <span className="sr-only">Remove</span>
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        ))
                    }
                </div>
            </div>

            <div className="grid gap-2">
                <div className="flex items-center justify-between">
                    <Label className={cn(errors.description ? "text-destructive" : "")}>Story / Description</Label>
                </div>
                <Textarea
                    value={formData.description}
                    onChange={e => {
                        onChange('description', e.target.value);
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
    );
};
