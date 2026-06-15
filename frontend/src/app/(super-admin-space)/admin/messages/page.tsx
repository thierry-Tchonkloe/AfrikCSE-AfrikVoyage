"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Send, Search, CheckCircle2, RotateCcw, Headset, ChevronLeft, ChevronRight } from "lucide-react";
import { cseService } from "@/services/companies/cse.service";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type ConvStatus = "OPEN" | "RESOLVED";

interface Conversation {
    id: string;
    status: ConvStatus;
    unreadCount: number;
    organization: { id: string; name: string } | null;
    participants: Array<{
        user: { id: string; firstName: string; lastName: string; role: string; lastLoginAt: string | null };
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

const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;

const STATUS_CONFIG: Record<ConvStatus, { label: string; color: string }> = {
    OPEN:     { label: "Ouvert", color: "#f59e0b" },
    RESOLVED: { label: "Résolu", color: "#10b981" },
};

export default function AdminMessagesPage() {
    const { user } = useAuth();

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConv, setActiveConv]   = useState<Conversation | null>(null);
    const [messages, setMessages]       = useState<Message[]>([]);
    const [input, setInput]             = useState("");
    const [search, setSearch]           = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [filter, setFilter]           = useState<"ALL" | ConvStatus>("ALL");
    const [page, setPage]               = useState(1);
    const [totalPages, setTotalPages]   = useState(1);
    const [counts, setCounts]           = useState({ open: 0, resolved: 0 });
    const [sending, setSending]         = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Recherche avec debounce
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(timer);
    }, [search]);

    // Revient à la première page quand la recherche ou le filtre changent
    useEffect(() => { setPage(1); }, [debouncedSearch, filter]);

    const loadConversations = useCallback(async () => {
        try {
            const res = await cseService.getConversations({
                page,
                limit: 20,
                search: debouncedSearch || undefined,
                status: filter !== "ALL" ? filter : undefined,
            });
            const convs: Conversation[] = res.conversations;
            setConversations(convs);
            setTotalPages(res.totalPages);
            setCounts({ open: res.openCount, resolved: res.resolvedCount });
            setActiveConv((prev) => {
                if (!prev) return convs[0] ?? null;
                const fresh = convs.find((c) => c.id === prev.id);
                return fresh ?? prev;
            });
        } catch {
            toast.error("Erreur chargement conversations");
        }
    }, [page, debouncedSearch, filter]);

    const loadMessages = useCallback(async () => {
        if (!activeConv) return;
        try {
            const msgs = await cseService.getMessages(activeConv.id);
            setMessages(msgs);
            await cseService.markAsRead(activeConv.id);
            setConversations((prev) =>
                prev.map((c) => (c.id === activeConv.id ? { ...c, unreadCount: 0 } : c))
            );
        } catch {
            toast.error("Erreur chargement messages");
        }
    }, [activeConv]);

    useEffect(() => { loadConversations(); }, [loadConversations]);
    useEffect(() => { loadMessages(); }, [loadMessages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Rafraîchit la liste des conversations (badges non lus, dernier message…)
    useEffect(() => {
        const interval = setInterval(loadConversations, 5000);
        return () => clearInterval(interval);
    }, [loadConversations]);

    // Polling des messages de la conversation active
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
            setMessages((prev) => prev.map((m) => (m.id === tempMsg.id ? sent : m)));
            loadConversations();
        } catch {
            setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
            toast.error("Erreur envoi");
            setInput(content);
        } finally {
            setSending(false);
        }
    };

    const handleToggleStatus = async () => {
        if (!activeConv || updatingStatus) return;
        const newStatus: ConvStatus = activeConv.status === "OPEN" ? "RESOLVED" : "OPEN";
        setUpdatingStatus(true);
        try {
            await cseService.updateConversationStatus(activeConv.id, newStatus);
            setConversations((prev) =>
                prev.map((c) => (c.id === activeConv.id ? { ...c, status: newStatus } : c))
            );
            setActiveConv((prev) => (prev ? { ...prev, status: newStatus } : prev));
            toast.success(
                newStatus === "RESOLVED" ? "Conversation marquée comme résolue" : "Conversation réouverte"
            );
        } catch {
            toast.error("Erreur lors de la mise à jour du statut");
        } finally {
            setUpdatingStatus(false);
        }
    };

    const getOrgName = (conv: Conversation): string => conv.organization?.name ?? "Organisation inconnue";
    const getOrgInitials = (conv: Conversation): string => getOrgName(conv).slice(0, 2).toUpperCase();
    const getOrgColor = (conv: Conversation): string => {
        const colors = ["#0f766e", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444"];
        return colors[getOrgName(conv).charCodeAt(0) % colors.length];
    };

    /** L'organisation est "en ligne" si un de ses membres s'est connecté récemment */
    const isOrgOnline = (conv: Conversation): boolean => {
        const lastLogins = conv.participants
            .filter((p) => p.user.role !== "SUPER_ADMIN" && p.user.lastLoginAt)
            .map((p) => new Date(p.user.lastLoginAt as string).getTime());
        if (lastLogins.length === 0) return false;
        return Date.now() - Math.max(...lastLogins) < ONLINE_THRESHOLD_MS;
    };

    /** Les messages envoyés par un Super Admin s'affichent sous la marque "Support AfrikCSE" */
    const getSenderLabel = (sender: Message["sender"]): string =>
        sender.role === "SUPER_ADMIN" ? "Support AfrikCSE" : `${sender.firstName} ${sender.lastName}`;

    const totalCount = counts.open + counts.resolved;

    return (
        <div className="flex h-[calc(100vh-130px)] bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* ── Sidebar conversations ── */}
            <div className="w-72 flex flex-col border-r border-gray-200 shrink-0">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h2 className="font-bold text-gray-900">Messages — Entreprises</h2>
                </div>

                {/* Filtres statut */}
                <div className="flex gap-1.5 px-3 pt-3">
                    {[
                        { key: "ALL" as const, label: "Tous", count: totalCount },
                        { key: "OPEN" as const, label: "Ouverts", count: counts.open },
                        { key: "RESOLVED" as const, label: "Résolus", count: counts.resolved },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setFilter(tab.key)}
                            className="flex-1 text-xs font-medium px-2 py-1.5 rounded-lg transition-colors"
                            style={
                                filter === tab.key
                                    ? { background: "var(--color-primary)", color: "white" }
                                    : { background: "#f3f4f6", color: "#6b7280" }
                            }
                        >
                            {tab.label} {tab.count > 0 && `(${tab.count})`}
                        </button>
                    ))}
                </div>

                {/* Recherche */}
                <div className="p-3 border-b border-gray-100">
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Rechercher une entreprise..."
                            className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none"
                        />
                    </div>
                </div>

                {/* Liste conversations */}
                <div className="flex-1 overflow-y-auto">
                    {conversations.map((conv) => {
                        const lastMsg = conv.messages[0];
                        const isActive = conv.id === activeConv?.id;
                        const color = getOrgColor(conv);
                        const online = isOrgOnline(conv);
                        const status = STATUS_CONFIG[conv.status];

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
                                        {getOrgInitials(conv)}
                                    </div>
                                    <span
                                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                                            online ? "bg-green-500" : "bg-gray-300"
                                        }`}
                                    />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center gap-1">
                                        <p className="text-sm font-semibold text-gray-900 truncate">
                                            {getOrgName(conv)}
                                        </p>
                                        {lastMsg && (
                                            <span className="text-xs text-gray-400 shrink-0">
                                                {new Date(lastMsg.createdAt).toLocaleTimeString("fr-FR", {
                                                    hour: "2-digit", minute: "2-digit",
                                                })}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between gap-1 mt-0.5">
                                        {lastMsg ? (
                                            <p className="text-xs text-gray-500 truncate">{lastMsg.content}</p>
                                        ) : (
                                            <p className="text-xs text-gray-400 italic">Aucun message</p>
                                        )}
                                        {conv.unreadCount > 0 && (
                                            <span
                                                className="shrink-0 text-[10px] font-bold text-white rounded-full px-1.5 py-0.5 min-w-4.5 text-center"
                                                style={{ background: "var(--color-primary)" }}
                                            >
                                                {conv.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                    <span
                                        className="inline-block mt-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full"
                                        style={{ color: status.color, background: status.color + "18" }}
                                    >
                                        {status.label}
                                    </span>
                                </div>
                            </button>
                        );
                    })}

                    {conversations.length === 0 && (
                        <div className="p-4 text-center text-sm text-gray-400">
                            Aucune conversation
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100">
                        <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
                            className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 text-gray-600">
                            <ChevronLeft size={16} />
                        </button>
                        <p className="text-xs text-gray-500">Page {page} / {totalPages}</p>
                        <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}
                            className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 text-gray-600">
                            <ChevronRight size={16} />
                        </button>
                    </div>
                )}
            </div>

            {/* ── Zone de chat ── */}
            {activeConv ? (
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Header chat */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="relative shrink-0">
                                <div
                                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                    style={{ background: getOrgColor(activeConv) }}
                                >
                                    {getOrgInitials(activeConv)}
                                </div>
                                <span
                                    className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                                        isOrgOnline(activeConv) ? "bg-green-500" : "bg-gray-300"
                                    }`}
                                />
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900 text-sm">{getOrgName(activeConv)}</p>
                                <p className={`text-xs ${isOrgOnline(activeConv) ? "text-green-500" : "text-gray-400"}`}>
                                    {isOrgOnline(activeConv) ? "● En ligne" : "● Hors ligne"}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={handleToggleStatus}
                            disabled={updatingStatus}
                            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50"
                            style={
                                activeConv.status === "OPEN"
                                    ? { color: "#10b981", borderColor: "#10b98140", background: "#10b98110" }
                                    : { color: "#6b7280", borderColor: "#d1d5db", background: "#f9fafb" }
                            }
                        >
                            {activeConv.status === "OPEN" ? (
                                <>
                                    <CheckCircle2 size={14} /> Marquer résolu
                                </>
                            ) : (
                                <>
                                    <RotateCcw size={14} /> Réouvrir
                                </>
                            )}
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                        {messages.map((msg) => {
                            const isMe = msg.sender.id === user?.id;
                            const isSupport = msg.sender.role === "SUPER_ADMIN";
                            return (
                                <div key={msg.id} className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
                                    {!isMe && (
                                        <div
                                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                                            style={{ background: isSupport ? "var(--color-primary)" : "#0f766e" }}
                                        >
                                            {isSupport ? <Headset size={14} /> : `${msg.sender.firstName[0]}${msg.sender.lastName[0]}`}
                                        </div>
                                    )}

                                    <div className={`max-w-[65%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-1`}>
                                        {!isMe && (
                                            <span className="text-xs text-gray-400 px-1">{getSenderLabel(msg.sender)}</span>
                                        )}
                                        <div
                                            className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                                            style={
                                                isMe
                                                    ? { background: "var(--color-primary)", color: "white", borderBottomRightRadius: "4px" }
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

                        {messages.length === 0 && (
                            <div className="h-full flex items-center justify-center text-sm text-gray-400">
                                Aucun message dans cette conversation
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Zone de saisie */}
                    <div className="px-6 py-4 border-t border-gray-100">
                        <div className="flex items-center gap-3">
                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                                placeholder="Répondre en tant que Support AfrikCSE..."
                                className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || sending}
                                className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-opacity disabled:opacity-50"
                                style={{ background: "var(--color-primary)" }}
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
