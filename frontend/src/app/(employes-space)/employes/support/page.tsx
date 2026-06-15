"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Send, Loader2, LifeBuoy } from "lucide-react";
import { employeeService } from "@/services/employes/employee.service";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Message {
    id: string;
    content: string;
    createdAt: string;
    sender: { id: string; firstName: string; lastName: string; role: string };
}

interface Conversation {
    id: string;
}

export default function SupportPage() {
    const { user } = useAuth();
    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [messages, setMessages]   = useState<Message[]>([]);
    const [input, setInput]         = useState("");
    const [loading, setLoading]     = useState(true);
    const [sending, setSending]     = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const loadMessages = useCallback(async (convId: string) => {
        try {
            const msgs = await employeeService.getConversationMessages(convId);
            setMessages(msgs);
            await employeeService.markConversationAsRead(convId);
        } catch {
            toast.error("Erreur lors du chargement des messages");
        }
    }, []);

    useEffect(() => {
        employeeService.getSupportConversation()
            .then(async (conv) => {
                setConversation(conv);
                await loadMessages(conv.id);
            })
            .catch(() => toast.error("Erreur lors du chargement de la conversation support"))
            .finally(() => setLoading(false));
    }, [loadMessages]);

    // Polling des messages (toutes les 3 secondes)
    useEffect(() => {
        if (!conversation) return;
        const interval = setInterval(() => loadMessages(conversation.id), 3000);
        return () => clearInterval(interval);
    }, [conversation, loadMessages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || !conversation || sending) return;
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
            const sent = await employeeService.sendConversationMessage(conversation.id, content);
            setMessages((prev) => prev.map((m) => (m.id === tempMsg.id ? sent : m)));
        } catch {
            setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
            toast.error("Erreur lors de l'envoi");
            setInput(content);
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-130px)] items-center justify-center bg-white rounded-xl border border-gray-200">
                <Loader2 size={24} className="animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-130px)] bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white shrink-0"
                    style={{ background: "#0f766e" }}>
                    <LifeBuoy size={18} />
                </div>
                <div>
                    <p className="font-semibold text-gray-900 text-sm">Support AfrikCSE & AfrikVoyage</p>
                    <p className="text-xs text-gray-400">Notre équipe vous répond généralement sous 24h</p>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-center text-sm text-gray-400">
                        <div>
                            <LifeBuoy size={32} className="mx-auto mb-2 opacity-30" />
                            <p>Posez votre question, notre équipe support vous répondra rapidement.</p>
                        </div>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.sender.id === user?.id;
                        return (
                            <div key={msg.id} className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
                                {!isMe && (
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                                        style={{ background: "#0f766e" }}>
                                        {msg.sender.firstName[0]}{msg.sender.lastName[0]}
                                    </div>
                                )}
                                <div className={`max-w-[65%] flex flex-col gap-1 ${isMe ? "items-end" : "items-start"}`}>
                                    <div
                                        className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                                        style={isMe
                                            ? { background: "#0f766e", color: "white", borderBottomRightRadius: "4px" }
                                            : { background: "#f3f4f6", color: "#111827", borderBottomLeftRadius: "4px" }}
                                    >
                                        {msg.content}
                                    </div>
                                    <span className="text-xs text-gray-400 px-1">
                                        {new Date(msg.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                                        {isMe && " ✓✓"}
                                    </span>
                                </div>
                            </div>
                        );
                    })
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
    );
}
