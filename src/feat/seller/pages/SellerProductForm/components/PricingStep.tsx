import React from "react";
import { motion } from "framer-motion";
import { Input } from "@/ui/Input";
import { Label } from "@/ui/Label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/ui/Card";
import { cn } from "@/lib/utils";
import { ProductFormData } from "./types";

interface PricingStepProps {
    formData: ProductFormData;
    onChange: (field: keyof ProductFormData, value: any) => void;
    errors: Record<string, string>;
    setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    MARKETPLACE_FEE_PERCENTAGE: number;
}

export const PricingStep: React.FC<PricingStepProps> = ({
    formData,
    onChange,
    errors,
    setErrors,
    MARKETPLACE_FEE_PERCENTAGE
}) => {
    return (
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
                                    onChange('price', val);
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
                                        onChange('discountPrice', val);
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
    );
};
