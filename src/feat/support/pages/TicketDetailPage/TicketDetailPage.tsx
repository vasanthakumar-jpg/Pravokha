import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/Card";
import { Button } from "@/ui/Button";
import { Badge } from "@/ui/Badge";
import { Textarea } from "@/ui/Textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/Avatar";
import { apiClient } from "@/infra/api/apiClient";
import { useAuth } from "@/core/context/AuthContext";
import { toast } from "@/shared/hook/use-toast";
import { cn } from "@/lib/utils";
import { Loader2, Send, ArrowLeft, Clock, Shield, Paperclip, Lock, ShieldAlert, MessageSquare, Check, AlertCircle } from "lucide-react";

interface Ticket {
    id: string;
    ticket_number: string;
    subject: string;
    description: string;
    type: string;
    status: string;
    priority: string;
    evidence_urls: string[] | null;
    created_at: string;
    updated_at: string;
    user_id: string;
}

interface Message {
    id: string;
    sender_id: string;
    message: string;
    is_internal: boolean;
    is_read: boolean;
    attachments: string[] | null;
    created_at: string;
    sender?: {
        full_name: string;
        role: string;
        avatar_url: string | null;
    };
}

export function TicketDetailPage() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const isSuspended = user?.status === 'suspended';
    const navigate = useNavigate();

    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [newMessage, setNewMessage] = useState("");

    const [isAdmin, setIsAdmin] = useState(false);
    const [ticketUser, setTicketUser] = useState<any>(null);
    const hasSuspendedMessage = useMemo(() => {
        return messages.some(m => m.message.includes("⚠️ [Message Suspended]") || (m as any).status === 'suspended');
    }, [messages]);

    useEffect(() => {
        if (messages.length > 0 && user) {
            const unreadAdminMessages = messages.filter(m => m.sender_id !== user.id && !m.is_read);
            if (unreadAdminMessages.length > 0) {
                // In the Node backend, marks are handled within fetchMessages mostly, 
                // but we can still have a manual trigger if needed.
                // For now, getTicketMessages already marks them.
            }
        }
    }, [messages, user]);

    const markMessagesAsRead = async (messageIds: string[]) => {
        // Handled by the backend in getTicketMessages
    };

    useEffect(() => {
        if (id && user) {
            checkAdminStatus();
            fetchTicketDetails();
            fetchMessages();

            // Real-time sync removed during backend migration.
            // Consider implementing polling or WebSockets in the future.
        }
    }, [id, user]);

    const checkAdminStatus = async () => {
        // Trust the user role from AuthContext/User object
        setIsAdmin(user?.role === 'ADMIN');
    };

    const fetchTicketDetails = async () => {
        if (!id) return;

        try {
            const response = await apiClient.get(`/support/tickets/${id}`);
            const data = response.data.ticket;

            // Map fields
            const mappedTicket = {
                ...data,
                ticket_number: data.ticketNumber,
                evidence_urls: data.evidenceUrls,
                created_at: data.createdAt,
                updated_at: data.updatedAt,
                user_id: data.userId
            };

            setTicket(mappedTicket);

            if (mappedTicket.user_id) {
                // Fetch user info for admin view if needed
                const userResponse = await apiClient.get(`/users/${mappedTicket.user_id}`);
                setTicketUser(userResponse.data.profile);
            }
        } catch (error: any) {
            console.error('Error fetching ticket:', error);
            if (error.response?.status === 404 || error.response?.status === 403) {
                toast({
                    title: "Access Denied",
                    description: "You don't have permission to view this ticket",
                    variant: "destructive"
                });
                navigate('/tickets');
                return;
            }
            toast({
                title: "Error",
                description: "Failed to load ticket details",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async () => {
        if (!id) return;

        try {
            const response = await apiClient.get(`/support/tickets/${id}/messages`);
            const data = response.data.messages.map((m: any) => ({
                ...m,
                sender_id: m.senderId,
                is_internal: m.isInternal,
                is_read: m.isRead,
                created_at: m.createdAt,
                sender: m.sender ? {
                    full_name: m.sender.name,
                    avatar_url: m.sender.avatarUrl,
                    role: m.sender.role
                } : undefined
            }));
            setMessages(data || []);
        } catch (error: any) {
            console.error('Error fetching messages:', error);
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !id || !user || !ticket) return;

        setSending(true);

        try {
            await apiClient.post(`/support/tickets/${id}/reply`, {
                message: newMessage,
                isInternal: false
            });

            setNewMessage("");
            fetchMessages();
            fetchTicketDetails();

            toast({
                title: "Message Dispatched",
                description: "Your communication has been securely logged."
            });
        } catch (error: any) {
            console.error('Error sending message:', error);
            toast({
                title: "Transmission Failed",
                description: "Critical error during message dispatch. Please retry.",
                variant: "destructive"
            });
        } finally {
            setSending(false);
        }
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
            under_review: "bg-blue-100 text-blue-800 border-blue-200",
            awaiting_user: "bg-purple-100 text-purple-800 border-purple-200",
            resolved: "bg-green-100 text-green-800 border-green-200",
            rejected: "bg-red-100 text-red-800 border-red-200",
            closed: "bg-gray-100 text-gray-800 border-gray-200"
        };
        return colors[status] || "bg-yellow-100 text-yellow-800 border-yellow-200";
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!ticket) {
        return (
            <div className="w-full px-4 sm:px-6 lg:px-8 py-16 text-center">
                <h2 className="text-2xl font-bold mb-4">Ticket not found</h2>
                <Button onClick={() => navigate(isAdmin ? '/admin/tickets' : '/tickets')}>
                    Back to Tickets
                </Button>
            </div>
        );
    }

    const isAppealType = ['suspension_appeal', 'account_verification', 'compliance_review', 'payout_issue'].includes(ticket.type);

    return (
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(isAdmin ? '/admin/tickets' : '/tickets')}
                className="mb-2 sm:mb-4 h-8 sm:h-9 text-xs sm:text-sm group hover:bg-primary/5"
            >
                <ArrowLeft className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform group-hover:-translate-x-1" />
                Back to {isAdmin ? 'Admin Dashboard' : 'My Tickets'}
            </Button>

            {isSuspended && !isAppealType && (
                <Card className="mb-6 border-slate-200 bg-slate-50">
                    <CardContent className="py-4 flex items-center gap-3 text-slate-600">
                        <Lock className="h-5 w-5 text-slate-400 shrink-0" />
                        <div className="text-sm">
                            <span className="font-bold">Security Isolation:</span> This ticket is related to standard marketplace operations and is read-only while your account is suspended.
                        </div>
                    </CardContent>
                </Card>
            )}

            {hasSuspendedMessage && !isAdmin && (
                <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 shadow-sm animate-in fade-in slide-in-from-top-2 duration-500">
                    <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                        <p className="text-sm font-bold text-amber-900">Information Privacy Guard</p>
                        <p className="text-xs text-amber-700 leading-relaxed font-medium">
                            A message from our support team was flagged for sensitive content and is currently hidden.
                            If this message is critical to your request, please contact platform operations.
                        </p>
                    </div>
                </div>
            )}

            {isAdmin && ticketUser && (
                <div className="mb-6 bg-primary/[0.03] border border-primary/10 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-primary/20">
                            {ticketUser.avatar_url && (
                                <AvatarImage src={ticketUser.avatar_url} alt={ticketUser.full_name} className="object-cover" />
                            )}
                            <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs sm:text-sm">
                                {ticketUser.full_name?.[0] || 'U'}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="text-xs sm:text-sm font-bold flex flex-wrap items-center gap-1.5 sm:gap-2">
                                {ticketUser.full_name}
                                {ticketUser.status === 'suspended' && (
                                    <Badge variant="destructive" className="h-4 sm:h-5 text-[8px] sm:text-[9px] font-bold capitalize px-1.5 sm:px-2 animate-pulse">Restricted</Badge>
                                )}
                            </div>
                            <p className="text-[10px] sm:text-xs text-muted-foreground truncate max-w-[140px] sm:max-w-none">{ticketUser.email}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                        <Badge variant="outline" className="bg-background font-bold text-[10px] sm:text-[11px] capitalize tracking-wider px-2 sm:px-2.5 h-5.5 sm:h-6 shrink-0 border-primary/20">
                            ID: {ticketUser.id.split('-')[0]}
                        </Badge>
                        <Button size="sm" variant="outline" className="h-7 sm:h-8 text-[10px] sm:text-xs font-bold px-2 sm:px-3" onClick={() => navigate(`/admin/users?email=${ticketUser.email}`)}>
                            View Dossier
                        </Button>
                    </div>
                </div>
            )}

            <Card className="mb-6 overflow-hidden">
                <CardHeader className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4">
                        <div className="space-y-1.5 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <CardTitle className="text-base sm:text-lg lg:text-xl font-bold break-words">{ticket.subject}</CardTitle>
                                <Badge variant="outline" className={cn("font-bold text-[10px] sm:text-[11px] h-6 shrink-0 border-none transition-all shadow-sm", getStatusColor(ticket.status))}>
                                    {ticket.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                </Badge>
                            </div>
                            <CardDescription className="text-xs sm:text-sm">
                                Ticket #{ticket.ticket_number} • <span className="capitalize">{ticket.type.replace('_', ' ')}</span>
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground bg-muted/30 sm:bg-transparent px-2 sm:px-0 py-1 sm:py-0 rounded-md sm:rounded-none shrink-0 self-end sm:self-start">
                            <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                            {new Date(ticket.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-xs sm:text-sm font-bold mb-1.5 sm:mb-2 flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-primary" />
                                Description:
                            </h3>
                            <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed text-muted-foreground">{ticket.description}</p>
                        </div>

                        {ticket.evidence_urls && ticket.evidence_urls.length > 0 && (
                            <div className="pt-2">
                                <h3 className="text-xs sm:text-sm font-bold mb-2 flex items-center gap-2">
                                    <Paperclip className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    Evidence Attached:
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {ticket.evidence_urls.map((url, index) => (
                                        <a
                                            key={index}
                                            href={url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/5 text-primary border border-primary/10 rounded-full hover:bg-primary/10 transition-colors text-[10px] sm:text-xs font-medium"
                                        >
                                            Attachment {index + 1}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Conversation</CardTitle>
                    <CardDescription>
                        {messages.length === 0 ? "No messages yet" : `${messages.length} ${messages.length === 1 ? 'message' : 'messages'}`}
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                    <div className="space-y-6 sm:space-y-4">
                        {messages.map((message) => {
                            const isCurrentUser = message.sender_id === user?.id;

                            return (
                                <div
                                    key={message.id}
                                    className={`flex gap-2 sm:gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}
                                >
                                    <Avatar className="h-8 w-8 sm:h-10 sm:w-10 shrink-0 border-2 border-background shadow-sm hover:scale-105 transition-transform duration-300">
                                        {message.sender?.avatar_url && (
                                            <AvatarImage src={message.sender.avatar_url} alt={message.sender.full_name} className="object-cover" />
                                        )}
                                        <AvatarFallback className={cn(
                                            "text-[10px] sm:text-xs font-bold transition-colors",
                                            isCurrentUser ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                                        )}>
                                            {message.sender?.full_name?.[0] || (isCurrentUser ? 'Y' : 'S')}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div className={`flex-1 ${isCurrentUser ? 'items-end' : 'items-start'} flex flex-col min-w-0 group`}>
                                        <div className={cn(
                                            "max-w-[85%] sm:max-w-[80%] rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 transition-all duration-300",
                                            isCurrentUser
                                                ? 'bg-primary text-primary-foreground rounded-tr-none shadow-sm shadow-primary/20 hover:shadow-md'
                                                : 'bg-muted/50 dark:bg-muted/20 rounded-tl-none border border-muted-foreground/5 hover:bg-muted/70'
                                        )}>
                                            <p className="text-[11px] sm:text-xs font-bold mb-0.5 sm:mb-1 opacity-70 capitalize tracking-tight flex items-center gap-1.5">
                                                {isCurrentUser ? 'You' : (message.sender?.full_name || 'Support Team')}
                                                {!isCurrentUser && <Shield className="h-3 w-3 opacity-50 text-primary" />}
                                            </p>
                                            <p className="text-sm sm:text-sm whitespace-pre-wrap leading-relaxed">{message.message}</p>
                                        </div>
                                        <div className={cn(
                                            "flex items-center gap-2 mt-1 px-1.5 transition-opacity opacity-60 group-hover:opacity-100",
                                            isCurrentUser ? "flex-row-reverse" : ""
                                        )}>
                                            <span className="text-[10px] sm:text-[11px] font-medium text-muted-foreground/60 tabular-nums">
                                                {new Date(message.created_at).toLocaleString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {isCurrentUser && (
                                                <div className="flex items-center -space-x-1.5 ml-1">
                                                    <Check className={cn("h-3.5 w-3.5", message.is_read ? "text-sky-500" : "text-muted-foreground/40")} />
                                                    {message.is_read && <Check className="h-3.5 w-3.5 text-sky-500 animate-in zoom-in duration-300" />}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {ticket.status !== 'closed' && ticket.status !== 'resolved' && (
                <>
                    {isSuspended && !isAppealType ? (
                        <Card className="border-primary/10 bg-primary/5">
                            <CardContent className="py-10 text-center text-primary/80 flex flex-col items-center gap-4">
                                <div className="p-3 rounded-full bg-primary/10">
                                    <ShieldAlert className="h-8 w-8 text-primary" />
                                </div>
                                <div className="space-y-1">
                                    <p className="font-bold uppercase tracking-widest text-[10px]">Registry Restriction</p>
                                    <p className="text-sm font-medium">Replies are restricted for this category during account suspension protocol.</p>
                                </div>
                                <Button variant="outline" onClick={() => navigate('/tickets')} size="sm" className="rounded-xl border-primary/20 hover:bg-primary/10">
                                    View Governance Appeals
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="border-primary/10 shadow-lg shadow-primary/5">
                            <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3">
                                <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4 text-primary" />
                                    Reply to Ticket
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                                <div className="space-y-4">
                                    <Textarea
                                        placeholder="Type your message..."
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        rows={4}
                                        className="resize-none text-xs sm:text-sm focus-visible:ring-primary/20 transition-all rounded-xl"
                                    />
                                    <div className="flex justify-end">
                                        <Button
                                            onClick={sendMessage}
                                            disabled={sending || !newMessage.trim()}
                                            className="w-full sm:w-auto font-bold h-9 sm:h-10 px-6 rounded-xl hover:shadow-md transition-all active:scale-[0.98]"
                                        >
                                            {sending ? (
                                                <>
                                                    <Loader2 className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                                                    Sending...
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                                    Send Message
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}

            {(ticket.status === 'closed' || ticket.status === 'resolved') && (
                <Card>
                    <CardContent className="pt-6 text-center text-muted-foreground">
                        This ticket has been {ticket.status}. No further replies are allowed.
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

export default TicketDetailPage;
