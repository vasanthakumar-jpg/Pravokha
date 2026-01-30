import { useAuth } from "@/core/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/ui/Card";
import { Button } from "@/ui/Button";
import { Badge } from "@/ui/Badge";
import { ShoppingBag, Heart, Package, User, TrendingUp, Clock, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { apiClient } from "@/infra/api/apiClient";

export default function UserDashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ orders: 0, wishlist: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      // Fetch user stats
      apiClient.get("/orders").then(res => {
        const orders = Array.isArray(res.data.data) ? res.data.data : [];
        setStats({ orders: orders.length, wishlist: 0 });
        setRecentOrders(orders.slice(0, 3));
      }).catch(err => console.error("Failed to fetch stats:", err));
    }
  }, [user]);

  console.log("[UserHome] Rendering. User:", user?.email, "Loading:", loading);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-2">
              Welcome back, {user?.name || user?.email?.split('@')[0] || 'User'}
            </h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Manage your account and track your orders
            </p>
          </div>
          <Badge variant="outline" className="hidden sm:flex items-center gap-2 px-4 py-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Active
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 border-primary/10 bg-gradient-to-br from-card to-primary/5" onClick={() => navigate("/products")}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Browse Products</CardTitle>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <ShoppingBag className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">Explore</p>
              <p className="text-xs text-muted-foreground mt-1">Discover new items</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 border-green-500/10 bg-gradient-to-br from-card to-green-500/5" onClick={() => navigate("/user/orders")}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Orders</CardTitle>
              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.orders}</p>
              <p className="text-xs text-muted-foreground mt-1">Total orders placed</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 border-red-500/10 bg-gradient-to-br from-card to-red-500/5" onClick={() => navigate("/wishlist")}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Wishlist</CardTitle>
              <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <Heart className="h-5 w-5 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.wishlist}</p>
              <p className="text-xs text-muted-foreground mt-1">Saved items</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 border-blue-500/10 bg-gradient-to-br from-card to-blue-500/5" onClick={() => navigate("/settings")}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profile</CardTitle>
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <User className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">85%</p>
              <p className="text-xs text-muted-foreground mt-1">Profile complete</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <Card className="lg:col-span-1 border-primary/20 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Quick Actions
              </CardTitle>
              <CardDescription>Get started with these shortcuts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start h-12 text-left shadow-sm hover:shadow-md transition-all" onClick={() => navigate("/products")}>
                <ShoppingBag className="mr-3 h-5 w-5" />
                <div className="flex flex-col items-start">
                  <span className="font-semibold">Shop Now</span>
                  <span className="text-xs opacity-70">Browse our catalog</span>
                </div>
              </Button>
              <Button className="w-full justify-start h-12 text-left shadow-sm hover:shadow-md transition-all" variant="outline" onClick={() => navigate("/user/orders")}>
                <Package className="mr-3 h-5 w-5" />
                <div className="flex flex-col items-start">
                  <span className="font-semibold">Track Orders</span>
                  <span className="text-xs opacity-70">View order status</span>
                </div>
              </Button>
              <Button className="w-full justify-start h-12 text-left shadow-sm hover:shadow-md transition-all" variant="outline" onClick={() => navigate("/settings")}>
                <User className="mr-3 h-5 w-5" />
                <div className="flex flex-col items-start">
                  <span className="font-semibold">Edit Profile</span>
                  <span className="text-xs opacity-70">Update your details</span>
                </div>
              </Button>
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card className="lg:col-span-2 border-primary/20 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Recent Orders
              </CardTitle>
              <CardDescription>
                {recentOrders.length > 0 ? `Your latest ${recentOrders.length} orders` : "No orders yet"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentOrders.length > 0 ? (
                <div className="space-y-4">
                  {recentOrders.map((order: any) => (
                    <div key={order.id} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => navigate("/user/orders")}>
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Package className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">Order #{order.orderNumber}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={order.status === 'DELIVERED' ? 'default' : 'secondary'} className="mb-1">
                          {order.status}
                        </Badge>
                        <p className="text-sm font-bold">₹{order.total.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full" onClick={() => navigate("/user/orders")}>
                    View All Orders
                  </Button>
                </div>
              ) : (
                <div className="py-12 text-center">
                  <Package className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground mb-4">No orders yet</p>
                  <Button onClick={() => navigate("/products")}>
                    Start Shopping
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
