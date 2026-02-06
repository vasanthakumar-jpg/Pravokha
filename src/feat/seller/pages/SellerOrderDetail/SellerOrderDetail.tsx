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
  FileText,
  Upload, X, Plus, Loader2, Eye, Layout, Layers, Image as ImageIcon, Briefcase, TrendingUp, Trash2, Shield, ExternalLink, Edit
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
  const [trackingCarrier, setTrackingCarrier] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
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
      items: Array.isArray(data.items) ? data.items.map((item: any) => {
        // Try multiple image sources with detailed logging
        const imageUrl =
          item.product?.images?.[0]?.url ||
          item.product?.images?.[0]?.imageUrl ||
          item.product?.imageUrl ||
          item.image ||
          item.product?.image ||
          item.product?.variants?.[0]?.images?.[0]?.url ||
          '';

        console.log('[Image Debug] ============');
        console.log('[Image Debug] Item title:', item.title || item.product?.title);
        console.log('[Image Debug] item.product?.images:', item.product?.images);
        console.log('[Image Debug] item.image:', item.image);
        console.log('[Image Debug] Final imageUrl:', imageUrl);

        return {
          ...item,
          title: item.title || item.product?.title || 'Unknown Product',
          price: item.priceAtPurchase !== undefined ? item.priceAtPurchase : (item.price !== undefined ? item.price : 0),
          quantity: item.quantity || 1,
          image: imageUrl,
          colorName: item.colorName || item.color_name,
          size: item.size,
          status: item.status || 'PENDING',
          trackingNumber: item.trackingNumber || item.tracking_number,
          trackingCarrier: item.trackingCarrier || item.tracking_carrier,
        };
      }) : [],
    };
  };

  const loadOrder = async () => {
    try {
      const response = await apiClient.get(`/orders/${orderId}`);

      // Backend response: {success: true, data: {...orderData...}}
      const rawOrderData = response.data?.data || response.data;
      const orderData = normalizeOrderData(rawOrderData);

      console.log('[Order Data] Full response:', rawOrderData);
      console.log('[Status History]:', rawOrderData.statusHistory);

      setOrder(orderData);

      // Extract statusHistory from the order response
      if (rawOrderData.statusHistory && Array.isArray(rawOrderData.statusHistory)) {
        setOrderHistory(rawOrderData.statusHistory);
        console.log('[Status History] Loaded:', rawOrderData.statusHistory.length, 'entries');
      } else {
        console.warn('[Status History] No statusHistory found in response');
        setOrderHistory([]);
      }

      setNotes(orderData.packingNotes || '');
      setTrackingNumber((orderData as any).tracking_number || '');

      const items = Array.isArray(orderData.items) ? orderData.items : [];
      const hasSellerItems = items.some((item: any) => item.sellerId === user?.id);
      if (!isAdmin && !hasSellerItems) {
        setIsReadOnly(true);
      }
    } catch (error) {
      console.error('[Load Order] Error:', error);
      toast({ title: "Error", description: "Failed to load order", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const calculatePricing = () => {
    const items = Array.isArray(order?.items) ? order.items : [];
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.18;
    const shipping = 50;
    const total = subtotal + tax + shipping;
    return { subtotal, tax, shipping, total };
  };

  const renderShippingAddress = () => {
    if (!order?.shipping_address) return 'No address provided';

    try {
      // If it's a JSON string, parse it
      if (typeof order.shipping_address === 'string' && (order.shipping_address.startsWith('{') || order.shipping_address.startsWith('['))) {
        const addr = JSON.parse(order.shipping_address);
        return (
          <div className="space-y-0.5">
            <p className="font-semibold text-foreground">{addr.name || order.customer_name}</p>
            <p className="text-muted-foreground">{addr.address || addr.street || ''}</p>
            <p className="text-muted-foreground">{addr.city || order.shipping_city || ''} {addr.pincode || order.shipping_pincode || ''}</p>
            {addr.phone && <p className="text-muted-foreground/80 text-[11px] pt-1">Contact: {addr.phone}</p>}
          </div>
        );
      }
    } catch (e) {
      console.error("Failed to parse shipping address JSON:", e);
    }

    // Fallback for plain text or failed parse
    return (
      <div className="space-y-0.5">
        <p className="font-semibold text-foreground">{order.customer_name}</p>
        <p className="text-muted-foreground">{order.shipping_address}</p>
        <p className="text-muted-foreground">{order.shipping_city} {order.shipping_pincode}</p>
      </div>
    );
  };

  const { subtotal, tax, shipping, total } = calculatePricing();

  const handleStatusUpdate = async (newStatus: string) => {
    if (!isAdmin && verificationStatus !== 'verified' && user?.role !== 'SUPER_ADMIN') {
      toast({
        title: "Verification Required",
        description: "You must be a verified seller to update order status.",
        variant: "destructive"
      });
      return;
    }

    setIsUpdatingStatus(true);
    console.log('[Status Update] Current order status:', order?.order_status);
    console.log('[Status Update] New status (lowercase):', newStatus);
    console.log('[Status Update] Sending to backend:', newStatus.toUpperCase());
    console.log('[Status Update] Order version:', order?.version);

    try {
      const response = await apiClient.patch(`/orders/${orderId}/status`, {
        status: newStatus.toUpperCase(),
        version: order.version
      });

      console.log('[Status Update] Backend response:', response.data);

      toast({
        title: "Status Updated",
        description: `Order status changed to ${newStatus}`,
        variant: "default"
      });

      // Refresh order data to get latest version and status
      console.log('[Status Update] Refreshing order data...');
      await loadOrder();
      console.log('[Status Update] Refresh complete');
    } catch (error: any) {
      console.error('[Status Update] Error:', error);
      console.error('[Status Update] Error response:', error.response?.data);

      const errorMsg = error.response?.data?.message || error.message || 'Failed to update status';
      toast({
        title: "Update Failed",
        description: errorMsg,
        variant: "destructive"
      });
    } finally {
      setIsUpdatingStatus(false);
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
    if (!isAdmin && verificationStatus !== 'verified' && user?.role !== 'SUPER_ADMIN') {
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

  // Timeline Logic - Generate from statusHistory
  let timeline: TimelineEvent[] = [];

  if (orderHistory && orderHistory.length > 0) {
    console.log('[Timeline] Processing', orderHistory.length, 'history entries');
    const processedStatuses = new Set();

    // Sort by timestamp ASCENDING (Oldest first) for chronological flow
    const sortedHistory = [...orderHistory].sort((a, b) =>
      new Date(a.created_at || a.createdAt || a.timestamp).getTime() - new Date(b.created_at || b.createdAt || b.timestamp).getTime()
    );

    timeline = sortedHistory.map((h: any) => {
      const statusText = (h.status || h.newStatus || h.new_status || '').toString().toLowerCase();
      if (!statusText || processedStatuses.has(statusText)) return null;

      // Mark as processed
      processedStatuses.add(statusText);

      const statusLabel = statusText.charAt(0).toUpperCase() + statusText.slice(1);

      return {
        status: statusLabel,
        timestamp: h.createdAt || h.created_at || h.timestamp,
        description: h.notes || h.description || `Status changed to ${statusLabel}`,
        icon: statusText === 'delivered' ? CheckCircle2 :
          statusText === 'shipped' ? Truck :
            statusText === 'packed' ? Package :
              statusText === 'confirmed' ? CheckCircle2 :
                statusText === 'cancelled' ? XCircle :
                  Clock,
        color: statusText === 'delivered' ? 'bg-emerald-50 text-emerald-600' :
          statusText === 'shipped' ? 'bg-blue-50 text-blue-600' :
            statusText === 'confirmed' ? 'bg-teal-50 text-teal-600' :
              statusText === 'cancelled' ? 'bg-red-50 text-red-600' :
                'bg-gray-50 text-gray-600'
      };
    }).filter(Boolean) as TimelineEvent[];

    // No reverse needed since we sorted by ASC above

  }

  // Fallback: If no history entries, create a "Placed" entry from order creation
  if (timeline.length === 0 && order) {
    console.log('[Timeline] No history found, using fallback');
    timeline = [{
      status: 'Placed',
      timestamp: order.created_at,
      description: 'Order received',
      icon: Clock,
      color: 'bg-gray-50 text-gray-600'
    }];
  }

  console.log('[Timeline] Final timeline:', timeline);

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
            <CardContent className="p-0">
              {/* Header (Desktop) - 2-3-3-1-3 Layout */}
              <div className="hidden lg:grid grid-cols-12 gap-4 p-4 border-b bg-muted/40 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                <div className="col-span-2 pl-2">Image</div>
                <div className="col-span-3">Product Details</div>
                <div className="col-span-3 text-center">Attributes</div>
                <div className="col-span-1 text-center">Qty</div>
                <div className="col-span-3 text-right pr-2">Status</div>
              </div>

              <div className="divide-y divide-border">
                {(Array.isArray(order.items) ? order.items : []).map((item: any, i: number) => {
                  const productId = item.productId || item.product_id || item.id;
                  const imageUrl = getMediaUrl(rawImageUrl) || "https://placehold.co/100x120/e2e8f0/64748b?text=No+Image";

                  return (
                    <div key={i} className="group relative bg-card hover:bg-muted/5 transition-colors">
                      {/* Desktop Grid Layout */}
                      <div className="hidden lg:grid grid-cols-12 gap-4 p-4 items-center">

                        {/* 1. Image (Col 2) */}
                        <div className="col-span-2 pl-2">
                          <div
                            className="w-16 h-20 bg-muted/30 rounded-md border flex items-center justify-center overflow-hidden cursor-pointer relative"
                            onClick={() => productId && navigate(isAdmin ? `/admin/products/edit/${productId}` : `/product/${productId}`)}
                          >
                            <img
                              src={imageUrl}
                              alt={item.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.currentTarget;
                                target.onerror = null;
                                target.src = "https://placehold.co/100x120/e2e8f0/64748b?text=No+Image";
                              }}
                            />
                          </div>
                        </div>

                        {/* 2. Details (Col 3) */}
                        <div className="col-span-3 min-w-0 flex flex-col justify-center">
                          <h4
                            className="font-semibold text-sm leading-tight cursor-pointer hover:text-primary hover:underline line-clamp-2 mb-1"
                            onClick={() => productId && navigate(isAdmin ? `/admin/products/edit/${productId}` : `/product/${productId}`)}
                          >
                            {item.title || "Product Title Unavailable"}
                          </h4>
                          <div className="text-sm font-bold text-foreground">₹{(item.price || 0).toLocaleString()}</div>
                        </div>

                        {/* 3. Attributes (Col 3 - Centered) */}
                        <div className="col-span-3 flex flex-col items-center justify-center gap-1">
                          {item.size && item.size !== 'null' && (
                            <Badge variant="outline" className="h-6 px-2 text-[10px] uppercase">{item.size}</Badge>
                          )}
                          {!item.size && <span className="text-xs text-muted-foreground">-</span>}
                          {/* Color placeholder if needed */}
                        </div>

                        {/* 4. Qty (Col 1 - Centered) */}
                        <div className="col-span-1 text-center font-medium text-sm">
                          {item.quantity}
                        </div>

                        {/* 5. Status (Col 3 - Right) */}
                        <div className="col-span-3 flex flex-col items-end justify-center pr-2 h-full">
                          <Badge variant="outline" className={cn(
                            "uppercase font-bold tracking-wider px-3 py-1",
                            (item.status || order.order_status) === 'delivered' ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                              (item.status || order.order_status) === 'shipped' ? "bg-blue-100 text-blue-700 border-blue-200" :
                                (item.status || order.order_status) === 'cancelled' ? "bg-red-100 text-red-700 border-red-200" :
                                  "bg-secondary text-secondary-foreground"
                          )}>
                            {item.status || order.order_status || 'PENDING'}
                          </Badge>
                        </div>
                      </div>

                      {/* Mobile Stack Layout */}
                      <div className="lg:hidden p-4 flex gap-4">
                        <div
                          className="w-20 h-24 bg-muted/30 rounded-md border flex-shrink-0 overflow-hidden"
                          onClick={() => productId && navigate(isAdmin ? `/admin/products/edit/${productId}` : `/product/${productId}`)}
                        >
                          <img
                            src={imageUrl}
                            alt={item.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = "https://placehold.co/100x120/e2e8f0/64748b?text=No+Image";
                            }}
                          />
                        </div>
                        <div className="flex-1 flex flex-col gap-2 min-w-0">
                          <div className="flex justify-between items-start">
                            <h4 className="font-semibold text-sm line-clamp-2">{item.title}</h4>
                            <span className="font-bold text-sm">₹{item.price}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>Qty: {item.quantity}</span>
                            {item.size && <Badge variant="secondary" className="text-[10px] h-5">{item.size}</Badge>}
                          </div>
                          <div className="mt-auto pt-2 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">Status:</span>
                            <Badge variant="outline" className={cn(
                              "uppercase font-bold text-[10px] h-6",
                              (item.status || order.order_status) === 'delivered' ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                                (item.status || order.order_status) === 'shipped' ? "bg-blue-100 text-blue-700 border-blue-200" :
                                  (item.status || order.order_status) === 'cancelled' ? "bg-red-100 text-red-700 border-red-200" :
                                    "bg-secondary text-secondary-foreground"
                            )}>
                              {item.status || order.order_status || 'PENDING'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Separator />

              <div className="space-y-3 p-4 bg-muted/20 border-t">
                <div className="flex flex-row items-center justify-between text-sm text-muted-foreground w-full">
                  <span>Subtotal</span>
                  <span className="font-medium text-foreground">₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex flex-row items-center justify-between text-sm text-muted-foreground w-full">
                  <span>Tax (18% GST)</span>
                  <span className="font-medium text-foreground">₹{tax.toLocaleString()}</span>
                </div>
                <div className="flex flex-row items-center justify-between text-sm text-muted-foreground w-full">
                  <span>Shipping</span>
                  <span className="font-medium text-foreground">₹{shipping.toLocaleString()}</span>
                </div>
                <div className="h-px bg-border my-2" />
                <div className="flex flex-row items-center justify-between w-full">
                  <span className="font-bold text-base text-foreground">Total</span>
                  <span className="font-bold text-lg text-[#0E6C68]">₹{total.toLocaleString()}</span>
                </div>
                <div className="flex justify-end pt-2">
                  <Badge variant={order.payment_status === 'paid' ? 'default' : 'secondary'} className={cn(
                    "px-3 py-1 text-xs font-bold uppercase tracking-wider",
                    order.payment_status === 'paid' ? "bg-[#0E6C68] hover:bg-[#0B5C58]" : "bg-orange-100 text-orange-700 hover:bg-orange-200"
                  )}>
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
                <AnimatePresence>
                  {timeline.map((event, i) => (
                    <motion.div
                      layout
                      key={i}
                      className="relative"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1, duration: 0.4 }}
                    >
                      <div className={cn("absolute -left-[21px] top-1 h-8 w-8 sm:h-10 sm:w-10 rounded-full border-2 sm:border-4 border-background flex items-center justify-center shadow-sm",
                        event.status === 'Delivered' ? "bg-[#E6F3F2] text-[#0E6C68]" : "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                      )}>
                        <event.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                      </div>
                      <div className="pl-6 group">
                        <h4 className="font-semibold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors">{event.status}</h4>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">{event.description}</p>
                        <p className="text-[10px] sm:text-xs font-bold text-muted-foreground/60 mt-1 uppercase tracking-wider">{safeFormatDate(event.timestamp, 'MMM dd, yyyy • HH:mm')}</p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>

          {/* Customer Info Row */}
          <div className="grid sm:grid-cols-2 gap-6">
            <Card className="border shadow-sm bg-card">
              <CardHeader className="bg-muted/40 pb-3"><CardTitle className="text-sm sm:text-base flex items-center gap-2 text-foreground"><User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" /> Customer</CardTitle></CardHeader>
              <CardContent className="pt-4 text-xs sm:text-sm space-y-2 text-foreground">
                <p className="font-medium">{order.customer_name}</p>
                <p className="text-muted-foreground flex items-center gap-2"><Mail className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> {order.customer_email}</p>
                {order.customer_phone && <p className="text-muted-foreground flex items-center gap-2"><Phone className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> {order.customer_phone}</p>}
              </CardContent>
            </Card>
            <Card className="border shadow-sm bg-card">
              <CardHeader className="bg-muted/40 pb-3"><CardTitle className="text-sm sm:text-base flex items-center gap-2 text-foreground"><MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" /> Shipping Address</CardTitle></CardHeader>
              <CardContent className="pt-4 text-xs sm:text-sm text-foreground">
                {renderShippingAddress()}
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
                  disabled={isUpdatingStatus || isReadOnly || order.order_status === 'cancelled' || (!isAdmin && verificationStatus !== 'verified' && user?.role !== 'SUPER_ADMIN')}
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
                {isUpdatingStatus && <p className="text-xs text-muted-foreground animate-pulse">Updating status...</p>}
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
                        disabled={!isAdmin && verificationStatus !== 'verified' && user?.role !== 'SUPER_ADMIN'}
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

          <div className="p-8 border rounded-lg bg-white text-black font-sans">
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
