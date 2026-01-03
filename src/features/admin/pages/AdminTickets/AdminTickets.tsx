import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { Textarea } from "@/components/ui/Textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/contexts/AdminContext";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { AdminHeaderSkeleton, AdminKpiSkeleton, AdminTableSkeleton } from "@/features/admin/components/AdminSkeleton";
import { StatsCard } from "@/features/admin/components/StatsCard";
import {
  Loader2,
  Search,
  MessageSquare,
  CheckCircle,
  XCircle,
  Eye,
  Send,
  ArrowLeft,
  AlertCircle,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Check,
  UserCheck,
  Download,
  Users as UsersIcon
} from "lucide-react";

interface Ticket {
  id: string;
  ticket_number: string;
  subject: string;
  type: string;
  status: string;
  priority: string;
  suspended_seller?: boolean;
  is_high_priority?: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
  user?: {
    full_name: string;
    email: string;
    status: string;
  };
}

interface TicketMessage {
  id: string;
  message: string;
  sender_id: string;
  is_read: boolean;
  created_at: string;
  sender?: {
    full_name: string;
    avatar_url: string | null;
  };
}

export default function AdminTickets() {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [replyMessage, setReplyMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [showReplyDialog, setShowReplyDialog] = useState(false);

  // Responsive search placeholder logic
  const [placeholder, setPlaceholder] = useState("Search ticket subject, user or number...");

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setPlaceholder("Search...");
      } else if (window.innerWidth < 1024) {
        setPlaceholder("Search tickets...");
      } else {
        setPlaceholder("Search ticket subject, user or number...");
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // CRITICAL: Authentication check to prevent unauthorized access
  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate("/auth");
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    filterTickets();
  }, [tickets, searchQuery, statusFilter, typeFilter]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from('support_tickets')
        .select(`
          *,
          user:profiles!support_tickets_user_id_fkey(full_name, email, status)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error: any) {
      console.error('Error fetching tickets:', error);
      toast({
        title: "Error",
        description: "Failed to load tickets",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterTickets = () => {
    let filtered = tickets;

    if (searchQuery) {
      filtered = filtered.filter(ticket =>
        ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.ticket_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(ticket => ticket.status === statusFilter);
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter(ticket => ticket.type === typeFilter);
    }

    setFilteredTickets(filtered);
  };

  const openReplyDialog = async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setShowReplyDialog(true);

    // Fetch messages
    try {
      const { data, error } = await (supabase as any)
        .from('ticket_messages')
        .select(`
          id, 
          message, 
          sender_id, 
          is_read, 
          created_at,
          sender:profiles!ticket_messages_sender_id_fkey(full_name, avatar_url)
        `)
        .eq('ticket_id', ticket.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Mark user messages as read
      const unreadUserMessages = (data || []).filter((m: any) => m.sender_id !== user?.id && !m.is_read);
      if (unreadUserMessages.length > 0) {
        await (supabase as any)
          .from('ticket_messages')
          .update({ is_read: true })
          .in('id', unreadUserMessages.map((m: any) => m.id));
      }
    } catch (error: any) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendReply = async () => {
    if (!replyMessage.trim() || !selectedTicket || !user) return;

    setSending(true);

    try {
      // 1. Send message
      const { error: messageError } = await (supabase as any)
        .from('ticket_messages')
        .insert({
          ticket_id: selectedTicket.id,
          sender_id: user.id,
          message: replyMessage,
          is_internal: false
        });

      if (messageError) throw messageError;

      // 2. Update ticket status to awaiting_user
      const { error: updateError } = await (supabase as any)
        .from('support_tickets')
        .update({
          status: 'awaiting_user',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedTicket.id);

      if (updateError) throw updateError;

      // 3. Insert professional notification for the user
      await (supabase as any)
        .from('notifications')
        .insert({
          user_id: selectedTicket.user_id,
          title: "Official support update",
          message: `The Pravokha registry has issued a new response regarding "${selectedTicket.subject}".`,
          type: 'message',
          link: `/tickets/${selectedTicket.id}`,
          metadata: { ticket_id: selectedTicket.id, sender_name: "Support Admin" }
        });

      toast({
        title: "Communication logged",
        description: "Your official response has been dispatched to the user."
      });

      setReplyMessage("");
      setShowReplyDialog(false);
      fetchTickets();

    } catch (error: any) {
      console.error('Error sending reply:', error);
      toast({
        title: "Transmission error",
        description: "Failed to dispatch communication registry.",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const updateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      const { error } = await (supabase as any)
        .from('support_tickets')
        .update({ status: newStatus })
        .eq('id', ticketId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Ticket status updated to ${newStatus}`
      });

      fetchTickets();
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200 hover:text-yellow-900",
      under_review: "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 hover:text-blue-900",
      awaiting_user: "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200 hover:text-purple-900",
      resolved: "bg-green-100 text-green-800 border-green-200 hover:bg-green-200 hover:text-green-900",
      rejected: "bg-red-100 text-red-800 border-red-200 hover:bg-red-200 hover:text-red-900",
      closed: "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200 hover:text-gray-900"
    };

    const label = status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');

    return (
      <Badge variant="outline" className={cn("font-medium transition-colors shadow-none", colors[status])}>
        {label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      low: "bg-blue-50 text-blue-700 border-blue-100",
      medium: "bg-yellow-50 text-yellow-700 border-yellow-100",
      high: "bg-orange-50 text-orange-700 border-orange-100",
      urgent: "bg-red-50 text-red-700 border-red-100"
    };

    const p = priority?.toLowerCase() || "medium";
    const label = p.charAt(0).toUpperCase() + p.slice(1);

    return (
      <Badge variant="outline" className={cn("font-bold shadow-none", colors[p])}>
        {label}
      </Badge>
    );
  };

  if (loading && tickets.length === 0) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 flex flex-col gap-8 pb-10">
        <AdminHeaderSkeleton />
        <AdminKpiSkeleton />
        <AdminTableSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex flex-col">
      <div className="w-full mx-auto py-3 sm:py-6 lg:py-8 px-2 sm:px-4 lg:px-6 xl:px-8 flex-1 flex flex-col gap-4 sm:gap-6 lg:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col gap-6">
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
                <h1 className="text-xl sm:text-2xl font-bold flex items-center flex-wrap gap-3">
                  Support registry
                  <Badge variant="outline" className="text-[10px] font-bold tracking-tight bg-primary/5 rounded-lg border-primary/20 shrink-0">{tickets.length} Total</Badge>
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground mt-0.5">Manage user support requests and platform appeals</p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                className="flex-1 sm:flex-none h-10 rounded-xl border-border/40 bg-card/20 backdrop-blur-sm font-bold text-xs"
                disabled={loading}
                onClick={fetchTickets}
              >
                <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} /> Refresh
              </Button>
              <Button className="flex-1 sm:flex-none h-10 rounded-xl font-bold text-xs bg-primary hover:bg-primary/90 shadow-md shadow-primary/20">
                <Download className="mr-2 h-4 w-4" /> Export data
              </Button>
            </div>
          </div>
        </div>

        {/* High risk governance alert */}
        {tickets.some(t => t.suspended_seller) && (
          <Card className="border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/30 backdrop-blur-sm overflow-hidden relative group cursor-pointer hover:bg-rose-100/60 dark:hover:bg-rose-950/50 transition-colors" onClick={() => navigate("/admin/tickets/suspended")}>
            <div className="absolute inset-y-0 left-0 w-1.5 bg-rose-600 dark:bg-rose-500" />
            <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
                <div className="h-10 w-10 rounded-full bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                  <ShieldAlert className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-rose-900 dark:text-rose-200 flex items-center gap-2 flex-wrap">
                    High-risk governance queue
                    <Badge variant="destructive" className="h-5 animate-pulse text-[10px] sm:text-xs">Critical</Badge>
                  </h3>
                  <p className="text-xs text-rose-700 dark:text-rose-300 font-medium mt-1">
                    {tickets.filter(t => t.suspended_seller).length} active appeals from restricted entities require urgent compliance review.
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-rose-700 dark:text-rose-300 hover:text-rose-800 dark:hover:text-rose-200 hover:bg-rose-100/50 dark:hover:bg-rose-900/30 gap-2 font-bold transition-all shrink-0 w-full sm:w-auto">
                Manage appeals
                <ArrowLeft className="h-4 w-4 rotate-180" />
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Pending"
            value={tickets.filter(t => t.status === 'pending').length.toString()}
            icon={ShieldCheck}
            color="bg-blue-600"
            description="Awaiting initial triage"
          />
          <StatsCard
            title="Awaiting user"
            value={tickets.filter(t => t.status === 'awaiting_user').length.toString()}
            icon={AlertCircle}
            color="bg-amber-500"
            description="Response pending from user"
          />
          <StatsCard
            title="Reviewing"
            value={tickets.filter(t => t.status === 'under_review').length.toString()}
            icon={UsersIcon}
            color="bg-indigo-600"
            description="Active administrative review"
          />
          <StatsCard
            title="Resolved"
            value={tickets.filter(t => t.status === 'resolved').length.toString()}
            icon={UserCheck}
            color="bg-emerald-500"
            description="Successfully settled cases"
          />
        </div>

        <Card className="border-border/40 bg-card/40 backdrop-blur-xl transition-all duration-500 rounded-2xl shadow-none overflow-hidden mb-8">
          <CardHeader className="bg-muted/10 border-b border-border/40 p-4 sm:p-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-primary opacity-70" />
                <CardTitle className="text-sm font-medium">Ticket directory</CardTitle>
              </div>

              <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={placeholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-11 h-11 bg-card/20 border-border/40 focus:ring-primary/20 rounded-xl backdrop-blur-sm text-sm w-full"
                  />
                </div>
                <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="flex-1 sm:flex-none sm:w-[140px] md:w-[150px] h-11 rounded-xl border-border/40 bg-card/20 backdrop-blur-sm px-3 sm:px-4 text-sm font-medium">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/40 backdrop-blur-xl bg-card/95">
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="under_review">Under review</SelectItem>
                      <SelectItem value="awaiting_user">Awaiting user</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="flex-1 sm:flex-none sm:w-[140px] md:w-[150px] h-11 rounded-xl border-border/40 bg-card/20 backdrop-blur-sm px-3 sm:px-4 text-sm font-medium">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/40 backdrop-blur-xl bg-card/95">
                      <SelectItem value="all">All types</SelectItem>
                      <SelectItem value="suspension_appeal">Suspension appeal</SelectItem>
                      <SelectItem value="general_support">General support</SelectItem>
                      <SelectItem value="technical_issue">Technical issue</SelectItem>
                      <SelectItem value="billing">Billing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="bg-card/40 backdrop-blur-sm border border-border/40 rounded-2xl p-8">
                <AdminTableSkeleton />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {/* Mobile View: Cards */}
              <div className="grid grid-cols-1 gap-4 lg:hidden">
                {filteredTickets.length === 0 ? (
                  <div className="bg-card border rounded-2xl p-8 text-center text-muted-foreground italic">
                    No support tickets currently in registry
                  </div>
                ) : (
                  filteredTickets.map((ticket) => (
                    <Card key={ticket.id} className="border-primary/5 overflow-hidden relative group">
                      <div className="absolute top-0 left-0 w-1 h-full bg-primary/10 group-hover:bg-primary transition-colors" />
                      <CardContent className="p-4 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded tracking-tighter">
                                {ticket.ticket_number}
                              </span>
                              {getPriorityBadge(ticket.priority)}
                            </div>
                            <h3 className="font-bold text-sm text-foreground line-clamp-2">
                              {ticket.subject}
                            </h3>
                          </div>
                          <div className="shrink-0">
                            {getStatusBadge(ticket.status)}
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 bg-muted/30 rounded-xl border border-border/40">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap mb-1">
                              <p className="text-[11px] font-black text-foreground tracking-tight">
                                {ticket.user?.full_name || 'Legacy account'}
                              </p>
                              <Badge variant="outline" className="h-5 px-1 text-[9px] font-bold bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 tracking-tight rounded-sm">
                                Sid: {ticket.user_id.split('-')[0].toUpperCase()}
                              </Badge>
                              {ticket.user?.status === 'suspended' && (
                                <Badge variant="destructive" className="h-4 text-[8px] font-black px-1 rounded-sm animate-pulse">Risk</Badge>
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground/60 font-medium truncate tabular-nums">
                              {ticket.user?.email}
                            </p>
                          </div>
                          <span className="text-[10px] text-muted-foreground/60 font-medium whitespace-nowrap">
                            {new Date(ticket.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                          <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[9px] sm:text-[10px] border-none font-bold px-2 py-1 whitespace-nowrap">
                            {ticket.type.charAt(0).toUpperCase() + ticket.type.slice(1).replace(/_/g, ' ')}
                          </Badge>
                          <div className="flex gap-1.5 flex-wrap">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-9 w-9 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl border border-blue-100"
                              onClick={() => navigate(`/admin/tickets/${ticket.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-9 w-9 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-xl border border-purple-100"
                              onClick={() => openReplyDialog(ticket)}
                            >
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                            {ticket.status !== 'resolved' && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-9 w-9 text-green-600 hover:bg-green-50 rounded-xl border border-green-100"
                                onClick={() => updateTicketStatus(ticket.id, 'resolved')}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              {/* Desktop View: Table */}
              <div className="hidden lg:block">
                <Card className="overflow-hidden border-border/40 shadow-sm rounded-2xl">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow className="hover:bg-transparent border-b border-border/40">
                        <TableHead className="font-bold text-[11px] tracking-wider">Ticket #</TableHead>
                        <TableHead className="font-bold text-[11px] tracking-wider">User</TableHead>
                        <TableHead className="font-bold text-[11px] tracking-wider">Subject</TableHead>
                        <TableHead className="font-bold text-[11px] tracking-wider">Type</TableHead>
                        <TableHead className="font-bold text-[11px] tracking-wider">Priority</TableHead>
                        <TableHead className="font-bold text-[11px] tracking-wider">Status</TableHead>
                        <TableHead className="font-bold text-[11px] tracking-wider">Created</TableHead>
                        <TableHead className="font-bold text-[11px] tracking-wider text-right">Guidance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTickets.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-16 text-muted-foreground italic font-medium">
                            Registry clear: No tickets pending review
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredTickets.map((ticket) => (
                          <TableRow key={ticket.id} className="hover:bg-muted/20 transition-colors border-b border-border/20 last:border-0 group">
                            <TableCell className="font-mono text-[10px] text-muted-foreground/80 font-semibold group-hover:text-foreground transition-colors">
                              {ticket.ticket_number}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1.5 py-1">
                                <span className="font-black text-xs text-foreground tracking-tight">
                                  {ticket.user?.full_name || 'Legacy account'}
                                </span>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <Badge variant="outline" className="h-5 px-1.5 text-[9px] font-bold bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 tracking-tight rounded-sm whitespace-nowrap">
                                    Sid: {ticket.user_id.split('-')[0].toUpperCase()}
                                  </Badge>
                                  {ticket.user?.status === 'suspended' && (
                                    <Badge variant="destructive" className="h-4 text-[8px] font-black px-1 rounded-sm animate-pulse">Risk</Badge>
                                  )}
                                </div>
                                <span className="text-[10px] text-muted-foreground font-medium truncate">{ticket.user?.email}</span>
                              </div>
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              <span className="text-xs font-bold text-foreground/80">{ticket.subject}</span>
                            </TableCell>
                            <TableCell className="min-w-[140px] max-w-[180px]">
                              <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[9px] border-none font-bold px-2 py-1 whitespace-nowrap">
                                {ticket.type.charAt(0).toUpperCase() + ticket.type.slice(1).replace(/_/g, ' ')}
                              </Badge>
                            </TableCell>
                            <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                            <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                            <TableCell className="text-[10px] font-bold tabular-nums text-muted-foreground/80 whitespace-nowrap">
                              {new Date(ticket.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1.5 justify-end">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg border border-transparent hover:border-blue-100"
                                  onClick={() => navigate(`/admin/tickets/${ticket.id}`)}
                                  title="View details"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg border border-transparent hover:border-purple-100"
                                  onClick={() => openReplyDialog(ticket)}
                                  title="Reply"
                                >
                                  <MessageSquare className="h-4 w-4" />
                                </Button>
                                {ticket.status !== 'resolved' && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg border border-transparent hover:border-green-100"
                                    onClick={() => updateTicketStatus(ticket.id, 'resolved')}
                                    title="Mark resolved"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </Card>
              </div>
            </motion.div>
          )}
        </AnimatePresence >

        {/* Reply Dialog */}
        < Dialog open={showReplyDialog} onOpenChange={setShowReplyDialog} >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Reply to ticket #{selectedTicket?.ticket_number}</DialogTitle>
              <DialogDescription className="flex items-center gap-2">
                {selectedTicket?.subject}
                {selectedTicket?.user?.status === 'suspended' && (
                  <span className="text-rose-600 font-bold text-[10px] bg-rose-50 px-2 py-0.5 rounded border border-rose-200">Suspended account</span>
                )}
              </DialogDescription>
            </DialogHeader>

            {selectedTicket?.user?.status === 'suspended' && (
              <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl flex items-start gap-3 mb-4">
                <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-rose-800 tracking-wider">Governance alert: Restricted entity</p>
                  <p className="text-[11px] text-rose-700 leading-relaxed font-medium">
                    This user is currently <span className="font-black text-rose-900">suspended</span>. Proceed with caution. Verify identity and compliance requirements before resolving appeals or restoring access.
                  </p>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar bg-background/50">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground opacity-40">
                  <MessageSquare className="h-10 w-10 mb-2" />
                  <p className="text-sm font-medium">No previous exchange logged</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isCurrentUser = msg.sender_id === user?.id;
                  return (
                    <div key={msg.id} className={cn("flex gap-3", isCurrentUser ? "flex-row-reverse" : "flex-row")}>
                      <Avatar className="h-8 w-8 shrink-0 border-2 border-background shadow-sm">
                        {msg.sender?.avatar_url && (
                          <AvatarImage src={msg.sender.avatar_url} />
                        )}
                        <AvatarFallback className={cn("text-[10px] font-bold", isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted")}>
                          {msg.sender?.full_name?.[0] || (isCurrentUser ? 'A' : 'S')}
                        </AvatarFallback>
                      </Avatar>
                      <div className={cn("flex flex-col max-w-[80%]", isCurrentUser ? "items-end" : "items-start")}>
                        <div className={cn(
                          "p-3 rounded-2xl text-sm leading-relaxed shadow-sm",
                          isCurrentUser
                            ? "bg-primary text-primary-foreground rounded-tr-none"
                            : "bg-white dark:bg-muted border border-border/40 rounded-tl-none"
                        )}>
                          <p className="whitespace-pre-wrap text-foreground">{msg.message}</p>
                        </div>
                        <div className={cn("flex items-center gap-1.5 mt-1 px-1 opacity-80", isCurrentUser ? "flex-row-reverse" : "flex-row")}>
                          <span className="text-[9px] font-medium tabular-nums text-muted-foreground/60">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isCurrentUser && (
                            <div className="flex items-center -space-x-1.5 ml-1">
                              <Check className={cn("h-3 w-3", msg.is_read ? "text-sky-500" : "text-muted-foreground/40")} />
                              {msg.is_read && <Check className="h-3 w-3 text-sky-500 animate-in zoom-in duration-300" />}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="space-y-4">
              <Textarea
                placeholder="Type your reply..."
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                rows={4}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowReplyDialog(false)}>
                Cancel
              </Button>
              <Button onClick={sendReply} disabled={sending || !replyMessage.trim()}>
                {sending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Reply
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
