import { useState, useRef, useEffect } from "react";
import { History, CreditCard, ShoppingBag, ExternalLink, ArrowRight, Trash2, RotateCcw, Search, Filter, AlertTriangle, Package, CheckCircle2, Truck, XCircle, MapPin, Receipt } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Input } from "@/components/ui/Input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose } from "@/components/ui/Sheet";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { Separator } from "@/components/ui/Separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/AlertDialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

interface HistorySectionProps {
  history?: any[];
  orders?: any[];
  payments?: any[];
}

export const HistorySection = ({ history, orders = [], payments = [] }: HistorySectionProps) => {
  const [activeTab, setActiveTab] = useState("orders");
  const [searchTerm, setSearchTerm] = useState("");
  const [deletedItems, setDeletedItems] = useState<string[]>([]);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Merge legacy history if orders is empty (fallback)
  const displayOrders = (orders && orders.length > 0 ? orders : (history || [])).filter(
    item => !deletedItems.includes(item.id)
  );
  
  const displayPayments = payments.filter(
    item => !deletedItems.includes(item.id)
  );

  const filteredOrders = displayOrders.filter(
    item => 
      item.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.total?.toString().includes(searchTerm) ||
      item.order_status?.toLowerCase().includes(searchTerm)
  );

  const filteredPayments = displayPayments.filter(
    item => 
      item.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.amount?.toString().includes(searchTerm) ||
      item.payment_method?.toLowerCase().includes(searchTerm)
  );

  const handleDelete = (id: string) => {
    setItemToDelete(id);
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;
    setDeletedItems(prev => [...prev, itemToDelete]);
    toast({
      title: "History Deleted",
      description: "Item removed from view",
      action: (
        <Button variant="outline" size="sm" onClick={() => handleUndo(itemToDelete)} className="gap-2">
          <RotateCcw className="h-3 w-3" /> Undo
        </Button>
      ),
    });
    setItemToDelete(null);
  };

  const handleUndo = (id: string) => {
    setDeletedItems(prev => prev.filter(itemId => itemId !== id));
    toast({ title: "Action Undone", description: "Item restored to history" });
  };

  const getStatusColor = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'delivered': return "bg-green-500";
      case 'shipped': return "bg-blue-500";
      case 'cancelled': return "bg-red-500";
      case 'processing': return "bg-orange-500";
      default: return "bg-slate-500";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <History className="h-6 w-6 text-primary" />
          History & Activity
        </h2>
        <div className="relative w-full sm:w-64">
           <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
           <Input 
             placeholder="Search history..." 
             className="pl-9" 
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
           />
        </div>
      </div>

      <Tabs defaultValue="orders" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6 h-auto p-1 bg-muted/50 rounded-xl">
          <TabsTrigger value="orders" className="py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-300">
             <ShoppingBag className="h-4 w-4 mr-2" /> Orders
          </TabsTrigger>
          <TabsTrigger value="transactions" className="py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-300">
             <CreditCard className="h-4 w-4 mr-2" /> Transactions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4 animate-in fade-in-50 duration-300">
          {filteredOrders.length > 0 ? (
            <div className="grid gap-4">
              {filteredOrders.map((order: any) => (
                <Card key={order.id} className="group overflow-hidden border-border/50 hover:border-primary/20 transition-all duration-300 hover:shadow-md bg-card/50">
                  <div className="flex flex-col sm:flex-row">
                    <div className={cn("w-full sm:w-1.5 h-1 sm:h-auto", getStatusColor(order.order_status))} />
                    
                    <div className="flex-1 p-4 sm:p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                        <div>
                          <h3 className="font-semibold text-lg flex items-center gap-2">
                            Order #{order.order_number}
                            <Badge variant="secondary" className={cn(
                              "capitalize ml-2 text-xs font-normal bg-opacity-15",
                              order.order_status === 'delivered' ? "bg-green-500 text-green-700" :
                              order.order_status === 'cancelled' ? "bg-red-500 text-red-700" :
                              "bg-blue-500 text-blue-700"
                            )}>
                              {order.order_status}
                            </Badge>
                          </h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                            <History className="h-3.5 w-3.5" />
                            {format(new Date(order.created_at), 'MMM dd, yyyy • hh:mm a')}
                          </p>
                        </div>
                        <div className="text-right">
                           <p className="font-bold text-lg">₹{(order.total || order.amount || 0).toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-dashed">
                         <Button variant="ghost" size="sm" onClick={() => handleDelete(order.id)} className="text-muted-foreground hover:text-red-600 -ml-2">
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                         </Button>
                         <Button 
                            size="sm" 
                            variant="outline" 
                            className="gap-2 group-hover:border-primary/50 group-hover:text-primary transition-colors"
                            onClick={() => setSelectedOrder(order)}
                         >
                            View Details <ArrowRight className="h-3.5 w-3.5" />
                         </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState icon={ShoppingBag} title="No orders found" description="You haven't placed any orders yet." />
          )}
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4 animate-in fade-in-50 duration-300">
           {filteredPayments.length > 0 ? (
            <div className="grid gap-4">
              {filteredPayments.map((payment: any) => (
                <Card key={payment.id} className="border-border/50 hover:border-primary/20 transition-all duration-300">
                  <CardContent className="p-4 sm:p-5 flex items-center justify-between gap-4">
                     <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                           <CreditCard className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                           <p className="font-medium">{payment.payment_method?.replace(/_/g, ' ').toUpperCase()}</p>
                           <p className="text-xs text-muted-foreground font-mono mt-0.5">
                              {payment.transaction_id || 'TXN-PENDING'}
                           </p>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className={cn(
                           "font-bold",
                           payment.status === 'success' ? "text-green-600" : "text-foreground"
                        )}>
                           {payment.status === 'refunded' ? '-' : '+'}₹{payment.amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                           {format(new Date(payment.created_at), 'MMM dd')}
                        </p>
                     </div>
                  </CardContent>
                </Card>
              ))}
            </div>
           ) : (
             <EmptyState icon={CreditCard} title="No transactions" description="No payment history available." />
           )}
        </TabsContent>
      </Tabs>

      {/* Premium Order Details Sheet */}
      <Sheet open={!!selectedOrder} onOpenChange={(o) => !o && setSelectedOrder(null)}>
        <SheetContent className="w-full sm:max-w-md p-0 gap-0 overflow-hidden flex flex-col bg-background/95 backdrop-blur-xl border-l shadow-2xl">
          {selectedOrder && (
            <>
              {/* Premium Header with Gradient */}
              <SheetHeader className="p-0 border-b-0 space-y-0">
                  <div className="relative h-32 bg-gradient-to-br from-primary/90 to-primary/70 flex items-center justify-center overflow-hidden shrink-0">
                     <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
                     <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                     <div className="text-center text-primary-foreground relative z-10 p-4">
                        <div className="inline-flex items-center justify-center p-2 bg-white/10 rounded-full mb-2 backdrop-blur-sm border border-white/20">
                          <Package className="h-6 w-6 text-white" />
                        </div>
                        <SheetTitle className="text-xl font-bold tracking-tight text-white mb-1">Order Details</SheetTitle>
                        <SheetDescription className="text-primary-foreground/80 text-sm">
                            #{selectedOrder.order?.order_number || selectedOrder.id.slice(0,8).toUpperCase()}
                        </SheetDescription>
                     </div>
                  </div>
              </SheetHeader>

              <ScrollArea className="flex-1">
                <div className="p-6 space-y-8">
                  
                  {/* Status Banner */}
                  <div className="text-center space-y-2">
                     <Badge className={cn(
                        "px-4 py-1.5 text-sm rounded-full shadow-lg transition-all hover:scale-105 cursor-default",
                        selectedOrder.status === 'delivered' ? "bg-green-500 hover:bg-green-600" :
                        selectedOrder.status === 'cancelled' ? "bg-red-500 hover:bg-red-600" :
                        "bg-primary hover:bg-primary/90"
                     )}>
                        {selectedOrder.status?.toUpperCase() || "PROCESSING"}
                     </Badge>
                     <p className="text-muted-foreground text-sm">
                        {selectedOrder.status === 'delivered' ? "Package successfully delivered" : "We are processing your order"}
                     </p>
                  </div>

                  <Separator />

                  {/* Order Items */}
                  <div className="space-y-4">
                     <h3 className="font-semibold flex items-center gap-2 text-sm uppercase tracking-wider text-muted-foreground">
                        <ShoppingBag className="h-4 w-4" /> Items Purchased
                     </h3>
                     {selectedOrder.items && Array.isArray(selectedOrder.items) && selectedOrder.items.length > 0 ? (
                        selectedOrder.items.map((item: any, idx: number) => (
                           <div key={idx} className="bg-muted/30 rounded-xl p-3 border border-border/50 flex gap-4 items-start">
                              <div className="h-16 w-16 rounded-lg bg-white overflow-hidden border shadow-sm shrink-0">
                                 {item.image ? (
                                    <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                                 ) : (
                                    <div className="h-full w-full flex items-center justify-center bg-gray-100">
                                       <ShoppingBag className="h-6 w-6 text-gray-400" />
                                    </div>
                                 )}
                              </div>
                              <div className="flex-1 min-w-0">
                                 <h4 className="font-medium text-sm line-clamp-2" title={item.title}>{item.title}</h4>
                                 <div className="flex justify-between items-center mt-1">
                                    <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                                    <p className="font-semibold text-sm">₹{(item.price * item.quantity).toLocaleString()}</p>
                                 </div>
                              </div>
                           </div>
                        ))
                     ) : (
                        <p className="text-sm text-muted-foreground italic">No items details available.</p>
                     )}
                  </div>

                  {/* Payment Details */}
                  <div className="space-y-4">
                     <h3 className="font-semibold flex items-center gap-2 text-sm uppercase tracking-wider text-muted-foreground">
                        <Receipt className="h-4 w-4" /> Payment Info
                     </h3>
                     <Card className="bg-card/50 border-dashed">
                        <CardContent className="p-4 space-y-3 text-sm">
                           <div className="flex justify-between">
                              <span className="text-muted-foreground">Payment ID</span>
                              <span className="font-mono">{selectedOrder.payment_id || selectedOrder.id.slice(0, 8).toUpperCase()}</span>
                           </div>
                           <div className="flex justify-between">
                              <span className="text-muted-foreground">Method</span>
                              <span className="uppercase">{selectedOrder.payment_method?.replace(/_/g, ' ') || 'N/A'}</span>
                           </div>
                           <div className="flex justify-between">
                              <span className="text-muted-foreground">Status</span>
                              <Badge variant={selectedOrder.payment_status === 'paid' ? 'secondary' : 'outline'} className="text-xs h-5 px-1.5">
                                 {selectedOrder.payment_status?.toUpperCase() || 'PENDING'}
                              </Badge>
                           </div>
                           <Separator className="my-2" />
                           <div className="flex justify-between font-bold text-base">
                              <span>Total Paid</span>
                              <span className="text-primary">₹{(selectedOrder.total || selectedOrder.amount || 0).toLocaleString()}</span>
                           </div>
                        </CardContent>
                     </Card>
                  </div>

                  {/* Shipping Address */}
                  <div className="space-y-4">
                     <h3 className="font-semibold flex items-center gap-2 text-sm uppercase tracking-wider text-muted-foreground">
                        <Truck className="h-4 w-4" /> Delivery Address
                     </h3>
                     <div className="flex gap-3 text-sm text-muted-foreground bg-muted/20 p-4 rounded-xl border">
                        <MapPin className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                        <div>
                           <p className="font-medium text-foreground mb-1">{selectedOrder.customer_name || 'Customer'}</p>
                           <p>{selectedOrder.shipping_address}</p>
                           <p>{selectedOrder.shipping_city} {selectedOrder.shipping_pincode ? `- ${selectedOrder.shipping_pincode}` : ''}</p>
                           {selectedOrder.customer_phone && (
                              <p className="mt-2 text-xs font-mono">Ph: {selectedOrder.customer_phone}</p>
                           )}
                        </div>
                     </div>
                  </div>

                </div>
              </ScrollArea>

              <div className="p-4 border-t bg-muted/10 backdrop-blur-sm space-y-3">
                 <Button className="w-full shadow-lg shadow-primary/20" size="lg" onClick={() => navigate(`/orders/${selectedOrder.id}`)}>
                    View Full Order Details <ExternalLink className="h-4 w-4 ml-2" />
                 </Button>
                 <SheetClose asChild>
                    <Button variant="ghost" className="w-full">Close</Button>
                 </SheetClose>
              </div>

            </>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!itemToDelete} onOpenChange={(o) => !o && setItemToDelete(null)}>
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
               <AlertTriangle className="h-5 w-5" /> Delete from History
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this item from your history view? This action cannot be undone after the undo period expires.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const EmptyState = ({ icon: Icon, title, description }: any) => (
  <div className="flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed rounded-xl bg-muted/5">
    <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
      <Icon className="h-8 w-8 text-muted-foreground/50" />
    </div>
    <h3 className="text-lg font-semibold">{title}</h3>
    <p className="text-sm text-muted-foreground max-w-xs mt-1">{description}</p>
  </div>
);

