import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/ui/Card";
import { Button } from "@/ui/Button";
import { Badge } from "@/ui/Badge";
import { Separator } from "@/ui/Separator";
import { Input } from "@/ui/Input";
import { Label } from "@/ui/Label";
import { Textarea } from "@/ui/Textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/Select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/ui/Dialog";
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
import { useToast } from "@/shared/hook/use-toast";
import { apiClient } from "@/infra/api/apiClient";
import { useAuth } from "@/core/context/AuthContext";
import { generateInvoicePDF } from "@/shared/util/invoiceGenerator";
import { cn } from "@/lib/utils";

// Safe date formatting helper
const safeFormatDate = (dateValue: any, formatStr: string, fallback: string = 'N/A'): string => {
  if (!dateValue) return fallback;
  const date = new Date(dateValue);
  if (isNaN(date.getTime())) return fallback;
  return format(date, formatStr);
};

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

  // Normalize order data to handle both camelCase (Prisma default) and snake_case field names
  const normalizeOrderData = (data: any) => {
    if (!data) return null;
    return {
      ...data,
      order_number: data.order_number || data.orderNumber,
      created_at: data.created_at || data.createdAt,
      order_status: (data.order_status || data.status || '').toLowerCase(),
      payment_status: (data.payment_status || data.paymentStatus || '').toLowerCase(),
      customer_name: data.customer_name || data.customerName,
      customer_email: data.customer_email || data.customerEmail,
      customer_phone: data.customer_phone || data.customerPhone,
      shipping_address: data.shipping_address || data.shippingAddress,
      shipping_city: data.shipping_city || data.shippingCity,
      shipping_pincode: data.shipping_pincode || data.shippingPincode,
      payment_method: data.payment_method || data.paymentMethod,
      tax_charge: data.tax_charge || data.taxAmount,
      shipping_charge: data.shipping_charge || data.shippingFee,
      items: Array.isArray(data.items) ? data.items.map((item: any) => ({
        ...item,
        title: item.title || item.product?.title || 'Unknown Product',
        price: item.priceAtPurchase !== undefined ? item.priceAtPurchase : (item.price !== undefined ? item.price : 0),
        quantity: item.quantity || 1,
        image: item.product?.images?.[0]?.url || item.image || item.product?.variants?.[0]?.images?.[0] || '',
        colorName: item.colorName || item.color_name,
        size: item.size,
        status: item.status || 'PENDING',
        trackingNumber: item.trackingNumber || item.tracking_number,
        trackingCarrier: item.trackingCarrier || item.tracking_carrier,
      })) : [],
    };
  };

  const loadOrder = async () => {
    try {
      const response = await apiClient.get(`/orders/${orderId}`);

      // Backend response: {success: true, data: {...orderData...}}
      const rawOrderData = response.data?.data || response.data;
      const orderData = normalizeOrderData(rawOrderData);

      setOrder(orderData);
      setNotes(orderData.packingNotes || '');
      setTrackingNumber((orderData as any).tracking_number || '');

      const items = Array.isArray(orderData.items) ? orderData.items : [];
      const hasSellerItems = items.some((item: any) => item.sellerId === user?.id);
      if (!isAdmin && !hasSellerItems) {
        setIsReadOnly(true);
        // Note: Backend likely already checks permissions, but this UI check remains valid for display logic
      }

      // Fetch history if not included in order object (often separate relationship)
      // Assuming separate endpoint or included.
      if (orderData.history) {
        setOrderHistory(orderData.history);
      } else {
        try {
          const historyResponse = await apiClient.get(`/orders/${orderId}/history`);
          const historyData = historyResponse.data?.data || historyResponse.data;
          setOrderHistory(Array.isArray(historyData) ? historyData : []);
        } catch (e) {
          console.warn("Could not load history", e);
        }
      }

    } catch (error) {
      console.error('Error loading order:', error);
      toast({ title: "Error", description: "Failed to load order", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const calculatePricing = () => {
    if (!order) return { subtotal: 0, tax: 0, shipping: 0, total: 0 };

    const total = order.totalAmount || order.total || 0;
    const shipping = order.shipping_charge || 0;
    const tax = order.tax_charge || 0;
    const subtotal = total - shipping - tax;

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
      await apiClient.patch(`/orders/${orderId}/status`, {
        status: newStatus.toUpperCase(), // Ensure uppercase for enum matching
        version: order.version
      });

      toast({ title: "Status Updated", description: `Order marked as ${newStatus}` });
      await loadOrder(); // Refresh to get updated history and version
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message || "Failed to update status. Check permissions.";
      toast({
        title: "Update Failed",
        description: msg,
        variant: "destructive"
      });
    }
  };

  const [updatingItemStatus, setUpdatingItemStatus] = useState<string | null>(null);

  const handleItemStatusUpdate = async (itemId: string, newStatus: string, trackingData?: any) => {
    setUpdatingItemStatus(itemId);
    try {
      await apiClient.patch(`/orders/${orderId}/items/${itemId}/status`, {
        status: newStatus.toUpperCase(),
        ...trackingData
      });
      toast({ title: "Item Updated", description: `Item status changed to ${newStatus}` });
      loadOrder();
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.response?.data?.message || "Failed to update item status",
        variant: "destructive"
      });
    } finally {
      setUpdatingItemStatus(null);
    }
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      // Preserve existing notes structure if complex, or just string
      const noteObj = { seller_notes: notes, updated_at: new Date().toISOString() };

      await apiClient.patch(`/orders/${orderId}/status`, {
        packingNotes: notes,
        version: order.version
      });

      toast({ title: "Saved", description: "Seller notes updated." });
      loadOrder();
    } catch (error: any) {
      toast({ title: "Error", description: error.response?.data?.message || "Failed to save notes", variant: "destructive" });
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
      if (order.activeItemId) {
        // Multi-vendor item-level status update
        await handleItemStatusUpdate(order.activeItemId, 'shipped', {
          trackingNumber,
          trackingCarrier: carrierName
        });

        // Clear active item ID
        setOrder(prev => {
          const { activeItemId, ...rest } = prev;
          return rest;
        });
      } else {
        // Legacy/Admin whole order ship
        await apiClient.post(`/orders/${orderId}/ship`, {
          trackingNumber,
          trackingCarrier: carrierName,
          version: order.version
        });
      }

      toast({ title: "Shipped", description: `Shipment details updated.` });
      setTrackingModalOpen(false);
      loadOrder();
    } catch (e: any) {
      toast({ title: "Error", description: e.response?.data?.message || "Update failed", variant: "destructive" });
    }
  };

  const handleDownloadInvoice = () => {
    if (!order) return;
    try {
      generateInvoicePDF({
        orderNumber: order.order_number,
        orderDate: safeFormatDate(order.created_at, 'MMMM dd, yyyy'),
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
              <p className="text-[10px] sm:text-sm text-muted-foreground flex items-center gap-1.5 font-medium">
                Order Management Dashboard
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
                        <span className="flex items-center gap-1.5 italic">Status: <Badge variant="outline" className="text-[10px] py-0 h-4 uppercase">{item.status}</Badge></span>
                      </p>

                      <div className="mt-4 p-3 bg-muted/30 rounded-lg space-y-3">
                        <div className="flex flex-col sm:flex-row gap-3 items-end">
                          <div className="flex-1 space-y-1">
                            <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Update Item Status</Label>
                            <Select
                              value={item.status?.toLowerCase()}
                              onValueChange={(val) => handleItemStatusUpdate(item.id, val)}
                              disabled={isReadOnly || updatingItemStatus === item.id || (!isAdmin && verificationStatus !== 'verified')}
                            >
                              <SelectTrigger className="h-9 bg-background border-border text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {statusOptions.map(opt => (
                                  <SelectItem key={opt.value} value={opt.value} className="text-xs">{opt.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {item.status?.toLowerCase() === 'packed' && (
                            <Button
                              size="sm"
                              className="h-9 bg-indigo-600 hover:bg-indigo-700 text-[10px] font-bold uppercase"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOrder(prev => ({ ...prev, activeItemId: item.id }));
                                setTrackingModalOpen(true);
                              }}
                            >
                              Ship Item
                            </Button>
                          )}
                        </div>

                        {item.trackingNumber && (
                          <div className="text-[10px] text-muted-foreground bg-background/50 p-2 rounded-md border border-dashed border-border flex items-center justify-between">
                            <span>Tracking: <span className="font-bold text-foreground">{item.trackingCarrier} - {item.trackingNumber}</span></span>
                            {item.shippedAt && <span>{safeFormatDate(item.shippedAt, 'MMM dd')}</span>}
                          </div>
                        )}
                      </div>

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
                      <p className="text-xs text-muted-foreground mt-1">{safeFormatDate(event.timestamp, 'MMM dd, yyyy • HH:mm')}</p>
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

        {/* Right Column (Actions & Info) */}
        <div className="space-y-6">
          <Card className="border shadow-sm bg-card overflow-hidden">
            <CardHeader className="bg-primary/5 border-b border-primary/10">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-primary tracking-widest uppercase opacity-60">Identity telemetry</span>
                <CardTitle className="text-xl font-black tracking-tight flex items-center justify-between">
                  {order.order_number}
                  <Badge className={cn("px-2 py-0 h-5 text-[9px] font-black border-0 shadow-sm", currentStatus?.color, "text-white")}>
                    {currentStatus?.label?.toUpperCase() || order.order_status?.toUpperCase()}
                  </Badge>
                </CardTitle>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-semibold mt-1">
                  <Calendar className="w-3 h-3" />
                  {safeFormatDate(order.created_at, 'MMM dd, yyyy • HH:mm')}
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="border shadow-sm bg-card">
            <CardHeader className="bg-muted/40 pb-4"><CardTitle className="text-base text-foreground">Order Status</CardTitle></CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Current Status</Label>
                <Select
                  value={order.order_status}
                  onValueChange={handleStatusUpdate}
                  disabled={isReadOnly || order.order_status === 'cancelled' || (!isAdmin && verificationStatus !== 'verified')}
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
                {!isAdmin && verificationStatus !== 'verified' && (
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
                      disabled={!isAdmin && verificationStatus !== 'verified'}
                    >
                      Mark as Packed
                    </Button>
                  )}
                  {order.order_status === 'packed' && (
                    <div className="space-y-3 sm:space-y-2">
                      <Button
                        className="w-full h-12 sm:h-10 text-base sm:text-sm bg-indigo-600 hover:bg-indigo-700 font-bold"
                        onClick={() => setTrackingModalOpen(true)}
                        disabled={!isAdmin && verificationStatus !== 'verified'}
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
                      disabled={!isAdmin && verificationStatus !== 'verified'}
                    >
                      Mark as Delivered
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    className="w-full h-12 sm:h-10 text-base sm:text-sm bg-red-600 hover:bg-red-700 text-white"
                    onClick={() => handleStatusUpdate('cancelled')}
                    disabled={!isAdmin && verificationStatus !== 'verified'}
                  >
                    Cancel Order
                  </Button>
                </>
              )}
              {!isAdmin && verificationStatus !== 'verified' && (
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
                <p className="text-sm text-muted-foreground">{safeFormatDate(order.created_at, 'MMMM dd, yyyy')}</p>
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
