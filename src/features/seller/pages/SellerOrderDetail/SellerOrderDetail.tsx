import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Separator } from "@/components/ui/Separator";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/Dialog";
import {
  ArrowLeft,
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  User,
  Mail,
  Phone,
  Download,
  Printer,
  Save,
  Calendar,
  Info,
  CreditCard,
  AlertCircle,
  FileText
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { generateInvoicePDF } from "@/utils/invoiceGenerator";
import { cn } from "@/lib/utils";

interface OrderItem {
  id: string;
  title: string;
  colorName?: string;
  size?: string;
  quantity: number;
  price: number;
  image?: string;
  sellerId?: string;
}

interface TimelineEvent {
  status: string;
  timestamp: string;
  description: string;
  icon: any;
  color: string;
}

const statusOptions = [
  { value: 'pending', label: 'Pending', color: 'bg-yellow-500' },
  { value: 'confirmed', label: 'Confirmed', color: 'bg-blue-500' },
  { value: 'packed', label: 'Packed', color: 'bg-purple-500' },
  { value: 'shipped', label: 'Shipped', color: 'bg-indigo-500' },
  { value: 'delivered', label: 'Delivered', color: 'bg-green-500' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-500' },
];

export default function SellerOrderDetail() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user, verificationStatus } = useAuth();

  const isAdmin = location.pathname.startsWith('/admin');
  const backLink = isAdmin ? '/admin/orders' : '/seller/orders';

  const [order, setOrder] = useState<any>(null);
  const [orderHistory, setOrderHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrierName, setCarrierName] = useState('Delhivery');
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [showPackingSlip, setShowPackingSlip] = useState(false);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);

  useEffect(() => {
    if (orderId) {
      loadOrder();
    }
  }, [orderId]);

  const loadOrder = async () => {
    try {
      const { data, error } = await supabase.from('orders').select('*').eq('id', orderId).single();
      if (error) throw error;

      setOrder(data);
      setNotes(data.notes ? (typeof data.notes === 'string' ? data.notes : JSON.parse(data.notes).seller_notes || '') : '');
      setTrackingNumber((data as any).tracking_number || '');

      const items = Array.isArray(data.items) ? data.items : [];
      const hasSellerItems = items.some((item: any) => item.sellerId === user?.id);
      if (!isAdmin && !hasSellerItems) {
        setIsReadOnly(true);
      }

      const { data: historyData } = await supabase.from('order_history' as any).select('*').eq('order_id', orderId).order('created_at', { ascending: true });
      if (historyData) setOrderHistory(historyData);

    } catch (error) {
      console.error('Error loading order:', error);
      toast({ title: "Error", description: "Failed to load order", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const calculatePricing = () => {
    if (!order) return { subtotal: 0, tax: 0, shipping: 0, total: 0 };
    const items = Array.isArray(order.items) ? order.items : [];
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    const tax = Math.round(subtotal * 0.18);
    const shipping = (order as any).shipping_charge || 0;
    const total = subtotal + tax + shipping;
    return { subtotal, tax, shipping, total };
  };

  const { subtotal, tax, shipping, total } = calculatePricing();

  const handleStatusUpdate = async (newStatus: string) => {
    if (!isAdmin && verificationStatus !== 'verified') {
      toast({
        title: "Verification Required",
        description: "You must be a verified seller to update order status.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error: updateError } = await supabase
        .from('orders')
        .update({ order_status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId)
        .select();

      if (updateError) throw updateError;

      if (!data || data.length === 0) {
        throw new Error("Update failed: You might not have permission to update this order.");
      }

      setOrder({ ...order, order_status: newStatus });

      // Add to Order History
      const { error: historyError } = await supabase.from('order_history' as any).insert({
        order_id: orderId,
        new_status: newStatus,
        description: `Order status updated to ${newStatus} by ${isAdmin ? 'Admin' : 'Seller'}.`,
        created_at: new Date().toISOString()
      });

      if (historyError) {
        console.error("Order history error:", historyError);
        // Note: We don't throw here as the main order update succeeded
      }

      // Audit Logging
      await supabase.from('audit_logs').insert({
        actor_id: user?.id,
        target_id: orderId,
        target_type: 'order',
        action_type: 'order_status_update',
        severity: 'info',
        description: `Order #${order?.order_number} status updated to "${newStatus}".`,
        metadata: { status: newStatus, order_number: order?.order_number }
      });

      toast({ title: "Status Updated", description: `Order marked as ${newStatus}` });
      await loadOrder();
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update status. Check permissions.",
        variant: "destructive"
      });
    }
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      // Preserve existing notes structure if complex, or just string
      const noteObj = { seller_notes: notes, updated_at: new Date().toISOString() };
      const { error } = await supabase.from('orders').update({ notes: JSON.stringify(noteObj) }).eq('id', orderId);
      if (error) throw error;

      // Audit Logging
      await supabase.from('audit_logs').insert({
        actor_id: user?.id,
        target_id: orderId,
        target_type: 'order',
        action_type: 'order_notes_update',
        severity: 'info',
        description: `Notes updated for Order #${order?.order_number}.`,
        metadata: { order_number: order?.order_number }
      });

      toast({ title: "Saved", description: "Seller notes updated." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to save notes", variant: "destructive" });
    } finally {
      setSavingNotes(false);
    }
  };

  const handleMarkShipped = async () => {
    if (!isAdmin && verificationStatus !== 'verified') {
      toast({
        title: "Verification Required",
        description: "You must be a verified seller to mark orders as shipped.",
        variant: "destructive"
      });
      return;
    }
    if (!trackingNumber || !carrierName) return toast({ title: "Required", description: "Enter carrier and tracking number", variant: "destructive" });
    try {
      const { data, error } = await supabase.from('orders').update({
        order_status: 'shipped',
        tracking_number: trackingNumber,
        carrier_name: carrierName,
        updated_at: new Date().toISOString()
      }).eq('id', orderId).select();

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error("Shipment update failed: Check permissions.");
      }

      setOrder({ ...order, order_status: 'shipped', tracking_number: trackingNumber, carrier_name: carrierName });

      // Add to Order History
      await supabase.from('order_history' as any).insert({
        order_id: orderId,
        new_status: 'shipped',
        description: `Order shipped via ${carrierName}. Tracking: ${trackingNumber}`,
        created_at: new Date().toISOString()
      });

      // Audit Logging
      await supabase.from('audit_logs').insert({
        actor_id: user?.id,
        target_id: orderId,
        target_type: 'order',
        action_type: 'order_shipment_start',
        severity: 'info',
        description: `Order #${order?.order_number} marked as shipped via ${carrierName}.`,
        metadata: { carrier: carrierName, tracking: trackingNumber, order_number: order?.order_number }
      });

      toast({ title: "Shipped", description: `Order shipped via ${carrierName} (${trackingNumber})` });
      loadOrder();
      setTrackingModalOpen(false);
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Update failed", variant: "destructive" });
    }
  };

  const handleDownloadInvoice = () => {
    if (!order) return;
    try {
      generateInvoicePDF({
        orderNumber: order.order_number,
        orderDate: format(new Date(order.created_at), 'MMMM dd, yyyy'),
        customerName: order.customer_name,
        customerEmail: order.customer_email,
        customerPhone: order.customer_phone,
        shippingAddress: order.shipping_address,
        shippingCity: order.shipping_city,
        shippingPincode: order.shipping_pincode,
        items: Array.isArray(order.items) ? order.items : [],
        subtotal, tax, shipping, total,
        paymentMethod: order.payment_method || 'Online',
        paymentStatus: order.payment_status,
      });
      toast({ title: "Downloaded", description: "Invoice saved." });
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "PDF generation failed", variant: "destructive" });
    }
  };

  // Timeline Logic
  let timeline: TimelineEvent[] = orderHistory.map(h => ({
    status: h.new_status.charAt(0).toUpperCase() + h.new_status.slice(1),
    timestamp: h.created_at,
    description: h.description || `Status changed to ${h.new_status}`,
    icon: h.new_status === 'delivered' ? CheckCircle2 : h.new_status === 'shipped' ? Truck : h.new_status === 'packed' ? Package : Clock,
    color: h.new_status === 'delivered' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
  }));
  if (timeline.length === 0 && order) {
    timeline = [{ status: 'Placed', timestamp: order.created_at, description: 'Order received', icon: Clock, color: 'bg-gray-100 text-gray-600' }];
  }

  if (loading) return <div className="p-12 text-center">Loading...</div>;
  if (!order) return <div className="p-12 text-center">Order not found</div>;

  const currentStatus = statusOptions.find(s => s.value === order.order_status);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 flex flex-col gap-8 pb-10">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-row items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              className="h-9 w-9 sm:w-auto rounded-xl border-border/40 bg-card/40 backdrop-blur-sm p-0 sm:px-3 gap-2 font-bold text-xs shrink-0"
              onClick={() => navigate(backLink)}
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <div className="min-w-0 flex-1">
              <div className="flex flex-row items-center gap-2 sm:gap-3 flex-wrap">
                <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-foreground truncate">{order.order_number}</h1>
                <Badge className={cn("px-2 py-0.5 text-[10px] sm:text-xs font-semibold border-0 h-5 sm:h-6 whitespace-nowrap shadow-sm shrink-0", currentStatus?.color, "text-white")}>
                  {currentStatus?.label || order.order_status}
                </Badge>
              </div>
              <p className="text-[10px] sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 flex items-center gap-1.5 font-medium">
                <Calendar className="w-3 h-3" /> {format(new Date(order.created_at), 'MMM dd, yyyy • HH:mm')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 scrollbar-none no-scrollbar">
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-xl border-border/40 bg-card/40 backdrop-blur-sm gap-2 font-bold text-xs whitespace-nowrap"
              onClick={handleDownloadInvoice}
            >
              <Download className="h-4 w-4" /> Invoice
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-xl border-border/40 bg-card/40 backdrop-blur-sm gap-2 font-bold text-xs whitespace-nowrap"
              onClick={() => window.print()}
            >
              <Printer className="h-4 w-4" /> Print
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-xl border-border/10 bg-indigo-50/50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300 gap-2 font-bold text-xs whitespace-nowrap"
              onClick={() => setShowPackingSlip(true)}
            >
              <FileText className="h-4 w-4" /> Packing Slip
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Details) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card className="border shadow-sm overflow-hidden bg-card">
            <CardHeader className="bg-muted/40 pb-4">
              <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                <Package className="w-5 h-5 text-muted-foreground" /> Order Items
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {(Array.isArray(order.items) ? order.items : []).map((item: any, i: number) => {
                const productId = item.productId || item.product_id || item.id;
                return (
                  <div
                    key={i}
                    className="flex gap-3 sm:gap-4 items-start pb-4 sm:pb-4 border-b sm:border-b border-border/40 last:border-0 last:pb-0 cursor-pointer hover:bg-muted/50 p-2 rounded-xl transition-all active:scale-[0.98]"
                    onClick={() => productId && navigate(`/product/${productId}`)}
                  >
                    <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-lg bg-muted border flex items-center justify-center overflow-hidden flex-shrink-0">
                      {item.image ? <img src={item.image} className="h-full w-full object-cover" /> : <Package className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-4">
                        <h4 className="font-semibold sm:font-medium text-sm sm:text-base text-foreground line-clamp-2">{item.title}</h4>
                        <p className="font-bold text-sm sm:text-base text-foreground shrink-0 ml-auto">₹{(item.price * item.quantity).toLocaleString()}</p>
                      </div>
                      <p className="text-[11px] sm:text-sm text-muted-foreground mt-1 flex flex-wrap gap-x-3 gap-y-1">
                        {item.colorName && <span className="flex items-center gap-1.5">Color: <span className="text-foreground font-medium">{item.colorName}</span></span>}
                        {item.size && <span className="flex items-center gap-1.5">Size: <span className="text-foreground font-medium">{item.size}</span></span>}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-[11px] sm:text-sm text-muted-foreground font-medium bg-muted/80 w-fit px-2 py-0.5 rounded-md">Qty: {item.quantity} × ₹{item.price.toLocaleString()}</p>
                        <p className="text-[10px] text-primary font-bold opacity-0 group-hover:opacity-100 transition-opacity">View Product →</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              <Separator />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax (18% GST)</span>
                  <span>₹{tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span>₹{shipping.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 text-foreground">
                  <span>Total</span>
                  <span className="text-[#0E6C68]">₹{total.toLocaleString()}</span>
                </div>
                <div className="flex justify-end pt-1">
                  <Badge variant={order.payment_status === 'paid' ? 'default' : 'secondary'} className={order.payment_status === 'paid' ? "bg-[#0E6C68] hover:bg-[#0B5C58]" : ""}>
                    PAYMENT: {order.payment_status?.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card className="border shadow-sm bg-card">
            <CardHeader className="bg-muted/40 pb-4">
              <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                <Clock className="w-5 h-5 text-muted-foreground" /> Order Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="relative pl-8 sm:pl-8 border-l-2 border-border space-y-8 ml-2">
                {timeline.map((event, i) => (
                  <div key={i} className="relative">
                    <div className={cn("absolute -left-[21px] top-1 h-10 w-10 rounded-full border-4 border-background flex items-center justify-center",
                      event.status === 'Delivered' ? "bg-[#E6F3F2] text-[#0E6C68]" : "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                    )}>
                      <event.icon className="h-5 w-5" />
                    </div>
                    <div className="pl-6">
                      <h4 className="font-semibold text-foreground">{event.status}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">{format(new Date(event.timestamp), 'MMM dd, yyyy • HH:mm')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Customer Info Row */}
          <div className="grid sm:grid-cols-2 gap-6">
            <Card className="border shadow-sm bg-card">
              <CardHeader className="bg-muted/40 pb-3"><CardTitle className="text-base flex items-center gap-2 text-foreground"><User className="w-4 h-4 text-muted-foreground" /> Customer</CardTitle></CardHeader>
              <CardContent className="pt-4 text-sm space-y-2 text-foreground">
                <p className="font-medium">{order.customer_name}</p>
                <p className="text-muted-foreground flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> {order.customer_email}</p>
                {order.customer_phone && <p className="text-muted-foreground flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> {order.customer_phone}</p>}
              </CardContent>
            </Card>
            <Card className="border shadow-sm bg-card">
              <CardHeader className="bg-muted/40 pb-3"><CardTitle className="text-base flex items-center gap-2 text-foreground"><MapPin className="w-4 h-4 text-muted-foreground" /> Shipping Address</CardTitle></CardHeader>
              <CardContent className="pt-4 text-sm space-y-1 text-foreground">
                <p className="font-medium">{order.customer_name}</p>
                <p className="text-muted-foreground">{order.shipping_address || 'No address provided'}</p>
                <p className="text-muted-foreground">{order.shipping_city} {order.shipping_pincode}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Column (Actions) */}
        <div className="space-y-6">
          <Card className="border shadow-sm bg-card">
            <CardHeader className="bg-muted/40 pb-4"><CardTitle className="text-base text-foreground">Order Status</CardTitle></CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Current Status</Label>
                <Select
                  value={order.order_status}
                  onValueChange={handleStatusUpdate}
                  disabled={isReadOnly || order.order_status === 'cancelled' || verificationStatus !== 'verified'}
                >
                  <SelectTrigger className="h-12 sm:h-10 bg-background text-base sm:text-sm border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(s => (
                      <SelectItem key={s.value} value={s.value} className="text-base sm:text-sm py-3 sm:py-2">{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {verificationStatus !== 'verified' && (
                  <p className="text-[10px] text-amber-600 font-medium">Verify account to change status</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Payment Status</Label>
                <div className={cn("p-2 rounded-md text-center font-medium text-sm border h-12 sm:h-auto flex items-center justify-center", order.payment_status === 'paid' ? "bg-[#E6F3F2] text-[#0E6C68] border-[#0E6C68]/20" : "bg-muted text-foreground border-border")}>
                  {order.payment_status?.toUpperCase()}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm bg-card">
            <CardHeader className="bg-muted/40 pb-4"><CardTitle className="text-base text-foreground">Quick Actions</CardTitle></CardHeader>
            <CardContent className="pt-4 space-y-3">
              {!isReadOnly && order.order_status !== 'cancelled' && order.order_status !== 'delivered' && (
                <>
                  {order.order_status === 'confirmed' && (
                    <Button
                      className="w-full h-12 sm:h-10 text-base sm:text-sm bg-purple-600 hover:bg-purple-700"
                      onClick={() => handleStatusUpdate('packed')}
                      disabled={verificationStatus !== 'verified'}
                    >
                      Mark as Packed
                    </Button>
                  )}
                  {order.order_status === 'packed' && (
                    <div className="space-y-3 sm:space-y-2">
                      <Button
                        className="w-full h-12 sm:h-10 text-base sm:text-sm bg-indigo-600 hover:bg-indigo-700 font-bold"
                        onClick={() => setTrackingModalOpen(true)}
                        disabled={verificationStatus !== 'verified'}
                      >
                        <Truck className="h-4 w-4 mr-2" />
                        Mark as Shipped
                      </Button>
                    </div>
                  )}
                  {order.order_status === 'shipped' && (
                    <Button
                      className="w-full h-12 sm:h-10 text-base sm:text-sm bg-[#0E6C68] hover:bg-[#0B5C58]"
                      onClick={() => handleStatusUpdate('delivered')}
                      disabled={verificationStatus !== 'verified'}
                    >
                      Mark as Delivered
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    className="w-full h-12 sm:h-10 text-base sm:text-sm bg-red-600 hover:bg-red-700 text-white"
                    onClick={() => handleStatusUpdate('cancelled')}
                    disabled={verificationStatus !== 'verified'}
                  >
                    Cancel Order
                  </Button>
                </>
              )}
              {verificationStatus !== 'verified' && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-700 leading-relaxed">
                    <strong>Restricted:</strong> You must be a verified seller to confirm or update orders.
                    <Button variant="link" className="p-0 h-auto text-xs ml-1 font-bold text-amber-800 underline" onClick={() => navigate('/seller/settings')}>Complete Verification</Button>
                  </p>
                </div>
              )}
              {order.order_status === 'delivered' && <div className="text-center text-sm text-[#0E6C68] font-medium py-2">Order Completed</div>}
              {order.order_status === 'cancelled' && <div className="text-center text-sm text-red-600 font-medium py-2">Order Cancelled</div>}
            </CardContent>
            <CardHeader className="bg-amber-50/50 dark:bg-amber-900/10 pb-4"><CardTitle className="text-base text-foreground">Seller Notes</CardTitle></CardHeader>
            <CardContent className="pt-4 space-y-3">
              <Textarea
                placeholder="Private notes (only visible to sellers)"
                className="min-h-[120px] resize-none bg-amber-50/30 dark:bg-amber-900/5 border-amber-200 dark:border-amber-800 focus:border-amber-400 dark:focus:border-amber-700 focus:ring-amber-200 dark:focus:ring-amber-900 text-base sm:text-sm text-foreground placeholder:text-muted-foreground"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                disabled={isReadOnly}
              />
              <Button onClick={handleSaveNotes} disabled={savingNotes || isReadOnly} variant="secondary" className="w-full h-12 sm:h-10 text-base sm:text-sm bg-amber-100 hover:bg-[#FDE68A] text-amber-900 border border-amber-200 dark:bg-amber-900/40 dark:text-amber-100 dark:border-amber-800 dark:hover:bg-amber-900/60 transition-colors">
                {savingNotes ? 'Saving...' : 'Save Notes'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tracking Modal */}
      <Dialog open={trackingModalOpen} onOpenChange={setTrackingModalOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-indigo-600" />
              Shipment Tracking
            </DialogTitle>
            <DialogDescription>
              Enter carrier details to notify the customer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Carrier Name</Label>
              <Select value={carrierName} onValueChange={setCarrierName}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Delhivery">Delhivery</SelectItem>
                  <SelectItem value="BlueDart">BlueDart</SelectItem>
                  <SelectItem value="Ecom Express">Ecom Express</SelectItem>
                  <SelectItem value="Xpressbees">Xpressbees</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tracking Number</Label>
              <Input
                placeholder="e.g. 1234567890"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setTrackingModalOpen(false)}>Cancel</Button>
            <Button onClick={handleMarkShipped} className="bg-indigo-600 hover:bg-indigo-700">Confirm Shipment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Packing Slip Modal */}
      <Dialog open={showPackingSlip} onOpenChange={setShowPackingSlip}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="print:hidden">
            <DialogTitle>Packing Slip</DialogTitle>
            <DialogDescription>Print this for your shipment package.</DialogDescription>
          </DialogHeader>

          <div className="p-8 border rounded-lg bg-white text-black font-sans print:border-0 print:p-0">
            <div className="flex justify-between items-start border-b pb-6 mb-6">
              <div>
                <h1 className="text-3xl font-black uppercase tracking-tighter text-[#146B6B]">PRAVOKHA</h1>
                <p className="text-xs text-muted-foreground mt-1 font-bold">SELLER PACKING SLIP</p>
              </div>
              <div className="text-right">
                <p className="font-bold">Order #: {order.order_number}</p>
                <p className="text-sm text-muted-foreground">{format(new Date(order.created_at), 'MMMM dd, yyyy')}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-12 mb-8">
              <div>
                <p className="text-[10px] font-black uppercase text-muted-foreground mb-2 tracking-widest">Ship To:</p>
                <p className="font-bold text-lg leading-tight">{order.customer_name}</p>
                <p className="text-sm mt-2">{order.shipping_address}</p>
                <p className="text-sm">{order.shipping_city}, {order.shipping_pincode}</p>
                <p className="text-sm mt-2 font-medium">{order.customer_phone}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase text-muted-foreground mb-2 tracking-widest">Sold By:</p>
                <p className="font-bold text-lg leading-tight">{user?.email?.split('@')[0] || 'Official Store'}</p>
                <p className="text-xs text-muted-foreground mt-1 italic">Verified Marketplace Seller</p>
              </div>
            </div>

            <table className="w-full mb-8">
              <thead>
                <tr className="border-b-2 border-black text-left">
                  <th className="py-2 text-xs font-black uppercase">Item Description</th>
                  <th className="py-2 text-xs font-black uppercase text-center">Qty</th>
                  <th className="py-2 text-xs font-black uppercase text-right">SKU</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {(Array.isArray(order.items) ? order.items : []).map((item: any, i: number) => (
                  <tr key={i}>
                    <td className="py-4">
                      <p className="font-bold text-sm">{item.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">
                        {item.colorName && `Color: ${item.colorName} | `}
                        {item.size && `Size: ${item.size}`}
                      </p>
                    </td>
                    <td className="py-4 text-center font-bold">{item.quantity}</td>
                    <td className="py-4 text-right font-mono text-[10px]">{(item.id || 'ITEM').substring(0, 8).toUpperCase()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-t-2 border-black pt-6 flex justify-between items-center">
              <div>
                <p className="text-[10px] text-muted-foreground italic font-medium">Thank you for shopping with us!</p>
              </div>
              <div className="bg-black text-white px-4 py-2 font-black text-sm uppercase tracking-widest">
                ITEMS: {(Array.isArray(order.items) ? order.items : []).reduce((s: number, i: any) => s + i.quantity, 0)}
              </div>
            </div>
          </div>

          <DialogFooter className="print:hidden">
            <Button variant="outline" onClick={() => setShowPackingSlip(false)}>Close</Button>
            <Button onClick={() => window.print()} className="bg-black text-white hover:bg-black/90">
              <Printer className="h-4 w-4 mr-2" />
              Print Packing Slip
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
