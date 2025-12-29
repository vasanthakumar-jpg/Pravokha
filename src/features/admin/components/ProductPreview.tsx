import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Heart, ShoppingCart, Star } from "lucide-react";

interface ProductPreviewProps {
  title: string;
  description: string;
  price: number;
  discountPrice?: number;
  images: string[];
  colors: string[];
  quantity: number;
  category: string;
  featured?: boolean;
  newArrival?: boolean;
}

export function ProductPreview({
  title,
  description,
  price,
  discountPrice,
  images,
  colors,
  quantity,
  category,
  featured,
  newArrival,
}: ProductPreviewProps) {
  const getStockStatus = () => {
    if (quantity === 0) return { text: "Out of Stock", variant: "destructive" as const };
    if (quantity === 1) return { text: "Last 1 Remaining", variant: "secondary" as const };
    return { text: "In Stock", variant: "default" as const };
  };

  const stockStatus = getStockStatus();

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="text-lg">Product Preview</CardTitle>
        <p className="text-sm text-muted-foreground">
          This is how your product will appear to customers
        </p>
      </CardHeader>
      <CardContent>
        <div className="max-w-sm mx-auto">
          <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300">
            <div className="relative aspect-square overflow-hidden bg-muted">
              {images.length > 0 ? (
                <img
                  src={images[0]}
                  alt={title || "Product preview"}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  No image uploaded
                </div>
              )}

              {/* Badges */}
              <div className="absolute top-2 left-2 flex flex-col gap-2">
                {featured && (
                  <Badge className="bg-primary text-primary-foreground font-bold shadow-md">
                    Featured
                  </Badge>
                )}
                {newArrival && (
                  <Badge className="bg-accent text-accent-foreground font-bold shadow-md px-1.5 py-0 text-[10px] h-5">
                    New
                  </Badge>
                )}
              </div>

              {/* Wishlist icon */}
              <button className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background/90 transition-all duration-200">
                <Heart className="h-4 w-4 transition-all duration-300 text-muted-foreground" />
              </button>
            </div>

            <CardContent className="p-4">
              <div className="space-y-2">
                {/* Category */}
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  {category || "Uncategorized"}
                </p>

                {/* Title */}
                <h3 className="font-semibold text-base line-clamp-2 min-h-[3rem]">
                  {title || "Product Title"}
                </h3>

                {/* Description */}
                {description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {description}
                  </p>
                )}

                {/* Colors */}
                {colors.length > 0 && (
                  <div className="flex gap-1.5 py-1">
                    {colors.slice(0, 5).map((color, index) => (
                      <div
                        key={index}
                        className="w-5 h-5 rounded-full border-2 border-border cursor-pointer hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                    {colors.length > 5 && (
                      <div className="w-5 h-5 rounded-full border-2 border-border flex items-center justify-center text-[10px]">
                        +{colors.length - 5}
                      </div>
                    )}
                  </div>
                )}

                {/* Rating */}
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                  <span className="text-xs text-muted-foreground ml-1">(4.5)</span>
                </div>

                {/* Price */}
                <div className="flex items-center gap-2">
                  {discountPrice && discountPrice < price ? (
                    <>
                      <span className="text-lg font-bold text-primary">
                        ₹{discountPrice}
                      </span>
                      <span className="text-sm text-muted-foreground line-through">
                        ₹{price}
                      </span>
                      <Badge variant="secondary" className="ml-auto">
                        {Math.round(((price - discountPrice) / price) * 100)}% OFF
                      </Badge>
                    </>
                  ) : (
                    <span className="text-lg font-bold text-primary">
                      ₹{price || 0}
                    </span>
                  )}
                </div>

                {/* Stock Status */}
                <Badge variant={stockStatus.variant} className="w-full justify-center">
                  {stockStatus.text}
                </Badge>

                {/* Add to Cart Button */}
                <Button
                  className="w-full"
                  disabled={quantity === 0}
                  size="sm"
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  {quantity === 0 ? "Out of Stock" : "Add to Cart"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
