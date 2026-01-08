import { useState, useEffect } from "react";
import { AdminSkeleton } from "@/feat/admin/components/AdminSkeleton";
import { motion, AnimatePresence } from "framer-motion";
import { useAdmin } from "@/core/context/AdminContext";
import { cn } from "@/lib/utils";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/ui/Card";
import { Button } from "@/ui/Button";
import { Badge } from "@/ui/Badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/ui/Table";
import {
    Check,
    X,
    AlertCircle,
    Eye,
    ArrowRight,
    ShieldAlert,
    Clock,
    User,
    Package,
} from "lucide-react";
import { supabase } from "@/infra/api/supabase";
import { toast } from "@/shared/hook/use-toast";
import { Textarea } from "@/ui/Textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/ui/Dialog";

export default function AdminProductUpdates() {
    const { isAdmin, loading: adminLoading } = useAdmin();
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [adminNotes, setAdminNotes] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("product_update_requests")
                .select(`
          *,
          products (
            title,
            sku,
            category,
            description,
            subcategory_id
          ),
          profiles (
            full_name,
            email
          )
        `)
                .order('created_at', { ascending: false });

            if (error) {
                // Fallback if table not found
                console.error("Requests fetch error:", error);
                setRequests([]);
            } else {
                setRequests(data || []);
            }
        } catch (err) {
            console.error("Error fetching requests:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAdmin && !adminLoading) {
            fetchRequests();
        }
    }, [isAdmin, adminLoading]);

    const handleAction = async (status: 'approved' | 'rejected') => {
        if (!selectedRequest) return;
        setIsProcessing(true);

        try {
            // 1. Update Request Status
            const { error: updateError } = await supabase
                .from("product_update_requests")
                .update({
                    status,
                    admin_notes: adminNotes,
                    updated_at: new Date().toISOString()
                })
                .eq("id", selectedRequest.id);

            if (updateError) throw updateError;

            // 2. If Approved, Apply Changes to Product
            if (status === 'approved') {
                const { reason, ...changes } = selectedRequest.requested_changes;

                // Clean up undefined/null values
                const cleanChanges = Object.fromEntries(
                    Object.entries(changes).filter(([_, v]) => v !== undefined && v !== null)
                );

                if (Object.keys(cleanChanges).length > 0) {
                    const { error: productError } = await supabase
                        .from("products")
                        .update(cleanChanges)
                        .eq("id", selectedRequest.product_id);

                    if (productError) throw productError;
                }
            }

            toast({
                title: status === 'approved' ? "Changes Approved" : "Request Rejected",
                description: status === 'approved' ? "Product has been updated." : "Seller will be notified.",
            });

            setSelectedRequest(null);
            setAdminNotes("");
            fetchRequests();
        } catch (err: any) {
            toast({
                title: "Action Failed",
                description: err.message,
                variant: "destructive"
            });
        } finally {
            setIsProcessing(false);
        }
    };

    if (adminLoading || loading) return <AdminSkeleton variant="table" />;

    return (
        <div className="w-full mx-auto py-8 px-4 lg:px-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        Product Update Requests
                        <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200">
                            Governance
                        </Badge>
                    </h1>
                    <p className="text-muted-foreground">Review and approve changes to restricted product fields.</p>
                </div>
                <Button variant="outline" onClick={fetchRequests}>
                    Refresh List
                </Button>
            </div>

            <Card className="border-border/60 bg-card rounded-xl overflow-hidden shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>Seller</TableHead>
                            <TableHead>Fields Changed</TableHead>
                            <TableHead>Requested On</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {requests.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                    No pending update requests found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            requests.map((request) => (
                                <TableRow key={request.id}>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-sm">{request.products?.title || 'Unknown Product'}</span>
                                            <span className="text-[10px] text-muted-foreground font-mono">SKU: {request.products?.sku}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <User className="w-3 h-3 text-muted-foreground" />
                                            <div className="flex flex-col">
                                                <span className="text-xs font-medium">{request.profiles?.full_name}</span>
                                                <span className="text-[10px] text-muted-foreground">{request.profiles?.email}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {Object.keys(request.requested_changes)
                                                .filter(k => k !== 'reason')
                                                .map(key => (
                                                    <Badge key={key} variant="outline" className="text-[9px] capitalize p-0 px-1.5 h-4">
                                                        {key.replace('_id', '')}
                                                    </Badge>
                                                ))}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <Clock className="w-3 h-3" />
                                            {new Date(request.created_at).toLocaleDateString()}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                "text-[9px] font-bold tracking-wider",
                                                request.status === 'pending' ? "bg-amber-50 text-amber-600 border-amber-200" :
                                                    request.status === 'approved' ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                                                        "bg-rose-50 text-rose-600 border-rose-200"
                                            )}
                                        >
                                            {request.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 gap-2 font-bold text-xs"
                                            onClick={() => setSelectedRequest(request)}
                                            disabled={request.status !== 'pending'}
                                        >
                                            <Eye className="w-3 h-3" />
                                            Review
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>

            {/* Review Dialog */}
            <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl">Review Update Request</DialogTitle>
                        <DialogDescription>
                            Comparing changes for product: <span className="font-bold text-foreground">{selectedRequest?.products?.title}</span>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {/* Diff Section */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold tracking-widest text-muted-foreground flex items-center gap-2">
                                <ShieldAlert className="w-3 h-3" /> Field Comparisons
                            </h4>

                            <div className="border rounded-2xl overflow-hidden border-border/40">
                                <Table>
                                    <TableHeader className="bg-muted/30">
                                        <TableRow>
                                            <TableHead className="text-[10px] h-10">Field</TableHead>
                                            <TableHead className="text-[10px] h-10">Original Value</TableHead>
                                            <TableHead className="text-[10px] h-10">New Proposed Value</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {selectedRequest && Object.entries(selectedRequest.requested_changes)
                                            .filter(([k]) => k !== 'reason')
                                            .map(([key, newValue]: [string, any]) => (
                                                <TableRow key={key}>
                                                    <TableCell className="font-bold text-[11px] capitalize">{key.replace('_id', '')}</TableCell>
                                                    <TableCell className="text-[11px] text-muted-foreground bg-rose-50/20 max-w-[200px] break-words">
                                                        {selectedRequest.products?.[key] || 'N/A'}
                                                    </TableCell>
                                                    <TableCell className="text-[11px] font-medium text-emerald-600 bg-emerald-50/20 max-w-[200px] break-words">
                                                        {newValue}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                        {/* Seller Reason */}
                        <div className="bg-muted/30 p-4 rounded-2xl border border-dashed border-border/60">
                            <h4 className="text-[10px] font-bold tracking-widest text-muted-foreground mb-2">Seller's justification</h4>
                            <p className="text-sm italic">"{selectedRequest?.requested_changes?.reason || 'No reason provided.'}"</p>
                        </div>

                        {/* Admin Notes */}
                        <div className="space-y-2">
                            <h4 className="text-[10px] font-bold tracking-widest text-muted-foreground">Reviewer notes (Internal)</h4>
                            <Textarea
                                placeholder="Provide feedback or internal notes for this decision..."
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                className="min-h-[80px] rounded-xl text-sm"
                            />
                        </div>
                    </div>

                    <DialogFooter className="flex-col sm:flex-row gap-3">
                        <Button
                            variant="outline"
                            className="flex-1 rounded-xl group border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                            onClick={() => handleAction('rejected')}
                            disabled={isProcessing}
                        >
                            <X className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                            Reject Changes
                        </Button>
                        <Button
                            className="flex-1 rounded-xl bg-[#267A77] hover:bg-[#1f6361]"
                            onClick={() => handleAction('approved')}
                            disabled={isProcessing}
                        >
                            {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                            Approve & Publish
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function Loader2({ className }: { className?: string }) {
    return <Clock className={className} /> // Just a placeholder if Lucide's Loader2 is same as Clock in this context, but I used Spinner icons before.
}
