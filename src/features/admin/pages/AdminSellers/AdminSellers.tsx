import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import {
  Store,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  ShieldCheck,
  FileText,
  Mail,
  MoreVertical,
  ShieldAlert,
  Calendar,
  CreditCard,
  Briefcase
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AdminSkeleton, AdminHeaderSkeleton } from "@/features/admin/components/AdminSkeleton";
import { useAdmin } from "@/contexts/AdminContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { StatsCard } from "@/features/admin/components/StatsCard";

interface Seller {
  id: string;
  user_id: string;
  full_name: string;
  verification_status: string;
  rejection_reason?: string;
  total_sales: number;
  created_at: string;
  email?: string;
  pan?: string;
  bank_account?: string;
}

export default function AdminSellers() {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [justification, setJustification] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate("/auth");
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    fetchSellers();
  }, []);

  const fetchSellers = async () => {
    try {
      setLoading(true);

      const { data: userRoles, error: roleError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "seller");

      if (roleError) throw roleError;
      const sellerIds = userRoles.map(ur => ur.user_id);

      if (sellerIds.length === 0) {
        setSellers([]);
        return;
      }

      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .in("id", sellerIds);

      if (profileError) throw profileError;

      const mappedSellers: Seller[] = (profiles as any[]).map(profile => ({
        id: profile.id,
        user_id: profile.id,
        full_name: profile.full_name || profile.business_name || "Unnamed Store",
        verification_status: profile.verification_status || "pending",
        rejection_reason: profile.rejection_reason,
        total_sales: 0,
        created_at: profile.created_at || new Date().toISOString(),
        email: profile.email,
        pan: profile.pan,
        bank_account: profile.bank_account
      }));

      setSellers(mappedSellers);
    } catch (error) {
      console.error("Error fetching sellers:", error);
      toast({ title: "Fetch Failed", description: "Could not load sellers", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAction = async (newStatus: 'approved' | 'rejected', reason?: string) => {
    if (!selectedSeller) return;

    try {
      setProcessing(true);
      const { error } = await supabase.rpc('admin_verify_seller', {
        p_user_id: selectedSeller.id,
        p_new_status: newStatus,
        p_reason: reason || null
      });

      if (error) {
        console.error("RPC Error:", error);
        throw error;
      }

      toast({
        title: newStatus === 'approved' ? "Verification Approved" : "Verification Rejected",
        description: `${selectedSeller.full_name}'s status has been updated.`,
      });

      setSellers(prev => prev.map(s =>
        s.id === selectedSeller.id ? { ...s, verification_status: newStatus, rejection_reason: reason } : s
      ));

      // Log audit
      await supabase.from('audit_logs').insert({
        actor_id: user?.id,
        target_id: selectedSeller.id,
        target_type: 'seller_verification',
        action_type: newStatus === 'approved' ? 'verification_approved' : 'verification_rejected',
        severity: newStatus === 'approved' ? 'info' : 'warning',
        description: `Seller ${selectedSeller.full_name} (${selectedSeller.id}) verification status updated to ${newStatus}.`,
        metadata: {
          new_status: newStatus,
          rejection_reason: reason
        }
      });

      setShowVerifyDialog(false);
      setSelectedSeller(null);
      setJustification("");
    } catch (error: any) {
      console.error("Verification error:", error);
      toast({
        title: "Action Item Failed",
        description: error.message || "Could not update seller status. Check database constraints.",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="container max-w-7xl mx-auto space-y-8">
        <AdminHeaderSkeleton showBack={true} showTitle={true} showDescription={true} />
        <AdminSkeleton variant="registry" skeletonProps={{ columns: 4, rows: 6 }} />
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20 rounded-full px-3 py-0.5 font-bold text-[10px]">VERIFIED</Badge>;
      case 'rejected': return <Badge variant="destructive" className="bg-rose-500/10 text-rose-600 border-rose-500/20 hover:bg-rose-500/20 rounded-full px-3 py-0.5 font-bold text-[10px]">REJECTED</Badge>;
      case 'under_review': return <Badge className="bg-sky-500/10 text-sky-600 border-sky-500/20 hover:bg-sky-500/20 rounded-full px-3 py-0.5 font-bold text-[10px]">REVIEWING</Badge>;
      default: return <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20 rounded-full px-3 py-0.5 font-bold text-[10px]">PENDING</Badge>;
    }
  };

  const filteredSellers = sellers.filter(seller => {
    const matchesSearch = (seller.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (seller.email || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || seller.verification_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="w-full mx-auto py-3 sm:py-6 lg:py-8 px-2 sm:px-4 lg:px-6 xl:px-8 flex flex-col gap-3 sm:gap-6 lg:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-6 sm:pb-8 lg:pb-10">
      <div className="flex flex-col gap-3 sm:gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              className="h-8 sm:h-9 rounded-xl border-border/40 bg-card/40 backdrop-blur-sm gap-2 font-bold text-xs w-fit justify-start"
              onClick={() => navigate("/admin")}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl lg:text-2xl font-bold flex items-center flex-wrap gap-2 sm:gap-3">
                Seller verification workspace
                <Badge variant="outline" className="text-[10px] font-bold tracking-tight bg-primary/5 rounded-lg border-primary/20 shrink-0 h-5 px-1.5">
                  {sellers.length} Total
                </Badge>
              </h1>
              <p className="text-xs sm:text-sm lg:text-base text-muted-foreground mt-0.5">Manage platform partner registrations and vetting</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-6">
        <StatsCard
          title="Total Pool Size"
          value={sellers.length.toString()}
          icon={Store}
          color="bg-blue-600"
          description="Registered platform partners"
          trend={{ value: 2.4, isPositive: true }}
        />
        <StatsCard
          title="Action Required"
          value={sellers.filter(s => s.verification_status === 'pending').length.toString()}
          icon={AlertTriangle}
          color="bg-amber-500"
          description="Awaiting vetting review"
          trend="Needs attention"
        />
        <StatsCard
          title="Verified Network"
          value={sellers.filter(s => s.verification_status === 'approved').length.toString()}
          icon={CheckCircle}
          color="bg-emerald-500"
          description="Active verified sellers"
          trend={{ value: 1.2, isPositive: true }}
        />
        <StatsCard
          title="Flagged/Blocked"
          value={sellers.filter(s => s.verification_status === 'rejected').length.toString()}
          icon={XCircle}
          color="bg-rose-500"
          description="Declined applications"
        />
      </div>


      {/* Mobile Card View */}
      <div className="space-y-2 sm:hidden">
        {loading ? (
          <AdminSkeleton variant="list" skeletonProps={{ count: 3 }} />
        ) : filteredSellers.length === 0 ? (
          <Card className="border-border/40 bg-card/40 backdrop-blur-xl">
            <CardContent className="py-12 text-center text-muted-foreground">
              <ShieldAlert className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>No verification cases found</p>
            </CardContent>
          </Card>
        ) : (
          filteredSellers.map((seller) => (
            <Card key={seller.id} className="border-border/40 bg-card/40 backdrop-blur-xl overflow-hidden shadow-sm">
              <CardHeader className="p-2.5 bg-muted/20 border-b border-border/10 pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col max-w-[70%]">
                    <span className="font-semibold text-foreground truncate">{seller.full_name || 'Unnamed Shop'}</span>
                  </div>
                  <Badge variant="outline" className={cn(
                    "rounded-full text-[9px] font-semibold px-2 py-0 h-5",
                    seller.verification_status === 'approved' ? "bg-emerald-500/5 text-emerald-600 border-emerald-500/20" :
                      seller.verification_status === 'rejected' ? "bg-rose-500/5 text-rose-600 border-rose-500/20" :
                        "bg-amber-500/5 text-amber-600 border-amber-500/20"
                  )}>
                    {seller.verification_status.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-2.5 pt-2.5 space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground flex items-center gap-1.5"><Mail className="w-3 h-3" /> Email</span>
                  <span className="font-medium text-foreground truncate max-w-[150px]">{seller.email}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground flex items-center gap-1.5"><Calendar className="w-3 h-3" /> Joined</span>
                  <span className="font-medium text-foreground">{new Date(seller.created_at).toLocaleDateString()}</span>
                </div>
                <Button
                  size="sm"
                  className="w-full h-8 text-xs font-medium"
                  onClick={() => { setSelectedSeller(seller); setShowVerifyDialog(true); }}
                >
                  Review Case
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Card className="hidden sm:block border-border/40 bg-card/40 backdrop-blur-xl transition-all duration-500 rounded-2xl shadow-none overflow-hidden min-h-[600px]">
        <CardHeader className="bg-muted/10 border-b border-border/40 p-3 sm:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search sellers by name, store or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 h-10 sm:h-11 bg-card/20 border-border/40 focus:ring-primary/20 rounded-xl backdrop-blur-sm text-xs sm:text-sm placeholder:text-[10px] sm:placeholder:text-sm"
              />
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[200px] h-10 sm:h-11 bg-card/20 rounded-xl border-border/40 backdrop-blur-sm font-bold text-xs">
                  <SelectValue placeholder="Status Filter" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-border/40 backdrop-blur-xl">
                  <SelectItem value="all">All Verification</SelectItem>
                  <SelectItem value="pending">Pending Review</SelectItem>
                  <SelectItem value="approved">Greenlit (Approved)</SelectItem>
                  <SelectItem value="rejected">Flagged (Rejected)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-border/40 hover:bg-transparent">
                  <TableHead className="px-6 h-12 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60">Shop details</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60">Contact information</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60">Status</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 text-right pr-10">Verification</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="p-0"><div className="h-64 bg-muted/10 animate-pulse" /></TableCell>
                  </TableRow>
                ) : filteredSellers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-24 text-muted-foreground">
                      <ShieldAlert className="h-12 w-12 mx-auto mb-4 opacity-10" />
                      <p className="text-sm font-medium italic">No verification cases found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSellers.map((seller) => (
                    <TableRow key={seller.id} className="group hover:bg-muted/30 transition-all border-b-border/20">
                      <TableCell className="px-4 py-4 sm:px-6 sm:py-5">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-sm tracking-tight">{seller.full_name || 'Unnamed Shop'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-4 sm:px-6 sm:py-5">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{seller.email}</span>
                          <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5 mt-0.5">
                            <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 opacity-60" />
                            Joined: {new Date(seller.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-4 sm:px-6 sm:py-5">
                        <Badge variant="outline" className={cn(
                          "rounded-full text-[10px] font-semibold px-3 py-0",
                          seller.verification_status === 'approved'
                            ? "bg-emerald-500/5 text-emerald-600 border-emerald-500/20"
                            : seller.verification_status === 'rejected'
                              ? "bg-rose-500/5 text-rose-600 border-rose-500/20"
                              : "bg-amber-500/5 text-amber-600 border-amber-500/20"
                        )}>
                          {seller.verification_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-4 sm:px-6 sm:py-5 text-right pr-10">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 px-4 rounded-xl font-bold border-border/40 bg-card/20 backdrop-blur-sm hover:bg-primary hover:text-white transition-all shadow-none text-xs"
                          onClick={() => {
                            setSelectedSeller(seller);
                            setShowVerifyDialog(true);
                          }}
                        >
                          Review Case
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
        <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden border-border/40 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.4)] rounded-3xl bg-card/95 backdrop-blur-2xl">
          <DialogHeader className="p-6 bg-gradient-to-br from-primary to-primary/90 text-white">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md border border-white/20">
                <Briefcase className="h-6 w-6" />
              </div>
              <div className="space-y-0.5">
                <DialogTitle className="text-xl font-bold">Identity Review</DialogTitle>
                <DialogDescription className="text-white/80 font-medium text-xs">
                  Governing Action: {selectedSeller?.full_name}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-muted/50 border border-border/60 hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                  <CreditCard className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-bold">Business ID (PAN)</span>
                </div>
                <p className="text-sm font-bold font-mono tracking-wider">{selectedSeller?.pan || 'Not Provided'}</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/50 border border-border/60 hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-bold">Payout Routing</span>
                </div>
                <p className="text-sm font-bold font-mono tracking-wider">{selectedSeller?.bank_account || 'Not Provided'}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
              <p className="text-[11px] leading-relaxed text-amber-900/80 dark:text-amber-300/80 font-medium">
                Approval grants marketplace access. Please ensure documents match registered corporate details to prevent fraud.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground/80">Governance Justification</label>
                <span className="text-[10px] font-medium text-muted-foreground italic flex items-center gap-1">
                  <ShieldAlert className="h-3 w-3" /> Required for Audit Trail
                </span>
              </div>
              <textarea
                className="w-full min-h-[120px] p-4 text-sm font-medium rounded-xl border bg-muted focus:ring-4 ring-primary/5 focus:border-primary/40 transition-all outline-none resize-none shadow-sm placeholder:opacity-40"
                placeholder="Describe the reason for this verification action..."
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="p-6 bg-muted/10 border-t border-border/20 flex flex-col sm:flex-row items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setShowVerifyDialog(false)}
              disabled={processing}
              className="w-full sm:w-fit"
            >
              Postpone
            </Button>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-fit">
              <Button
                variant="destructive"
                className="w-full sm:w-fit"
                onClick={() => handleVerifyAction('rejected', justification)}
                disabled={processing || !justification.trim()}
              >
                {processing ? "Updating..." : "Decline Access"}
              </Button>
              <Button
                className="w-full sm:w-fit bg-primary hover:bg-primary/90 text-white"
                onClick={() => handleVerifyAction('approved', justification)}
                disabled={processing || !justification.trim()}
              >
                {processing ? "Confirming..." : "Confirm Approval"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

