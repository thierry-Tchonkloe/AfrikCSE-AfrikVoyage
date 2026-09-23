"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "@/i18n/navigation";
import { Bell, ChevronLeft, ChevronRight } from "lucide-react";
import { notificationService } from "@/services/notification.service";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Notification, NotificationType } from "@/types";
import { useTranslations } from "next-intl";
import { useDateLocale } from "@/hooks/useDateLocale";

type Translator = ReturnType<typeof useTranslations<"shared.notificationsList">>;

const TYPE_LABEL_KEYS = {
    APPROVAL_REQUEST: "typeApprovalRequest",
    REQUEST_APPROVED: "typeRequestApproved",
    REQUEST_REJECTED: "typeRequestRejected",
    TRIP_REMINDER: "typeTripReminder",
    NEW_EVENT: "typeNewEvent",
    MESSAGE_RECEIVED: "typeMessageReceived",
    SYSTEM_UPDATE: "typeSystemUpdate",
    NEW_PARTNER_OFFER: "typeNewPartnerOffer",
    PHOTO_PENDING_MODERATION: "typePhotoPendingModeration",
    BOOKING_CONFIRMED: "typeBookingConfirmed",
    BOOKING_CANCELLED: "typeBookingCancelled",
    BOOKING_COMPLETED: "typeBookingCompleted",
    BOOKING_REJECTED: "typeBookingRejected",
    WALLET_CREDITED: "typeWalletCredited",
    CASHBACK_CREDITED: "typeCashbackCredited",
    ORDER_CONFIRMED: "typeOrderConfirmed",
    ORDER_CANCELLED: "typeOrderCancelled",
} as const satisfies Record<NotificationType, string>;

const getTypeOptions = (t: Translator): { value: NotificationType | ""; label: string }[] => ([
    { value: "", label: t("allNotifications") },
    ...(Object.keys(TYPE_LABEL_KEYS) as NotificationType[]).map((value) => ({ value, label: t(TYPE_LABEL_KEYS[value]) })),
]);

function formatDateTime(iso: string, locale: string) {
    return new Date(iso).toLocaleString(locale, {
        day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
}

export function NotificationsList({ darkMode = false }: { darkMode?: boolean }) {
    const t = useTranslations("shared.notificationsList");
    const TYPE_OPTIONS = useMemo(() => getTypeOptions(t), [t]);
    const dateLocale = useDateLocale();
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [unreadCount, setUnreadCount] = useState(0);
    const [type, setType] = useState<NotificationType | "">("");

    const load = useCallback(async (targetPage: number, targetType: NotificationType | "") => {
        setLoading(true);
        try {
        const [list, unread] = await Promise.all([
            notificationService.getNotifications(targetPage, targetType || undefined),
            notificationService.getUnreadCount(),
        ]);
        setNotifications(list.notifications);
        setTotalPages(list.totalPages || 1);
        setUnreadCount(unread.count);
        } catch {
        toast.error(t("errorLoadingNotifications"));
        } finally {
        setLoading(false);
        }
    }, []);

    useEffect(() => { load(page, type); }, [page, type, load]);

    const handleTypeChange = (value: NotificationType | "") => {
        setType(value);
        setPage(1);
    };

    const handleNotificationClick = async (notif: Notification) => {
        if (!notif.read) {
        setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)));
        setUnreadCount((c) => Math.max(0, c - 1));
        try { await notificationService.markAsRead(notif.id); }
        catch { toast.error(t("errorWhileUpdating")); }
        }
        if (notif.link) router.push(notif.link);
    };

    const handleMarkAllAsRead = async () => {
        if (unreadCount === 0) return;
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
        try {
        await notificationService.markAllAsRead();
        toast.success(t("allNotificationsHaveBeen"));
        } catch { toast.error(t("errorWhileUpdating")); }
    };

    return (
        <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
            <h1 className={cn("text-xl font-bold", darkMode ? "text-gray-100" : "text-gray-900")}>{t("notifications")}</h1>
            <p className="text-sm text-gray-500">
                {unreadCount > 0 ? t("unreadNotification", { unreadCount, p2: unreadCount > 1 ? "s" : "" }) : t("reAllCaughtUp")}
            </p>
            </div>
            <div className="flex items-center gap-2">
            <select
                value={type}
                onChange={(e) => handleTypeChange(e.target.value as NotificationType | "")}
                className={cn(
                "px-3 py-2 rounded-lg text-sm border outline-none",
                darkMode ? "bg-gray-800 border-gray-700 text-gray-100" : "bg-white border-gray-200 text-gray-900"
                )}
            >
                {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
            {unreadCount > 0 && (
                <button
                onClick={handleMarkAllAsRead}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white whitespace-nowrap"
                style={{ background: "var(--color-primary)" }}
                >
                {t("markAllAsRead")}
                </button>
            )}
            </div>
        </div>

        <div className={cn(
            "rounded-xl border divide-y",
            darkMode ? "bg-gray-800 border-gray-700 divide-gray-700" : "bg-white border-gray-200 divide-gray-100"
        )}>
            {loading ? (
            [...Array(5)].map((_, i) => (
                <div key={i} className="p-4 h-16 animate-pulse" />
            ))
            ) : notifications.length === 0 ? (
            <div className="p-10 text-center">
                <Bell size={28} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">{t("noNotificationsMoment")}</p>
            </div>
            ) : (
            notifications.map((notif) => (
                <button
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={cn(
                    "w-full text-left p-4 flex items-start gap-3 transition-colors",
                    darkMode ? "hover:bg-gray-700/50" : "hover:bg-gray-50"
                )}
                >
                <span
                    className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                    style={{ background: notif.read ? "transparent" : "var(--color-primary)" }}
                />
                <div className="flex-1 min-w-0">
                    <p className={cn(
                    "text-sm",
                    notif.read
                        ? darkMode ? "text-gray-400" : "text-gray-600"
                        : cn("font-semibold", darkMode ? "text-gray-100" : "text-gray-900")
                    )}>
                    {notif.title}
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5">{notif.body}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatDateTime(notif.createdAt, dateLocale)}</p>
                </div>
                </button>
            ))
            )}
        </div>

        {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
            <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className={cn(
                "p-2 rounded-lg border disabled:opacity-40",
                darkMode ? "border-gray-700" : "border-gray-200"
                )}
            >
                <ChevronLeft size={16} />
            </button>
            <span className="text-sm text-gray-500">{t("page", { page, totalPages })}</span>
            <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className={cn(
                "p-2 rounded-lg border disabled:opacity-40",
                darkMode ? "border-gray-700" : "border-gray-200"
                )}
            >
                <ChevronRight size={16} />
            </button>
            </div>
        )}
        </div>
    );
}
