import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/infra/api/supabase";
import { useAdmin } from "@/core/context/AdminContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/Card";
import { Button } from "@/ui/Button";
import { Textarea } from "@/ui/Textarea";
import { Badge } from "@/ui/Badge";
import { toast } from "@/shared/hook/use-toast";

import { Send, ArrowLeft } from "lucide-react";
import { AdminHeaderSkeleton, AdminSupportSkeleton } from "@/feat/admin/components/AdminSkeleton";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  message: string;
  is_admin: boolean;
  created_at: string;
  user_id: string;
}

interface Conversation {
  id: string;
  subject: string;
  status: string;
  last_message_at: string;
  created_at: string;
  user_id: string;
}

export default function AdminSupport() {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate("/");
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchConversations();
    }
  }, [isAdmin]);

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from("support_conversations")
        .select("*")
        .order("last_message_at", { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    const { data, error } = await supabase
      .from("support_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      toast({ title: "Error", description: "Failed to load messages", variant: "destructive" });
      return;
    }
    setMessages(data || []);
    scrollToBottom();
  };

  useEffect(() => {
    if (!selectedConversation) return;

    fetchMessages(selectedConversation);

    const channel = supabase
      .channel(`admin-support:${selectedConversation}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_messages",
          filter: `conversation_id=eq.${selectedConversation}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const sendMessage = async () => {
    if (!selectedConversation || !newMessage.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const selectedConv = conversations.find(c => c.id === selectedConversation);
    if (!selectedConv) return;

    const { error } = await supabase
      .from("support_messages")
      .insert([{
        conversation_id: selectedConversation,
        user_id: selectedConv.user_id,
        message: newMessage,
        is_admin: true,
      }]);

    if (error) {
      toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
      return;
    }

    await supabase
      .from("support_conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", selectedConversation);

    setNewMessage("");
  };

  const toggleStatus = async (conversationId: string, currentStatus: string) => {
    const newStatus = currentStatus === "open" ? "closed" : "open";
    const { error } = await supabase
      .from("support_conversations")
      .update({ status: newStatus })
      .eq("id", conversationId);

    if (error) {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
      return;
    }

    toast({ title: "Success", description: `Conversation ${newStatus}` });
    fetchConversations();
  };

  if (adminLoading || (loading && conversations.length === 0)) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 flex flex-col gap-8 pb-10">
        <AdminHeaderSkeleton />
        <AdminSupportSkeleton />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 flex flex-col gap-8 pb-10">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-xl border-border/60 bg-card gap-2 font-medium text-xs w-full sm:w-auto justify-start shadow-sm"
              onClick={() => navigate("/admin")}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Support Management</h1>
              <p className="text-xs sm:text-base text-muted-foreground mt-1">Real-time support conversations</p>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <AdminSupportSkeleton />
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid lg:grid-cols-3 gap-6"
          >
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
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-sm">{conv.subject}</p>
                      <Badge variant={conv.status === "open" ? "default" : "secondary"}>
                        {conv.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(conv.last_message_at).toLocaleDateString()}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full mt-2 rounded-xl"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStatus(conv.id, conv.status);
                      }}
                    >
                      {conv.status === "open" ? "Close" : "Reopen"}
                    </Button>
                  </div>
                ))}
                {conversations.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl bg-muted/10">
                    No active conversations
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
                    <div className="h-[400px] overflow-y-auto mb-4 space-y-3 p-4 border rounded-2xl">
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.is_admin ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[70%] p-3 rounded-2xl ${msg.is_admin
                              ? "bg-primary text-primary-foreground rounded-tr-none shadow-lg shadow-primary/10"
                              : "bg-muted text-foreground rounded-tl-none border-border/50"
                              }`}
                          >
                            <p className="text-sm">{msg.message}</p>
                            <p className="text-[10px] opacity-70 mt-1">
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
                        placeholder="Type your response..."
                        rows={2}
                        className="rounded-2xl resize-none focus:ring-primary/20"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                          }
                        }}
                      />
                      <Button onClick={sendMessage} size="icon" className="self-end rounded-xl h-12 w-12 shadow-lg shadow-primary/20">
                        <Send className="h-5 w-5" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="h-[500px] flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-2xl bg-muted/5 gap-4">
                    <div className="p-4 rounded-full bg-muted/20">
                      <Send className="h-8 w-8 opacity-20" />
                    </div>
                    <p className="font-medium">Select a conversation to view messages</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
