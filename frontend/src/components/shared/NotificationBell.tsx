"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { notificationService } from "@/services/notification.service";
import type { Notification } from "@/types";

function formatTime(iso: string) {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return "À l'instant";
    if (diff < 3600) return `il y a ${Math.round(diff / 60)} min`;
    if (diff < 86400) return `il y a ${Math.round(diff / 3600)} h`;
    return `il y a ${Math.round(diff / 86400)} j`;
}

export function NotificationBell({
    darkMode = false,
    notificationsHref,
}: {
    darkMode?: boolean;
    /** Page "Voir toutes les notifications" — adaptée à l'espace courant */
    notificationsHref: string;
}) {
    const router = useRouter();
    const containerRef = useRef<HTMLDivElement>(null);

    const [open, setOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);

    const loadUnreadCount = useCallback(async () => {
        try {
        const { count } = await notificationService.getUnreadCount();
        setUnreadCount(count);
        } catch { /* badge non bloquant */ }
    }, []);

    useEffect(() => { loadUnreadCount(); }, [loadUnreadCount]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
            setOpen(false);
        }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleOpen = async () => {
        const willOpen = !open;
        setOpen(willOpen);
        if (willOpen) {
        setLoading(true);
        try {
            const data = await notificationService.getNotifications(1);
            setNotifications(data.notifications);
        } catch { /* dropdown reste vide */ }
        finally { setLoading(false); }
        }
    };

    const handleNotificationClick = async (notif: Notification) => {
        if (!notif.read) {
        setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)));
        setUnreadCount((c) => Math.max(0, c - 1));
        try { await notificationService.markAsRead(notif.id); }
        catch { /* compteur déjà optimiste, pas critique */ }
        }
        if (notif.link) {
        setOpen(false);
        router.push(notif.link);
        }
    };

    const handleMarkAllRead = async () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
        try { await notificationService.markAllAsRead(); }
        catch { /* idempotent : sera resynchronisé au prochain chargement */ }
    };

    return (
        <div className="relative" ref={containerRef}>
        <button
            onClick={toggleOpen}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 relative"
        >
            <Bell size={18} />
            {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
            </span>
            )}
        </button>

        {open && (
            <div className={cn(
            "absolute right-0 mt-2 w-80 rounded-xl border shadow-lg z-50 overflow-hidden",
            darkMode ? "bg-gray-800 border-gray-700 text-gray-100" : "bg-white border-gray-200 text-gray-900"
            )}>
            <div className={cn(
                "flex items-center justify-between px-4 py-3 border-b",
                darkMode ? "border-gray-700" : "border-gray-100"
            )}>
                <p className="text-sm font-semibold">Notifications</p>
                {unreadCount > 0 && (
                <button
                    onClick={handleMarkAllRead}
                    className="text-xs hover:underline"
                    style={{ color: "var(--color-primary)" }}
                >
                    Tout marquer comme lu
                </button>
                )}
            </div>

            <div className="max-h-80 overflow-y-auto">
                {loading ? (
                <div className="p-4 text-center text-xs text-gray-400">Chargement...</div>
                ) : notifications.length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-400">Aucune notification.</div>
                ) : (
                notifications.map((n) => (
                    <button
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={cn(
                        "w-full text-left px-4 py-3 border-b last:border-b-0 transition-colors",
                        darkMode ? "border-gray-700 hover:bg-gray-700/50" : "border-gray-100 hover:bg-gray-50"
                    )}
                    >
                    <div className="flex items-start gap-2">
                        {!n.read && (
                        <span className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: "var(--color-primary)" }} />
                        )}
                        <div className={cn("min-w-0", n.read && "pl-4")}>
                        <p className="text-xs font-semibold truncate">{n.title}</p>
                        <p className="text-xs text-gray-500 line-clamp-2">{n.body}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{formatTime(n.createdAt)}</p>
                        </div>
                    </div>
                    </button>
                ))
                )}
            </div>

            <button
                onClick={() => { setOpen(false); router.push(notificationsHref); }}
                className={cn(
                "w-full text-center py-2.5 text-xs font-medium border-t",
                darkMode ? "border-gray-700" : "border-gray-100"
                )}
                style={{ color: "var(--color-primary)" }}
            >
                Voir toutes les notifications
            </button>
            </div>
        )}
        </div>
    );
}
