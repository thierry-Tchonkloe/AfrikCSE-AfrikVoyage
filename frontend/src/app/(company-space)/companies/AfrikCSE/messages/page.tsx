"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Send, Search, Phone, Video, MoreVertical, Plus } from "lucide-react";
import { cseService } from "@/services/companies/cse.service";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Conversation {
    id: string;
    organization: { id: string; name: string } | null;
    participants: Array<{
        user: { id: string; firstName: string; lastName: string; role: string };
        lastReadAt: string | null;
    }>;
    messages: Array<{
        content: string;
        createdAt: string;
        sender: { firstName: string; lastName: string };
    }>;
    updatedAt: string;
}

interface Message {
    id: string;
    content: string;
    createdAt: string;
    sender: { id: string; firstName: string; lastName: string; role: string };
}

export default function MessagesPage() {
    const { user } = useAuth();
    const isSuperAdmin = user?.role === "SUPER_ADMIN";

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConv, setActiveConv]       = useState<Conversation | null>(null);
    const [messages, setMessages]           = useState<Message[]>([]);
    const [input, setInput]                 = useState("");
    const [search, setSearch]               = useState("");
    const [sending, setSending]             = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Charge les conversations
    const loadConversations = useCallback(async () => {
        try {
        const convs = await cseService.getConversations();
        setConversations(convs);

        // Non-super admin : ouvre directement la conversation support
        if (!isSuperAdmin && convs.length === 0) {
            const support = await cseService.getSupportConversation();
            setConversations([support]);
            setActiveConv(support);
        } else if (!isSuperAdmin && convs.length > 0) {
            setActiveConv(convs[0]);
        }
        } catch { toast.error("Erreur chargement conversations"); }
    }, [isSuperAdmin]);

    // Charge les messages de la conversation active
    const loadMessages = useCallback(async () => {
        if (!activeConv) return;
        try {
        const msgs = await cseService.getMessages(activeConv.id);
        setMessages(msgs);
        await cseService.markAsRead(activeConv.id);
        } catch { toast.error("Erreur chargement messages"); }
    }, [activeConv]);

    useEffect(() => { loadConversations(); }, [loadConversations]);
    useEffect(() => { loadMessages(); }, [loadMessages]);

    // Scroll automatique vers le bas
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Polling des messages (toutes les 3 secondes)
    useEffect(() => {
        if (!activeConv) return;
        const interval = setInterval(loadMessages, 3000);
        return () => clearInterval(interval);
    }, [activeConv, loadMessages]);

    const handleSend = async () => {
        if (!input.trim() || !activeConv || sending) return;
        const content = input.trim();
        setInput("");
        setSending(true);

        // Optimistic update
        const tempMsg: Message = {
        id: "temp-" + Date.now(),
        content,
        createdAt: new Date().toISOString(),
        sender: {
            id: user?.id ?? "",
            firstName: user?.firstName ?? "",
            lastName: user?.lastName ?? "",
            role: user?.role ?? "",
        },
        };
        setMessages((prev) => [...prev, tempMsg]);

        try {
        const sent = await cseService.sendMessage(activeConv.id, content);
        setMessages((prev) => prev.map((m) => m.id === tempMsg.id ? sent : m));
        loadConversations(); // met à jour la liste
        } catch {
        setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
        toast.error("Erreur envoi");
        setInput(content);
        } finally {
        setSending(false);
        }
    };

    const filteredConvs = conversations.filter((c) => {
        const name = isSuperAdmin
        ? c.organization?.name ?? ""
        : c.participants
            .filter((p) => p.user.role === "SUPER_ADMIN")
            .map((p) => `${p.user.firstName} ${p.user.lastName}`)
            .join(", ");
        return name.toLowerCase().includes(search.toLowerCase());
    });

    const getConvName = (conv: Conversation): string => {
        if (isSuperAdmin) return conv.organization?.name ?? "Inconnu";
        // Affiche le nom du Super Admin
        const sa = conv.participants.find((p) => p.user.role === "SUPER_ADMIN");
        return sa ? `${sa.user.firstName} ${sa.user.lastName}` : "Support";
    };

    const getConvInitials = (conv: Conversation): string => {
        return getConvName(conv).slice(0, 2).toUpperCase();
    };

    const getConvColor = (conv: Conversation): string => {
        const colors = ["#0f766e", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444"];
        const name = getConvName(conv);
        return colors[name.charCodeAt(0) % colors.length];
    };

    const isOnline = (conv: Conversation): boolean => {
        // Logique simplifiée — à remplacer par WebSocket
        return conv.id === activeConv?.id;
    };

    return (
        <div className="flex h-[calc(100vh-130px)] bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* ── Sidebar conversations ── */}
        <div className="w-64 flex flex-col border-r border-gray-200 shrink-0">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Messages</h2>
            {isSuperAdmin && (
                <button className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                style={{ background: "#0f766e" }}>
                <Plus size={16} />
                </button>
            )}
            </div>

            {/* Recherche */}
            <div className="p-3 border-b border-gray-100">
            <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher..."
                className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none"
                />
            </div>
            </div>

            {/* Liste conversations */}
            <div className="flex-1 overflow-y-auto">
            {filteredConvs.map((conv) => {
                const lastMsg = conv.messages[0];
                const isActive = conv.id === activeConv?.id;
                const color = getConvColor(conv);

                return (
                <button
                    key={conv.id}
                    onClick={() => setActiveConv(conv)}
                    className="w-full flex items-start gap-3 p-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50"
                    style={isActive ? { background: "#f0fdf4", borderLeft: "3px solid #0f766e" } : {}}
                >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                    <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ background: color }}
                    >
                        {getConvInitials(conv)}
                    </div>
                    {isOnline(conv) && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
                    )}
                    </div>

                    <div className="flex-1 min-w-0">
                    <div className="flex justify-between">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                        {getConvName(conv)}
                        </p>
                        {lastMsg && (
                        <span className="text-xs text-gray-400 shrink-0 ml-1">
                            {new Date(lastMsg.createdAt).toLocaleTimeString("fr-FR", {
                            hour: "2-digit", minute: "2-digit",
                            })}
                        </span>
                        )}
                    </div>
                    {lastMsg && (
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                        {lastMsg.content}
                        </p>
                    )}
                    </div>
                </button>
                );
            })}

            {filteredConvs.length === 0 && (
                <div className="p-4 text-center text-sm text-gray-400">
                Aucune conversation
                </div>
            )}
            </div>
        </div>

        {/* ── Zone de chat ── */}
        {activeConv ? (
            <div className="flex-1 flex flex-col min-w-0">
            {/* Header chat */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: getConvColor(activeConv) }}
                >
                    {getConvInitials(activeConv)}
                </div>
                <div>
                    <p className="font-semibold text-gray-900 text-sm">
                    {getConvName(activeConv)}
                    </p>
                    <p className="text-xs text-green-500">● En ligne</p>
                </div>
                </div>
                <div className="flex items-center gap-2">
                <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
                    <Phone size={17} />
                </button>
                <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
                    <Video size={17} />
                </button>
                <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
                    <MoreVertical size={17} />
                </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {messages.map((msg) => {
                const isMe = msg.sender.id === user?.id;
                return (
                    <div key={msg.id} className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
                    {/* Avatar expéditeur */}
                    {!isMe && (
                        <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ background: "#0f766e" }}
                        >
                        {msg.sender.firstName[0]}{msg.sender.lastName[0]}
                        </div>
                    )}

                    <div className={`max-w-[65%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-1`}>
                        <div
                        className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                        style={isMe
                            ? { background: "#0f766e", color: "white", borderBottomRightRadius: "4px" }
                            : { background: "#f3f4f6", color: "#111827", borderBottomLeftRadius: "4px" }
                        }
                        >
                        {msg.content}
                        </div>
                        <span className="text-xs text-gray-400 px-1">
                        {new Date(msg.createdAt).toLocaleTimeString("fr-FR", {
                            hour: "2-digit", minute: "2-digit",
                        })}
                        {isMe && " ✓✓"}
                        </span>
                    </div>
                    </div>
                );
                })}

                {/* Indicateur "en train d'écrire" simulé */}
                {activeConv && (
                <div className="flex items-center gap-2 text-xs text-gray-400">
                    <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: "#0f766e" }}
                    >
                    S
                    </div>
                    <span>Support est en train d&#39;écrire</span>
                    <span className="flex gap-0.5">
                    {[0, 1, 2].map((i) => (
                        <span key={i}
                        className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
                        style={{ animationDelay: `${i * 150}ms` }}
                        />
                    ))}
                    </span>
                </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Zone de saisie */}
            <div className="px-6 py-4 border-t border-gray-100">
                <div className="flex items-center gap-3">
                <button className="text-gray-400 hover:text-gray-600">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                    </svg>
                </button>
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder="Tapez votre message..."
                    className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none"
                />
                <button
                    onClick={handleSend}
                    disabled={!input.trim() || sending}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-opacity disabled:opacity-50"
                    style={{ background: "#0f766e" }}
                >
                    <Send size={16} />
                </button>
                </div>
            </div>
            </div>
        ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            Sélectionnez une conversation
            </div>
        )}
        </div>
    );
}