import { useMemo, useState, useEffect, useRef } from "react";
import type { FormEvent } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Home, MessageCircle, Send, User } from "lucide-react";
import { api } from "../lib/api";
import { useAuthStore } from "../store/auth.store";

interface Participant {
  id: string;
  name: string;
  avatar: string | null;
}

interface Conversation {
  participant: Participant;
  lastMessage: string;
  createdAt: string;
  listing: {
    id: string;
    title: string;
  } | null;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
  sender: Participant;
  receiver: Participant;
}

export default function Messages() {
  const { id: participantId } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [content, setContent] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const inDashboard = location.pathname.startsWith("/dashboard");
  const messagesBasePath = inDashboard ? "/dashboard/messages" : "/messages";

  // Fetch all conversations
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery<Conversation[]>({
    queryKey: ["conversations"],
    queryFn: async () => {
      const response = await api.get("/messages/conversations");
      return response.data;
    },
    enabled: !!user,
  });

  // Fetch messages with selected participant
  const { data: messages = [], isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ["messages", participantId],
    queryFn: async () => {
      const response = await api.get(`/messages/${participantId}`);
      return response.data;
    },
    enabled: !!user && !!participantId,
  });

  const sendMutation = useMutation({
    mutationFn: async (text: string) => {
      const response = await api.post("/messages", {
        receiverId: participantId,
        content: text
      });
      return response.data;
    },
    onSuccess: () => {
      setContent("");
      queryClient.invalidateQueries({ queryKey: ["messages", participantId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!content.trim() || !participantId) return;
    sendMutation.mutate(content.trim());
  };

  const selectedConversation = conversations.find(c => c.participant.id === participantId);

  if (!user) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-7 text-center dark:border-white/[0.08] dark:bg-[#111827]">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-(--color-primary)/10 text-(--color-primary)">
            <MessageCircle className="h-5 w-5" />
          </div>
          <h1 className="mt-5 text-lg font-semibold text-gray-950 dark:text-white">
            Sign in to view messages
          </h1>
          <p className="mt-2 text-[14px] leading-6 text-gray-500 dark:text-gray-400">
            Messages between guests and hosts are saved to your account.
          </p>
          <Link
            to={`/login?redirect=${messagesBasePath}`}
            className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-(--color-primary) px-5 text-[13px] font-semibold text-white transition-colors hover:bg-(--color-primary-dark)"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={inDashboard ? "h-[calc(100vh-3rem)] overflow-hidden" : "h-[calc(100vh-5.5rem)] overflow-hidden py-4"}>
      <div className="mx-auto flex h-full w-full max-w-6xl flex-col">
        <header className="mb-4 shrink-0">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-950 dark:text-white">Messages</h1>
          <p className="mt-2 text-[14px] text-gray-500 dark:text-gray-400">Chat with hosts and guests about listings.</p>
        </header>

        <div className="grid min-h-0 flex-1 overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.08] dark:bg-[#111827] lg:grid-cols-[330px_minmax(0,1fr)]">
          <aside className="flex min-h-0 max-h-56 flex-col border-b border-gray-200 dark:border-white/[0.08] lg:max-h-none lg:border-b-0 lg:border-r">
            <div className="shrink-0 border-b border-gray-200 px-4 py-3 dark:border-white/[0.08]">
              <p className="text-[12px] font-semibold uppercase tracking-widest text-gray-400">Conversations</p>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {conversationsLoading ? (
                <div className="p-4 text-sm text-gray-400">Loading...</div>
              ) : conversations.length === 0 ? (
                <div className="p-5 text-[14px] text-gray-500 dark:text-gray-400">No conversations yet.</div>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.participant.id}
                    onClick={() => navigate(`${messagesBasePath}/${conv.participant.id}`)}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors border-l-4 ${
                      participantId === conv.participant.id
                        ? "border-(--color-primary) bg-(--color-primary)/5"
                        : "border-transparent hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gray-100">
                      {conv.participant.avatar ? (
                        <img src={conv.participant.avatar} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gray-200 text-gray-500">
                          <User size={16} />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="truncate text-[13px] font-semibold text-gray-950 dark:text-white">{conv.participant.name}</p>
                        <span className="text-[10px] text-gray-400">{new Date(conv.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="truncate text-[12px] text-gray-500 dark:text-gray-400">{conv.lastMessage}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </aside>

          <main className="flex min-h-0 flex-col">
            {participantId ? (
              <>
                <header className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-white/[0.08]">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gray-100 overflow-hidden">
                      {selectedConversation?.participant.avatar ? (
                        <img src={selectedConversation.participant.avatar} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gray-200 text-gray-500">
                          <User size={14} />
                        </div>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {selectedConversation?.participant.name || "Chat"}
                    </p>
                  </div>
                </header>

                <div ref={scrollRef} className="flex-1 overflow-y-auto bg-gray-50 p-4 dark:bg-white/[0.02] space-y-4">
                  {messagesLoading ? (
                    <div className="text-center text-sm text-gray-400">Loading messages...</div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-sm text-gray-400 py-10">No messages yet. Start chatting!</div>
                  ) : (
                    messages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.senderId === user.id ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                          msg.senderId === user.id 
                            ? "bg-(--color-primary) text-white rounded-br-none" 
                            : "bg-white dark:bg-white/[0.05] text-gray-800 dark:text-gray-200 rounded-bl-none shadow-sm"
                        }`}>
                          <p>{msg.content}</p>
                          <p className={`text-[10px] mt-1 opacity-70 ${msg.senderId === user.id ? "text-right" : ""}`}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleSubmit} className="border-t border-gray-200 p-3 dark:border-white/[0.08] flex gap-2">
                  <input
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm outline-none focus:border-(--color-primary) dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white"
                  />
                  <button
                    type="submit"
                    disabled={!content.trim() || sendMutation.isPending}
                    className="h-10 w-10 flex items-center justify-center rounded-lg bg-(--color-primary) text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
                  >
                    <Send size={18} />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 bg-gray-100 dark:bg-white/[0.05] rounded-full flex items-center justify-center mb-4">
                  <MessageCircle className="text-gray-400" size={32} />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Your Messages</h2>
                <p className="text-sm text-gray-500 max-w-xs mt-2">Select a conversation to start chatting with hosts or guests.</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
