import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "@/infra/api/apiClient";
import { useAuth } from "@/core/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/Card";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { Textarea } from "@/ui/Textarea";
import { Label } from "@/ui/Label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/ui/Dialog";
import { toast } from "@/shared/hook/use-toast";
import { Send, MessageSquare, Plus } from "lucide-react";

interface Message {
    id: string;
    message: string;
    is_admin: boolean;
    created_at: string;
}

interface Conversation {
    id: string;
    subject: string;
    status: string;
    last_message_at: string;
    created_at: string;
}

export function SupportChatPage() {
    const { user } = useAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [newSubject, setNewSubject] = useState("");
    const [dialogOpen, setDialogOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (user) {
            fetchConversations();
        }
    }, [user]);

    const fetchConversations = async () => {
        try {
            const response = await apiClient.get('/support/conversations');
            // Map camelCase to snake_case
            const data = response.data.conversations.map((c: any) => ({
                ...c,
                last_message_at: c.lastMessageAt,
                created_at: c.createdAt
            }));
            setConversations(data || []);
        } catch (error: any) {
            toast({ title: "Error", description: "Failed to load conversations", variant: "destructive" });
        }
    };

    const fetchMessages = async (conversationId: string) => {
        try {
            const response = await apiClient.get(`/support/conversations/${conversationId}/messages`);
            const data = response.data.messages.map((m: any) => ({
                ...m,
                is_admin: m.isAdmin,
                created_at: m.createdAt
            }));
            setMessages(data || []);
            scrollToBottom();
        } catch (error: any) {
            toast({ title: "Error", description: "Failed to load messages", variant: "destructive" });
        }
    };

    useEffect(() => {
        if (!selectedConversation || !user) return;

        fetchMessages(selectedConversation);

        // Real-time sync removed during migration.
        // Consider polling or socket.io update.
    }, [selectedConversation, user]);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    const createConversation = async () => {
        if (!user || !newSubject.trim()) return;

        try {
            const response = await apiClient.post('/support/conversations', { subject: newSubject });
            const data = response.data.conversation;

            toast({ title: "Success", description: "Conversation created" });
            setDialogOpen(false);
            setNewSubject("");
            fetchConversations();
            setSelectedConversation(data.id);
        } catch (error: any) {
            toast({ title: "Error", description: "Failed to create conversation", variant: "destructive" });
        }
    };

    const sendMessage = async () => {
        if (!user || !selectedConversation || !newMessage.trim()) return;

        try {
            await apiClient.post(`/support/conversations/${selectedConversation}/messages`, {
                message: newMessage
            });
            setNewMessage("");
            fetchMessages(selectedConversation);
        } catch (error: any) {
            toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
        }
    };

    return (
        <div className="w-full max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold">Support Chat</h1>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            New Conversation
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Start New Conversation</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="subject">Subject</Label>
                                <Input
                                    id="subject"
                                    value={newSubject}
                                    onChange={(e) => setNewSubject(e.target.value)}
                                    placeholder="What do you need help with?"
                                />
                            </div>
                            <Button onClick={createConversation} className="w-full">Create</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Conversations</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
                        {conversations.map((conv) => (
                            <div
                                key={conv.id}
                                onClick={() => setSelectedConversation(conv.id)}
                                className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedConversation === conv.id ? "border-primary bg-primary/5" : "hover:border-primary/50"
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <p className="font-semibold text-sm">{conv.subject}</p>
                                    <span className={`text-xs px-2 py-1 rounded ${conv.status === "open" ? "bg-green-500/10 text-green-600" : "bg-gray-500/10 text-gray-600"
                                        }`}>
                                        {conv.status}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {new Date(conv.last_message_at).toLocaleDateString()}
                                </p>
                            </div>
                        ))}
                        {conversations.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                <p>No conversations yet</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Messages</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {selectedConversation ? (
                            <>
                                <div className="h-[400px] overflow-y-auto mb-4 space-y-3 p-4 border rounded-lg">
                                    {messages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={`flex ${msg.is_admin ? "justify-start" : "justify-end"}`}
                                        >
                                            <div
                                                className={`max-w-[70%] p-3 rounded-lg ${msg.is_admin
                                                    ? "bg-muted text-foreground"
                                                    : "bg-primary text-primary-foreground"
                                                    }`}
                                            >
                                                <p className="text-sm">{msg.message}</p>
                                                <p className="text-xs opacity-70 mt-1">
                                                    {new Date(msg.created_at).toLocaleTimeString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>
                                <div className="flex gap-2">
                                    <Textarea
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type your message..."
                                        rows={2}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && !e.shiftKey) {
                                                e.preventDefault();
                                                sendMessage();
                                            }
                                        }}
                                    />
                                    <Button onClick={sendMessage} size="icon" className="self-end">
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <div className="h-[500px] flex items-center justify-center text-muted-foreground">
                                Select a conversation to view messages
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default SupportChatPage;
