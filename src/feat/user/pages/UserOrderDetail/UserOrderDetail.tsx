import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/ui/Card";
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
import { OrderTimeline, VerticalOrderTracker } from "@/feat/orders/components/OrderTimeline";
import { OrderCancellationReasonDialog } from "@/feat/orders/components/OrderCancellationReasonDialog";
import { generateInvoicePDF } from "@/shared/util/invoiceGenerator";
import { cn, getMediaUrl } from "@/lib/utils";
import { Order, OrderItem } from "@/core/types/product";


export default function UserOrderDetail() {
   const { orderId } = useParams();
   const navigate = useNavigate();
   const { toast } = useToast();

   const [order, setOrder] = useState<Order | null>(null);
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
            // rawOrder is expected to have camelCase fields from the backend
            setOrder(rawOrder);
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

      const total = order.totalAmount || 0;
      const shipping = order.shippingFee || 0;
      const tax = order.taxAmount || 0;
      const subtotal = total - shipping - tax;

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

         // Use direct database values
         const actualTotal = order.totalAmount || 0;
         const shippingCharge = order.shippingFee || 0;
         const taxAmount = order.taxAmount || 0;
         const subtotal = actualTotal - shippingCharge - taxAmount;

         // Ensure items are mapped correctly for the generator
         const invoiceItems = items.map((item: any) => ({
            title: item.title || item.product?.title || "Product",
            quantity: item.quantity || 1,
            price: item.priceAtPurchase || item.price || 0,
            colorName: item.colorName || item.color || "",
            size: item.size || ""
         }));

         await generateInvoicePDF({
            orderNumber: order.orderNumber || "N/A",
            orderDate: order.createdAt && !isNaN(new Date(order.createdAt).getTime())
               ? format(new Date(order.createdAt), 'MMMM dd, yyyy')
               : new Date().toDateString(),
            customerName: order.customerName || "Customer",
            customerEmail: order.customerEmail || "N/A",
            customerPhone: order.customerPhone || "N/A",
            shippingAddress: order.shippingAddress || "N/A",
            shippingCity: order.shippingCity || "",
            shippingPincode: order.shippingPincode || "",
            items: invoiceItems,
            subtotal: subtotal,
            tax: taxAmount,
            shipping: shippingCharge,
            total: actualTotal,
            paymentMethod: order.paymentMethod || 'N/A',
            paymentStatus: order.paymentStatus || 'pending',
         });

         toast({ title: "Invoice Downloaded", description: `Invoice_${order.orderNumber}.pdf` });
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
      status: h.newStatus || h.new_status,
      timestamp: h.createdAt || h.created_at,
      message: h.description
   }));

   // If no history exists (legacy orders), fallback to current status
   if (timelineUpdates.length === 0 && order.createdAt) {
      timelineUpdates.push({ id: undefined, status: 'pending', timestamp: order.createdAt, message: 'Order Placed' });
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
                  <h1 className="text-sm sm:text-2xl md:text-3xl font-bold tracking-tight break-all sm:break-normal">Order #{order.orderNumber}</h1>
                  <Badge className={cn("text-white h-5 sm:h-7 px-2 sm:px-3 text-[10px] sm:text-sm font-medium whitespace-nowrap",
                     order.status?.toLowerCase() === 'delivered' ? "bg-green-600" :
                        order.status?.toLowerCase() === 'cancelled' ? "bg-red-600" :
                           order.status?.toLowerCase() === 'packed' ? "bg-purple-600" :
                              "bg-primary"
                  )}>
                     {order.status?.toUpperCase()}
                  </Badge>
               </div>
               <div className="flex items-center gap-2 mt-2 text-sm sm:text-base text-muted-foreground">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                  {order.createdAt && !isNaN(new Date(order.createdAt).getTime())
                     ? format(new Date(order.createdAt), 'MMM dd, yyyy')
                     : 'N/A'}
               </div>
            </div>

            <div className="flex flex-col gap-3 w-full sm:w-auto sm:flex-row mt-4 sm:mt-0">
               {order.status !== 'cancelled' && (
                  <Button variant="outline" size="sm" onClick={handleDownloadInvoice} className="h-10 w-full sm:w-auto justify-center sm:min-w-[100px]">
                     <Download className="h-4 w-4 mr-2" />
                     Invoice
                  </Button>
               )}
               {(order.status?.toLowerCase() === 'pending' || order.status?.toLowerCase() === 'confirmed') && (
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
                     <VerticalOrderTracker
                        status={order.status?.toLowerCase()}
                        createdAt={order.createdAt}
                        trackingUpdates={timelineUpdates}
                     />
                  </CardContent>
               </Card>

               {/* Refund Status Card - Premium Feature */}
               {(order.paymentStatus === 'refund_pending' || order.paymentStatus === 'refunded') && (
                  <Card className="border-0 shadow-lg ring-1 ring-emerald-500/20 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/30 dark:to-gray-900">
                     <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg text-emerald-700 dark:text-emerald-400">
                           <CreditCard className="h-5 w-5" />
                           Refund Status
                        </CardTitle>
                     </CardHeader>
                     <CardContent>
                        <div className="flex items-center gap-4">
                           <div className={`p-3 rounded-full ${order.paymentStatus === 'refunded' ? 'bg-emerald-100 text-emerald-600' : 'bg-yellow-100 text-yellow-600'}`}>
                              {order.paymentStatus === 'refunded' ? <XCircle className="h-6 w-6 rotate-45" /> : <Calendar className="h-6 w-6" />}
                           </div>
                           <div>
                              <h4 className="font-semibold text-lg">
                                 {order.paymentStatus === 'refunded' ? 'Refund Processed' : 'Refund Initiated'}
                              </h4>
                              <p className="text-muted-foreground text-sm mt-1">
                                 Amount: <span className="font-medium text-foreground">₹{order.totalAmount?.toLocaleString()}</span>
                                 {order.paymentStatus === 'refund_pending' &&
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
                     {items.map((item: OrderItem, idx: number) => {
                        // Robust ID extraction
                        const productId = item.productId || item.id;
                        return (
                           <div
                              key={idx}
                              className="flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border bg-card hover:bg-primary/5 transition-all cursor-pointer group"
                              onClick={() => {
                                 const slug = item.product?.slug || item.productId || item.id;
                                 navigate(`/product/${slug}`);
                              }}

                           >
                              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg border overflow-hidden bg-muted flex-shrink-0">
                                 {(() => {
                                    // Robust image extraction: check item image, then variant images
                                    let imgPath = item.image;

                                    if (!imgPath && item.product?.variants) {
                                       // Scan all variants for an image
                                       const variants = Array.isArray(item.product.variants) ? item.product.variants : [];
                                       for (const v of variants) {
                                          let variantImgs = v.images;
                                          if (typeof variantImgs === 'string') {
                                             try { variantImgs = JSON.parse(variantImgs); } catch (e) { variantImgs = []; }
                                          }
                                          if (Array.isArray(variantImgs) && variantImgs.length > 0) {
                                             imgPath = variantImgs[0];
                                             break;
                                          }
                                       }
                                    }

                                    const fullImgUrl = getMediaUrl(imgPath);
                                    return fullImgUrl ? (
                                       <img src={fullImgUrl} alt={item.product?.title || 'Product'} className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-300" />
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
                                       {item.product?.title || 'Product'}
                                    </h3>
                                    <p className="text-sm sm:text-base font-bold whitespace-nowrap">
                                       ₹{(item.priceAtPurchase * item.quantity).toLocaleString()}
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
                  <CardFooter className="bg-muted/10 border-t p-4 sm:p-6 mt-auto">
                     <div className="flex flex-wrap items-center justify-between w-full gap-4 sm:gap-12">
                        <div className="flex flex-row gap-6 sm:gap-16">
                           <div className="space-y-1">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Subtotal</p>
                              <p className="text-base sm:text-lg font-bold">₹{subtotal.toLocaleString()}</p>
                           </div>
                           <div className="space-y-1">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Tax</p>
                              <p className="text-base sm:text-lg font-bold">₹{tax.toLocaleString()}</p>
                           </div>
                           <div className="space-y-1">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Shipping</p>
                              <p className="text-base sm:text-lg font-bold">₹{shipping.toLocaleString()}</p>
                           </div>
                        </div>
                        <div className="space-y-1 sm:text-right">
                           <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Total amount</p>
                           <p className="text-2xl sm:text-3xl font-black text-primary">₹{total.toLocaleString()}</p>
                        </div>
                     </div>
                  </CardFooter>
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
                                 {order.paymentMethod === "upi" ? "UPI" :
                                    order.paymentMethod === "qr" ? "QR Code" :
                                       order.paymentMethod === "cod" ? "Cash on Delivery" :
                                          order.paymentMethod || "N/A"}
                              </span>
                           </div>
                           <Separator className="bg-border/50" />
                           <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Payment Status</span>
                              <Badge variant={order.paymentStatus === 'paid' ? 'default' : 'secondary'} className={cn(
                                 "capitalize shadow-sm",
                                 order.paymentStatus === 'paid' ? "bg-green-600 hover:bg-green-700" : ""
                              )}>
                                 {order.paymentStatus || "Pending"}
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
                     {(() => {
                        let addr: { name: any; address: any; city: any; pincode: any; phone?: any } = { name: order.customerName, address: order.shippingAddress, city: order.shippingCity, pincode: order.shippingPincode };
                        try {
                           if (order.shippingAddress?.startsWith('{')) {
                              const parsed = JSON.parse(order.shippingAddress);
                              addr = { ...addr, ...parsed };
                           }
                        } catch (e) { }

                        return (
                           <>
                              <div className="font-medium text-base">{addr.name}</div>
                              <div className="text-muted-foreground space-y-1">
                                 <p>{addr.address}</p>
                                 <p>{addr.city} - {addr.pincode}</p>
                                 <p>India</p>
                                 <p className="pt-2 flex items-center gap-2 text-foreground">
                                    Phone: {addr.phone || order.customerPhone}
                                 </p>
                              </div>
                           </>
                        );
                     })()}
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
                  orderNumber={order.orderNumber}
                  orderAmount={total}
                  isPrepaid={order.paymentStatus === 'paid'}
               />
            )
         }
      </div >
   );
}
