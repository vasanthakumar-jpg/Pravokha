import React from 'react';
import { ShoppingBag, TrendingUp, Sparkles, IndianRupee } from 'lucide-react';
import { Button } from "@/ui/Button";
import { Badge } from "@/ui/Badge";
import { useCart } from "@/core/context/CartContext";
import { getMediaUrl } from "@/lib/utils";

interface Product {
    id: string;
    title: string;
    price: number;
    discountPrice?: number;
    variants: any[];
}

interface ComboOffer {
    id: string;
    title: string;
    description: string;
    comboPrice: number;
    originalPrice: number;
    products: Product[];
}

interface ComboOfferWidgetProps {
    productId: string;
    offers: ComboOffer[];
}

export const ComboOfferWidget: React.FC<ComboOfferWidgetProps> = ({ productId, offers }) => {
    const { addMultipleToCart } = useCart();

    if (!offers || offers.length === 0) return null;

    const handleAddBundle = (offer: ComboOffer) => {
        const itemsToAdd = offer.products.map(product => {
            const variant = product.variants[0];
            const size = variant.sizes.find((s: any) => s.stock > 0)?.size || variant.sizes[0]?.size;

            return {
                item: {
                    productId: product.id,
                    variantId: variant.id,
                    title: product.title,
                    colorName: variant.colorName,
                    colorHex: variant.colorHex,
                    size: size,
                    price: product.price, // Discount will be applied at checkout via combo logic
                    image: variant.images[0],
                    maxStock: variant.sizes.find((s: any) => s.size === size)?.stock || 0,
                    sellerId: (product as any).dealerId || (product as any).vendorId || "",
                },
                quantity: 1
            };
        });

        addMultipleToCart(itemsToAdd);
    };

    return (
        <div className="mt-8 p-6 rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent animate-fade-up">
            <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                <h3 className="text-lg font-bold">Bundle & Save</h3>
            </div>

            <div className="space-y-6">
                {offers.map((offer) => (
                    <div key={offer.id} className="p-4 rounded-xl bg-background border shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex-1">
                                <h4 className="font-bold text-lg text-primary">{offer.title}</h4>
                                <p className="text-sm text-muted-foreground mb-3">{offer.description}</p>

                                <div className="flex -space-x-3 mb-4 overflow-hidden">
                                    {offer.products.map((p, idx) => (
                                        <div key={p.id} className="relative group">
                                            <div className={`h-12 w-12 rounded-full border-2 border-background overflow-hidden bg-muted ${p.id === productId ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
                                                <img
                                                    src={getMediaUrl(p.variants[0]?.images[0])}
                                                    alt={p.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            {p.id === productId && (
                                                <Badge className="absolute -top-1 -right-1 p-0 h-4 w-4 flex items-center justify-center rounded-full text-[8px]">You</Badge>
                                            )}
                                        </div>
                                    ))}
                                    <div className="h-12 w-12 rounded-full border-2 border-background bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                        +{offer.products.length}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-2 w-full md:w-auto">
                                <div className="text-right">
                                    <div className="flex items-center justify-end gap-2 text-muted-foreground line-through text-sm">
                                        <IndianRupee className="h-3 w-3" />
                                        {offer.originalPrice || offer.products.reduce((s, p) => s + p.price, 0)}
                                    </div>
                                    <div className="flex items-center justify-end gap-1 text-2xl font-black text-foreground">
                                        <IndianRupee className="h-5 w-5" />
                                        {offer.comboPrice}
                                    </div>
                                    <Badge variant="secondary" className="mt-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200">
                                        Save ₹{(offer.originalPrice || offer.products.reduce((s, p) => s + p.price, 0)) - offer.comboPrice}
                                    </Badge>
                                </div>
                                <Button
                                    onClick={() => handleAddBundle(offer)}
                                    className="w-full md:w-auto gap-2 shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
                                >
                                    <ShoppingBag className="h-4 w-4" />
                                    Add Bundle to Cart
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg">
                <TrendingUp className="h-3 w-3" />
                <span>Frequently bought together by other savvy shoppers!</span>
            </div>
        </div>
    );
};
