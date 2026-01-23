import { Card, CardContent, CardHeader, CardTitle } from "@/ui/Card";
import { Badge } from "@/ui/Badge";
import { Button } from "@/ui/Button";
import { Clock, Eye, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface RecentOrder {
  id: string;
  order_number: string;
  customer_name: string;
  total: number;
  status: string;
  created_at: string;
  items_count: number;
}

interface RecentOrdersProps {
  orders: RecentOrder[];
  isGhost?: boolean;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function RecentOrders({ orders, isGhost }: RecentOrdersProps) {
  const navigate = useNavigate();

  const getRelativeTime = (date: string) => {
    const now = new Date();
    const orderDate = new Date(date);
    const diffInHours = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const Content = (
    <div className="space-y-3">
      {orders.slice(0, 5).map((order) => (
        <div key={order.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-medium">#{order.order_number}</p>
              <Badge className={statusColors[order.status] || 'bg-gray-100 text-gray-800'}>
                {order.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{order.customer_name}</p>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Package className="h-3 w-3" />
                {order.items_count} item{order.items_count > 1 ? 's' : ''}
              </span>
              <span className="text-xs text-muted-foreground">
                {getRelativeTime(order.created_at)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <p className="text-sm font-bold">₹{order.total}</p>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/seller/orders/${order.id}`)}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );

  if (isGhost) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Orders
          </h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/seller/orders')}>
            View All
          </Button>
        </div>
        {orders.length === 0 ? <p className="text-sm text-muted-foreground">No orders yet</p> : Content}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No orders yet</p>
        </CardContent>
      </Card>
    );
  }



  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Orders
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={() => navigate('/seller/orders')}>
          View All
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {orders.slice(0, 5).map((order) => (
            <div key={order.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium">#{order.order_number}</p>
                  <Badge className={statusColors[order.status] || 'bg-gray-100 text-gray-800'}>
                    {order.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{order.customer_name}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    {order.items_count} item{order.items_count > 1 ? 's' : ''}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {getRelativeTime(order.created_at)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <p className="text-sm font-bold">₹{order.total}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(`/seller/orders/${order.id}`)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
