import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/Card";
import { Button } from "@/ui/Button";
import { Badge } from "@/ui/Badge";
import { Separator } from "@/ui/Separator";
import {
   ArrowLeft,
   Package,
   MapPin,
   CreditCard,
   Download,
   Calendar,
   ShoppingBag,
   Info,
   XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/shared/hook/use-toast";
import { apiClient } from "@/infra/api/apiClient";
import { OrderTimeline } from "@/feat/orders/components/OrderTimeline";
import { OrderCancellationReasonDialog } from "@/feat/orders/components/OrderCancellationReasonDialog";
import { generateInvoicePDF } from "@/shared/util/invoiceGenerator";
import { cn } from "@/lib/utils";

interface OrderItem {
   id: string;
   productId?: string;
   title: string;
   colorName?: string;
   size?: string;
   quantity: number;
   price: number;
   image?: string;
   sellerId?: string;
}

export default function UserOrderDetail() {
   const { orderId } = useParams();
   const navigate = useNavigate();
   const { toast } = useToast();

   const [order, setOrder] = useState<any>(null);
   const [orderHistory, setOrderHistory] = useState<any[]>([]); // To store real history
   const [loading, setLoading] = useState(true);

   // Cancellation State
   const [isCancellationOpen, setIsCancellationOpen] = useState(false);

   useEffect(() => {
      if (orderId) {
         loadOrder();
      }
   }, [orderId]);

   const loadOrder = async () => {
      try {
         const { data: orderResponse } = await apiClient.get(`/orders/${orderId}`);
         const rawOrder = orderResponse.data;

         if (rawOrder) {
            const transformedOrder = {
               ...rawOrder,
               order_number: rawOrder.orderNumber,
               order_status: rawOrder.status,
               created_at: rawOrder.createdAt,
               // Ensure address and payment fields are mapped correctly from camelCase
               shipping_address: rawOrder.shippingAddress || rawOrder.shipping_address,
               shipping_city: rawOrder.shippingCity || rawOrder.shipping_city,
               shipping_pincode: rawOrder.shippingPincode || rawOrder.shipping_pincode,
               payment_method: rawOrder.paymentMethod || rawOrder.payment_method,
               payment_status: rawOrder.paymentStatus || rawOrder.payment_status,
               customer_name: rawOrder.customerName || rawOrder.customer_name,
               customer_phone: rawOrder.customerPhone || rawOrder.customer_phone,
               tracking_number: rawOrder.trackingNumber || rawOrder.tracking_number,
               total: rawOrder.total,
            };
            setOrder(transformedOrder);
         } else {
            setOrder(null);
         }

         // Fetch history if not included in rawOrder
         try {
            if (rawOrder.history) {
               setOrderHistory(rawOrder.history);
            } else {
               const { data: historyResponse } = await apiClient.get(`/orders/${orderId}/history`);
               setOrderHistory(historyResponse.data || []);
            }
         } catch (e) {
            console.warn("Could not fetch history separately", e);
         }
      } catch (error) {
         console.error('Error loading order:', error);
         toast({
            title: "Error",
            description: "Failed to load order details",
            variant: "destructive",
         });
      } finally {
         setLoading(false);
      }
   };

   const calculatePricing = () => {
      if (!order) return { subtotal: 0, tax: 0, shipping: 0, total: 0 };

      const items = Array.isArray(order.items) ? order.items : [];
      const subtotal = items.reduce((sum: number, item: any) =>
         sum + (item.price * item.quantity), 0
      );

      // Tax calculation (18% GST)
      const taxRate = 0.18;
      const tax = Math.round(subtotal * taxRate);

      // Shipping from order or default
      const shipping = (order as any).shipping_charge || 0;

      // Total
      const total = subtotal + tax + shipping;

      return { subtotal, tax, shipping, total };
   };

   const handleCancelOrder = () => {
      setIsCancellationOpen(true);
   };

   const handleConfirmCancellation = async (reason: string, comments: string) => {
      try {
         await apiClient.post(`/orders/${orderId}/cancel`, { reason, comments });

         toast({
            title: "Order Cancelled",
            description: "Your order has been cancelled successfully.",
         });
         loadOrder(); // Refresh to see updated status and history

      } catch (error: any) {
         console.error('Error cancelling order:', error);
         toast({
            title: "Cancellation Failed",
            description: error.response?.data?.message || error.message || "Could not cancel order",
            variant: "destructive",
         });
      } finally {
         setIsCancellationOpen(false);
      }
   };

   const handleDownloadInvoice = async () => {
      if (!order) return;

      toast({ title: "Generating Invoice...", description: "Please wait while we prepare your document." });

      try {
         const items = Array.isArray(order.items) ? order.items : [];

         // Calculate subtotal from actual product prices
         const itemsTotal = items.reduce((sum: number, item: any) =>
            sum + ((item.price || 0) * (item.quantity || 1)), 0
         );

         // Get values from database
         const actualTotal = order.total || 0;
         const shippingCharge = (order as any).shipping_charge || 0;

         // Calculate: subtotal = items total, tax = total - subtotal - shipping
         const subtotal = itemsTotal;
         const tax = Math.max(0, actualTotal - subtotal - shippingCharge);

         // Ensure items are mapped correctly for the generator
         const invoiceItems = items.map((item: any) => ({
            title: item.title || "Product",
            quantity: item.quantity || 1,
            price: item.price || 0,
            colorName: item.colorName || item.color || "",
            size: item.size || ""
         }));

         await generateInvoicePDF({
            orderNumber: order.order_number || "N/A",
            orderDate: order.created_at && !isNaN(new Date(order.created_at).getTime())
               ? format(new Date(order.created_at), 'MMMM dd, yyyy')
               : new Date().toDateString(),
            customerName: order.customer_name || "Customer",
            customerEmail: order.customer_email || "N/A",
            customerPhone: order.customer_phone || "N/A",
            shippingAddress: order.shipping_address || "N/A",
            shippingCity: order.shipping_city || "",
            shippingPincode: order.shipping_pincode || "",
            items: invoiceItems,
            subtotal: subtotal,
            tax: tax,
            shipping: shippingCharge,
            total: actualTotal,
            paymentMethod: order.payment_method || 'N/A',
            paymentStatus: order.payment_status || 'pending',
         });

         toast({ title: "Invoice Downloaded", description: `Invoice_${order.order_number}.pdf` });
      } catch (error) {
         console.error("Invoice Calculation Error:", error);
         toast({ title: "Error", description: "Failed to generate invoice. Please contact support.", variant: "destructive" });
      }
   };

   const handleDeleteHistory = async (historyId: string) => {
      // Logic removed as it is not safe for users to delete history.
      // Keeping function signature to avoid prop type errors if OrderTimeline requires it.
      console.warn("User attempted to delete history - Action Blocked");
   };

   if (loading) {
      return (
         <div className="flex items-center justify-center min-h-screen">
            <div className="text-center animate-pulse">
               <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
               <p className="text-muted-foreground">Loading order details...</p>
            </div>
         </div>
      );
   }

   if (!order) {
      return (
         <div className="w-full px-4 sm:px-6 lg:px-8 py-16 text-center">
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-2">Order Not Found</h1>
            <Button onClick={() => navigate('/orders')}>Back to Orders</Button>
         </div>
      );
   }

   const { subtotal, tax, shipping, total } = calculatePricing();
   const items = Array.isArray(order.items) ? order.items : [];

   // Construct timeline updates from real history
   const timelineUpdates = orderHistory.map(h => ({
      id: h.id,
      status: h.new_status,
      timestamp: h.created_at,
      message: h.description
   }));

   // If no history exists (legacy orders), fallback to current status
   if (timelineUpdates.length === 0 && order.created_at) {
      timelineUpdates.push({ id: undefined, status: 'pending', timestamp: order.created_at, message: 'Order Placed' });
   }

   return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-8 max-w-7xl mx-auto">
         {/* Header */}
         {/* Premium Header */}
         {/* Header */}
         <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="w-full">
               <Button variant="ghost" onClick={() => navigate('/user/orders')} className="pl-0 text-muted-foreground hover:text-foreground -ml-2 mb-2">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Orders
               </Button>
               <div className="flex items-center justify-between gap-2 w-full">
                  <h1 className="text-sm sm:text-2xl md:text-3xl font-bold tracking-tight break-all sm:break-normal">Order #{order.order_number}</h1>
                  <Badge className={cn("text-white h-5 sm:h-7 px-2 sm:px-3 text-[10px] sm:text-sm font-medium whitespace-nowrap",
                     order.order_status?.toLowerCase() === 'delivered' ? "bg-green-600" :
                        order.order_status?.toLowerCase() === 'cancelled' ? "bg-red-600" :
                           order.order_status?.toLowerCase() === 'packed' ? "bg-purple-600" :
                              "bg-primary"
                  )}>
                     {order.order_status?.toUpperCase()}
                  </Badge>
               </div>
               <div className="flex items-center gap-2 mt-2 text-sm sm:text-base text-muted-foreground">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                  {order.created_at && !isNaN(new Date(order.created_at).getTime())
                     ? format(new Date(order.created_at), 'MMM dd, yyyy')
                     : 'N/A'}
               </div>
            </div>

            <div className="flex flex-col gap-3 w-full sm:w-auto sm:flex-row mt-4 sm:mt-0">
               {order.order_status !== 'cancelled' && (
                  <Button variant="outline" size="sm" onClick={handleDownloadInvoice} className="h-10 w-full sm:w-auto justify-center sm:min-w-[100px]">
                     <Download className="h-4 w-4 mr-2" />
                     Invoice
                  </Button>
               )}
               {(order.order_status?.toLowerCase() === 'pending' || order.order_status?.toLowerCase() === 'confirmed') && (
                  <Button variant="destructive" size="sm" onClick={handleCancelOrder} className="h-10 w-full sm:w-auto justify-center sm:min-w-[120px]">
                     <XCircle className="h-4 w-4 mr-2" />
                     Cancel Order
                  </Button>
               )}
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Left Column: Timeline & Items */}
            <div className="lg:col-span-2 space-y-8">

               {/* Timeline Card */}
               <Card className="border-0 shadow-lg ring-1 ring-black/5 bg-gradient-to-br from-white to-gray-50 dark:from-gray-950 dark:to-gray-900">
                  <CardHeader>
                     <CardTitle className="flex items-center gap-2 text-lg">
                        <Package className="h-5 w-5 text-primary" />
                        Order Progress
                     </CardTitle>
                  </CardHeader>
                  <CardContent>
                     <OrderTimeline
                        status={order.order_status?.toLowerCase()}
                        createdAt={order.created_at}
                        trackingUpdates={timelineUpdates}
                        onDelete={handleDeleteHistory}
                     />
                  </CardContent>
               </Card>

               {/* Refund Status Card - Premium Feature */}
               {(order.payment_status === 'refund_pending' || order.payment_status === 'refunded') && (
                  <Card className="border-0 shadow-lg ring-1 ring-emerald-500/20 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/30 dark:to-gray-900">
                     <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg text-emerald-700 dark:text-emerald-400">
                           <CreditCard className="h-5 w-5" />
                           Refund Status
                        </CardTitle>
                     </CardHeader>
                     <CardContent>
                        <div className="flex items-center gap-4">
                           <div className={`p-3 rounded-full ${order.payment_status === 'refunded' ? 'bg-emerald-100 text-emerald-600' : 'bg-yellow-100 text-yellow-600'}`}>
                              {order.payment_status === 'refunded' ? <XCircle className="h-6 w-6 rotate-45" /> : <Calendar className="h-6 w-6" />}
                           </div>
                           <div>
                              <h4 className="font-semibold text-lg">
                                 {order.payment_status === 'refunded' ? 'Refund Processed' : 'Refund Initiated'}
                              </h4>
                              <p className="text-muted-foreground text-sm mt-1">
                                 Amount: <span className="font-medium text-foreground">₹{order.total?.toLocaleString()}</span>
                                 {order.payment_status === 'refund_pending' &&
                                    " • It usually takes 5-7 business days for the amount to reflect in your account."
                                 }
                              </p>
                           </div>
                        </div>
                     </CardContent>
                  </Card>
               )}

               {/* Items Card */}
               <Card className="border-0 shadow-md">
                  <CardHeader>
                     <CardTitle className="text-lg">Items in your order</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                     {items.map((item: any, idx: number) => {
                        // Robust ID extraction: check new productId, then product_id, then id
                        const productId = item.productId || item.product_id || item.id;
                        return (
                           <div
                              key={idx}
                              className="flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border bg-card hover:bg-muted/30 transition-all cursor-pointer group"
                              onClick={() => {
                                 const slug = item.product?.slug || item.productId || item.product_id || item.id;
                                 navigate(`/product/${slug}`);
                              }}

                           >
                              <div className="h-20 w-20 sm:h-24 sm:w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                                 {(() => {
                                    const img = item.image || item.product?.variants?.[0]?.images?.[0];
                                    return img ? (
                                       <img src={img} alt={item.title} className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-300" />
                                    ) : (
                                       <div className="flex h-full w-full items-center justify-center bg-gray-100">
                                          <ShoppingBag className="h-8 w-8 text-gray-400" />
                                       </div>
                                    );
                                 })()}
                              </div>
                              <div className="flex flex-1 flex-col min-w-0">
                                 <div className="flex flex-col sm:flex-row sm:justify-between items-start gap-1 sm:gap-4">
                                    <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 group-hover:text-primary transition-colors leading-tight">
                                       {item.title}
                                    </h3>
                                    <p className="text-sm sm:text-base font-bold whitespace-nowrap">
                                       ₹{(item.price * item.quantity).toLocaleString()}
                                    </p>
                                 </div>
                                 <p className="mt-1 text-xs sm:text-sm text-muted-foreground truncate">
                                    {item.colorName} {item.size ? `• Size ${item.size}` : ''}
                                 </p>
                                 <div className="flex flex-1 items-end justify-between text-xs sm:text-sm mt-2">
                                    <p className="text-muted-foreground font-medium bg-muted/50 px-2 py-0.5 rounded">
                                       Qty {item.quantity}
                                    </p>
                                    <span className="text-primary text-[10px] font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                                       View Product →
                                    </span>
                                 </div>
                              </div>
                           </div>
                        );
                     })}
                  </CardContent>
               </Card>
            </div>

            {/* Right Column: Calculations & Details */}
            <div className="space-y-6">

               {/* Order Summary */}
               <Card className="border-0 shadow-md">
                  <CardHeader>
                     <CardTitle className="text-lg">Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                     <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                           <span className="text-muted-foreground">Subtotal</span>
                           <span>₹{subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                           <span className="text-muted-foreground">Tax</span>
                           <span>₹{tax.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                           <span className="text-muted-foreground">Shipping</span>
                           <span>₹{shipping.toLocaleString()}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-base font-bold">
                           <span>Total</span>
                           <span className="text-primary">₹{total.toLocaleString()}</span>
                        </div>
                     </div>

                     <div className="pt-4 space-y-3">
                        <div className="flex flex-col gap-3 p-4 bg-muted/40 border border-border/50 rounded-lg">
                           <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                 <CreditCard className="h-4 w-4 text-primary" />
                                 <span className="font-medium text-sm">Payment Method</span>
                              </div>
                              <span className="capitalize text-sm font-medium">
                                 {order.payment_method === "upi" ? "UPI" :
                                    order.payment_method === "qr" ? "QR Code" :
                                       order.payment_method === "cod" ? "Cash on Delivery" :
                                          order.payment_method || "N/A"}
                              </span>
                           </div>
                           <Separator className="bg-border/50" />
                           <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Payment Status</span>
                              <Badge variant={order.payment_status === 'paid' ? 'default' : 'secondary'} className={cn(
                                 "capitalize shadow-sm",
                                 order.payment_status === 'paid' ? "bg-green-600 hover:bg-green-700" : ""
                              )}>
                                 {order.payment_status || "Pending"}
                              </Badge>
                           </div>
                        </div>
                     </div>
                  </CardContent>
               </Card>

               {/* Shipping Details */}
               <Card className="border-0 shadow-md">
                  <CardHeader>
                     <CardTitle className="flex items-center gap-2 text-lg">
                        <MapPin className="h-5 w-5 text-primary" />
                        Delivery Details
                     </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-3">
                     <div className="font-medium text-base">{order.customer_name}</div>
                     <div className="text-muted-foreground space-y-1">
                        <p>{order.shipping_address}</p>
                        <p>{order.shipping_city} - {order.shipping_pincode}</p>
                        <p>India</p>
                        <p className="pt-2 flex items-center gap-2 text-foreground">
                           Phone: {order.customer_phone}
                        </p>
                     </div>
                  </CardContent>
               </Card>

               {/* Support Box */}
               <Card className="bg-primary/5 border-primary/20 shadow-none">
                  <CardContent className="p-4 flex gap-3">
                     <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                     <div className="text-sm">
                        <p className="font-medium text-primary">Need Help?</p>
                        <p className="text-muted-foreground mt-1">
                           If you have any issues with your order, please contact our support team.
                        </p>
                        <Button variant="link" className="px-0 h-auto mt-2 text-primary" onClick={() => navigate('/support')}>
                           Contact Support
                        </Button>
                     </div>
                  </CardContent>
               </Card>

            </div>
         </div>

         {
            order && (
               <OrderCancellationReasonDialog
                  open={isCancellationOpen}
                  onOpenChange={setIsCancellationOpen}
                  onConfirm={handleConfirmCancellation}
                  orderNumber={order.order_number}
                  orderAmount={total}
                  isPrepaid={order.payment_status === 'paid'}
               />
            )
         }
      </div >
   );
}
