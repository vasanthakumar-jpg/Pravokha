import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/Card";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { Label } from "@/ui/Label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/Select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/Table";
import { Badge } from "@/ui/Badge";
import { Plus, Percent, Tag, Calendar, Eye, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/shared/hook/use-toast";
import { apiClient } from "@/infra/api/apiClient";
import { useAuth } from "@/core/context/AuthContext";

interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  min_order: number;
  max_uses: number;
  used_count: number;
  start_date: string;
  end_date: string;
  status: 'active' | 'expired' | 'disabled';
}

export default function SellerPromotions() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    type: 'percentage' as 'percentage' | 'fixed',
    value: 0,
    min_order: 0,
    max_uses: 100,
  });

  useEffect(() => {
    fetchCoupons();
  }, [user]);

  const fetchCoupons = async () => {
    if (!user) return;

    try {
      const { data } = await apiClient.get('/coupons', {
        params: { seller_id: user.id }
      });

      const transformedCoupons: Coupon[] = (data || []).map((coupon: any) => ({
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        min_order: coupon.min_order,
        max_uses: coupon.max_uses,
        used_count: coupon.used_count,
        start_date: coupon.start_date,
        end_date: coupon.end_date,
        status: coupon.status,
      }));

      setCoupons(transformedCoupons);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCoupon = async () => {
    if (!newCoupon.code || !newCoupon.value || !user) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data } = await apiClient.post('/coupons', {
        seller_id: user.id,
        code: newCoupon.code,
        type: newCoupon.type,
        value: newCoupon.value,
        min_order: newCoupon.min_order,
        max_uses: newCoupon.max_uses,
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      if (data) {
        setCoupons([data, ...coupons]);
        setShowForm(false);
        setNewCoupon({ code: '', type: 'percentage', value: 0, min_order: 0, max_uses: 100 });
        toast({
          title: "Coupon Created",
          description: `Coupon "${data.code}" has been created successfully`,
        });
      }
    } catch (error: any) {
      console.error('Error creating coupon:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create coupon",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    try {
      await apiClient.delete(`/coupons/${id}`);

      setCoupons(coupons.filter(c => c.id !== id));
      toast({
        title: "Coupon Deleted",
        description: "Coupon has been removed",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete coupon",
        variant: "destructive",
      });
    }
  };

  const statusConfig = {
    active: { color: 'bg-green-100 text-green-800', label: 'Active' },
    expired: { color: 'bg-gray-100 text-gray-800', label: 'Expired' },
  };

  if (loading) {
    return (
      <div className="container py-8 max-w-7xl animate-pulse space-y-8">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-muted rounded-xl" />
            <div className="h-4 w-48 bg-muted/60 rounded-lg" />
          </div>
          <div className="h-10 w-32 bg-muted rounded-xl" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-muted/30 rounded-2xl border border-border/40" />
          ))}
        </div>

        <div className="rounded-3xl border border-border/40 overflow-hidden bg-card/50">
          <div className="h-14 bg-muted/20 border-b border-border/40" />
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex gap-4 items-center">
                <div className="h-5 flex-1 bg-muted/40 rounded" />
                <div className="h-5 w-24 bg-muted/40 rounded" />
                <div className="h-5 w-20 bg-muted/40 rounded" />
                <div className="h-7 w-24 bg-muted rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="container py-8" >
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Promotions & Discounts</h1>
          <p className="text-muted-foreground">Create and manage your promotional offers</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Coupon
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6" >
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{coupons.filter(c => c.status === 'active').length}</div>
            <p className="text-xs text-muted-foreground">Active Coupons</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{coupons.reduce((s, c) => s + c.used_count, 0)}</div>
            <p className="text-xs text-muted-foreground">Total Uses</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              ₹{coupons.reduce((s, c) => s + (c.used_count * (c.type === 'fixed' ? c.value : 0)), 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Discount Given</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{coupons.reduce((s, c) => s + c.max_uses - c.used_count, 0)}</div>
            <p className="text-xs text-muted-foreground">Remaining Uses</p>
          </CardContent>
        </Card>
      </div >

      {/* Create Coupon Form */}
      {
        showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Create New Coupon</CardTitle>
              <CardDescription>Set up a discount code for your customers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Coupon Code *</Label>
                  <Input
                    value={newCoupon.code}
                    onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                    placeholder="e.g., SAVE20"
                  />
                </div>
                <div>
                  <Label>Discount Type *</Label>
                  <Select value={newCoupon.type} onValueChange={(v: any) => setNewCoupon({ ...newCoupon, type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Discount Value *</Label>
                  <Input
                    type="number"
                    value={newCoupon.value}
                    onChange={(e) => setNewCoupon({ ...newCoupon, value: parseInt(e.target.value) || 0 })}
                    placeholder={newCoupon.type === 'percentage' ? '20' : '500'}
                  />
                </div>
                <div>
                  <Label>Minimum Order Amount</Label>
                  <Input
                    type="number"
                    value={newCoupon.min_order}
                    onChange={(e) => setNewCoupon({ ...newCoupon, min_order: parseInt(e.target.value) || 0 })}
                    placeholder="1000"
                  />
                </div>
                <div>
                  <Label>Maximum Uses</Label>
                  <Input
                    type="number"
                    value={newCoupon.max_uses}
                    onChange={(e) => setNewCoupon({ ...newCoupon, max_uses: parseInt(e.target.value) || 100 })}
                    placeholder="100"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={handleCreateCoupon}>Create Coupon</Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )
      }

      {/* Coupons Table */}
      <Card>
        <CardHeader>
          <CardTitle>Active Coupons</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Min Order</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Valid Until</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map((coupon) => (
                <TableRow key={coupon.id}>
                  <TableCell className="font-mono font-bold">{coupon.code}</TableCell>
                  <TableCell>
                    {coupon.type === 'percentage' ? (
                      <Badge variant="outline" className="gap-1">
                        <Percent className="h-3 w-3" />
                        {coupon.value}% OFF
                      </Badge>
                    ) : (
                      <Badge variant="outline">₹{coupon.value} OFF</Badge>
                    )}
                  </TableCell>
                  <TableCell>₹{coupon.min_order}</TableCell>
                  <TableCell>
                    {coupon.used_count} / {coupon.max_uses}
                    <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                      <div
                        className="bg-primary h-1.5 rounded-full"
                        style={{ width: `${(coupon.used_count / coupon.max_uses) * 100}%` }}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(coupon.end_date), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusConfig[coupon.status].color} variant="secondary">
                      {statusConfig[coupon.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteCoupon(coupon.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div >
  );
}
