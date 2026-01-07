import { Badge } from "@/ui/Badge";
import { AlertCircle } from "lucide-react";

interface StockIndicatorProps {
  stock: number;
  size?: string;
  showCount?: boolean;
  className?: string;
}

export function StockIndicator({ stock, size, showCount = true, className = "" }: StockIndicatorProps) {
  const getStatus = () => {
    if (stock === 0) {
      return { 
        text: "Out of Stock", 
        variant: "destructive" as const,
        textColor: "text-red-600",
        bgColor: "bg-red-50 dark:bg-red-950/20"
      };
    }
    if (stock < 10) {
      return { 
        text: "Low Stock", 
        variant: "secondary" as const,
        textColor: "text-orange-600",
        bgColor: "bg-orange-50 dark:bg-orange-950/20"
      };
    }
    return { 
      text: "In Stock", 
      variant: "default" as const,
      textColor: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/20"
    };
  };
  
  const status = getStatus();
  
  return (
    <div className={`flex items-center gap-2 p-2 rounded-md ${status.bgColor} ${className}`}>
      {size && (
        <span className="text-xs font-medium text-muted-foreground">
          Size {size}:
        </span>
      )}
      <Badge variant={status.variant} className="text-xs">
        {status.text}
      </Badge>
      {showCount && stock > 0 && stock < 10 && (
        <div className="flex items-center gap-1">
          <AlertCircle className={`h-3 w-3 ${status.textColor}`} />
          <span className={`text-xs font-semibold ${status.textColor}`}>
            {stock} left
          </span>
        </div>
      )}
    </div>
  );
}
