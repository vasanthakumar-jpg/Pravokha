import { Card, CardContent, CardHeader, CardTitle } from "@/ui/Card";
import { Badge } from "@/ui/Badge";
import { Package, AlertTriangle } from "lucide-react";

interface Product {
  id: string;
  title: string;
  stock_quantity?: number;
}

interface LowStockAlertsProps {
  products: Product[];
  threshold?: number;
  isGhost?: boolean;
}

export default function LowStockAlerts({ products, threshold = 10, isGhost }: LowStockAlertsProps) {
  const lowStockProducts = products.filter(p => (p.stock_quantity || 0) < threshold && (p.stock_quantity || 0) > 0);
  const outOfStock = products.filter(p => (p.stock_quantity || 0) === 0);

  const Content = (
    <div className="space-y-3">
      {outOfStock.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-2 text-destructive">Out of Stock ({outOfStock.length})</p>
          <div className="space-y-1">
            {outOfStock.slice(0, 3).map((product) => (
              <div key={product.id} className="flex items-center justify-between text-sm">
                <span className="truncate flex-1">{product.title}</span>
                <Badge variant="destructive" className="ml-2">0</Badge>
              </div>
            ))}
            {outOfStock.length > 3 && (
              <p className="text-xs text-muted-foreground">+{outOfStock.length - 3} more</p>
            )}
          </div>
        </div>
      )}

      {lowStockProducts.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-2 text-orange-600">Low Stock ({lowStockProducts.length})</p>
          <div className="space-y-1">
            {lowStockProducts.slice(0, 3).map((product) => (
              <div key={product.id} className="flex items-center justify-between text-sm">
                <span className="truncate flex-1">{product.title}</span>
                <Badge variant="secondary" className="ml-2 bg-orange-100 text-orange-700">
                  {product.stock_quantity}
                </Badge>
              </div>
            ))}
            {lowStockProducts.length > 3 && (
              <p className="text-xs text-muted-foreground">+{lowStockProducts.length - 3} more</p>
            )}
          </div>
        </div>
      )}
    </div>
  );

  if (isGhost) {
    return (
      <div className="p-6">
        <h2 className="text-lg font-bold flex items-center gap-2 mb-6">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Stock Alerts
        </h2>
        {lowStockProducts.length === 0 && outOfStock.length === 0 ? <p className="text-sm text-muted-foreground">All products are well-stocked ✅</p> : Content}
      </div>
    );
  }

  if (lowStockProducts.length === 0 && outOfStock.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Stock Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">All products are well-stocked ✅</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Stock Alerts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {outOfStock.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2 text-destructive">Out of Stock ({outOfStock.length})</p>
              <div className="space-y-1">
                {outOfStock.slice(0, 3).map((product) => (
                  <div key={product.id} className="flex items-center justify-between text-sm">
                    <span className="truncate flex-1">{product.title}</span>
                    <Badge variant="destructive" className="ml-2">0</Badge>
                  </div>
                ))}
                {outOfStock.length > 3 && (
                  <p className="text-xs text-muted-foreground">+{outOfStock.length - 3} more</p>
                )}
              </div>
            </div>
          )}

          {lowStockProducts.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2 text-orange-600">Low Stock ({lowStockProducts.length})</p>
              <div className="space-y-1">
                {lowStockProducts.slice(0, 3).map((product) => (
                  <div key={product.id} className="flex items-center justify-between text-sm">
                    <span className="truncate flex-1">{product.title}</span>
                    <Badge variant="secondary" className="ml-2 bg-orange-100 text-orange-700">
                      {product.stock_quantity}
                    </Badge>
                  </div>
                ))}
                {lowStockProducts.length > 3 && (
                  <p className="text-xs text-muted-foreground">+{lowStockProducts.length - 3} more</p>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
