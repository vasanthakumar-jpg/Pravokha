import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TrendingUp, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface TopProduct {
  id: string;
  title: string;
  sales: number;
  revenue: number;
}

interface TopProductsProps {
  products: TopProduct[];
  isGhost?: boolean;
}

export default function TopProducts({ products, isGhost }: TopProductsProps) {
  const navigate = useNavigate();

  const Content = (
    <div className="space-y-3">
      {products.slice(0, 5).map((product, index) => (
        <div key={product.id} className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Badge className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-xs">
              {index + 1}
            </Badge>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{product.title}</p>
              <p className="text-xs text-muted-foreground">
                {product.sales} sales • ₹{product.revenue.toLocaleString()}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0"
            onClick={() => navigate(`/seller/products`)}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );

  if (isGhost) {
    return (
      <div className="p-6">
        <h2 className="text-lg font-bold flex items-center gap-2 mb-6">
          <TrendingUp className="h-5 w-5" />
          Top Products
        </h2>
        {products.length === 0 ? <p className="text-sm text-muted-foreground">No sales data yet</p> : Content}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Top Products
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No sales data yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Top Products
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {products.slice(0, 5).map((product, index) => (
            <div key={product.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Badge className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-xs">
                  {index + 1}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{product.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {product.sales} sales • ₹{product.revenue.toLocaleString()}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="flex-shrink-0"
                onClick={() => navigate(`/seller/products`)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
