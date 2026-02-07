import React from "react";
import { Badge } from "@/ui/Badge";
import { Button } from "@/ui/Button";
import { Package, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductFormData } from "./types";

interface VisualsStepProps {
    id?: string;
    isAdmin: boolean;
    formData: ProductFormData;
    handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>, colorId: string) => void;
    removeImage: (index: number, type: 'new' | 'existing', colorId: string) => void;
    handleBack: () => void;
}

export const VisualsStep: React.FC<VisualsStepProps> = ({
    id,
    isAdmin,
    formData,
    handleImageUpload,
    removeImage,
    handleBack
}) => {
    return (
        <div className="space-y-6 animate-in slide-in-from-right-8 fade-in duration-300">
            <div className="text-center mb-6">
                <h3 className="text-lg font-semibold">Upload Images by Color</h3>
                <p className="text-sm text-muted-foreground">
                    Add specific images for each color variant so customers see the right product.
                </p>
            </div>

            {formData.selectedColors.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 text-center">
                    <div className="bg-white p-3 rounded-full shadow-sm mb-3">
                        <Package className="h-6 w-6 text-orange-400" />
                    </div>
                    <h3 className="font-semibold text-gray-900">No Colors Defined</h3>
                    <p className="text-sm text-gray-500 max-w-xs mt-1 mb-4">
                        You need to add at least one color variant in the previous step to upload images.
                    </p>
                    <Button variant="outline" onClick={handleBack}>
                        Go Back to Variants
                    </Button>
                </div>
            ) : (
                <div className="space-y-8">
                    {formData.selectedColors.map(color => {
                        const existing = formData.existingVariantImages[color.id] || [];
                        const previews = formData.variantPreviews[color.id] || [];
                        const hasImages = existing.length + previews.length > 0;

                        return (
                            <div key={color.id} className="bg-card border rounded-xl overflow-hidden shadow-sm">
                                <div className="px-5 py-4 border-b bg-gray-50/50 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div>
                                            <h4 className="font-semibold text-sm">
                                                {color.name}
                                                {id && !isAdmin && <Badge variant="secondary" className="ml-2 text-[8px] bg-amber-50 text-amber-700 border-amber-200 uppercase tracking-tighter transition-colors hover:bg-amber-100 hover:text-amber-800">Admin Managed</Badge>}
                                            </h4>
                                            <p className="text-[10px] text-muted-foreground">
                                                {hasImages ? `${existing.length + previews.length} images` : "No images yet"}
                                            </p>
                                        </div>
                                    </div>
                                    {!hasImages && (
                                        <Badge variant="destructive" className="text-[10px]">Required</Badge>
                                    )}
                                </div>

                                <div className="p-5">
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                        {/* Upload Button */}
                                        <label
                                            className={cn(
                                                "aspect-[4/5] border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-primary/50 transition-all group",
                                                id && !isAdmin && "opacity-50 cursor-not-allowed hover:bg-white hover:border-gray-200"
                                            )}
                                        >
                                            <div className="bg-primary/5 p-2 rounded-full mb-2 group-hover:scale-110 transition-transform">
                                                <Upload className="h-5 w-5 text-primary" />
                                            </div>
                                            <span className="text-xs font-semibold text-gray-600">Add Image</span>
                                            <input
                                                type="file"
                                                multiple
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => handleImageUpload(e, color.id)}
                                                disabled={!!id && !isAdmin}
                                            />
                                        </label>

                                        {/* Existing Images */}
                                        {existing.map((src, i) => (
                                            <div key={`exist-${color.id}-${i}`} className="relative group aspect-[4/5] rounded-xl overflow-hidden shadow-sm border bg-white">
                                                <img src={src} className="w-full h-full object-cover" />
                                                <button
                                                    onClick={() => removeImage(i, 'existing', color.id)}
                                                    className={cn(
                                                        "absolute top-2 right-2 bg-white/90 hover:bg-destructive hover:text-white text-gray-600 p-1.5 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all",
                                                        id && !isAdmin && "cursor-not-allowed hidden"
                                                    )}
                                                    disabled={!!id && !isAdmin}
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                                {i === 0 && <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full">Main</span>}
                                            </div>
                                        ))}

                                        {/* New Previews */}
                                        {previews.map((src, i) => (
                                            <div key={`new-${color.id}-${i}`} className="relative group aspect-[4/5] rounded-xl overflow-hidden shadow-sm border border-primary/30 bg-white">
                                                <img src={src} className="w-full h-full object-cover" />
                                                <button
                                                    onClick={() => removeImage(i, 'new', color.id)}
                                                    className="absolute top-2 right-2 bg-white/90 hover:bg-destructive hover:text-white text-gray-600 p-1.5 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                                <Badge className="absolute top-2 left-2 text-[10px] h-5 py-0">New</Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
