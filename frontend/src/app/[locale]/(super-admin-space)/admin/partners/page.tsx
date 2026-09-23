"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "@/i18n/navigation";
import {
    Plus, Search, RefreshCw, Trash2, Edit, Loader2, Wifi, WifiOff, Globe, PackageCheck,
} from "lucide-react";
import { partnersService } from "@/services/admin/partners.service";
import { Partner, PartnerStatus, PartnerScope } from "@/types";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";
import { useTranslations } from "next-intl";


type Translator = ReturnType<typeof useTranslations<"admin.partners">>;

const getStatusColors = (t: Translator): Record<PartnerStatus, { bg: string; text: string; label: string }> => ({
    DRAFT:     { bg: "#f3f4f6", text: "#6b7280", label: t("draft") },
    ACTIVE:    { bg: "#dcfce7", text: "#15803d", label: t("active") },
    INACTIVE:  { bg: "#fef9c3", text: "#a16207", label: t("inactive") },
    SUSPENDED: { bg: "#fee2e2", text: "#dc2626", label: t("suspended") },
});

const getScopeLabels = (tr: Translator): Record<PartnerScope, string> => ({
    CSE:    "CSE",
    VOYAGE: tr("travel"),
    BOTH:   tr("cseTravel"),
});

export default function PartnersPage() {
    const tr = useTranslations("admin.partners");
    const SCOPE_LABELS = useMemo(() => getScopeLabels(tr), [tr]);
    const t = useTranslations("admin.partners");
    const STATUS_COLORS = useMemo(() => getStatusColors(t), [t]);
    const router = useRouter();
    const [partners, setPartners] = useState<Partner[]>([]);
    const [total, setTotal]       = useState(0);
    const [loading, setLoading]   = useState(true);
    const [search, setSearch]     = useState("");
    const [status, setStatus]     = useState("");
    const [scopeType, setScopeType] = useState("");
    const [page, setPage]         = useState(1);
    const limit = 10;

    const [deleteTarget, setDeleteTarget] = useState<Partner | null>(null);
    const [deleting, setDeleting]         = useState(false);
    const [syncing, setSyncing]           = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await partnersService.getAll({
                page, limit, search: search || undefined,
                status: status as PartnerStatus || undefined,
                scopeType: scopeType as PartnerScope || undefined,
            });
            setPartners(Array.isArray(res.data) ? res.data : []);
            setTotal(res.total ?? 0);
        } catch (err) {
            toast.error(getErrorMessage(err, t("errorLoadingPartners")));
        } finally {
            setLoading(false);
        }
    }, [page, search, status, scopeType]);

    useEffect(() => { load(); }, [load]);

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await partnersService.delete(deleteTarget.id);
            toast.success(t("partnerDeleted"));
            setDeleteTarget(null);
            load();
        } catch (err) {
            toast.error(getErrorMessage(err, t("unableDeletePartner")));
        } finally {
            setDeleting(false);
        }
    };

    const handleSync = async (id: string) => {
        setSyncing(id);
        try {
            const res = await partnersService.sync(id);
            toast.success(res.message);
        } catch (err) {
            toast.error(getErrorMessage(err, t("synchronizationFailed")));
        } finally {
            setSyncing(null);
        }
    };

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return (
        <div className="space-y-5">
            {/* En-tête */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">{t("partners")}</h1>
                    <p className="text-sm text-gray-500">{t("manageCseTravelPartners")}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => router.push("/admin/partners/offers")}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50"
                    >
                        <PackageCheck size={15} /> {t("offersApprove")}
                    </button>
                    <button
                        onClick={() => router.push("/admin/partners/new")}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium"
                        style={{ background: "var(--color-primary)" }}
                    >
                        <Plus size={15} /> {t("newPartner")}
                    </button>
                </div>
            </div>

            {/* Filtres */}
            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-48">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        placeholder={t("searchPartner")}
                        className="w-full pl-8 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none"
                    />
                </div>
                <select
                    value={status}
                    onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                    className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none"
                >
                    <option value="">{t("allStatuses")}</option>
                    <option value="DRAFT">{t("draft")}</option>
                    <option value="ACTIVE">{t("active")}</option>
                    <option value="INACTIVE">{t("inactive")}</option>
                    <option value="SUSPENDED">{t("suspended")}</option>
                </select>
                <select
                    value={scopeType}
                    onChange={(e) => { setScopeType(e.target.value); setPage(1); }}
                    className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none"
                >
                    <option value="">{t("allTypes")}</option>
                    <option value="CSE">CSE</option>
                    <option value="VOYAGE">{t("travel")}</option>
                    <option value="BOTH">{t("cseTravel")}</option>
                </select>
            </div>

            {/* Tableau */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20 text-gray-400">
                        <Loader2 size={24} className="animate-spin mr-2" /> {t("loading")}
                    </div>
                ) : partners.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        <p className="text-4xl mb-3">🤝</p>
                        <p className="font-medium">{t("noPartnerFound")}</p>
                        <p className="text-xs mt-1">{t("createFirstPartner")}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50">
                                    {[t("partner"), t("industry"), t("scope"), t("status"), "API", t("offers"), t("actions")].map((h) => (
                                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {partners.map((p) => {
                                    const st = STATUS_COLORS[p.status] ?? STATUS_COLORS.DRAFT;
                                    return (
                                        <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    {p.logoUrl ? (
                                                        <img src={p.logoUrl} alt={p.name} className="w-8 h-8 rounded-lg object-cover" />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                                                            {p.name[0].toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-medium text-gray-900">{p.name}</p>
                                                        {p.isGlobal && (
                                                            <span className="flex items-center gap-1 text-xs text-blue-500">
                                                                <Globe size={11} /> {t("global")}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">{p.sector}</td>
                                            <td className="px-4 py-3 text-gray-600">{SCOPE_LABELS[p.scopeType]}</td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                                                    style={{ background: st.bg, color: st.text }}>
                                                    {st.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                {p.apiEnabled ? (
                                                    <span className="inline-flex items-center gap-1 text-xs text-green-600">
                                                        <Wifi size={12} /> {t("enabled")}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                                                        <WifiOff size={12} /> {t("disabled")}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">
                                                {p._count?.offers ?? "—"}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    {p.apiEnabled && (
                                                        <button
                                                            onClick={() => handleSync(p.id)}
                                                            disabled={syncing === p.id}
                                                            title={t("synchronize")}
                                                            className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors disabled:opacity-50"
                                                        >
                                                            <RefreshCw size={14} className={syncing === p.id ? "animate-spin" : ""} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => router.push(`/admin/partners/${p.id}`)}
                                                        title={t("edit")}
                                                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                                                    >
                                                        <Edit size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteTarget(p)}
                                                        title={t("delete")}
                                                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{t("partner2", { total, p2: total > 1 ? "s" : "" })}</span>
                    <div className="flex items-center gap-1">
                        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                            className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
                            {t("previous")}
                        </button>
                        <span className="px-3">{page} / {totalPages}</span>
                        <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                            className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
                            {t("next")}
                        </button>
                    </div>
                </div>
            )}

            {/* Modal suppression */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                        <h3 className="font-bold text-gray-900 mb-2">{t("deletePartner")}</h3>
                        <p className="text-sm text-gray-500 mb-5">
                            <strong>{deleteTarget.name}</strong> {t("willPermanentlyDeletedActive")}
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteTarget(null)}
                                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
                                {t("cancel")}
                            </button>
                            <button onClick={handleDelete} disabled={deleting}
                                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-70"
                                style={{ background: "#ef4444" }}>
                                {deleting && <Loader2 size={14} className="animate-spin" />}
                                {t("delete")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
