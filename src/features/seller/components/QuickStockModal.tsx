import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, Package, RefreshCw } from "lucide-react";

interface QuickStockModalProps {
    product: any;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function QuickStockModal({ product, isOpen, onClose, onSuccess }: QuickStockModalProps) {
    const [variants, setVariants] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [updates, setUpdates] = useState<Record<string, number>>({});

    useEffect(() => {
        if (isOpen && product?.id) {
            fetchVariants();
        }
    }, [isOpen, product?.id]);

    const fetchVariants = async () => {
        setFetching(true);
        try {
            const { data, error } = await supabase
                .from('product_variants')
                .select('*, product_sizes(*)')
                .eq('product_id', product.id);

            if (error) throw error;
            setVariants(data || []);

            // Initialize updates state
            const initialUpdates: Record<string, number> = {};
            data?.forEach(v => {
                v.product_sizes?.forEach((s: any) => {
                    initialUpdates[s.id] = s.stock || 0;
                });
            });
            setUpdates(initialUpdates);
        } catch (error: any) {
            console.error("Error fetching variants:", error);
            toast({
                title: "Error",
                description: "Failed to load product variants",
                variant: "destructive",
            });
        } finally {
            setFetching(false);
        }
    };

    const handleUpdate = async () => {
        setLoading(true);
        try {
            const updatePromises = Object.entries(updates).map(([sizeId, stock]) =>
                supabase
                    .from('product_sizes')
                    .update({ stock })
                    .eq('id', sizeId)
            );

            const results = await Promise.all(updatePromises);
            const firstError = results.find(r => r.error);
            if (firstError) throw firstError.error;

            toast({
                title: "Inventory Updated",
                description: `Successfully updated stock for ${product.title}.`,
            });
            onSuccess();
            onClose();
        } catch (error: any) {
            toast({
                title: "Update Failed",
                description: error.message || "Failed to update stock",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[450px] overflow-hidden border-border/40 bg-card/95 backdrop-blur-xl shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold italic">
                        <Package className="h-5 w-5 text-primary" />
                        Quick Inventory Update
                    </DialogTitle>
                    <p className="text-xs text-muted-foreground italic">Updating inventory for: <span className="text-foreground font-semibold">{product?.title}</span></p>
                </DialogHeader>

                <div className="grid gap-6 py-6 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin">
                    {fetching ? (
                        <div className="flex flex-col items-center justify-center py-10 space-y-3">
                            <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
                            <p className="text-sm text-muted-foreground animate-pulse font-medium">Fetching variants...</p>
                        </div>
                    ) : variants.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground bg-muted/30 rounded-xl border border-dashed">
                            No variants found for this product.
                        </div>
                    ) : (
                        variants.map((v) => (
                            <div key={v.id} className="space-y-4 p-4 rounded-2xl bg-muted/20 border border-border/40 group hover:border-primary/20 transition-all duration-300">
                                <div className="flex items-center justify-between border-b pb-2 mb-2">
                                    <h4 className="text-sm font-black tracking-widest text-primary/80">Variant: {v.color_name || 'Primary'}</h4>
                                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    {v.product_sizes?.map((s: any) => (
                                        <div key={s.id} className="space-y-2">
                                            <Label htmlFor={`size-${s.id}`} className="text-[10px] font-bold text-muted-foreground ml-1">Size {s.size}</Label>
                                            <div className="relative">
                                                <Input
                                                    id={`size-${s.id}`}
                                                    type="number"
                                                    min={0}
                                                    value={updates[s.id]}
                                                    onChange={(e) => {
                                                        const val = parseInt(e.target.value);
                                                        setUpdates(prev => ({ ...prev, [s.id]: isNaN(val) ? 0 : Math.max(0, val) }));
                                                    }}
                                                    className="pl-3 h-10 bg-background/50 border-border/40 focus:ring-primary/20 transition-all font-mono"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0 mt-2">
                    <Button variant="outline" onClick={onClose} disabled={loading} className="rounded-xl border-border/60 hover:bg-muted font-bold transition-all">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleUpdate}
                        disabled={loading || fetching}
                        className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20 transition-all group"
                    >
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <RefreshCw className="h-4 w-4 mr-2 group-hover:rotate-180 transition-transform duration-500" />
                        )}
                        Sync Inventory
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
