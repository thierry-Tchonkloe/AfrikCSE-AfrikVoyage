"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, Download, Loader2, ChevronLeft, ChevronRight, ScrollText } from "lucide-react";
import { auditLogService, AuditLog } from "@/services/admin/audit-log.service";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useDateLocale } from "@/hooks/useDateLocale";

type Translator = ReturnType<typeof useTranslations<"admin.logs">>;

const ACTION_LABELS: Record<string, {
    labelKey: "orgValidated" | "orgRejected" | "orgSuspended" | "orgReactivated" | "orgModulesUpdated" | "orgUpdated"
        | "orgDeleted" | "userCreated" | "userRoleChanged" | "userActivated" | "userDeactivated";
    color: string;
}> = {
    ORG_VALIDATED:        { labelKey: "orgValidated",      color: "#10b981" },
    ORG_REJECTED:         { labelKey: "orgRejected",       color: "#ef4444" },
    ORG_SUSPENDED:        { labelKey: "orgSuspended",      color: "#f59e0b" },
    ORG_REACTIVATED:      { labelKey: "orgReactivated",    color: "#10b981" },
    ORG_MODULES_UPDATED:  { labelKey: "orgModulesUpdated", color: "#6366f1" },
    ORG_UPDATED:          { labelKey: "orgUpdated",        color: "#6366f1" },
    ORG_DELETED:          { labelKey: "orgDeleted",        color: "#ef4444" },
    USER_CREATED:         { labelKey: "userCreated",       color: "#10b981" },
    USER_ROLE_CHANGED:    { labelKey: "userRoleChanged",   color: "#6366f1" },
    USER_ACTIVATED:       { labelKey: "userActivated",     color: "#10b981" },
    USER_DEACTIVATED:     { labelKey: "userDeactivated",   color: "#ef4444" },
};

function actionMeta(action: string, t: Translator) {
    const meta = ACTION_LABELS[action];
    return meta ? { label: t(meta.labelKey), color: meta.color } : { label: action, color: "#6b7280" };
}

export default function AuditLogsPage() {
    const dateLocale = useDateLocale();
    const t = useTranslations("admin.logs");
    const [logs, setLogs]         = useState<AuditLog[]>([]);
    const [actions, setActions]   = useState<string[]>([]);
    const [loading, setLoading]   = useState(true);
    const [exporting, setExporting] = useState(false);

    const [search, setSearch]     = useState("");
    const [action, setAction]     = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo]     = useState("");

    const [page, setPage]         = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal]       = useState(0);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await auditLogService.getAll({
                page, limit: 20, search: search || undefined, action: action || undefined,
                dateFrom: dateFrom || undefined, dateTo: dateTo || undefined,
            });
            setLogs(res.data);
            setTotalPages(res.totalPages);
            setTotal(res.total);
        } catch {
            toast.error(t("errorLoadingAuditLog"));
        } finally {
            setLoading(false);
        }
    }, [page, search, action, dateFrom, dateTo]);

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        auditLogService.getActions().then(setActions).catch(() => {});
    }, []);

    useEffect(() => { setPage(1); }, [search, action, dateFrom, dateTo]);

    const handleExport = async () => {
        setExporting(true);
        try {
            const blob = await auditLogService.export({
                search: search || undefined, action: action || undefined,
                dateFrom: dateFrom || undefined, dateTo: dateTo || undefined,
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } catch {
            toast.error(t("errorDuringExport"));
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="space-y-5">
            {/* En-tête */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">{t("auditLog")}</h1>
                    <p className="text-sm text-gray-500">
                        {t("historyActionsPerformed")}
                    </p>
                </div>
                <button
                    onClick={handleExport}
                    disabled={exporting}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-60"
                >
                    {exporting ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                    {t("exportCsv")}
                </button>
            </div>

            {/* Filtres */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t("searchUserCompany")}
                        className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-teal-400"
                    />
                </div>
                <select
                    value={action}
                    onChange={(e) => setAction(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-700"
                >
                    <option value="">{t("allActions")}</option>
                    {actions.map((a) => (
                        <option key={a} value={a}>{actionMeta(a, t).label}</option>
                    ))}
                </select>
                <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none text-gray-700"
                />
                <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none text-gray-700"
                />
            </div>

            {/* Tableau */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 text-left text-xs text-gray-400 uppercase">
                                <th className="px-5 py-3 font-medium">{t("date")}</th>
                                <th className="px-5 py-3 font-medium">{t("action")}</th>
                                <th className="px-5 py-3 font-medium">{t("user")}</th>
                                <th className="px-5 py-3 font-medium">{t("organization")}</th>
                                <th className="px-5 py-3 font-medium">{t("ipAddress")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="border-b border-gray-50">
                                        <td colSpan={5} className="px-5 py-4">
                                            <div className="h-4 bg-gray-100 rounded animate-pulse" />
                                        </td>
                                    </tr>
                                ))
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-5 py-12 text-center text-gray-400">
                                        <ScrollText size={28} className="mx-auto mb-2 text-gray-300" />
                                        {t("noEntryFound")}
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => {
                                    const meta = actionMeta(log.action, t);
                                    return (
                                        <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                                            <td className="px-5 py-3 text-gray-500 whitespace-nowrap">
                                                {new Date(log.createdAt).toLocaleString(dateLocale, {
                                                    day: "2-digit", month: "2-digit", year: "numeric",
                                                    hour: "2-digit", minute: "2-digit",
                                                })}
                                            </td>
                                            <td className="px-5 py-3">
                                                <span
                                                    className="text-xs font-medium px-2 py-1 rounded"
                                                    style={{ color: meta.color, background: meta.color + "18" }}
                                                >
                                                    {meta.label}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-gray-700">
                                                {log.user ? (
                                                    <div>
                                                        <p className="font-medium">{log.user.firstName} {log.user.lastName}</p>
                                                        <p className="text-xs text-gray-400">{log.user.email}</p>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400">—</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3 text-gray-700">
                                                {log.organization?.name ?? <span className="text-gray-400">—</span>}
                                            </td>
                                            <td className="px-5 py-3 text-gray-400 font-mono text-xs">
                                                {log.ipAddress ?? "—"}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                        {t("showingEntries", { length: logs.length, total })}
                    </p>
                    <div className="flex items-center gap-1">
                        <button disabled={page <= 1} onClick={() => setPage(page - 1)}
                            className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 text-gray-600">
                            <ChevronLeft size={16} />
                        </button>
                        {[...Array(Math.min(totalPages, 5))].map((_, i) => (
                            <button key={i + 1} onClick={() => setPage(i + 1)}
                                className="w-7 h-7 rounded text-xs font-medium"
                                style={page === i + 1
                                    ? { background: "var(--color-primary)", color: "white" }
                                    : { color: "#6b7280" }}>
                                {i + 1}
                            </button>
                        ))}
                        <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}
                            className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 text-gray-600">
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
