import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuthStore } from "../store/auth.store";
import { Send, Search, MessageSquare, ChevronLeft, MoreVertical, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Participant {
  id: string;
  name: string;
  avatar: string | null;
}

interface Conversation {
  participant: Participant;
  lastMessage: string;
  createdAt: string;
  listing?: { id: string; title: string };
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
  sender: Participant;
}

export default function Messages() {
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const contactId = searchParams.get("contact");

  const { data: conversations, isLoading: loadingConvs } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const res = await api.get("/messages/conversations");
      return res.data as Conversation[];
    },
    refetchInterval: 3000
  });

  // Auto-select participant from URL if specified
  useEffect(() => {
    if (contactId && conversations && !selectedParticipant) {
      const existingConv = conversations.find(c => c.participant.id === contactId);
      if (existingConv) {
        setSelectedParticipant(existingConv.participant);
      } else {
        // If not in conversations yet, fetch their basic info
        api.get(`/users/${contactId}`).then(res => {
          setSelectedParticipant({
            id: res.data.id,
            name: res.data.name,
            avatar: res.data.avatar
          });
        }).catch(() => {
          toast.error("User not found");
        });
      }
    }
  }, [contactId, conversations, selectedParticipant]);

  const { data: messages, isLoading: loadingMessages } = useQuery({
    queryKey: ["messages", selectedParticipant?.id],
    queryFn: async () => {
      if (!selectedParticipant) return [];
      const res = await api.get(`/messages/${selectedParticipant.id}`);
      return res.data as Message[];
    },
    enabled: !!selectedParticipant,
    refetchInterval: 3000 // Poll for new messages every 3 seconds
  });

  const clearMutation = useMutation({
    mutationFn: async () => {
      if (!selectedParticipant) return;
      await api.delete(`/messages/${selectedParticipant.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", selectedParticipant?.id] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      toast.success("Chat history cleared");
    },
    onError: () => {
      toast.error("Failed to clear chat");
    }
  });

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await api.post("/messages", {
        receiverId: selectedParticipant?.id,
        content
      });
      return res.data;
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ["messages", selectedParticipant?.id] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    }
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sendMutation.isPending) return;
    sendMutation.mutate(newMessage);
  };

  return (
    <div className="flex h-[calc(100vh-80px)] bg-white dark:bg-[#0F0F0F] overflow-hidden">
      {/* Sidebar - Conversations List */}
      <div className={`w-full md:w-[380px] flex-shrink-0 border-r border-[#EBEBEB] dark:border-[#2A2A2A] flex flex-col ${selectedParticipant ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 border-b border-[#EBEBEB] dark:border-[#2A2A2A]">
          <h1 className="text-2xl font-bold mb-4">Messages</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#717171]" />
            <input 
              type="text" 
              placeholder="Search messages"
              className="w-full pl-10 pr-4 py-2.5 bg-[#F7F7F7] dark:bg-[#1A1A1A] border-none rounded-full text-sm focus:ring-2 focus:ring-(--color-primary)"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingConvs ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 dark:bg-[#1A1A1A] animate-pulse rounded-xl" />)}
            </div>
          ) : conversations?.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-[#1A1A1A] rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-[#717171]" />
              </div>
              <h3 className="font-semibold">No messages yet</h3>
              <p className="text-sm text-[#717171] mt-1">When you contact a host or guest, your messages will appear here.</p>
            </div>
          ) : (
            conversations?.map((conv) => (
              <button
                key={conv.participant.id}
                onClick={() => setSelectedParticipant(conv.participant)}
                className={`w-full p-4 flex gap-4 hover:bg-[#F7F7F7] dark:hover:bg-[#1A1A1A] transition-colors text-left border-b border-[#F7F7F7] dark:border-[#1A1A1A] ${selectedParticipant?.id === conv.participant.id ? 'bg-[#F7F7F7] dark:bg-[#1A1A1A]' : ''}`}
              >
                <div className="relative flex-shrink-0">
                  {conv.participant.avatar ? (
                    <img src={conv.participant.avatar} className="w-12 h-12 rounded-full object-cover" alt="" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-(--color-primary) text-white flex items-center justify-center font-bold">
                      {conv.participant.name[0]}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold truncate">{conv.participant.name}</span>
                    <span className="text-[11px] text-[#717171]">
                      {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(conv.createdAt))}
                    </span>
                  </div>
                  <p className="text-sm text-[#717171] truncate">{conv.lastMessage}</p>
                  {conv.listing && (
                    <span className="text-[11px] text-(--color-primary) mt-1 block">Regarding: {conv.listing.title}</span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col bg-[#F7F7F7] dark:bg-[#0A0A0A] ${!selectedParticipant ? 'hidden md:flex' : 'flex'}`}>
        {selectedParticipant ? (
          <>
            {/* Chat Header */}
            <div className="h-20 bg-white dark:bg-[#1A1A1A] border-b border-[#EBEBEB] dark:border-[#2A2A2A] px-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => setSelectedParticipant(null)} className="md:hidden p-2 -ml-2">
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <div className="flex items-center gap-3">
                  {selectedParticipant.avatar ? (
                    <img src={selectedParticipant.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-(--color-primary) text-white flex items-center justify-center font-bold">
                      {selectedParticipant.name[0]}
                    </div>
                  )}
                  <div>
                    <h2 className="font-bold">{selectedParticipant.name}</h2>
                    <p className="text-[12px] text-emerald-500 font-medium">Online</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    if (confirm("Are you sure you want to clear this conversation?")) {
                      clearMutation.mutate();
                    }
                  }}
                  disabled={clearMutation.isPending}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-[#2A2A2A] rounded-full text-[#717171] transition-colors"
                  title="Clear history"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-[#2A2A2A] rounded-full">
                  <MoreVertical className="w-5 h-5 text-[#717171]" />
                </button>
              </div>
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loadingMessages ? (
                <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-(--color-primary) border-t-transparent rounded-full animate-spin" /></div>
              ) : (
                messages?.map((msg) => {
                  const isMe = msg.senderId === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] md:max-w-[70%] ${isMe ? 'order-1' : 'order-2'}`}>
                        <div className={`p-4 rounded-2xl shadow-sm ${isMe ? 'bg-(--color-primary) text-white rounded-tr-none' : 'bg-white dark:bg-[#1A1A1A] rounded-tl-none'}`}>
                          <p className="text-sm leading-relaxed">{msg.content}</p>
                        </div>
                        <span className={`text-[10px] text-[#717171] mt-1 block ${isMe ? 'text-right' : 'text-left'}`}>
                          {new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }).format(new Date(msg.createdAt))}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 bg-white dark:bg-[#1A1A1A] border-t border-[#EBEBEB] dark:border-[#2A2A2A]">
              <form onSubmit={handleSendMessage} className="flex gap-4">
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  autoFocus
                  className="flex-1 px-6 py-4 bg-[#F7F7F7] dark:bg-[#0A0A0A] border-none rounded-2xl text-sm focus:ring-2 focus:ring-(--color-primary)"
                />
                <button 
                  type="submit"
                  disabled={!newMessage.trim() || sendMutation.isPending}
                  className="w-14 h-14 bg-(--color-primary) text-white rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
                >
                  <Send className="w-6 h-6" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-24 h-24 bg-white dark:bg-[#1A1A1A] rounded-3xl shadow-xl flex items-center justify-center mb-8 rotate-3 hover:rotate-0 transition-transform">
              <MessageSquare className="w-12 h-12 text-(--color-primary)" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Select a conversation</h2>
            <p className="text-[#717171] max-w-sm">Choose a contact from the list on the left to start chatting with them.</p>
          </div>
        )}
      </div>
    </div>
  );
}
