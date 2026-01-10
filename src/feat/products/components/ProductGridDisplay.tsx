import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/ui/Card";
import { Button } from "@/ui/Button";
import { Badge } from "@/ui/Badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/ui/Tooltip";
import { Edit, Eye, EyeOff, Trash2, ShieldCheck, Package } from "lucide-react";
import { ProductImage } from "./ProductImage";
import { ProductDomain } from "../domain/types";
import { cn } from "@/lib/utils";

interface ProductGridDisplayProps {
    products: ProductDomain[];
    onTogglePublish: (id: string, currentStatus: boolean) => void;
    onDelete: (id: string) => void;
    basePath: string;
}

export function ProductGridDisplay({ products, onTogglePublish, onDelete, basePath }: ProductGridDisplayProps) {
    const navigate = useNavigate();

    const getStockStatus = (stock: number = 0) => {
        if (stock === 0) return { label: "Out of Stock", color: "bg-red-500 text-white" };
        if (stock < 10) return { label: "Low Stock", color: "bg-orange-500 text-white" };
        return { label: "In Stock", color: "bg-green-500 text-white" };
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((product) => {
                const stockStatus = getStockStatus(product.stock_quantity);
                return (
                    <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-all group rounded-2xl">
                        <div className="relative aspect-square bg-muted">
                            <ProductImage productId={product.id} title={product.title} size="grid" src={product.main_image} />
                            <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                                {product.is_featured && <Badge className="bg-teal-600 text-white border-0 text-[10px]">Featured</Badge>}
                                {product.is_new && <Badge className="bg-yellow-400 text-yellow-900 border-0 text-[10px]">New</Badge>}
                                {product.is_verified && (
                                    <Badge className="bg-blue-600 text-white border-0 text-[10px] flex items-center gap-1">
                                        <ShieldCheck className="h-3 w-3" /> Verified
                                    </Badge>
                                )}
                                <Badge className={cn(stockStatus.color, "border-0 text-[10px]")}>{stockStatus.label}</Badge>
                            </div>
                        </div>

                        <CardContent className="p-4 space-y-3">
                            <h3 className="font-semibold text-base line-clamp-1">{product.title}</h3>

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Price</span>
                                    <span className="font-semibold">₹{product.price.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Category</span>
                                    <span className="capitalize text-xs">{product.category?.replace(/-/g, " ")}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Package className="h-4 w-4" />
                                <span>{product.stock_quantity || 0} Stock</span>
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 h-8 text-xs gap-1.5 rounded-lg"
                                    onClick={() => navigate(`${basePath}/edit/${product.id}`)}
                                >
                                    <Edit className="h-3.5 w-3.5" /> Edit
                                </Button>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className={cn("h-8 w-8 p-0 rounded-lg", product.published ? 'text-green-600' : 'text-muted-foreground')}
                                            onClick={() => onTogglePublish(product.id, product.published)}
                                        >
                                            {product.published ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{product.published ? "Unpublish" : "Publish"}</p>
                                    </TooltipContent>
                                </Tooltip>

                                <Button
                                    variant="destructive"
                                    size="sm"
                                    className="flex-1 h-8 text-xs gap-1.5 rounded-lg"
                                    onClick={() => onDelete(product.id)}
                                >
                                    <Trash2 className="h-3.5 w-3.5" /> Delete
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
