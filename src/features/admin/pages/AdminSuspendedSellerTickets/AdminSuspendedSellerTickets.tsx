import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { Textarea } from "@/components/ui/Textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/contexts/AdminContext";
import { toast } from "@/hooks/use-toast";
import { AdminHeaderSkeleton, AdminTableSkeleton } from "@/features/admin/components/AdminSkeleton";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Search, MessageSquare, CheckCircle, XCircle, Eye, Send, ArrowLeft, AlertCircle, ShieldAlert, Check, Clock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";

interface Ticket {
    id: string;
    ticket_number: string;
    subject: string;
    type: string;
    status: string;
    priority: string;
    suspended_seller: boolean;
    is_high_priority: boolean;
    created_at: string;
    updated_at: string;
    user_id: string;
    user?: {
        full_name: string;
        email: string;
        status: string;
        id: string;
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

export default function AdminSuspendedSellerTickets() {
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
            const { data, error } = await (supabase as any)
                .from('support_tickets')
                .select(`
          *,
          user:profiles!support_tickets_user_id_fkey(id, full_name, email, status)
        `)
                .eq('suspended_seller', true)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setTickets(data || []);
        } catch (error: any) {
            console.error('Error fetching tickets:', error);
            toast({
                title: "Error",
                description: "Failed to load high-risk tickets",
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

            // Mark seller messages as read
            const unreadSellerMessages = (data || []).filter((m: any) => m.sender_id !== user?.id && !m.is_read);
            if (unreadSellerMessages.length > 0) {
                await (supabase as any)
                    .from('ticket_messages')
                    .update({ is_read: true })
                    .in('id', unreadSellerMessages.map((m: any) => m.id));
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
            const { data: messageData, error: messageError } = await (supabase as any)
                .from('ticket_messages')
                .insert({
                    ticket_id: selectedTicket.id,
                    sender_id: user.id,
                    message: replyMessage,
                    is_internal: false
                })
                .select()
                .single();

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

            // 3. Insert professional notification for the user (High Risk specific)
            await (supabase as any)
                .from('notifications')
                .insert({
                    user_id: selectedTicket.user_id,
                    title: "Action Required: Appeal Registry",
                    message: `Official guidance has been issued regarding your appeal "${selectedTicket.subject}". Please review immediately.`,
                    type: 'alert',
                    link: `/tickets/${selectedTicket.id}`,
                    metadata: { ticket_id: selectedTicket.id, sender_name: "Compliance Admin" }
                });

            toast({ title: "Guidance dispatched", description: "The compliance protocol has been registered." });
            setReplyMessage("");
            setShowReplyDialog(false);
            fetchTickets();
        } catch (error: any) {
            console.error('Error sending reply:', error);
            toast({ title: "Transmission failed", description: "Registry lock failed. Please retry.", variant: "destructive" });
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
            toast({ title: "Success", description: `Ticket status updated to ${newStatus}` });
            fetchTickets();
        } catch (error: any) {
            console.error('Error updating status:', error);
            toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
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
            <Badge variant="outline" className={cn("font-medium transition-colors shadow-none border-none", colors[status])}>
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
                <AdminTableSkeleton />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 flex flex-col gap-8 pb-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-baseline gap-4 mb-2">
                <div className="flex flex-col items-start gap-4 w-full">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 -ml-2 rounded-lg text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 font-semibold text-[11px] tracking-wider"
                        onClick={() => navigate("/admin/tickets")}
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Registry index
                    </Button>
                    <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                                Governance registry
                            </h1>
                            <Badge variant="destructive" className="h-5 px-1.5 text-[9px] font-black italic shadow-sm bg-rose-500 hover:bg-rose-600 border-none rounded">
                                High risk
                            </Badge>
                        </div>
                        <p className="text-[11px] sm:text-xs text-muted-foreground font-medium flex items-center gap-1.5 opacity-80 tracking-wide">
                            <ShieldAlert className="h-3.5 w-3.5 text-rose-500" />
                            Suspension appeals & compliance review telemetry
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-rose-500/[0.03] border-l-4 border-rose-500 p-4 sm:p-5 rounded-r-2xl flex items-start gap-4 transition-colors hover:bg-rose-500/[0.05]">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 shrink-0">
                    <ShieldAlert className="h-5 w-5" />
                </div>
                <div className="space-y-1.5">
                    <p className="text-[10px] font-black text-rose-600 tracking-[0.2em]">Restricted access protocol</p>
                    <p className="text-xs text-rose-700/80 leading-relaxed font-semibold max-w-2xl">
                        This workspace isolates entities under active suspension. Review process requires strict verification of identity and compliance documentation before any status delegation.
                    </p>
                </div>
            </div>

            {/* Filters */}
            <Card className="border-rose-100 bg-rose-50/5 shadow-sm rounded-2xl overflow-hidden">
                <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative group">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-rose-500 transition-colors" />
                            <Input
                                placeholder="Search risk registry subject, user or number..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-11 h-11 bg-background rounded-xl border-rose-100 focus-visible:ring-rose-200 transition-all font-medium text-sm"
                            />
                        </div>
                        <div className="grid grid-cols-2 md:flex gap-3">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="h-11 rounded-xl border-rose-100 bg-background font-semibold text-xs hover:bg-rose-50 transition-colors focus:ring-rose-200 min-w-[140px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-rose-100 shadow-xl">
                                    <SelectItem value="all">All statuses</SelectItem>
                                    <SelectItem value="under_review">Under review</SelectItem>
                                    <SelectItem value="awaiting_user">Awaiting user</SelectItem>
                                    <SelectItem value="resolved">Resolved</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger className="h-11 rounded-xl border-rose-100 bg-background font-semibold text-xs hover:bg-rose-50 transition-colors focus:ring-rose-200 min-w-[140px]">
                                    <SelectValue placeholder="Type" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-rose-100 shadow-xl">
                                    <SelectItem value="all">All types</SelectItem>
                                    <SelectItem value="suspension_appeal">Suspension appeal</SelectItem>
                                    <SelectItem value="account_verification">Account verification</SelectItem>
                                    <SelectItem value="compliance_review">Compliance review</SelectItem>
                                    <SelectItem value="payout_issue">Payout issue</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Mobile View: Cards */}
            <div className="grid grid-cols-1 gap-4 lg:hidden">
                {filteredTickets.length === 0 ? (
                    <div className="bg-card border rounded-2xl p-8 text-center text-muted-foreground italic">
                        No high-risk tickets currently in queue
                    </div>
                ) : (
                    filteredTickets.map((ticket) => (
                        <Card key={ticket.id} className="border-rose-100/50 overflow-hidden relative group">
                            <div className="absolute top-0 left-0 w-1 h-full bg-rose-500/20 group-hover:bg-rose-500 transition-colors" />
                            <CardContent className="p-4 space-y-4">
                                <div className="flex justify-between items-start gap-2">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded tracking-tighter">
                                                {ticket.ticket_number}
                                            </span>
                                            {getPriorityBadge(ticket.priority)}
                                        </div>
                                        <h3 className="font-bold text-sm text-foreground truncate">
                                            {ticket.subject}
                                        </h3>
                                    </div>
                                    {getStatusBadge(ticket.status)}
                                </div>

                                <div className="flex items-start gap-4 p-4 bg-muted/20 rounded-2xl border border-border/40">
                                    <div className="h-10 w-10 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0 border border-rose-500/20">
                                        <ShieldAlert className="h-5 w-5 text-rose-600" />
                                    </div>
                                    <div className="min-w-0 flex-1 space-y-1.5">
                                        <p className="text-xs font-black text-rose-700 leading-none">
                                            <span className="lowercase first-letter:uppercase">
                                                {ticket.user?.full_name || 'Legacy account'}
                                            </span>
                                        </p>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Badge variant="outline" className="h-5 px-2 text-[10px] font-bold bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 tracking-tight rounded-md shadow-sm">
                                                Sid: {ticket.user_id.split('-')[0].toUpperCase()}
                                            </Badge>
                                            <span className="text-[10px] text-muted-foreground/60 font-medium tabular-nums">
                                                {new Date(ticket.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between gap-2 pt-1">
                                    <Badge variant="secondary" className="bg-slate-100 text-slate-800 text-[9px] border-none font-bold px-2">
                                        {ticket.type.replace('_', ' ').charAt(0).toUpperCase() + ticket.type.replace('_', ' ').slice(1)}
                                    </Badge>
                                    <div className="flex gap-1.5">
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
                                                className="h-9 w-9 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-xl border border-green-100"
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
                                <TableHead className="w-[120px] font-bold text-[11px] tracking-wider">Ticket #</TableHead>
                                <TableHead className="font-bold text-[11px] tracking-wider">Seller identity</TableHead>
                                <TableHead className="font-bold text-[11px] tracking-wider">Classification</TableHead>
                                <TableHead className="font-bold text-[11px] tracking-wider text-center">Protocol</TableHead>
                                <TableHead className="font-bold text-[11px] tracking-wider">Submission</TableHead>
                                <TableHead className="text-right font-bold text-[11px] tracking-wider">Guidance</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredTickets.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-16 text-muted-foreground italic font-medium">
                                        Registry clear: No high-risk entities pending review
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredTickets.map((ticket) => (
                                    <TableRow key={ticket.id} className="hover:bg-muted/20 transition-colors border-b border-border/20 last:border-0 group">
                                        <TableCell className="font-mono text-[10px] text-muted-foreground/80 font-semibold group-hover:text-foreground transition-colors">
                                            #{ticket.ticket_number}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1 py-1">
                                                <span className="font-black text-xs text-foreground tracking-tight flex items-center gap-2">
                                                    <span className="lowercase first-letter:uppercase">{ticket.user?.full_name || 'Legacy account'}</span>
                                                    <Badge variant="outline" className="h-5 px-2 text-[10px] font-bold bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 tracking-tight rounded-md shadow-sm">
                                                        Sid: {ticket.user_id.split('-')[0].toUpperCase()}
                                                    </Badge>
                                                </span>
                                                <span className="text-[10px] text-muted-foreground font-medium">{ticket.user?.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1.5">
                                                <Badge variant="secondary" className="w-fit bg-slate-100 text-slate-800 text-[9px] border-none font-black px-1.5 h-5">
                                                    {ticket.type.replace('_', ' ').charAt(0).toUpperCase() + ticket.type.replace('_', ' ').slice(1)}
                                                </Badge>
                                                <span className="text-[10px] font-bold italic text-muted-foreground/60 truncate max-w-[200px]">
                                                    {ticket.subject}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col items-center gap-1.5">
                                                {getPriorityBadge(ticket.priority)}
                                                {getStatusBadge(ticket.status)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-[10px] font-bold tabular-nums text-muted-foreground/80">
                                            {new Date(ticket.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex gap-1.5 justify-end">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg border border-transparent hover:border-blue-100"
                                                    onClick={() => navigate(`/admin/tickets/${ticket.id}`)}
                                                    title="View Detail"
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
                                                        title="Mark Resolved"
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

            {/* Minimal Reply Dialog */}
            <Dialog open={showReplyDialog} onOpenChange={setShowReplyDialog}>
                <DialogContent className="max-w-2xl bg-card p-0 sm:p-0 overflow-hidden rounded-none sm:rounded-2xl h-[100dvh] sm:h-auto sm:max-h-[90vh] flex flex-col">
                    <DialogHeader className="p-4 sm:p-6 border-b bg-muted/30">
                        <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                <MessageSquare className="h-5 w-5" />
                            </div>
                            Direct response to suspended seller
                        </DialogTitle>
                        <DialogDescription className="text-[10px] sm:text-xs">
                            Registry #{selectedTicket?.ticket_number} — <span className="font-bold underline decoration-primary/30 decoration-2">{selectedTicket?.subject}</span>
                        </DialogDescription>
                    </DialogHeader>

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
                                                <p className="whitespace-pre-wrap">{msg.message}</p>
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

                    <div className="p-4 sm:p-6 border-t bg-muted/10 space-y-4">
                        <div className="relative group">
                            <Textarea
                                placeholder="Provide clear, legally binding guidance..."
                                value={replyMessage}
                                onChange={(e) => setReplyMessage(e.target.value)}
                                rows={3}
                                className="resize-none focus-visible:ring-primary/20 border-border/40 rounded-xl text-sm sm:text-base pr-12 min-h-[100px] sm:min-h-0"
                            />
                            <Button
                                size="icon"
                                className="absolute bottom-3 right-3 h-8 w-8 rounded-lg shadow-lg"
                                onClick={sendReply}
                                disabled={sending || !replyMessage.trim()}
                            >
                                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            </Button>
                        </div>
                        <div className="p-4 bg-slate-900/5 dark:bg-white/5 border border-primary/10 rounded-2xl flex items-start gap-3 transition-all hover:bg-slate-900/10 dark:hover:bg-white/10 group">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                                <ShieldAlert className="h-4 w-4" />
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-[10px] text-primary font-black tracking-[0.2em]">Compliance protocol</p>
                                <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">Responses to suspended entities are legally sensitive. Confirm secondary verification before promising manual restoration.</p>
                            </div>
                        </div>
                        <div className="flex sm:hidden justify-end">
                            <Button variant="ghost" className="h-9 rounded-xl text-xs font-bold" onClick={() => setShowReplyDialog(false)}>Dismiss</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
