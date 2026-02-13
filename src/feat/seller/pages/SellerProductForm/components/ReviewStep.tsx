import { Check, FileText, DollarSign, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/Card";
import { Badge } from "@/ui/Badge";
import { ProductFormData } from "./types";


interface ReviewStepProps {
    isAdmin: boolean;
    formData: ProductFormData;
    onChange: (field: keyof ProductFormData, value: any) => void;
}

export const ReviewStep: React.FC<ReviewStepProps> = ({
    isAdmin,
    formData,
    onChange
}) => {
    // Merge new previews and existing images for summary
    const allImages = [
        ...Object.values(formData.variantPreviews).flat(),
        ...Object.values(formData.existingVariantImages).flat()
    ];

    // Calculate total stock from sizeStock map
    const totalStock = Object.values(formData.sizeStock).reduce((acc, curr) => acc + curr, 0);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Summary Banner */}
            <div className="bg-primary/5 border border-primary/20 p-6 rounded-2xl flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Check className="h-6 w-6" />
                </div>
                <div>
                    <h3 className="text-lg font-bold tracking-tight">Final Verification</h3>
                    <p className="text-sm text-muted-foreground">Please perform a last sweep of your product configuration before {formData.title ? "submitting." : "initializing."}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column: Basic Info & Pricing */}
                <div className="space-y-6">
                    <Card className="border-border/60 shadow-sm overflow-hidden">
                        <CardHeader className="bg-muted/30 py-4">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <FileText className="h-4 w-4 text-primary" />
                                Basic Identity
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 space-y-4">
                            <div className="flex justify-between items-start">
                                <span className="text-xs text-muted-foreground">Product Title</span>
                                <span className="text-xs font-bold text-right truncate ml-4">{formData.title || "---"}</span>
                            </div>
                            <div className="flex justify-between items-center border-t pt-3">
                                <span className="text-xs text-muted-foreground">Mapped Category</span>
                                <span className="text-xs font-bold text-right uppercase tracking-tighter text-[10px]">{formData.category || "---"}</span>
                            </div>
                            <div className="flex justify-between items-center border-t pt-3">
                                <span className="text-xs text-muted-foreground">System SKU</span>
                                <code className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded">{formData.sku || "AUTO-GEN"}</code>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/60 shadow-sm overflow-hidden bg-emerald-50/20 dark:bg-emerald-950/10">
                        <CardHeader className="bg-emerald-500/10 py-4 border-b border-emerald-500/20">
                            <CardTitle className="text-sm font-bold flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                                <DollarSign className="h-4 w-4" />
                                Pricing Profile
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-muted-foreground">Original Price</span>
                                <span className="text-sm font-black italic">₹{formData.price || "0"}</span>
                            </div>
                            <div className="flex justify-between items-center border-t border-emerald-500/10 pt-3">
                                <span className="text-xs text-muted-foreground">Discounted Price</span>
                                <span className="text-sm font-black text-emerald-600">₹{formData.discountPrice || formData.price || "0"}</span>
                            </div>
                            <div className="flex justify-between items-center border-t border-emerald-500/20 pt-3 bg-emerald-500/5 -mx-5 px-5 py-2">
                                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Net Margin (Approx)</span>
                                <span className="text-lg font-black text-emerald-600">
                                    ₹{Math.floor(Number(formData.discountPrice || formData.price) * 0.9)}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Variants & Media */}
                <div className="space-y-6">
                    <Card className="border-border/60 shadow-sm overflow-hidden">
                        <CardHeader className="bg-muted/30 py-4">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Package className="h-4 w-4 text-primary" />
                                Inventory Matrix
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 space-y-5">
                            <div>
                                <h4 className="text-[10px] uppercase font-black tracking-widest text-muted-foreground mb-3">Color Configuration</h4>
                                <div className="flex flex-wrap gap-2">
                                    {formData.selectedColors.length > 0 ? formData.selectedColors.map(c => (
                                        <Badge key={c.id} variant="outline" className="gap-2 px-3 py-1 rounded-lg border-primary/20 bg-primary/5">
                                            <div className="w-2.5 h-2.5 rounded-full border border-black/10 shadow-inner" style={{ backgroundColor: c.hex }} />
                                            <span className="text-xs font-bold uppercase">{c.name}</span>
                                        </Badge>
                                    )) : <span className="text-xs italic text-muted-foreground">No colors assigned</span>}
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <h4 className="text-[10px] uppercase font-black tracking-widest text-muted-foreground mb-3">Size Architecture</h4>
                                <div className="flex flex-wrap gap-1.5">
                                    {formData.selectedSizes.length > 0 ? formData.selectedSizes.map(s => (
                                        <div key={s} className="px-2 py-1 bg-muted rounded font-black text-[10px] min-w-[32px] text-center border">
                                            {s}
                                        </div>
                                    )) : <span className="text-xs italic text-muted-foreground">No sizes assigned</span>}
                                </div>
                            </div>

                            <div className="border-t pt-4 flex justify-between items-center">
                                <span className="text-xs font-bold">Total Stock Units</span>
                                <Badge className="bg-black text-white px-3 font-black">{totalStock || "0"}</Badge>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Preview Images */}
                    <div className="grid grid-cols-4 gap-2">
                        {allImages.slice(0, 4).map((url, i) => (
                            <div key={i} className="aspect-square rounded-xl overflow-hidden border border-border/60 group relative">
                                <img src={url} alt="Variant preview" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                {i === 3 && allImages.length > 4 && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xs font-black">
                                        +{allImages.length - 4}
                                    </div>
                                )}
                            </div>
                        ))}
                        {allImages.length === 0 && (
                            <div className="col-span-4 h-24 border border-dashed rounded-xl flex items-center justify-center text-muted-foreground text-xs italic">
                                No image previews available
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Final Confirmation Message */}
            <div className="bg-muted/30 p-4 rounded-xl border border-dashed text-center">
                <p className="text-sm text-muted-foreground italic">
                    By submitting, you agree to the marketplace policies and confirm that all information provided is accurate.
                </p>
            </div>
        </div>


    );
};
