"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, CheckCircle2, XCircle, Clock, SkipForward } from "lucide-react";
import { notificationsAdminService } from "@/services/admin/notifications-admin.service";
import { NotificationLog, NotificationType, NotificationLogStatus } from "@/types";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";

const STATUS_CONFIG: Record<NotificationLogStatus, { label: string; color: string; icon: React.ElementType }> = {
    SENT:    { label: "Envoyé",  color: "bg-green-100 text-green-700", icon: CheckCircle2 },
    FAILED:  { label: "Échoué", color: "bg-red-100 text-red-700",     icon: XCircle },
    PENDING: { label: "En att.", color: "bg-amber-100 text-amber-700", icon: Clock },
    SKIPPED: { label: "Ignoré", color: "bg-gray-100 text-gray-500",   icon: SkipForward },
};

const CHANNEL_COLOR: Record<string, string> = {
    IN_APP: "bg-purple-100 text-purple-700",
    EMAIL:  "bg-blue-100 text-blue-700",
    SMS:    "bg-green-100 text-green-700",
};

export default function NotificationLogsPage() {
    const [logs, setLogs]     = useState<NotificationLog[]>([]);
    const [total, setTotal]   = useState(0);
    const [page, setPage]     = useState(1);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<NotificationType | "">("");

    const load = useCallback(async (p: number, ev: NotificationType | "") => {
        setLoading(true);
        try {
            const res = await notificationsAdminService.listLogs(p, ev || undefined);
            if (p === 1) setLogs(res.logs); else setLogs((prev) => [...prev, ...res.logs]);
            setTotal(res.total);
            setPage(p);
        } catch (err) {
            toast.error(getErrorMessage(err, "Erreur de chargement"));
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { load(1, filter); }, [filter, load]);

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Logs de notifications</h1>
                    <p className="text-sm text-gray-500 mt-0.5">{total} entrée{total !== 1 ? "s" : ""}</p>
                </div>
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as NotificationType | "")}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">Tous les événements</option>
                    {(["BOOKING_CONFIRMED","BOOKING_CANCELLED","BOOKING_COMPLETED","BOOKING_REJECTED","WALLET_CREDITED","CASHBACK_CREDITED","ORDER_CONFIRMED","ORDER_CANCELLED"] as NotificationType[]).map((e) => (
                        <option key={e} value={e}>{e}</option>
                    ))}
                </select>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {loading && logs.length === 0 ? (
                    <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
                ) : logs.length === 0 ? (
                    <div className="text-center py-16 text-gray-400 text-sm">Aucun log</div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="text-left px-5 py-3 font-medium text-gray-500">Événement</th>
                                <th className="text-left px-5 py-3 font-medium text-gray-500">Canal</th>
                                <th className="text-left px-5 py-3 font-medium text-gray-500">Destinataire</th>
                                <th className="text-left px-5 py-3 font-medium text-gray-500">Statut</th>
                                <th className="text-left px-5 py-3 font-medium text-gray-500">Erreur</th>
                                <th className="text-left px-5 py-3 font-medium text-gray-500">Envoyé le</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {logs.map((log) => {
                                const sc = STATUS_CONFIG[log.status] ?? { label: log.status, color: "bg-gray-100 text-gray-500", icon: Clock };
                                const StatusIcon = sc.icon;
                                return (
                                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="px-5 py-3 text-xs font-mono text-gray-600 dark:text-gray-300">{log.event}</td>
                                        <td className="px-5 py-3">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CHANNEL_COLOR[log.channel] ?? "bg-gray-100 text-gray-600"}`}>
                                                {log.channel}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-gray-500 text-xs">
                                            {log.email ?? log.phone ?? log.userId?.slice(0, 8) ?? "—"}
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sc.color}`}>
                                                <StatusIcon className="h-3 w-3" />{sc.label}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-xs text-red-500 max-w-xs truncate">{log.error ?? "—"}</td>
                                        <td className="px-5 py-3 text-xs text-gray-400">
                                            {log.sentAt ? new Date(log.sentAt).toLocaleString("fr-FR", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" }) : "—"}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {!loading && logs.length < total && (
                <div className="text-center">
                    <button onClick={() => load(page + 1, filter)} className="text-sm text-blue-600 hover:underline">
                        Voir plus ({total - logs.length} restants)
                    </button>
                </div>
            )}
        </div>
    );
}
