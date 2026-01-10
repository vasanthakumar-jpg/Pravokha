import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/Card";
import { Button } from "@/ui/Button";
import { Badge } from "@/ui/Badge";
import { Input } from "@/ui/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/Select";
import { apiClient } from "@/infra/api/apiClient";
import { useAuth } from "@/core/context/AuthContext";
import { toast } from "@/shared/hook/use-toast";
import { Loader2, Plus, Search, MessageSquare, Clock, CheckCircle, XCircle, Lock, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { TicketForm } from "@/shared/ui/TicketForm";

interface Ticket {
    id: string;
    ticket_number: string;
    subject: string;
    type: string;
    status: string;
    priority: string;
    created_at: string;
    updated_at: string;
}

export function SupportTicketsPage() {
    const { user, isSuspended } = useAuth();
    const navigate = useNavigate();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewTicket, setShowNewTicket] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    useEffect(() => {
        if (user) {
            fetchTickets();
        }
    }, [user]);

    useEffect(() => {
        filterTickets();
    }, [tickets, searchQuery, statusFilter]);

    const fetchTickets = async () => {
        if (!user) return;

        try {
            const response = await apiClient.get('/support/tickets');
            const data = response.data.tickets.map((t: any) => ({
                ...t,
                ticket_number: t.ticketNumber,
                created_at: t.createdAt,
                updated_at: t.updatedAt
            }));
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

        // Search filter
        if (searchQuery) {
            filtered = filtered.filter(ticket =>
                ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                ticket.ticket_number.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Status filter
        if (statusFilter !== "all") {
            filtered = filtered.filter(ticket => ticket.status === statusFilter);
        }

        setFilteredTickets(filtered);
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", icon: any }> = {
            pending: { variant: "secondary", icon: Clock },
            under_review: { variant: "default", icon: MessageSquare },
            awaiting_user: { variant: "outline", icon: MessageSquare },
            resolved: { variant: "default", icon: CheckCircle },
            rejected: { variant: "destructive", icon: XCircle },
            closed: { variant: "outline", icon: CheckCircle }
        };

        const config = variants[status] || variants.pending;
        const Icon = config.icon;

        return (
            <Badge variant={config.variant} className="gap-1 capitalize">
                <Icon className="h-3 w-3" />
                {status.replace('_', ' ')}
            </Badge>
        );
    };

    const getPriorityBadge = (priority: string) => {
        const colors: Record<string, string> = {
            low: "bg-blue-100 text-blue-800",
            medium: "bg-yellow-100 text-yellow-800",
            high: "bg-orange-100 text-orange-800",
            urgent: "bg-red-100 text-red-800"
        };

        return (
            <Badge variant="outline" className={cn("capitalize", colors[priority])}>
                {priority}
            </Badge>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (showNewTicket) {
        return (
            <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Button
                    variant="ghost"
                    onClick={() => setShowNewTicket(false)}
                    className="mb-4"
                >
                    ← Back to Tickets
                </Button>
                <TicketForm onSuccess={() => {
                    setShowNewTicket(false);
                    fetchTickets();
                }} />
            </div>
        );
    }

    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Support Tickets</h1>
                    <p className="text-sm text-muted-foreground font-medium flex items-center gap-2 mt-1">
                        <Shield className="h-3.5 w-3.5 text-primary" />
                        Identity & Governance Registry
                    </p>
                </div>
                <Button onClick={() => setShowNewTicket(true)} className={cn("w-full sm:w-auto font-bold h-11 px-6 rounded-xl shadow-sm hover:shadow-md transition-all active:scale-[0.98]", isSuspended ? "bg-amber-600 hover:bg-amber-700" : "")}>
                    <Plus className="mr-2 h-4 w-4" />
                    {isSuspended ? "Open Appeal / Case" : "New Ticket"}
                </Button>
            </div>

            {isSuspended && (
                <Card className="mb-8 border-primary/10 bg-primary/[0.03] overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                    <CardContent className="py-4 flex items-center gap-4 text-foreground">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <Shield className="h-5 w-5 shrink-0" />
                        </div>
                        <div className="text-sm font-medium">
                            <span className="font-bold text-primary mr-1">Governance Notice: Account Restricted.</span>
                            Your entity is under suspension registry. Access is limited to Appeals, Verification, Payouts, or Compliance protocols.
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Filters */}
            <Card className="mb-8 border-primary/5 bg-primary/[0.01]">
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative group">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Search ticket subject or number..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-11 h-11 bg-background rounded-xl border-primary/10 focus-visible:ring-primary/20 transition-all font-medium"
                            />
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full sm:w-[200px] h-11 rounded-xl border-primary/10 bg-background font-medium hover:bg-primary/[0.02] transition-colors focus:ring-primary/20">
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-primary/10 shadow-xl">
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="under_review">Under Review</SelectItem>
                                    <SelectItem value="awaiting_user">Awaiting Response</SelectItem>
                                    <SelectItem value="resolved">Resolved</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                    <SelectItem value="closed">Closed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tickets List */}
            {filteredTickets.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No tickets found</h3>
                        <p className="text-muted-foreground mb-4">
                            {searchQuery || statusFilter !== "all"
                                ? "Try adjusting your filters"
                                : "Start by creating your first support ticket"}
                        </p>
                        {!searchQuery && statusFilter === "all" && (
                            <Button onClick={() => setShowNewTicket(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Create Ticket
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {filteredTickets.map((ticket) => {
                        const isAppealType = ['suspension_appeal', 'account_verification', 'compliance_review', 'payout_issue'].includes(ticket.type);
                        const isLocked = isSuspended && !isAppealType;

                        return (
                            <Card
                                key={ticket.id}
                                className={cn(
                                    "cursor-pointer hover:shadow-lg transition-shadow relative overflow-hidden",
                                    isLocked && "opacity-80 bg-slate-50 border-slate-200 cursor-not-allowed"
                                )}
                                onClick={() => {
                                    if (isLocked) {
                                        toast({
                                            title: "Standard restricted",
                                            description: "Commerce support is disabled during suspension. You can only view these tickets.",
                                        });
                                    }
                                    navigate(`/tickets/${ticket.id}`);
                                }}
                            >
                                {isLocked && (
                                    <div className="absolute top-0 right-0 p-2">
                                        <div className="bg-slate-200 p-1 rounded-full" title="Locked during suspension">
                                            <Lock className="h-3 w-3 text-slate-500" />
                                        </div>
                                    </div>
                                )}
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <CardTitle className="text-lg">{ticket.subject}</CardTitle>
                                                {ticket.status === 'awaiting_user' && (
                                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[10px] font-black animate-pulse">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                        NEW REPLY
                                                    </span>
                                                )}
                                            </div>
                                            <CardDescription>
                                                Ticket #{ticket.ticket_number}
                                            </CardDescription>
                                        </div>
                                        <div className="flex flex-col gap-2 items-end">
                                            {getStatusBadge(ticket.status)}
                                            {getPriorityBadge(ticket.priority)}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                                        <div className="flex items-center gap-4">
                                            <span className="capitalize">{ticket.type.replace('_', ' ')}</span>
                                            <span>Created: {new Date(ticket.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <span>Updated: {new Date(ticket.updated_at).toLocaleDateString()}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default SupportTicketsPage;
