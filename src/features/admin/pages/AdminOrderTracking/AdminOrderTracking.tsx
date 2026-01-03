import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AdminSkeleton } from "@/features/admin/components/AdminSkeleton";
import { useAdmin } from "@/contexts/AdminContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { Separator } from "@/components/ui/Separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/Sheet";
import { toast } from "@/hooks/use-toast";
import {
  Package,
  CheckCircle2,
  Truck,
  MapPin,
  Search,
  Filter,
  ArrowLeft,
  Clock,
  Ban,
  ChevronRight,
  RefreshCw,
  Eye,
  Settings2
} from "lucide-react";
import { format } from "date-fns";

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  order_status: string;
  total: number;
  created_at: string;
  shipping_address: string;
  shipping_city: string;
  tracking_updates?: any;
}

export default function AdminOrderTracking() {
  const navigate = useNavigate();
  const { isAdmin } = useAdmin();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Status Update State
  const [newStatus, setNewStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [updating, setUpdating] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (isAdmin) {
      loadOrders();
    }
  }, [isAdmin, currentPage, statusFilter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from("orders")
        .select("*", { count: "exact" });

      if (statusFilter !== "all") {
        query = query.eq("order_status", statusFilter);
      }

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      setOrders(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error("Error loading orders:", error);
      toast({
        title: "Fetch Failed",
        description: "Could not sync tracking data from command center.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async () => {
    if (!selectedOrder || !newStatus) {
      toast({
        title: "Validation Error",
        description: "Specify a governance status to proceed.",
        variant: "destructive",
      });
      return;
    }

    if (newStatus === "delivered" && !otpCode) {
      toast({
        title: "Security Check Required",
        description: "Enter delivery verification code (OTP).",
        variant: "destructive",
      });
      return;
    }

    try {
      setUpdating(true);
      const trackingUpdate = {
        status: newStatus,
        timestamp: new Date().toISOString(),
        message: statusNote || `Lifecycle stage updated to ${newStatus}`,
        ...(newStatus === "delivered" && { otp: otpCode }),
      };

      const existingUpdates = Array.isArray(selectedOrder.tracking_updates) ? selectedOrder.tracking_updates : [];
      const updatedTracking = [...existingUpdates, trackingUpdate];

      const { error } = await supabase
        .from("orders")
        .update({
          order_status: newStatus,
          tracking_updates: updatedTracking,
        })
        .eq("id", selectedOrder.id);

      if (error) throw error;

      // Add to Order History
      await supabase.from('order_history' as any).insert({
        order_id: selectedOrder.id,
        new_status: newStatus,
        description: statusNote || `Lifecycle stage updated to ${newStatus} by Admin`,
        created_at: new Date().toISOString()
      });

      // Audit Logging
      await supabase.from('audit_logs').insert({
        actor_id: (await supabase.auth.getUser()).data.user?.id,
        target_id: selectedOrder.id,
        target_type: 'order',
        action_type: 'order_status_update',
        severity: 'info',
        description: `Order #${selectedOrder.order_number} status updated to "${newStatus}" by Admin.`,
        metadata: { status: newStatus, order_number: selectedOrder.order_number, note: statusNote }
      });

      toast({
        title: "Status Transmitted",
        description: `Order #${selectedOrder.order_number} shifted to ${newStatus}.`,
      });

      setNewStatus("");
      setStatusNote("");
      setOtpCode("");
      await loadOrders();
      setShowDetailSheet(false);
    } catch (error) {
      console.error("Error updating order:", error);
      toast({
        title: "Update Failed",
        description: "Governance override rejected by system.",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 font-bold px-2 py-0.5 rounded-full text-[10px]">PENDING</Badge>;
      case "confirmed": return <Badge variant="outline" className="bg-sky-500/10 text-sky-600 border-sky-500/20 font-bold px-2 py-0.5 rounded-full text-[10px]">CONFIRMED</Badge>;
      case "shipped": return <Badge variant="outline" className="bg-indigo-500/10 text-indigo-600 border-indigo-500/20 font-bold px-2 py-0.5 rounded-full text-[10px]">SHIPPED</Badge>;
      case "delivered": return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold px-2 py-0.5 rounded-full text-[10px]">DELIVERED</Badge>;
      case "cancelled": return <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/20 font-bold px-2 py-0.5 rounded-full text-[10px]">CANCELLED</Badge>;
      default: return <Badge variant="secondary" className="px-2 py-0.5 rounded-full text-[10px]">{status}</Badge>;
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(o =>
      o.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [orders, searchQuery]);

  const totalPages = Math.ceil(totalCount / pageSize);

  if (!isAdmin && !loading) return null;

  if (loading) {
    return <AdminSkeleton variant="table" />;
  }

  return (
    <div className="w-full mx-auto py-3 sm:py-6 lg:py-8 px-2 sm:px-4 lg:px-6 xl:px-8 flex flex-col gap-3 sm:gap-6 lg:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-6 sm:pb-8 lg:pb-10">
      {/* Header Section */}
      <div className="flex flex-col gap-3 sm:gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-xl border-border/40 bg-card/40 backdrop-blur-sm gap-2 font-bold text-xs w-fit justify-start"
              onClick={() => navigate("/admin")}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold">
                Order Tracking and Operations
              </h1>
              <p className="text-xs sm:text-sm lg:text-base text-muted-foreground mt-0.5">Real-time marketplace fulfillment governance center.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              className="flex-1 sm:flex-none h-10 rounded-xl border-border/40 font-bold text-xs bg-card/20 backdrop-blur-sm"
              onClick={loadOrders}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} /> Refresh Hub
            </Button>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <Card className="border-border/50 bg-card/60 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl shadow-primary/5">
        <CardContent className="p-3 sm:p-4 flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter by Order # or Customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-10 sm:h-11 bg-background/50 border-border/50 rounded-xl focus:ring-primary/20 text-xs sm:text-sm placeholder:text-[10px] sm:placeholder:text-sm"
            />
          </div>
          <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}>
            <SelectTrigger className="w-full sm:w-[200px] h-11 bg-background/50 rounded-xl border-border/50">
              <Filter className="h-4 w-4 mr-2 opacity-60" />
              <SelectValue placeholder="Lifecycle Filter" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/10 bg-card/95 backdrop-blur-xl">
              <SelectItem value="all">All Tracking</SelectItem>
              <SelectItem value="pending">Pending Fulfilment</SelectItem>
              <SelectItem value="confirmed">Confirmed Logs</SelectItem>
              <SelectItem value="shipped">In Transit</SelectItem>
              <SelectItem value="out_for_delivery">Delivery Attempt</SelectItem>
              <SelectItem value="delivered">Completed Cycle</SelectItem>
              <SelectItem value="cancelled">Cancelled/Voided</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="block sm:hidden space-y-3">
        {/* Mobile Card View */}
        {loading ? (
          <AdminSkeleton variant="list" skeletonProps={{ count: 3 }} />
        ) : filteredOrders.length === 0 ? (
          <Card className="border-border/50 bg-card/40 backdrop-blur-xl">
            <CardContent className="py-12 text-center text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>No orders found</p>
            </CardContent>
          </Card>
        ) : (
          filteredOrders.map((order) => (
            <Card key={order.id} className="border-border/50 bg-card/40 backdrop-blur-xl overflow-hidden">
              <CardHeader className="p-2.5 bg-muted/20 border-b border-border/10 pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <span className="font-semibold text-foreground" style={{ fontSize: '14px' }}>#{order.order_number}</span>
                    <span className="text-[10px] text-muted-foreground uppercase">{format(new Date(order.created_at), 'MMM dd, HH:mm')}</span>
                  </div>
                  {getStatusBadge(order.order_status)}
                </div>
              </CardHeader>
              <CardContent className="p-2.5 pt-2.5 space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground flex items-center gap-1.5"><Eye className="w-3 h-3" /> Customer</span>
                  <span className="font-medium text-foreground">{order.customer_name}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground flex items-center gap-1.5"><Settings2 className="w-3 h-3" /> Contact</span>
                  <span className="font-medium text-foreground font-mono">{order.customer_phone}</span>
                </div>
                <Separator className="bg-border/30" />
                <div className="flex justify-between items-center bg-background/50 p-2 rounded-lg border border-border/20">
                  <span className="text-xs font-medium text-muted-foreground">Order Value</span>
                  <span className="text-sm font-bold text-primary">₹{order.total.toLocaleString()}</span>
                </div>
                <Button size="sm" className="w-full h-8 text-xs font-medium" onClick={() => { setSelectedOrder(order); setShowDetailSheet(true); }}>
                  Manage <Settings2 className="w-3 h-3 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>


      {/* Desktop Orders Table */}
      <Card className="border-border/50 bg-card/40 backdrop-blur-xl rounded-2xl overflow-hidden shadow-sm hidden sm:block">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[150px] text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60">Order Details</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60">Customer Identity</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60">Lifecycle State</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60">Financial Value</TableHead>
                <TableHead className="text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 pr-6">Governance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow className="animate-pulse">
                  <TableCell colSpan={5} className="py-8"><div className="h-32 bg-muted/10 rounded-lg w-full" /></TableCell>
                </TableRow>
              ) : filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-24 text-center">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground/20 mb-4" />
                    <p className="text-sm font-semibold text-muted-foreground opacity-60 italic">No tracking data matches your current filters.</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow key={order.id} className="group hover:bg-primary/5 transition-colors border-b-border/30">
                    <TableCell className="py-5">
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm tracking-tight">#{order.order_number}</span>
                        <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter opacity-70">
                          {format(new Date(order.created_at), 'MMM dd, HH:mm')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm tracking-tight">{order.customer_name}</span>
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1.5 font-medium">
                          <Clock className="h-3 w-3 opacity-60" /> {order.customer_phone}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(order.order_status)}</TableCell>
                    <TableCell>
                      <span className="font-semibold text-sm">₹{order.total.toLocaleString()}</span>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl h-8 hover:bg-primary hover:text-white transition-all gap-1.5 font-bold text-[10px] px-3 border-border/50"
                        onClick={() => { setSelectedOrder(order); setShowDetailSheet(true); }}
                      >
                        <Settings2 className="h-3.5 w-3.5" /> Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination Container */}
      {
        totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 pt-0">
            <div className="text-xs font-semibold text-muted-foreground tracking-widest opacity-70">
              Page {currentPage} of {totalPages} <Separator orientation="vertical" className="inline mx-2 h-3" /> {totalCount} Records
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="rounded-xl h-10 px-4 font-semibold border-border/50 bg-background/50 shadow-sm"
              >
                Back
              </Button>
              <div className="flex items-center gap-1.5 px-3">
                {[...Array(Math.min(totalPages, 5))].map((_, i) => (
                  <Button
                    key={i}
                    variant={currentPage === i + 1 ? "default" : "ghost"}
                    size="icon"
                    className={cn(
                      "h-9 w-9 rounded-xl font-semibold transition-all",
                      currentPage === i + 1 ? "bg-primary shadow-lg shadow-primary/20 scale-110" : "hover:bg-primary/10"
                    )}
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="rounded-xl h-10 px-4 font-semibold border-border/50 bg-background/50 shadow-sm"
              >
                Next
              </Button>
            </div>
          </div>
        )
      }

      {/* Side Detail Sheet */}
      <Sheet open={showDetailSheet} onOpenChange={setShowDetailSheet}>
        <SheetContent className="w-full sm:max-w-[500px] bg-card/95 backdrop-blur-2xl border-l-border/30 p-0">
          <div className="flex flex-col h-full">
            <SheetHeader className="p-8 pb-4 bg-primary/5 border-b border-primary/10">
              <div className="flex items-center gap-4 mb-2">
                <div className="p-3 bg-primary rounded-2xl shadow-lg shadow-primary/20">
                  <Package className="h-6 w-6 text-white" />
                </div>
                <div>
                  <SheetTitle className="text-2xl font-semibold">Lifecycle Governance</SheetTitle>
                  <SheetDescription className="font-semibold text-primary italic uppercase tracking-widest text-[10px]">
                    ORDER ID: {selectedOrder?.order_number}
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {/* Order Info Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold text-muted-foreground uppercase">Customer</Label>
                  <p className="text-sm font-semibold truncate">{selectedOrder?.customer_name}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold text-muted-foreground uppercase">Revenue</Label>
                  <p className="text-sm font-semibold">₹{selectedOrder?.total.toLocaleString()}</p>
                </div>
                <div className="col-span-2 space-y-1">
                  <Label className="text-[10px] font-semibold text-muted-foreground uppercase">Destination</Label>
                  <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                    {selectedOrder?.shipping_address}, {selectedOrder?.shipping_city}
                  </p>
                </div>
              </div>

              <Separator className="bg-border/30" />

              {/* Status Update Form */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black flex items-center gap-2">
                    <Settings2 className="h-4 w-4 text-primary" /> Governance Override
                  </h3>
                  <Badge className="bg-primary/10 text-primary border-primary/20 font-semibold px-2 py-0.5 rounded-full text-[9px]">Active Control</Badge>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Next Fulfilment Phase</Label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger className="h-12 rounded-xl bg-background border-border/40 focus:ring-primary/20">
                        <SelectValue placeholder="Select target status..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border/10">
                        <SelectItem value="confirmed">Confirmed Logs</SelectItem>
                        <SelectItem value="shipped">In Transit</SelectItem>
                        <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                        <SelectItem value="delivered">Completed Cycle (OTP Req)</SelectItem>
                        <SelectItem value="cancelled">Void (Cancelled)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {newStatus === "delivered" && (
                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                      <Label className="text-xs font-semibold text-emerald-600">Verification OTP</Label>
                      <Input
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="6-digit unique identifier"
                        maxLength={6}
                        className="h-12 rounded-xl font-mono text-center text-lg tracking-[0.5em] bg-emerald-500/5 border-emerald-500/20"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Governance Note (Audit Trail)</Label>
                    <Textarea
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                      placeholder="Add justification or logistics notes..."
                      className="min-h-[100px] rounded-xl bg-background border-border/40 focus:ring-primary/20 resize-none text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>

              <Separator className="bg-border/30" />

              {/* Tracking History Timeline */}
              <div className="space-y-6">
                <h3 className="text-sm font-black flex items-center gap-2 tracking-tighter">
                  <Clock className="h-4 w-4 text-primary" /> Fulfilment Timeline
                </h3>
                <div className="space-y-6 pl-2 border-l border-border/40 ml-2">
                  {selectedOrder?.tracking_updates?.length > 0 ? (
                    selectedOrder.tracking_updates.map((update: any, i: number) => (
                      <div key={i} className="relative pl-6">
                        <div className="absolute -left-[1.65rem] top-1.5 h-3 w-3 rounded-full bg-primary border-4 border-background shadow-primary/20 shadow-lg" />
                        <div className="flex flex-col">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] font-semibold tracking-widest text-[#146B6B]">{update.status}</span>
                            <span className="text-[10px] font-semibold text-muted-foreground">{format(new Date(update.timestamp), 'MMM dd, HH:mm')}</span>
                          </div>
                          <p className="text-xs font-semibold text-muted-foreground leading-relaxed">{update.message}</p>
                        </div>
                      </div>
                    )).reverse()
                  ) : (
                    <div className="text-center py-6">
                      <Clock className="h-8 w-8 mx-auto text-muted-foreground/20 mb-2" />
                      <p className="text-[10px] font-semibold text-muted-foreground italic">No lifecycle events recorded.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <SheetFooter className="p-8 pt-4 bg-muted/20 border-t border-border/40">
              <Button
                onClick={updateOrderStatus}
                className="w-full h-14 rounded-2xl font-semibold text-base shadow-xl shadow-primary/20"
                disabled={updating || !newStatus}
              >
                {updating ? <RefreshCw className="h-5 w-5 animate-spin mr-2" /> : <RefreshCw className="h-5 w-5 mr-2" />}
                Sync Lifecycle Update
              </Button>
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>
    </div >
  );
}
