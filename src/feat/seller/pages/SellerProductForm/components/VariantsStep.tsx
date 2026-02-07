import React from "react";
import { Input } from "@/ui/Input";
import { Label } from "@/ui/Label";
import { Button } from "@/ui/Button";
import { Badge } from "@/ui/Badge";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductFormData, ColorOption, getStockKey } from "./types";

interface VariantsStepProps {
    formData: ProductFormData;
    setFormData: React.Dispatch<React.SetStateAction<ProductFormData>>;
    SIZES: string[];
    toggleSelection: (list: any[], item: any, field: 'selectedSizes' | 'selectedColors') => void;
    toast: any;
}

export const VariantsStep: React.FC<VariantsStepProps> = ({
    formData,
    setFormData,
    SIZES,
    toggleSelection,
    toast
}) => {
    return (
        <div className="space-y-8 animate-in slide-in-from-right-8 fade-in duration-300">
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

                                const newColor: ColorOption = {
                                    id: crypto.randomUUID(),
                                    name,
                                    hex
                                };
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
                            key={color.id}
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
                        <div key={color.id} className="bg-slate-50 p-5 rounded-xl border border-slate-200">
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
    );
};
